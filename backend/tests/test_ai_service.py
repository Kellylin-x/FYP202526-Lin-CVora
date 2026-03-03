import pytest
from unittest.mock import Mock, patch, PropertyMock
from app.services.ai_service import AIService


class TestAIService:
    """Test AI Service with mocked OpenAI API"""
    
    @pytest.fixture
    def service_with_mock_client(self):
        """Create a fresh AI service with mocked client for each test"""
        service = AIService(api_key="test-key")
        mock_client = Mock()
        service.client = mock_client  # Replace the client with a mock
        return service, mock_client
    
    def test_enhance_bullet_point_success(self, service_with_mock_client):
        """Test successful bullet point enhancement"""
        service, mock_client = service_with_mock_client
        
        # Mock the chat completion response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Developed web applications using React and Python, improving system performance by 40%"
        mock_client.chat.completions.create.return_value = mock_response
        
        # Call the service
        result = service.enhance_bullet_point(
            text="Built web apps with React and Python",
            context={"job_title": "Software Engineer", "company": "Tech Corp"}
        )
        
        # Assertions
        assert result['error'] is None
        assert 'enhanced' in result
        assert len(result['enhanced']) > 0
        assert 'confidence' in result
        assert 0 <= result['confidence'] <= 1.0
    
    def test_enhance_bullet_point_with_metrics(self, service_with_mock_client):
        """Test that enhancement with metrics gets high confidence"""
        service, mock_client = service_with_mock_client
        
        # Mock response with metrics
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Led team of 3 developers to deliver client project 2 weeks ahead of schedule, resulting in 95% client satisfaction"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = service.enhance_bullet_point(
            text="Led team on project",
            context={"job_title": "Team Lead", "company": "Consulting Firm"}
        )
        
        assert result['error'] is None
        assert result['improvements']['has_measurable_result'] is True
        assert result['confidence'] > 0.3
    
    def test_enhance_bullet_point_validates_output(self, service_with_mock_client):
        """Test that AI output is validated"""
        service, mock_client = service_with_mock_client
        
        # Mock response with error message
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "ERROR: I cannot complete this task"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = service.enhance_bullet_point(
            text="Did some work",
            context={"job_title": "Developer"}
        )
        
        # Should detect validation issue and return original text
        assert result['error'] == "AI produced invalid enhancement"
        assert result['enhanced'] == "Did some work"
        assert result['confidence'] == 0.0
    
    def test_confidence_scoring_with_action_verb(self, service_with_mock_client):
        """Test confidence scoring includes action verb check"""
        service, mock_client = service_with_mock_client
        
        # Mock response with strong action verb
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Developed scalable backend infrastructure"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = service.enhance_bullet_point(
            text="Worked on backend",
            context={"job_title": "Backend Engineer"}
        )
        
        # Should detect action verb
        assert result['improvements']['has_action_verb'] is True
        assert result['confidence'] > 0.0
    
    def test_handles_api_error_gracefully(self, service_with_mock_client):
        """Test graceful error handling when OpenAI API fails"""
        service, mock_client = service_with_mock_client
        
        # Simulate API error
        mock_client.chat.completions.create.side_effect = Exception("API Error: Rate limit exceeded")
        
        result = service.enhance_bullet_point(
            text="Did some work",
            context={"job_title": "Developer"}
        )
        
        # Should return error gracefully
        assert result['error'] is not None
        assert 'AI service error' in result['error']
        assert result['enhanced'] == "Did some work"
        assert result['confidence'] == 0.0
    
    def test_handles_missing_api_key(self):
        """Test behavior when API key is not configured"""
        # Create service without API key
        service_no_key = AIService(api_key=None)
        
        result = service_no_key.enhance_bullet_point(
            text="Did work",
            context={"job_title": "Developer"}
        )
        
        # Should return error about missing API key
        assert result['error'] is not None
        assert 'api key' in result['error'].lower()  # Just check for "api key"
        assert result['confidence'] == 0.0
    
    def test_rejects_text_too_short(self):
        """Test that very short text is rejected"""
        service = AIService(api_key="test-key")
        
        result = service.enhance_bullet_point(
            text="Hi",
            context={"job_title": "Developer"}
        )
        
        assert 'too short' in result['error'].lower()
        assert result['confidence'] == 0.0
    
    def test_cleans_ai_output(self, service_with_mock_client):
        """Test that AI output is cleaned (quotes, markdown removed)"""
        service, mock_client = service_with_mock_client
        
        # Mock response with quotes and markdown
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = '"**Developed** web applications"'
        mock_client.chat.completions.create.return_value = mock_response
        
        result = service.enhance_bullet_point(
            text="Built web apps",
            context={"job_title": "Developer"}
        )
        
        # Should remove quotes and markdown
        assert '"' not in result['enhanced']
        assert '**' not in result['enhanced']
    
    def test_detects_measurable_results(self, service_with_mock_client):
        """Test detection of measurable results (numbers, percentages)"""
        service, mock_client = service_with_mock_client
        
        # Mock response with metrics
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Improved system performance by 40% serving 1M users"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = service.enhance_bullet_point(
            text="Improved system",
            context={"job_title": "Engineer"}
        )
        
        # Should detect measurable results
        assert result['improvements']['has_measurable_result'] is True
    
    def test_validates_length_appropriate(self, service_with_mock_client):
        """Test that overly long responses are rejected"""
        service, mock_client = service_with_mock_client
        
        # Mock response that's too long (>200 chars)
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "A" * 250  # Way too long
        mock_client.chat.completions.create.return_value = mock_response
        
        result = service.enhance_bullet_point(
            text="Did work",
            context={"job_title": "Developer"}
        )
        
        # Should reject due to length
        assert result['error'] == "AI produced invalid enhancement"
        assert result['confidence'] == 0.0