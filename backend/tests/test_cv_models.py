import pytest
from pydantic import ValidationError
from app.models.cv_models import (
    PersonalInfo,
    Experience,
    Education,
    Project,
    Skills,
    CVData,
    EnhanceRequest,
    JobAnalysisRequest
)


class TestPersonalInfo:
    """Test PersonalInfo model validation"""
    
    def test_valid_personal_info(self):
        """Test creating PersonalInfo with valid data"""
        data = {
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+353 123 456 789",
            "location": "Dublin, Ireland"
        }
        person = PersonalInfo(**data)
        
        assert person.full_name == "John Doe"
        assert person.email == "john.doe@example.com"
        assert person.phone == "+353 123 456 789"
        assert person.location == "Dublin, Ireland"
        assert person.linkedin is None  # Optional field
        assert person.github is None    # Optional field
    
    def test_invalid_email(self):
        """Test that invalid email is rejected"""
        data = {
            "full_name": "John Doe",
            "email": "not-an-email",  # Invalid!
            "phone": "+353 123 456 789",
            "location": "Dublin, Ireland"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            PersonalInfo(**data)
        
        # Check that email validation failed
        assert "email" in str(exc_info.value)
    
    def test_missing_required_field(self):
        """Test that missing required fields are rejected"""
        data = {
            "full_name": "John Doe",
            # Missing email, phone, location!
        }
        
        with pytest.raises(ValidationError):
            PersonalInfo(**data)
    
    def test_optional_fields(self):
        """Test that optional fields work correctly"""
        data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "+353 123 456",
            "location": "Dublin",
            "linkedin": "linkedin.com/in/johndoe",
            "github": "github.com/johndoe",
            "website": "johndoe.com"
        }
        person = PersonalInfo(**data)
        
        assert person.linkedin == "linkedin.com/in/johndoe"
        assert person.github == "github.com/johndoe"
        assert person.website == "johndoe.com"


class TestExperience:
    """Test Experience model validation"""
    
    def test_valid_experience(self):
        """Test creating Experience with valid data"""
        data = {
            "id": "exp-1",
            "job_title": "Software Engineer",
            "company": "Tech Corp",
            "location": "Dublin, Ireland",
            "start_date": "January 2023",
            "end_date": "Present",
            "responsibilities": ["Developed features", "Fixed bugs"],
            "achievements": ["Improved performance by 40%"],
            "technologies": ["Python", "React", "Docker"]
        }
        exp = Experience(**data)
        
        assert exp.id == "exp-1"
        assert exp.job_title == "Software Engineer"
        assert len(exp.responsibilities) == 2
        assert len(exp.achievements) == 1
        assert len(exp.technologies) == 3
    
    def test_empty_lists_allowed(self):
        """Test that empty lists are allowed for responsibilities, achievements, technologies"""
        data = {
            "id": "exp-1",
            "job_title": "Intern",
            "company": "Startup Inc",
            "location": "Remote",
            "start_date": "June 2024",
            "end_date": "August 2024"
            # No responsibilities, achievements, or technologies
        }
        exp = Experience(**data)
        
        assert exp.responsibilities == []
        assert exp.achievements == []
        assert exp.technologies == []


class TestSkills:
    """Test Skills model"""
    
    def test_valid_skills(self):
        """Test creating Skills with both technical and soft skills"""
        data = {
            "technical": ["Python", "JavaScript", "Docker"],
            "soft": ["Communication", "Teamwork", "Problem Solving"]
        }
        skills = Skills(**data)
        
        assert len(skills.technical) == 3
        assert len(skills.soft) == 3
        assert "Python" in skills.technical
        assert "Communication" in skills.soft
    
    def test_empty_skills_allowed(self):
        """Test that empty skill lists are allowed"""
        skills = Skills()
        
        assert skills.technical == []
        assert skills.soft == []


class TestCVData:
    """Test complete CVData model"""
    
    def test_minimal_cv_data(self):
        """Test creating CVData with minimal required fields"""
        data = {
            "personal_info": {
                "full_name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+353 87 1234567",
                "location": "Cork, Ireland"
            },
            "skills": {
                "technical": ["Python"],
                "soft": []
            }
        }
        cv = CVData(**data)
        
        assert cv.personal_info.full_name == "Jane Smith"
        assert cv.professional_summary == ""  # Default empty
        assert cv.experience == []  # Default empty
        assert cv.education == []   # Default empty
        assert cv.projects == []    # Default empty
        assert cv.certifications == []  # Default empty
    
    def test_complete_cv_data(self):
        """Test creating CVData with all fields populated"""
        data = {
            "personal_info": {
                "full_name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+353 87 1234567",
                "location": "Cork, Ireland",
                "linkedin": "linkedin.com/in/janesmith"
            },
            "professional_summary": "Experienced software engineer",
            "experience": [
                {
                    "id": "exp-1",
                    "job_title": "Senior Developer",
                    "company": "Tech Firm",
                    "location": "Cork",
                    "start_date": "2020",
                    "end_date": "Present",
                    "responsibilities": ["Lead development"],
                    "achievements": ["Shipped major feature"],
                    "technologies": ["Python", "React"]
                }
            ],
            "education": [
                {
                    "id": "edu-1",
                    "degree": "BSc Computer Science",
                    "institution": "University of Galway",
                    "location": "Galway",
                    "graduation_date": "2019",
                    "grade": "First Class Honours"
                }
            ],
            "skills": {
                "technical": ["Python", "JavaScript"],
                "soft": ["Leadership"]
            },
            "projects": [],
            "certifications": ["AWS Certified"]
        }
        cv = CVData(**data)
        
        assert cv.professional_summary == "Experienced software engineer"
        assert len(cv.experience) == 1
        assert len(cv.education) == 1
        assert len(cv.certifications) == 1


class TestEnhanceRequest:
    """Test EnhanceRequest model for API"""
    
    def test_valid_enhance_request(self):
        """Test creating valid enhancement request"""
        data = {
            "text": "Did some coding work",
            "context": {
                "job_title": "Software Engineer",
                "company": "Tech Corp"
            }
        }
        request = EnhanceRequest(**data)
        
        assert request.text == "Did some coding work"
        assert request.context["job_title"] == "Software Engineer"
    
    def test_text_too_short(self):
        """Test that very short text is rejected"""
        data = {
            "text": "Hi",  # Only 2 characters, min is 5
            "context": {"job_title": "Engineer"}
        }
        
        with pytest.raises(ValidationError):
            EnhanceRequest(**data)


class TestJobAnalysisRequest:
    """Test JobAnalysisRequest model"""
    
    def test_valid_job_analysis_request(self):
        """Test creating valid job analysis request"""
        data = {
            "job_description": "Looking for a Python developer with React experience and knowledge of Docker containers."
        }
        request = JobAnalysisRequest(**data)
        
        assert len(request.job_description) >= 50
        assert request.cv_text is None  # Optional
    
    def test_job_description_too_short(self):
        """Test that short job descriptions are rejected"""
        data = {
            "job_description": "Python dev"  # Too short (< 50 chars)
        }
        
        with pytest.raises(ValidationError):
            JobAnalysisRequest(**data)
    
    def test_with_cv_text(self):
        """Test job analysis request with CV text included"""
        data = {
            "job_description": "Looking for a Python developer with 3 years experience in web development using Django or Flask.",
            "cv_text": "Experienced Python developer with Django and Flask skills."
        }
        request = JobAnalysisRequest(**data)
        
        assert request.cv_text is not None
        assert "Django" in request.cv_text