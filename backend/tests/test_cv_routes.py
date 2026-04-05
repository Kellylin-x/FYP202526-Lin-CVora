import pytest
import io
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas
from docx import Document
from app.models.cv_models import CVData, PersonalInfo, Skills
from app.services.cv_parser import cv_parser

from app.main import app


client = TestClient(app)

def _mock_parsed_cv():
    return {
        'success': True,
        'parsed_data': {
            'personal_info': {
                'full_name': 'John Doe',
                'email': 'john@example.com',
                'phone': '+353 85 123 4567',
                'location': 'Dublin, Ireland'
            },
            'professional_summary': 'Experienced software engineer.',
            'skills': {'technical': ['Python', 'React'], 'soft': ['Teamwork']},
            'experience': [],
            'education': [],
            'projects': [],
            'certifications': [],
            'dynamic_sections': []
        },
        'warnings': [],
        'raw_text': ''
    }

def _mock_parsed_cv_with_warnings():
    return {
        'success': True,
        'parsed_data': {
            'personal_info': {
                'full_name': 'Unknown',
                'email': 'unknown@example.com',
                'phone': '0000000000',
                'location': 'Unknown'
            },
            'professional_summary': '',
            'skills': {'technical': [], 'soft': []},
            'experience': [],
            'education': [],
            'projects': [],
            'certifications': [],
            'dynamic_sections': []
        },
        'warnings': ['No experience section found', 'No skills detected'],
        'raw_text': ''
    }

class TestCVUploadEndpoint:
    """Integration tests for POST /api/cv/upload"""

    def _generate_pdf(self, text: str) -> bytes:
        """Helper to generate a minimal PDF for upload tests"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer)
        c.drawString(100, 750, text)
        c.save()
        return buffer.getvalue()

    def _generate_docx(self, text: str) -> bytes:
        """Helper to generate a minimal DOCX for upload tests"""
        doc = Document()
        doc.add_paragraph(text)
        buffer = io.BytesIO()
        doc.save(buffer)
        return buffer.getvalue()

    def test_upload_valid_pdf(self):
        """Test uploading a valid PDF file"""
        pdf_bytes = self._generate_pdf("John Doe\njohn@example.com\nPython Developer")

        with patch('app.api.cv_routes.asyncio.to_thread') as mock_thread:
            mock_thread.return_value = _mock_parsed_cv()
            response = client.post(
                "/api/cv/upload",
                files={"file": ("test_cv.pdf", pdf_bytes, "application/pdf")}
            )

        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'parsed_data' in data
        assert 'warnings' in data

    def test_upload_valid_docx(self):
        """Test uploading a valid DOCX file"""
        docx_bytes = self._generate_docx("Jane Smith\njane@example.com\nSoftware Engineer")

        with patch('app.api.cv_routes.asyncio.to_thread') as mock_thread:
            mock_thread.return_value = _mock_parsed_cv()
            response = client.post(
                "/api/cv/upload",
                files={"file": ("test_cv.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            )

        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True

    def test_upload_invalid_file_type(self):
        """Test that unsupported file types are rejected"""
        response = client.post(
            "/api/cv/upload",
            files={"file": ("cv.txt", b"some text content", "text/plain")}
        )

        assert response.status_code == 400
        assert "Unsupported file type" in response.json()['detail']

    def test_upload_no_filename(self):
        """Test that missing filename is rejected"""
        response = client.post(
            "/api/cv/upload",
            files={"file": ("", b"content", "application/pdf")}
        )

        assert response.status_code in [400, 422]

    def test_upload_returns_warnings_for_incomplete_cv(self):
        """Test that warnings are returned for CVs missing sections"""
        pdf_bytes = self._generate_pdf("Just a name, nothing else here at all.")

        with patch('app.api.cv_routes.asyncio.to_thread') as mock_thread:
            mock_thread.return_value = _mock_parsed_cv_with_warnings()
            response = client.post(
                "/api/cv/upload",
                files={"file": ("minimal_cv.pdf", pdf_bytes, "application/pdf")}
            )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data['warnings'], list)
        assert len(data['warnings']) > 0


class TestEnhanceBulletEndpoint:
    """Integration tests for POST /api/cv/enhance-bullet"""

    @pytest.fixture
    def mock_ai_service(self):
        """Mock the AI service at the route level"""
        with patch('app.api.cv_routes.ai_service') as mock:
            mock.enhance_bullet_point.return_value = {
                'original': 'Built web apps',
                'enhanced': 'Developed scalable web applications using React and Python',
                'improvements': {
                    'has_action_verb': True,
                    'has_measurable_result': False,
                    'length_appropriate': True,
                    'improved_clarity': True
                },
                'confidence': 0.65,
                'error': None
            }
            yield mock

    def test_enhance_bullet_success(self, mock_ai_service):
        """Test successful bullet point enhancement"""
        response = client.post(
            "/api/cv/enhance-bullet",
            json={
                "text": "Built web apps with React and Python",
                "context": {"job_title": "Software Engineer", "company": "Tech Corp"}
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert 'original' in data
        assert 'enhanced' in data
        assert 'confidence' in data
        assert 'improvements' in data

    def test_enhance_bullet_text_too_short(self):
        """Test that text under 5 characters is rejected"""
        response = client.post(
            "/api/cv/enhance-bullet",
            json={
                "text": "Hi",
                "context": {"job_title": "Developer"}
            }
        )

        assert response.status_code == 422

    def test_enhance_bullet_text_too_long(self):
        """Test that text over 500 characters is rejected"""
        response = client.post(
            "/api/cv/enhance-bullet",
            json={
                "text": "A" * 501,
                "context": {"job_title": "Developer"}
            }
        )

        assert response.status_code == 400
        assert "too long" in response.json()['detail'].lower()

    def test_enhance_bullet_ai_service_error(self):
        """Test handling when AI service returns an error"""
        with patch('app.api.cv_routes.ai_service') as mock:
            mock.enhance_bullet_point.return_value = {
                'original': 'Did some work',
                'enhanced': 'Did some work',
                'improvements': {},
                'confidence': 0.0,
                'error': 'AI service not configured (missing API key)'
            }

            response = client.post(
                "/api/cv/enhance-bullet",
                json={
                    "text": "Did some work on the project",
                    "context": {"job_title": "Developer"}
                }
            )

        assert response.status_code == 503
        assert 'detail' in response.json()


class TestJobAnalysisEndpoint:
    """Integration tests for POST /api/cv/job/analyze"""

    def test_analyze_job_keywords_only(self):
        """Test job analysis without CV text — keywords only"""
        response = client.post(
            "/api/cv/job/analyze",
            json={
                "job_description": "Looking for a Python developer with React and Docker experience. Must know AWS and PostgreSQL."
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert 'extracted_keywords' in data
        assert data['match_score'] is None
        assert data['matched_keywords'] is None
        assert data['missing_keywords'] is None
        assert isinstance(data['recommendations'], list)

    def test_analyze_job_with_cv_comparison(self):
        """Test full job vs CV comparison"""
        response = client.post(
            "/api/cv/job/analyze",
            json={
                "job_description": "Senior Python developer needed with Django, PostgreSQL, Docker, and AWS experience.",
                "cv_text": "Experienced Python and Django developer. Familiar with PostgreSQL and Docker."
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert 'extracted_keywords' in data
        assert data['match_score'] is not None
        assert isinstance(data['match_score'], float)
        assert data['matched_keywords'] is not None
        assert data['missing_keywords'] is not None
        assert len(data['recommendations']) > 0

    def test_analyze_job_description_too_short(self):
        """Test that job descriptions under 50 characters are rejected"""
        response = client.post(
            "/api/cv/job/analyze",
            json={
                "job_description": "Short job"
            }
        )

        assert response.status_code == 422

    def test_analyze_job_returns_keyword_dict(self):
        """Test that extracted_keywords is a dict with expected structure"""
        response = client.post(
            "/api/cv/job/analyze",
            json={
                "job_description": "Python developer with React, Docker, and AWS experience required for our team."
            }
        )

        assert response.status_code == 200
        data = response.json()
        # extracted_keywords is a dict (from keyword_matcher)
        assert isinstance(data['extracted_keywords'], dict)
        assert 'all' in data['extracted_keywords']


class TestHealthEndpoint:
    """Tests for health check endpoints"""

    def test_cv_routes_health(self):
        """Test CV routes health check"""
        response = client.get("/api/cv/health")

        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'routes' in data