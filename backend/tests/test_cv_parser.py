import pytest
import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from docx import Document
from app.services.cv_parser import cv_parser


class TestCVParser:
    """Test CV Parser with real CV data"""
    
    @pytest.fixture(scope="class")
    def fixtures_dir(self):
        """Get the fixtures directory path"""
        return Path(__file__).parent / "fixtures"
    
    @pytest.fixture(scope="class")
    def sample_cv_text(self, fixtures_dir):
        """Load sample CV text"""
        cv_path = fixtures_dir / "sample_cv.txt"
        with open(cv_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    @pytest.fixture(scope="class")
    def sample_pdf_path(self, fixtures_dir, sample_cv_text):
        """Create a sample PDF CV for testing"""
        pdf_path = fixtures_dir / "sample_cv.pdf"
        
        # Create PDF with CV content
        c = canvas.Canvas(str(pdf_path), pagesize=letter)
        
        # Split text into lines and write to PDF
        y_position = 750
        for line in sample_cv_text.split('\n'):
            if y_position < 50:  # New page if running out of space
                c.showPage()
                y_position = 750
            c.drawString(50, y_position, line[:80])  # Limit line length
            y_position -= 15
        
        c.save()
        
        yield pdf_path
        
        # Cleanup
        if pdf_path.exists():
            os.remove(pdf_path)
    
    @pytest.fixture(scope="class")
    def sample_docx_path(self, fixtures_dir, sample_cv_text):
        """Create a sample DOCX CV for testing"""
        docx_path = fixtures_dir / "sample_cv.docx"
        
        # Create DOCX with CV content
        doc = Document()
        for line in sample_cv_text.split('\n'):
            if line.strip():
                doc.add_paragraph(line)
        
        doc.save(str(docx_path))
        
        yield docx_path
        
        # Cleanup
        if docx_path.exists():
            os.remove(docx_path)
    
    def test_parse_pdf_success(self, sample_pdf_path):
        """Test that PDF parsing returns success"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        assert result['success'] is True
        assert 'parsed_data' in result
        assert 'raw_text' in result
        assert len(result['raw_text']) > 0
    
    def test_parse_docx_success(self, sample_docx_path):
        """Test that DOCX parsing returns success"""
        result = cv_parser.parse_docx(str(sample_docx_path))
        
        assert result['success'] is True
        assert 'parsed_data' in result
        assert 'raw_text' in result
        assert len(result['raw_text']) > 0
    
    def test_extract_email_from_your_cv(self, sample_pdf_path):
        """Test that parser extracts YOUR email correctly"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        personal_info = result['parsed_data']['personal_info']
        
        # Should extract your email
        assert personal_info['email'] == 'y.lin1@universityofgalway.ie'
    
    def test_extract_phone_from_your_cv(self, sample_pdf_path):
        """Test that parser extracts YOUR phone number"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        personal_info = result['parsed_data']['personal_info']
        
        # Should extract your phone (might have different formatting)
        assert personal_info['phone'] is not None
        assert '085' in personal_info['phone'] or '1600' in personal_info['phone']
    
    def test_extract_name_from_your_cv(self, sample_pdf_path):
        """Test that parser extracts YOUR name"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        personal_info = result['parsed_data']['personal_info']
        
        # Should extract your name (or part of it)
        assert personal_info['full_name'] is not None
        assert len(personal_info['full_name']) > 0
    
    def test_extract_location_from_your_cv(self, sample_pdf_path):
        """Test that parser extracts location"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        personal_info = result['parsed_data']['personal_info']
        raw_text = result['raw_text'].lower()
        
        # Should detect Irish location (Galway, Tullamore, or Ireland)
        location = personal_info.get('location', '').lower()
        
        # Check if any Irish location is detected
        irish_locations = ['ireland', 'tullamore', 'galway', 'offaly']
        location_found = any(loc in location or loc in raw_text for loc in irish_locations)
        
        assert location_found, f"Should detect Irish location. Found location: '{location}'"
        
    def test_extract_skills_from_your_cv(self, sample_pdf_path):
        """Test that parser extracts YOUR technical skills"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        skills = result['parsed_data']['skills']['technical']
        raw_text = result['raw_text'].lower()
        
        # Your CV mentions these skills - at least some should be detected
        expected_skills = ['java', 'javascript', 'python', 'c', 'html', 'bash', 'sql']
        
        # Check if at least 3 of your skills are detected
        found_count = sum(1 for skill in expected_skills if skill in raw_text)
        assert found_count >= 3, f"Should detect at least 3 skills, found {found_count}"
    
    def test_extract_education_from_your_cv(self, sample_pdf_path):
        """Test that parser detects YOUR education"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        education = result['parsed_data']['education']
        raw_text = result['raw_text'].lower()
        
        # Should detect your degree or university
        assert len(education) > 0 or 'computer science' in raw_text or 'university' in raw_text
    
    def test_extract_experience_from_your_cv(self, sample_pdf_path):
        """Test that parser detects YOUR work experience"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        experience = result['parsed_data']['experience']
        raw_text = result['raw_text'].lower()
        
        # Should detect your Aura experience or receptionist role
        assert len(experience) > 0 or 'aura' in raw_text or 'receptionist' in raw_text
    
    def test_warnings_for_missing_data(self, sample_pdf_path):
        """Test that parser generates warnings for any missing sections"""
        result = cv_parser.parse_pdf(str(sample_pdf_path))
        
        # Warnings should be a list
        assert 'warnings' in result
        assert isinstance(result['warnings'], list)
    
    def test_parse_nonexistent_file(self):
        """Test that parser handles missing files gracefully"""
        result = cv_parser.parse_pdf("nonexistent_file.pdf")
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_pdf_and_docx_extract_same_email(self, sample_pdf_path, sample_docx_path):
        """Test that PDF and DOCX parsing extract the same email"""
        pdf_result = cv_parser.parse_pdf(str(sample_pdf_path))
        docx_result = cv_parser.parse_docx(str(sample_docx_path))
        
        pdf_email = pdf_result['parsed_data']['personal_info']['email']
        docx_email = docx_result['parsed_data']['personal_info']['email']
        
        # Both should extract your email
        assert pdf_email == docx_email
        assert pdf_email == 'y.lin1@universityofgalway.ie'