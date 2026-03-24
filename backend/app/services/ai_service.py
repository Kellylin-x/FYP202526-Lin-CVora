import google.genai as genai
import os
from typing import Dict, Optional, Any
import re
import json


class AIService:
    """
    AI Service for CV enhancement using Google Gemini API
    Implements STAR method and UK/Ireland CV best practices
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI service with Gemini API key

        Args:
            api_key: Gemini API key (if None, reads from GEMINI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not set. AI features will not work.")
            self.client = None
        else:
            # Configure the Gemini client with the API key
            self.client = genai.Client(api_key=self.api_key)
            self.model = "models/gemini-2.5-flash"

        # Max output tokens for bullet point enhancement (short responses only)
        self.max_tokens = 150
    
    def enhance_bullet_point(self, text: str, context: Dict) -> Dict:
        """
        Enhance a CV bullet point using STAR method via Gemini

        Args:
            text: Original bullet point text
            context: Dictionary with job_title, company, target_role etc.

        Returns:
            Dictionary with original, enhanced, improvements, confidence
        """
        if not self.client:
            return {
                "original": text,
                "enhanced": text,
                "error": "AI service not configured (missing API key)",
                "improvements": {},
                "confidence": 0.0
            }

        if len(text.strip()) < 5:
            return {
                "original": text,
                "enhanced": text,
                "error": "Text too short to enhance",
                "improvements": {},
                "confidence": 0.0
            }

        # Build the full prompt combining system instructions and user request
        prompt = self._get_system_prompt() + "\n\n" + self._build_enhancement_prompt(text, context)

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "max_output_tokens": self.max_tokens,
                    "temperature": 0.7
                }
            )

            enhanced_text = response.text.strip()
            enhanced_text = self._clean_ai_output(enhanced_text)

            if not self._validate_enhancement(text, enhanced_text):
                return {
                    "original": text,
                    "enhanced": text,
                    "error": "AI produced invalid enhancement",
                    "improvements": {},
                    "confidence": 0.0
                }

            improvements = self._analyze_improvements(text, enhanced_text)
            confidence = self._calculate_confidence(improvements)

            return {
                "original": text,
                "enhanced": enhanced_text,
                "improvements": improvements,
                "confidence": confidence,
                "error": None
            }

        except Exception as e:
            return {
                "original": text,
                "enhanced": text,
                "error": f"AI service error: {str(e)}",
                "improvements": {},
                "confidence": 0.0
            }

    def chat_with_cv_context(self, message: str, history: list, cv_data: dict) -> dict:
        """
        Context-aware CV assistant chat using Gemini.

        Returns both a conversational reply AND an optional suggested_edit object
        when the user asks the AI to make a specific change to their CV.

        suggested_edit shapes:
          { "field": "professional_summary", "value": "..." }
          { "field": "experience_bullet", "exp_id": "abc123", "bullet_index": 0, "value": "..." }
          { "field": "skills_add", "skill_type": "technical", "values": ["Python", "FastAPI"] }
          { "field": "project_description", "project_id": "xyz789", "value": "..." }

        Args:
            message:  The user's latest message
            history:  List of previous messages [{"role": "user"/"assistant", "content": "..."}]
            cv_data:  The full CVFormData object serialised as a dict

        Returns:
            Dictionary with 'reply' and optional 'suggested_edit'
        """
        if not self.client:
            return {"error": "AI service not configured (missing API key)"}

        try:
            personal   = cv_data.get("personal_info", {})
            target     = cv_data.get("target_role", {})
            experience = cv_data.get("experience", [])
            education  = cv_data.get("education", [])
            skills     = cv_data.get("skills", {})
            summary    = cv_data.get("professional_summary", "")
            projects   = cv_data.get("projects", [])

            # Format experience with IDs and bullet indices so AI can reference specific entries
            exp_text = ""
            for exp in experience:
                bullets = "\n".join(
                    f"    [{i}] {r}" for i, r in enumerate(exp.get("responsibilities", [])) if r.strip()
                )
                exp_text += f"\n  ID:{exp.get('id')} | {exp.get('job_title')} at {exp.get('company')} ({exp.get('start_date')} - {exp.get('end_date')})\n{bullets}"

            edu_text = ""
            for edu in education:
                edu_text += f"\n  {edu.get('degree')} — {edu.get('institution')} ({edu.get('graduation_date')})"

            # Format projects with IDs so AI can reference specific ones
            proj_text = ""
            for proj in projects:
                proj_text += f"\n  ID:{proj.get('id')} | {proj.get('title')}: {proj.get('description')}"

            history_text = ""
            for msg in history:
                role_label = "User" if msg.get("role") == "user" else "CVora Assistant"
                history_text += f"\n{role_label}: {msg.get('content', '')}\n"

            prompt = f"""You are CVora, an expert AI CV assistant specialising in STEM roles in Ireland and the UK.
You are helping {personal.get('full_name', 'the user')} build their CV.
They are targeting: {target.get('job_title', 'a STEM role')}
Career focus: {target.get('career_focus', 'not specified')}

CURRENT CV CONTENT:
EXPERIENCE:{exp_text if exp_text else ' None added yet'}
EDUCATION:{edu_text if edu_text else ' None added yet'}
TECHNICAL SKILLS: {', '.join(skills.get('technical', [])) or 'None added yet'}
SOFT SKILLS: {', '.join(skills.get('soft', [])) or 'None added yet'}
PROJECTS:{proj_text if proj_text else ' None added yet'}
PROFESSIONAL SUMMARY: {summary or 'Not written yet'}

You can give advice AND suggest direct edits to the CV.
When the user asks you to write, rewrite, improve, or update something specific, include a suggested_edit.

You MUST respond with a JSON object in this exact format:
{{
  "reply": "Your conversational message to the user explaining what you did or suggesting improvements",
  "suggested_edit": null
}}

OR if suggesting an edit, use ONE of these shapes for suggested_edit:

For professional summary:
  {{"field": "professional_summary", "value": "the full new summary text"}}

For a specific experience bullet (use the ID and index shown above):
  {{"field": "experience_bullet", "exp_id": "the-exp-id", "bullet_index": 0, "value": "improved bullet text"}}

For adding skills:
  {{"field": "skills_add", "skill_type": "technical", "values": ["Skill1", "Skill2"]}}

For a project description (use the project ID shown above):
  {{"field": "project_description", "project_id": "the-project-id", "value": "new description"}}

RULES:
- Always include "reply" — a friendly explanation of what you suggested and why
- Only include suggested_edit when the user explicitly asks you to write/rewrite/improve something
- Do not fabricate experience or skills not mentioned by the user
- Be specific and refer to their actual CV content
- Use UK/Ireland CV conventions
- Return ONLY the JSON object, no markdown, no code fences

--- Conversation so far ---
{history_text if history_text else '(No previous messages)'}
---

User: {message}

Respond with JSON only:"""

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "max_output_tokens": 1000,
                    "temperature": 0.7,
                }
            )

            raw = response.text.strip() if response.text else ""

            # Parse structured JSON response
            result = self._parse_json_response(raw)

            return {
                "reply": result.get("reply", "I couldn't generate a response. Please try again."),
                "suggested_edit": result.get("suggested_edit", None)
            }

        except Exception as e:
            return {"error": f"AI service error: {str(e)}"}

    def analyze_job_description(self, job_description: str) -> Dict:
        """
        Analyse a job description using Gemini to produce a structured summary.
        Returns TL;DR, employment type, remote/hybrid, salary, key requirements etc.

        Args:
            job_description: Full job description text

        Returns:
            Dictionary with structured job analysis
        """
        if not self.client:
            return {"error": "AI service not configured (missing API key)"}

        # Additional validation and cleaning
        if not job_description or len(job_description.strip()) < 10:
            return {"error": "Job description is too short or empty"}

        # Clean the job description
        job_description = job_description.strip()

        # Ask Gemini to return structured JSON only — no markdown, no preamble
        prompt = f"""You are an expert job analyst specialising in STEM roles in Ireland and the UK.
Analyse this job description and return ONLY a valid JSON object with exactly these fields.
Do not include markdown, code fences, or any explanation — just the raw JSON.

{{
  "job_title": "extracted job title",
  "company": "company name if mentioned, else null",
  "tldr": "2-3 sentence plain English summary of what this role actually involves",
  "employment_type": "Full-time / Part-time / Contract / Internship / unknown",
  "work_model": "Remote / Hybrid / On-site / unknown",
  "salary": "salary range if mentioned, else null",
  "experience_level": "Junior / Mid-level / Senior / Lead / unknown",
  "key_requirements": ["list", "of", "must-have", "skills", "max 6"],
  "nice_to_have": ["list", "of", "preferred", "skills", "max 4"],
  "tech_stack": ["list", "of", "technologies", "mentioned"],
  "soft_skills": ["list", "of", "soft", "skills", "mentioned"]
}}

Job Description:
{job_description}"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "max_output_tokens": 1800,
                    "temperature": 0.0,
                    "response_mime_type": "application/json"
                }
            )

            raw = response.text or ""
            return self._parse_json_response(raw)

        except json.JSONDecodeError as e:
            try:
                repair_prompt = f"""Convert the following text into valid JSON only.
Do not include markdown or explanations.

Text:
{response.text if 'response' in locals() and response and response.text else ''}"""

                repair_response = self.client.models.generate_content(
                    model=self.model,
                    contents=repair_prompt,
                    config={
                        "max_output_tokens": 1800,
                        "temperature": 0,
                        "response_mime_type": "application/json"
                    }
                )

                repaired_raw = repair_response.text or ""
                return self._parse_json_response(repaired_raw)
            except Exception:
                return self._default_job_analysis(job_description)
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}

    def compare_cv_to_job(self, cv_text: str, job_description: str) -> Dict:
        """
        Use Gemini to intelligently compare a CV against a job description.
        Returns match score, strengths, gaps and actionable recommendations.

        Args:
            cv_text: Full CV text
            job_description: Full job description text

        Returns:
            Dictionary with match analysis
        """
        if not self.client:
            return {"error": "AI service not configured (missing API key)"}

        # Ask Gemini to act as an ATS analyst and return structured JSON
        prompt = f"""You are an expert ATS (Applicant Tracking System) analyst and CV reviewer
specialising in STEM roles in Ireland and the UK.
Compare the CV against the job description and return ONLY a valid JSON object.
Do not include markdown, code fences, or any explanation — just the raw JSON.

{{
  "match_score": <integer 0-100>,
  "match_summary": "2-3 sentence honest assessment of how well this CV matches",
  "strengths": ["list", "of", "things", "cv", "does", "well", "for", "this", "role"],
  "gaps": ["list", "of", "missing", "skills", "or", "experience"],
  "recommendations": ["list", "of", "specific", "actionable", "improvements"],
  "ats_verdict": "Likely to pass ATS / May struggle with ATS / Unlikely to pass ATS"
}}

CV:
{cv_text}

Job Description:
{job_description}"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "max_output_tokens": 1000,
                    "temperature": 0.3,
                    "response_mime_type": "application/json"
                }
            )

            raw = response.text or ""
            return self._parse_json_response(raw)

        except Exception as e:
            return {"error": f"Comparison failed: {str(e)}"}

    def _strip_markdown_fences(self, text: str) -> str:
        """Remove markdown code fences that LLMs may wrap around JSON."""
        cleaned = text.strip()
        cleaned = re.sub(r'^```json\s*', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'^```\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        return cleaned.strip()

    def _extract_json_object(self, text: str) -> Optional[str]:
        """Extract the first balanced JSON object from mixed text."""
        start = text.find('{')
        if start == -1:
            return None

        depth = 0
        in_string = False
        escaped = False

        for index in range(start, len(text)):
            char = text[index]

            if escaped:
                escaped = False
                continue

            if char == '\\':
                escaped = True
                continue

            if char == '"':
                in_string = not in_string
                continue

            if in_string:
                continue

            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    return text[start:index + 1]

        return None

    def _parse_json_response(self, raw_text: str) -> Dict[str, Any]:
        """Parse LLM output into JSON with extraction fallback."""
        cleaned = self._strip_markdown_fences(raw_text)

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass

            extracted = self._extract_json_object(cleaned)
            if extracted:
                return json.loads(extracted)
            raise

    def _default_job_analysis(self, job_description: str) -> Dict[str, Any]:
        """Fallback analysis to avoid hard failures when model output is malformed."""
        text = ' '.join(job_description.split())
        title_match = re.search(r'(?i)\b([A-Za-z/&\- ]{3,40}(engineer|developer|analyst|manager|architect))\b', text)
        company_match = re.search(r'(?i)\bat\s+([A-Z][A-Za-z0-9&.,\- ]{2,40})', text)

        return {
            "job_title": title_match.group(1).strip() if title_match else "Unknown Role",
            "company": company_match.group(1).strip() if company_match else None,
            "tldr": text[:280] + ("..." if len(text) > 280 else ""),
            "employment_type": "unknown",
            "work_model": "unknown",
            "salary": None,
            "experience_level": "unknown",
            "key_requirements": [],
            "nice_to_have": [],
            "tech_stack": [],
            "soft_skills": []
        }
    
    def _get_system_prompt(self) -> str:
        """Instructions for bullet point enhancement behaviour"""
        return """You are an expert CV writer specializing in UK and Ireland STEM roles.

Your task is to improve CV bullet points using these principles:
1. STAR Method: Situation, Task, Action, Result
2. Strong action verbs (developed, led, implemented, optimized, etc.)
3. Quantifiable results and metrics where possible
4. Concise and professional tone
5. UK/Ireland CV standards (not US resume style)

CRITICAL RULES:
- DO NOT fabricate information or add details not in the original
- DO NOT make the text longer than 2 lines (approximately 150 characters)
- DO NOT use overly promotional language
- DO respond with ONLY the improved bullet point, no explanations
- DO maintain the core meaning and facts of the original text"""

    def _build_enhancement_prompt(self, text: str, context: Dict) -> str:
        """Build the user-facing part of the enhancement prompt"""
        job_title = context.get('job_title', 'a STEM role')
        company = context.get('company', 'a company')

        return f"""Improve this CV bullet point for {job_title} at {company}:

Original: {text}

Requirements:
- Start with a strong action verb if not already present
- Add measurable results ONLY if the original text suggests them
- Use STAR method (Situation, Task, Action, Result)
- Keep under 2 lines (max 150 characters)
- Maintain professional UK/Ireland CV tone
- DO NOT invent information not in the original

Return ONLY the improved bullet point, nothing else."""
    
    def _clean_ai_output(self, text: str) -> str:
        """Remove quotes, markdown formatting, and bullet symbols from AI output"""
        text = text.strip('"\'')
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # Remove bold markdown
        text = re.sub(r'\*(.+?)\*', r'\1', text)       # Remove italic markdown
        text = re.sub(r'^[\-\*•]\s+', '', text)         # Remove leading bullet symbols
        return text.strip()

    def _validate_enhancement(self, original: str, enhanced: str) -> bool:
        """Check that the enhanced text is valid and usable"""
        if not enhanced or len(enhanced.strip()) < 5:
            return False
        if len(enhanced) > 200:
            return False
        if enhanced.lower().strip() == original.lower().strip():
            return False
        # Reject if the AI returned an error message instead of enhanced text
        error_indicators = ['error', 'cannot', 'unable', 'sorry', 'i cannot']
        if any(indicator in enhanced.lower() for indicator in error_indicators):
            return False
        return True

    def _analyze_improvements(self, original: str, enhanced: str) -> Dict:
        """Analyse what specific improvements the AI made to the bullet point"""
        improvements = {
            "has_action_verb": False,
            "has_measurable_result": False,
            "length_appropriate": False,
            "improved_clarity": False
        }

        # Check if enhanced text starts with a strong action verb
        action_verbs = [
            'developed', 'led', 'managed', 'designed', 'implemented', 'created',
            'achieved', 'improved', 'increased', 'reduced', 'built', 'delivered',
            'optimized', 'automated', 'analyzed', 'established', 'coordinated',
            'executed', 'engineered', 'architected', 'deployed', 'maintained',
            'enhanced', 'streamlined', 'collaborated', 'spearheaded'
        ]
        first_word = enhanced.split()[0].lower() if enhanced.split() else ''
        improvements["has_action_verb"] = first_word in action_verbs

        # Check if enhanced text contains numbers or percentages (measurable results)
        number_pattern = r'\d+[\d,]*\.?\d*\s*(%|percent|users|hours|days|months|weeks|years|times|x)?'
        improvements["has_measurable_result"] = bool(re.search(number_pattern, enhanced))

        # Check length is within acceptable range
        improvements["length_appropriate"] = 20 < len(enhanced) < 200

        # Simple heuristic: more words and longer text suggests more detail added
        improvements["improved_clarity"] = (
            len(enhanced.split()) > len(original.split()) and
            len(enhanced) > len(original)
        )

        return improvements

    def _calculate_confidence(self, improvements: Dict) -> float:
        """Calculate an overall confidence score based on improvements made"""
        weights = {
            "has_action_verb": 0.25,
            "has_measurable_result": 0.35,
            "length_appropriate": 0.20,
            "improved_clarity": 0.20
        }

        confidence = 0.0
        for key, weight in weights.items():
            if improvements.get(key, False):
                confidence += weight

        return round(confidence, 2)


# Singleton instance — shared across the application
ai_service = AIService()