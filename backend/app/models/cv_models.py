from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

# ─────────────────────────────────────────────────────────────────────────────
# These are our "data shapes" — like forms with labelled fields.
# Pydantic (the library we're using) automatically checks that incoming data
# matches the shape we expect. If someone sends a request with a missing required
# field or the wrong type, FastAPI rejects it automatically with a helpful error.
#
# BaseModel is the base class everything here inherits from — it's what gives
# each class its validation superpowers.
# ─────────────────────────────────────────────────────────────────────────────
 

class PersonalInfo(BaseModel):
    """
    Personal contact information for CV
    Stores all the contact details that appear at the top of a CV.
    
    The '...' in Field(...) means the field is REQUIRED — FastAPI will reject
    the request if it's missing. Fields with Field(None, ...) are optional.
    """
    full_name: str = Field(..., min_length=1, description="Full name of the candidate")
    # EmailStr is a special type — Pydantic checks it's actually a valid email format
    email: EmailStr = Field(..., description="Email address")
    phone: str = Field(..., min_length=10, description="Phone number")
    location: str = Field(..., description="Current location (e.g., 'Dublin, Ireland')")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL")
    github: Optional[str] = Field(None, description="GitHub profile URL")
    website: Optional[str] = Field(None, description="Personal website or portfolio URL")

    class Config:
        #this example shows up in the auto-generated FastAPI docs at /docs
        #so developers testing the API know what data to send
        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+353 123 456 789",
                "location": "Dublin, Ireland",
                "linkedin": "linkedin.com/in/johndoe",
                "github": "github.com/johndoe"
            }
        }


class Experience(BaseModel):
    """
    Represents one job on a CV — title, company, dates, bullet points etc.
    A user can have multiple Experience entries, so these get stored in a List.
 
    We store an 'id' so the frontend and AI can reference a specific job entry
    without relying on its position in the list (which could change).
    """
    id: str = Field(..., description="Unique identifier for this experience")
    job_title: str = Field(..., min_length=1, description="Job title or role")
    company: str = Field(..., min_length=1, description="Company name")
    location: str = Field(..., description="Job location")
    start_date: str = Field(..., description="Start date (e.g., 'January 2023')")
    end_date: str = Field(..., description="End date or 'Present'")
    
    # default_factory=list means: if no value is provided, start with an empty list
    # (never use [] as a default directly in Python — it causes a shared-reference bug)
    responsibilities: List[str] = Field(default_factory=list, description="List of responsibilities")
    achievements: List[str] = Field(default_factory=list, description="List of achievements with measurable results")
    technologies: List[str] = Field(default_factory=list, description="Technologies and tools used")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "exp-1",
                "job_title": "Software Engineer",
                "company": "Tech Company Ltd",
                "location": "Dublin, Ireland",
                "start_date": "June 2022",
                "end_date": "Present",
                "responsibilities": [
                    "Developed and maintained web applications using React and TypeScript"
                ],
                "achievements": [
                    "Reduced page load time by 40% through optimization techniques",
                    "Led team of 3 developers on critical client project"
                ],
                "technologies": ["React", "TypeScript", "Node.js", "PostgreSQL"]
            }
        }


class Education(BaseModel):
    """
    Represents one education entry — degree, institution, graduation date etc.
    'grade' is optional because not everyone includes their grade on a CV.
    'relevant_modules' lets students (like us!) highlight CS modules that are
    directly relevant to the role they're applying for.
    """
    
    id: str = Field(..., description="Unique identifier for this education")
    degree: str = Field(..., min_length=1, description="Degree name (e.g., 'Bachelor of Computer Science')")
    institution: str = Field(..., min_length=1, description="Educational institution name")
    location: str = Field(..., description="Institution location")
    graduation_date: str = Field(..., description="Graduation date or expected date")
    grade: Optional[str] = Field(None, description="Grade or classification (e.g., 'First Class Honours', '3.8 GPA')")
    relevant_modules: List[str] = Field(default_factory=list, description="Relevant courses or modules")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "edu-1",
                "degree": "Bachelor of Computer Science",
                "institution": "University of Galway",
                "location": "Galway, Ireland",
                "graduation_date": "June 2026",
                "grade": "First Class Honours (Expected)",
                "relevant_modules": ["Artificial Intelligence", "Web Development", "Database Systems"]
            }
        }


class Project(BaseModel):
    """
    Project entry for portfolio/academic projects - really useful for students
    who don't have loads of work experience yet but have built cool things.
    'link' is optional since not every project is public.
    """
    id: str = Field(..., description="Unique identifier for this project")
    title: str = Field(..., min_length=1, description="Project title")
    description: str = Field(..., min_length=10, description="Brief project description")
    technologies: List[str] = Field(default_factory=list, description="Technologies used in the project")
    link: Optional[str] = Field(None, description="Link to project (GitHub, live demo, etc.)")
    achievements: List[str] = Field(default_factory=list, description="Key achievements or outcomes")
    start_date: Optional[str] = Field(None, description="Project start date")
    end_date: Optional[str] = Field(None, description="Project end date or 'Ongoing'")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "proj-1",
                "title": "AI-Powered CV Builder",
                "description": "Web application that helps users create professional CVs with AI assistance",
                "technologies": ["React", "TypeScript", "FastAPI", "Gemini API"],
                "link": "github.com/username/cv-builder",
                "achievements": [
                    "Implemented AI-powered content enhancement",
                    "Built ATS-compatible CV parser"
                ],
                "start_date": "January 2026",
                "end_date": "Ongoing"
            }
        }


class Skills(BaseModel):
    """
    Technical and soft skills in two buckets:
    - technical: things like Python, React, Docker — hard, learnable tools
    - soft: things like communication, leadership — personality/work-style traits
    
    Keeping them separate means the frontend can display them differently
    and the AI can give targeted advice on each type.
    """
    technical: List[str] = Field(default_factory=list, description="Technical skills (programming languages, tools, frameworks)")
    soft: List[str] = Field(default_factory=list, description="Soft skills (communication, leadership, etc.)")

    class Config:
        json_schema_extra = {
            "example": {
                "technical": ["Python", "JavaScript", "React", "FastAPI", "Docker", "Git"],
                "soft": ["Team Leadership", "Problem Solving", "Communication", "Agile Methodologies"]
            }
        }


class CVData(BaseModel):
    """
    Complete CV data structure
    The top-level CV model — it contains everything.
    Think of it as the whole CV packed into one object.
 
    Every other model above is used as a building block here.
    When the frontend sends a CV to the backend, it arrives in this shape.
    When the AI needs to read the CV, we serialise this into a dict and pass it in.
    """
    personal_info: PersonalInfo
    professional_summary: str = Field(default="", description="Brief professional summary (2-3 sentences)")
    experience: List[Experience] = Field(default_factory=list, description="Work experience entries")
    education: List[Education] = Field(default_factory=list, description="Education entries")
    skills: Skills
    projects: List[Project] = Field(default_factory=list, description="Portfolio or academic projects")
    certifications: List[str] = Field(default_factory=list, description="Professional certifications")
    dynamic_sections: List[dict] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "personal_info": {
                    "full_name": "John Doe",
                    "email": "john.doe@example.com",
                    "phone": "+353 123 456 789",
                    "location": "Dublin, Ireland",
                    "linkedin": "linkedin.com/in/johndoe",
                    "github": "github.com/johndoe"
                },
                "professional_summary": "Software Engineer with 3 years of experience in full-stack development, specializing in React and Python. Passionate about building scalable web applications and leveraging AI to solve real-world problems.",
                "experience": [],
                "education": [],
                "skills": {
                    "technical": ["Python", "JavaScript", "React", "FastAPI"],
                    "soft": ["Problem Solving", "Team Leadership"]
                },
                "projects": [],
                "certifications": ["AWS Certified Developer"]
            }
        }


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST & RESPONSE MODELS
#
# These define what data comes IN to our API endpoints (Request models)
# and what shape the response goes back OUT in (Response models).
#
# Keeping requests and responses as separate typed models means FastAPI
# auto-validates them AND auto-generates the /docs API documentation for free.
# ─────────────────────────────────────────────────────────────────────────────

class CVUploadResponse(BaseModel):
    """
    Response after uploading a CV
    
    Sent back after a user uploads their existing CV PDF.
    'success' tells the frontend whether parsing worked.
    'warnings' is a list of non-fatal issues (e.g. "couldn't find phone number").
    'raw_text' is the full extracted text — useful for debugging parser issues.
    """
    success: bool
    message: str
    parsed_data: Optional[dict] = None
    warnings: List[str] = Field(default_factory=list)
    raw_text: Optional[str] = None


class EnhanceRequest(BaseModel):
    """
    Request to enhance a bullet point
    
    Sent by the frontend when a user clicks "Enhance" on a bullet point.
    'text' is the bullet they want improved.
    'context' is a dict with things like job_title and company so the AI
    can tailor the enhancement to their target role.
    """
    text: str = Field(..., min_length=5, description="Original bullet point text")
    context: dict = Field(..., description="Context (job_title, company, etc.)")


class EnhanceResponse(BaseModel):
    """
    Response with enhanced text
    
    Sent back after enhancing a bullet point.
    'confidence' is a 0.0–1.0 score from _calculate_confidence() in ai_service.py.
    'improvements' is a dict of flags like {"has_action_verb": true, ...}.
    """
    original: str
    enhanced: str
    improvements: dict = Field(default_factory=dict, description="What was improved")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class JobAnalysisRequest(BaseModel):
    """
    Request to analyze job description
        
    Request for the older keyword-based job analysis route.
    'cv_text' is optional — if provided, we can also do a basic CV/job match.
    """
    job_description: str = Field(..., min_length=50)
    cv_text: Optional[str] = None


class JobAnalysisResponse(BaseModel):
    """
    Response with job analysis
    Kept here for backwards compatibility even though the LLM version is now preferred
    """
    extracted_keywords: dict
    match_score: Optional[float] = None
    matched_keywords: Optional[List[str]] = None
    missing_keywords: Optional[List[str]] = None
    recommendations: List[str] = Field(default_factory=list)


class JobDescriptionRequest(BaseModel):
    """
    Request for LLM job description analysis
    min_length=50 stops people sending a one-word job title and expecting a full analysis.
    """
    job_description: str = Field(..., min_length=50)


class JobDescriptionAnalysisResponse(BaseModel):
    """
    Structured response for LLM-powered job analysis
    
    All fields are Optional or have defaults because the AI might not find every piece of info
    (e.g. not all job ads mention salary).
 
    'tldr' is the plain-English 2-3 sentence summary — the headline for the Job Analysis page.
    'error' is only populated if something went wrong during AI analysis.
    """
    job_title: Optional[str] = None
    company: Optional[str] = None
    tldr: str = ""
    employment_type: Optional[str] = None
    work_model: Optional[str] = None
    salary: Optional[str] = None
    experience_level: Optional[str] = None
    key_requirements: List[str] = Field(default_factory=list)
    nice_to_have: List[str] = Field(default_factory=list)
    tech_stack: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    error: Optional[str] = None


class JobAnalysisLLMResponse(JobDescriptionAnalysisResponse):
    """
    Backward-compatible alias for restored LLM job analysis route.
    We created this when we restored the LLM analysis route so that old code
    referencing 'JobAnalysisLLMResponse' still works without needing changes everywhere.
    Inheriting from JobDescriptionAnalysisResponse means it has all the same fields.
    """


class CVCompareResponse(BaseModel):
    """
    Response for CV vs job comparison.
    
    'match_score' is 0–100 (like a percentage).
    'ats_verdict' is the AI's prediction of whether this CV would pass ATS screening.
    """
    match_score: int = 0
    match_summary: str = ""
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    ats_verdict: Optional[str] = None
    error: Optional[str] = None

class ChatMessage(BaseModel):
    """
    A single message in the chat history
    'role' is either "user" (the person typing) or "assistant" (CVora's reply).
    We store the full history and send it back each request so the AI has memory
    of the conversation — it doesn't remember anything between calls on its own.
    """
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class CVChatRequest(BaseModel):
    """
    Request body for the CV chat endpoint (/api/cv/chat)
    Bundles the user's new message, the full conversation history,
    and the current state of their CV all in one payload.
    """
    message: str = Field(..., min_length=1, description="The user's latest message")
    history: List[ChatMessage] = Field(default_factory=list, description="Previous conversation turns")
    cv_data: dict = Field(default_factory=dict, description="The full CVFormData serialised as a dict")


class CVChatResponse(BaseModel):
    """
    Response from the CV chat endpoint — includes reply and optional suggested edit
    e.g. rewrite a bullet, update the summary) — if present, the frontend shows an Apply button.
    """
    reply: str
    suggested_edit: Optional[dict] = None

class CVEnhanceChatRequest(BaseModel):
    """
    Request body for the Upload CV enhancement chat endpoint.
    Similar to CVChatRequest but also includes:
    - 'parsed_cv': the CV that was uploaded (not built in the wizard)
    - 'gaps': the list of missing skills/experience identified by compare_cv_to_job()
    - 'job_description': the job the user is trying to match
    The AI uses these to ask targeted questions and fill in the gaps.
    """
    message: str
    history: List[ChatMessage]
    parsed_cv: dict
    gaps: List[str] = []
    job_description: str = ""
 
class CVEnhanceChatResponse(BaseModel):
    """
    Response from the Upload CV enhancement chat endpoint.
    'suggested_addition' is different from 'suggested_edit' in CVChatResponse —
    here we're ADDING new content (a new bullet, skill, or summary rewrite)
    rather than editing something that already exists in the wizard.
    """
    reply: str
    suggested_addition: Optional[dict] = None
    gap_index: int = -1
