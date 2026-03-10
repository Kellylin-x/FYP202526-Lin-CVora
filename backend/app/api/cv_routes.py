from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
import os
import tempfile

from ..models.cv_models import (
    CVData, 
    CVUploadResponse, 
    EnhanceRequest, 
    EnhanceResponse,
    JobAnalysisRequest,
    JobAnalysisResponse,
    JobAnalysisLLMResponse,
    CVCompareResponse
)
from ..services.cv_parser import cv_parser
from ..services.ai_service import ai_service
from ..services.keyword_matcher import ats_analyzer


router = APIRouter(prefix="/api/cv", tags=["cv"])


@router.post("/upload", response_model=CVUploadResponse)
async def upload_cv(file: UploadFile = File(...)):
    """
    Upload and parse a CV file (PDF or DOCX)
    
    Args:
        file: Uploaded CV file
        
    Returns:
        Parsed CV data with warnings
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
    chunk_size = 1024 * 1024  # 1MB chunks
    content = bytearray()
    
    try:
        while chunk := await file.read(chunk_size):
            file_size += len(chunk)
            if file_size > 10 * 1024 * 1024:  # 10MB
                raise HTTPException(
                    status_code=413, 
                    detail="File too large. Maximum size is 10MB."
                )
            content.extend(chunk)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Save to temporary file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Parse based on file type
        if file_extension == '.pdf':
            result = cv_parser.parse_pdf(tmp_path)
        else:  # .docx
            result = cv_parser.parse_docx(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        if not result.get('success', False):
            raise HTTPException(
                status_code=422, 
                detail=result.get('error', 'Failed to parse CV')
            )
        
        return CVUploadResponse(
            success=True,
            message="CV parsed successfully",
            parsed_data=result.get('parsed_data'),
            warnings=result.get('warnings', []),
            raw_text=result.get('raw_text', '')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temp file if it exists
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing CV: {str(e)}"
        )


@router.post("/enhance-bullet", response_model=EnhanceResponse)
async def enhance_bullet_point(request: EnhanceRequest):
    """
    Enhance a single CV bullet point using AI
    
    Args:
        request: Original text and context (job_title, company, etc.)
        
    Returns:
        Enhanced text with improvements analysis
    """
    if not request.text or len(request.text.strip()) < 5:
        raise HTTPException(
            status_code=400, 
            detail="Text too short. Minimum 5 characters required."
        )
    
    if len(request.text) > 500:
        raise HTTPException(
            status_code=400, 
            detail="Text too long. Maximum 500 characters."
        )
    
    try:
        result = ai_service.enhance_bullet_point(
            text=request.text,
            context=request.context
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
    
    Args:
        request: Job description and optional CV text
        
    Returns:
        Keyword analysis and match score
    """
    if len(request.job_description) < 50:
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
    if len(request.job_description) < 50:
        raise HTTPException(status_code=400, detail="Job description too short. Minimum 50 characters required.")

    try:
        # Clean and sanitize the job description to handle special characters
        job_desc = request.job_description.strip()

        # Remove or escape problematic characters that could break JSON parsing
        # Replace smart quotes with regular quotes
        job_desc = job_desc.replace('"', '"').replace('"', '"').replace(''', "'").replace(''', "'")
        # Replace newlines with spaces to avoid JSON issues
        job_desc = job_desc.replace('\n', ' ').replace('\r', ' ')
        # Remove excessive whitespace
        job_desc = ' '.join(job_desc.split())

        # Additional validation - ensure the cleaned text is still valid
        if not job_desc or len(job_desc) < 10:
            raise HTTPException(status_code=400, detail="Job description became too short after cleaning. Please provide more content.")

        result = ai_service.analyze_job_description(job_desc)

        if result.get('error'):
            raise HTTPException(status_code=503, detail=result['error'])

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
            soft_skills=result.get('soft_skills', [])
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analysing job description: {str(e)}")


@router.post("/compare", response_model=CVCompareResponse)
async def compare_cv_to_job(request: JobAnalysisRequest):
    """
    LLM-powered CV vs job description comparison
    Returns intelligent match score, strengths, gaps and recommendations
    """
    if len(request.job_description) < 50:
        raise HTTPException(status_code=400, detail="Job description too short. Minimum 50 characters required.")

    if not request.cv_text:
        raise HTTPException(status_code=400, detail="CV text is required for comparison.")

    try:
        result = ai_service.compare_cv_to_job(
            cv_text=request.cv_text,
            job_description=request.job_description
        )

        if result.get('error'):
            raise HTTPException(status_code=503, detail=result['error'])

        return CVCompareResponse(
            match_score=result.get('match_score'),
            match_summary=result.get('match_summary'),
            strengths=result.get('strengths', []),
            gaps=result.get('gaps', []),
            recommendations=result.get('recommendations', []),
            ats_verdict=result.get('ats_verdict')
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing CV to job: {str(e)}")


@router.get("/health")
async def cv_routes_health():
    """Health check for CV routes"""
    return {
        "status": "healthy",
        "routes": [
            "POST /api/cv/upload",
            "POST /api/cv/enhance-bullet",
            "POST /api/cv/job/analyze"
            "POST /api/cv/job/analyze-llm",
            "POST /api/cv/compare"
        ]
    }