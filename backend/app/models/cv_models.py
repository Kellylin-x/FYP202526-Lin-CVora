from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class PersonalInfo(BaseModel):
    """Personal contact information for CV"""
    full_name: str = Field(..., min_length=1, description="Full name of the candidate")
    email: EmailStr = Field(..., description="Email address")
    phone: str = Field(..., min_length=10, description="Phone number")
    location: str = Field(..., description="Current location (e.g., 'Dublin, Ireland')")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL")
    github: Optional[str] = Field(None, description="GitHub profile URL")
    website: Optional[str] = Field(None, description="Personal website or portfolio URL")

    class Config:
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
    """Work experience entry"""
    id: str = Field(..., description="Unique identifier for this experience")
    job_title: str = Field(..., min_length=1, description="Job title or role")
    company: str = Field(..., min_length=1, description="Company name")
    location: str = Field(..., description="Job location")
    start_date: str = Field(..., description="Start date (e.g., 'January 2023')")
    end_date: str = Field(..., description="End date or 'Present'")
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
    """Education entry"""
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
    """Project entry for portfolio/academic projects"""
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
                "technologies": ["React", "TypeScript", "FastAPI", "OpenAI"],
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
    """Technical and soft skills"""
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
    """Complete CV data structure"""
    personal_info: PersonalInfo
    professional_summary: str = Field(default="", description="Brief professional summary (2-3 sentences)")
    experience: List[Experience] = Field(default_factory=list, description="Work experience entries")
    education: List[Education] = Field(default_factory=list, description="Education entries")
    skills: Skills
    projects: List[Project] = Field(default_factory=list, description="Portfolio or academic projects")
    certifications: List[str] = Field(default_factory=list, description="Professional certifications")

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


# Request/Response models for API endpoints

class CVUploadResponse(BaseModel):
    """Response after uploading a CV"""
    success: bool
    message: str
    parsed_data: Optional[CVData] = None
    warnings: List[str] = Field(default_factory=list)
    raw_text: Optional[str] = None


class EnhanceRequest(BaseModel):
    """Request to enhance a bullet point"""
    text: str = Field(..., min_length=5, description="Original bullet point text")
    context: dict = Field(..., description="Context (job_title, company, etc.)")


class EnhanceResponse(BaseModel):
    """Response with enhanced text"""
    original: str
    enhanced: str
    improvements: dict = Field(default_factory=dict, description="What was improved")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class JobAnalysisRequest(BaseModel):
    """Request to analyze job description"""
    job_description: str = Field(..., min_length=50)
    cv_text: Optional[str] = None


class JobAnalysisResponse(BaseModel):
    """Response with job analysis"""
    extracted_keywords: dict
    match_score: Optional[float] = None
    matched_keywords: Optional[List[str]] = None
    missing_keywords: Optional[List[str]] = None
    recommendations: List[str] = Field(default_factory=list)


class JobDescriptionRequest(BaseModel):
    """Request for LLM job description analysis"""
    job_description: str = Field(..., min_length=50)


class JobDescriptionAnalysisResponse(BaseModel):
    """Structured response for LLM-powered job analysis"""
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
    """Backward-compatible alias for restored LLM job analysis route."""


class CVCompareResponse(BaseModel):
    """Response for CV vs job comparison."""
    match_score: int = 0
    match_summary: str = ""
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    ats_verdict: Optional[str] = None