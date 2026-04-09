from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Optional
import os
import tempfile
import asyncio
import re

from ..models.cv_models import (
    CVData, 
    CVUploadResponse, 
    EnhanceRequest, 
    EnhanceResponse,
    JobAnalysisRequest,
    JobAnalysisResponse,
    JobAnalysisLLMResponse,
    CVCompareResponse,
    CVChatRequest,
    CVChatResponse,
    CVEnhanceChatRequest,
    CVEnhanceChatResponse
)

from ..services.cv_parser import cv_parser
from ..services.ai_service import ai_service
from ..services.keyword_matcher import ats_analyzer


router = APIRouter(prefix="/api/cv", tags=["cv"])

LLM_TIMEOUT_SECONDS = 30
UPLOAD_PARSE_TIMEOUT_SECONDS = 45
FILE_READ_CHUNK_BYTES = 1024 * 1024
MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024
MIN_BULLET_LENGTH = 5
MAX_BULLET_LENGTH = 500
MIN_JOB_DESCRIPTION_LENGTH = 50
ROLE_ANCHORS = (
    "engineer", "developer", "analyst", "architect", "scientist",
    "programmer", "manager", "graduate", "intern", "lead"
)


def _safe_unlink(path: Optional[str]) -> None:
    """Best-effort temp file cleanup."""
    if path and os.path.exists(path):
        os.unlink(path)

# Used when gemini is unavailable
def _extract_role_hint(job_description: str) -> Optional[str]:
    """Find a role-like phrase using lightweight anchor matching."""
    for raw_line in job_description.splitlines():
        line = " ".join(raw_line.split())
        if not line:
            continue
        lower_line = line.lower()
        if any(anchor in lower_line for anchor in ROLE_ANCHORS):
            cleaned = re.sub(r"^[^A-Za-z]+|[^A-Za-z0-9/()\-\s]+$", "", line).strip(" -")
            if 3 <= len(cleaned) <= 90:
                return cleaned

    token_pattern = r"\b(?:" + "|".join(ROLE_ANCHORS) + r")\b"
    token_match = re.search(token_pattern, job_description, flags=re.IGNORECASE)
    if not token_match:
        return None

    start = max(0, token_match.start() - 45)
    end = min(len(job_description), token_match.end() + 35)
    snippet = " ".join(job_description[start:end].split())
    snippet = re.sub(r"^[^A-Za-z]+|[^A-Za-z0-9/()\-\s]+$", "", snippet).strip(" -")
    return snippet if 3 <= len(snippet) <= 90 else None

# returns user friendly summary of AI error
def _summarize_ai_error(ai_error: str) -> str:
    lowered = (ai_error or "").lower()
    if "resource_exhausted" in lowered or "quota" in lowered or "429" in lowered:
        return "Gemini quota limit reached. Showing keyword-based fallback results."
    if "timed out" in lowered or "timeout" in lowered:
        return "AI analysis timed out. Showing keyword-based fallback results."
    return "AI analysis is temporarily unavailable. Showing keyword-based fallback results."

# builds keyword based comparison result when gemini unavailable
def _build_compare_fallback(job_description: str, cv_text: str, ai_error: str = "") -> CVCompareResponse:
    fallback = ats_analyzer.analyze_job_vs_cv(
        job_description=job_description,
        cv_text=cv_text
    )

    fallback_score = int(round(float(fallback.get('match_score', 0.0))))
    fallback_strengths = fallback.get('matched_keywords', [])[:8]
    fallback_gaps = fallback.get('missing_keywords', [])[:8]
    fallback_recommendations = fallback.get('recommendations', [])

    if fallback_score >= 70:
        verdict = "Likely to pass ATS"
    elif fallback_score >= 40:
        verdict = "May struggle with ATS"
    else:
        verdict = "Unlikely to pass ATS"

    return CVCompareResponse(
        match_score=fallback_score,
        match_summary=(
            "AI comparison is temporarily unavailable, so this score is based "
            "on keyword overlap between your CV and the job description."
        ),
        strengths=fallback_strengths,
        gaps=fallback_gaps,
        recommendations=fallback_recommendations,
        ats_verdict=verdict,
        error=_summarize_ai_error(ai_error)
    )

# basic chat response when gemini unavailable
def _build_enhance_chat_fallback(request: CVEnhanceChatRequest) -> CVEnhanceChatResponse:
    message = (request.message or "").strip().lower()
    gaps = request.gaps or []

    if len(request.history) == 0:
        if gaps:
            top_gap = gaps[0]
            return CVEnhanceChatResponse(
                reply=f"Let's start with '{top_gap}'. Have you used it in a project, module, or internship?",
                suggested_addition=None
            )
        return CVEnhanceChatResponse(
            reply="Tell me one recent achievement and I will draft a strong CV bullet for you.",
            suggested_addition=None
        )

    positive_signals = ["yes", "i did", "i have", "used", "worked", "built", "implemented"]
    if any(s in message for s in positive_signals):
        exp = request.parsed_cv.get("experience") or []
        target_title = exp[0].get("job_title") if exp else "Relevant Project"
        return CVEnhanceChatResponse(
            reply="Great, that is relevant. Here is a bullet you can apply.",
            suggested_addition={
                "type": "bullet",
                "job_title": target_title,
                "value": "Implemented and applied this capability in real tasks, improving delivery speed and reliability for team outcomes."
            }
        )

    if gaps:
        next_gap = gaps[0]
        return CVEnhanceChatResponse(
            reply=f"No problem. Let's move to '{next_gap}'. Did you gain any exposure to this in coursework or projects?",
            suggested_addition=None
        )

    return CVEnhanceChatResponse(
        reply="Thanks. Share one quantified result and I will convert it into a concise CV bullet.",
        suggested_addition=None
    )


@router.post("/upload", response_model=CVUploadResponse)
async def upload_cv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload and parse a CV file (PDF or DOCX)
    Returns parsed CV data with warnings
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ['.pdf', '.docx']:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file_extension}. Only PDF and DOCX are supported."
        )
    
    # Validate file size (10MB limit)
    file_size = 0
    content = bytearray()
    
    try:
        while chunk := await file.read(FILE_READ_CHUNK_BYTES):
            file_size += len(chunk)
            if file_size > MAX_UPLOAD_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=413, 
                    detail="File too large. Maximum size is 10MB."
                )
            content.extend(chunk)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Save to temporary file
    tmp_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Offload CPU/file-heavy parsing to a worker thread so one slow file
        # does not block the event loop and stall all API endpoints.
        parse_fn = cv_parser.parse_pdf if file_extension == '.pdf' else cv_parser.parse_docx
        result = await asyncio.wait_for(
            asyncio.to_thread(parse_fn, tmp_path),
            timeout=UPLOAD_PARSE_TIMEOUT_SECONDS
        )

        if not result.get('success', False):
            raise HTTPException(
                status_code=422,
                detail=result.get('error', 'Failed to parse CV')
            )

        background_tasks.add_task(_safe_unlink, tmp_path)
        tmp_path = None

        return CVUploadResponse(
            success=True,
            message="CV parsed successfully",
            parsed_data=result.get('parsed_data'),
            warnings=result.get('warnings', []),
            raw_text=result.get('raw_text', '')
        )

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="CV parsing timed out. Please try a smaller or text-based PDF/DOCX."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CV: {str(e)}"
        )
    finally:
        _safe_unlink(tmp_path)

@router.post("/enhance-chat", response_model=CVEnhanceChatResponse)
async def enhance_cv_chat(request: CVEnhanceChatRequest):
    """
    Proactive CV enhancement chat for the Upload CV page.
    Asks targeted questions about identified gaps and generates
    specific bullet point / skill suggestions the user can apply.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
 
    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]
 
        result = await asyncio.wait_for(
            asyncio.to_thread(
                ai_service.enhance_cv_with_chat,
                request.message,
                history,
                request.parsed_cv,
                request.gaps,
                request.job_description
            ),
            timeout=LLM_TIMEOUT_SECONDS
        )
 
        if result.get("error"):
            return _build_enhance_chat_fallback(request)
 
        return CVEnhanceChatResponse(
            reply=result["reply"],
            suggested_addition=result.get("suggested_addition"),
            gap_index=result.get("gap_index", -1)
        )
 
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        return _build_enhance_chat_fallback(request)
    except Exception as e:
        print(f"Enhancement chat exception fallback: {str(e)}")
        return _build_enhance_chat_fallback(request)

@router.post("/enhance-bullet", response_model=EnhanceResponse)
async def enhance_bullet_point(request: EnhanceRequest):
    """
    Enhance a single CV bullet point using AI
    Returns enhanced text with improvements analysis
    """
    if not request.text or len(request.text.strip()) < MIN_BULLET_LENGTH:
        raise HTTPException(
            status_code=400, 
            detail="Text too short. Minimum 5 characters required."
        )
    
    if len(request.text) > MAX_BULLET_LENGTH:
        raise HTTPException(
            status_code=400, 
            detail="Text too long. Maximum 500 characters."
        )
    
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                ai_service.enhance_bullet_point,
                text=request.text,
                context=request.context
            ),
            timeout=LLM_TIMEOUT_SECONDS
        )
        
        if result.get('error'):
            raise HTTPException(
                status_code=503,  # Service Unavailable
                detail=result['error']
            )
        
        return EnhanceResponse(
            original=result['original'],
            enhanced=result['enhanced'],
            improvements=result.get('improvements', {}),
            confidence=result.get('confidence', 0.0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error enhancing text: {str(e)}"
        )


@router.post("/job/analyze", response_model=JobAnalysisResponse)
async def analyze_job_description(request: JobAnalysisRequest):
    """
    Analyze job description and optionally compare with CV
    Returns Keyword analysis and match score
    """
    if len(request.job_description) < MIN_JOB_DESCRIPTION_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="Job description too short. Minimum 50 characters required."
        )
    
    try:
        if request.cv_text:
            # Full comparison: job description vs CV
            analysis = ats_analyzer.analyze_job_vs_cv(
                job_description=request.job_description,
                cv_text=request.cv_text
            )
            
            return JobAnalysisResponse(
                extracted_keywords=ats_analyzer.extract_keywords(request.job_description),
                match_score=analysis.get('match_score'),
                matched_keywords=analysis.get('matched_keywords'),
                missing_keywords=analysis.get('missing_keywords'),
                recommendations=analysis.get('recommendations', [])
            )
        else:
            # Just extract keywords from job description
            keywords = ats_analyzer.extract_keywords(request.job_description)
            
            return JobAnalysisResponse(
                extracted_keywords=keywords,
                match_score=None,
                matched_keywords=None,
                missing_keywords=None,
                recommendations=[
                    f"Job requires {len(keywords['all'])} key skills/technologies",
                    "Upload your CV to see how well it matches this job"
                ]
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing job description: {str(e)}"
        )

@router.post("/job/analyze-llm", response_model=JobAnalysisLLMResponse)
async def analyze_job_description_llm(request: JobAnalysisRequest):
    """
    LLM-powered job description analysis
    Returns structured summary: TL;DR, employment type, remote/hybrid, salary, requirements
    """
    if len(request.job_description) < MIN_JOB_DESCRIPTION_LENGTH:
        raise HTTPException(status_code=400, detail="Job description too short. Minimum 50 characters required.")

    try:
        # Clean and sanitize the job description to handle special characters
        job_desc = request.job_description.strip()

        # Normalize all whitespace (spaces/newlines/tabs) to single spaces.
        job_desc = ' '.join(job_desc.split())

        # Additional validation - ensure the cleaned text is still valid
        if not job_desc or len(job_desc) < 10:
            raise HTTPException(status_code=400, detail="Job description became too short after cleaning. Please provide more content.")

        result = await asyncio.wait_for(
            asyncio.to_thread(ai_service.analyze_job_description, job_desc),
            timeout=LLM_TIMEOUT_SECONDS
        )

        if result.get('error'):
            reason = _summarize_ai_error(result.get('error', ''))
            print(f"Job analysis fallback: {reason}")
            # Fallback to deterministic keyword extraction so UI still receives
            # structured data when Gemini quota/rate limits are hit.
            keywords = ats_analyzer.extract_keywords(job_desc)

            # Prefer a role-like phrase from the JD header/body.
            role_hint = "STEM Role"
            detected_role = _extract_role_hint(request.job_description)
            if detected_role:
                role_hint = detected_role

            if role_hint == "STEM Role":
                role_match = keywords.get('all', [])
                if role_match:
                    role_hint = role_match[0].title()

            return JobAnalysisLLMResponse(
                job_title=role_hint,
                company=None,
                tldr=(
                    "AI job analysis is temporarily unavailable (for example due to API quota). "
                    "This is a keyword-based fallback summary."
                ),
                employment_type="unknown",
                work_model="unknown",
                salary=None,
                experience_level="unknown",
                key_requirements=keywords.get('technical_skills', [])[:8],
                nice_to_have=[],
                tech_stack=keywords.get('technical_skills', [])[:12],
                soft_skills=keywords.get('soft_skills', [])[:8],
                error=reason
            )

        return JobAnalysisLLMResponse(
            job_title=result.get('job_title'),
            company=result.get('company'),
            tldr=result.get('tldr'),
            employment_type=result.get('employment_type'),
            work_model=result.get('work_model'),
            salary=result.get('salary'),
            experience_level=result.get('experience_level'),
            key_requirements=result.get('key_requirements', []),
            nice_to_have=result.get('nice_to_have', []),
            tech_stack=result.get('tech_stack', []),
            soft_skills=result.get('soft_skills', []),
            error=result.get('error')
        )

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Job analysis timed out. Please try again with a shorter job description."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analysing job description: {str(e)}")


@router.post("/compare", response_model=CVCompareResponse)
async def compare_cv_to_job(request: JobAnalysisRequest):
    """
    LLM-powered CV vs job description comparison
    Returns intelligent match score, strengths, gaps and recommendations
    """
    if len(request.job_description) < MIN_JOB_DESCRIPTION_LENGTH:
        raise HTTPException(status_code=400, detail="Job description too short. Minimum 50 characters required.")

    if not request.cv_text:
        raise HTTPException(status_code=400, detail="CV text is required for comparison.")

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                ai_service.compare_cv_to_job,
                request.cv_text,
                request.job_description
            ),
            timeout=LLM_TIMEOUT_SECONDS
        )

        if result.get('error'):
            reason = _summarize_ai_error(result.get('error', ''))
            print(f"Compare fallback: {reason}")
            return _build_compare_fallback(request.job_description, request.cv_text, result.get('error', ''))

        return CVCompareResponse(
            match_score=result.get('match_score'),
            match_summary=result.get('match_summary'),
            strengths=result.get('strengths', []),
            gaps=result.get('gaps', []),
            recommendations=result.get('recommendations', []),
            ats_verdict=result.get('ats_verdict'),
            error=result.get('error')
        )

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        return _build_compare_fallback(request.job_description, request.cv_text, "comparison timed out")
    except Exception as e:
        print(f"Compare fallback: {_summarize_ai_error(str(e))}")
        return _build_compare_fallback(request.job_description, request.cv_text, str(e))

@router.post("/chat", response_model=CVChatResponse)
async def chat_with_cv_assistant(request: CVChatRequest):
    """Context-aware CV assistant chat endpoint."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]

        result = await asyncio.wait_for(
            asyncio.to_thread(
                ai_service.chat_with_cv_context,
                message=request.message,
                history=history,
                cv_data=request.cv_data
            ),
            timeout=LLM_TIMEOUT_SECONDS
        )

        if result.get("error"):
            raise HTTPException(status_code=503, detail=result["error"])

        return CVChatResponse(reply=result["reply"], suggested_edit=result.get("suggested_edit"))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.get("/health")
def cv_routes_health():
    """Health check for CV routes"""
    return {
        "status": "healthy",
        "services": {
            "ai_service": "configured" if getattr(ai_service, "client", None) else "degraded",
            "cv_parser": "operational",
            "ats_analyzer": "operational"
        },
        "routes": [
            "POST /api/cv/upload",
            "POST /api/cv/enhance-bullet",
            "POST /api/cv/job/analyze",
            "POST /api/cv/job/analyze-llm",
            "POST /api/cv/compare"
        ]
    }