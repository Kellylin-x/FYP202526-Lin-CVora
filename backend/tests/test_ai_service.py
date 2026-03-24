import pytest
from unittest.mock import Mock
from app.services.ai_service import AIService


class TestAIService:
    """Test AI Service with mocked Gemini API"""

    @pytest.fixture
    def service_with_mock_client(self):
        """
        Create a fresh AIService with a mocked Gemini client for each test.
        Replaces the real client so no actual API calls are made.
        """
        service = AIService(api_key="test-key")
        mock_client = Mock()
        service.client = mock_client
        return service, mock_client

    def _mock_gemini_response(self, mock_client, text: str):
        """
        Helper to set up a Gemini-style mock response.
        Gemini returns response.text, not response.choices[0].message.content.
        """
        mock_response = Mock()
        mock_response.text = text
        mock_client.models.generate_content.return_value = mock_response

    # ── enhance_bullet_point tests ─────────────────────────────────────────

    def test_enhance_bullet_point_success(self, service_with_mock_client):
        """Test successful bullet point enhancement"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(
            mock_client,
            "Developed web applications using React and Python, improving system performance by 40%"
        )

        result = service.enhance_bullet_point(
            text="Built web apps with React and Python",
            context={"job_title": "Software Engineer", "company": "Tech Corp"}
        )

        assert result['error'] is None
        assert 'enhanced' in result
        assert len(result['enhanced']) > 0
        assert 'confidence' in result
        assert 0 <= result['confidence'] <= 1.0

    def test_enhance_bullet_point_with_metrics(self, service_with_mock_client):
        """Test that enhancement with metrics gets high confidence"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(
            mock_client,
            "Led team of 3 developers to deliver client project 2 weeks ahead of schedule, resulting in 95% client satisfaction"
        )

        result = service.enhance_bullet_point(
            text="Led team on project",
            context={"job_title": "Team Lead", "company": "Consulting Firm"}
        )

        assert result['error'] is None
        assert result['improvements']['has_measurable_result'] is True
        assert result['confidence'] > 0.3

    def test_enhance_bullet_point_validates_output(self, service_with_mock_client):
        """Test that AI output containing error messages is rejected"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, "ERROR: I cannot complete this task")

        result = service.enhance_bullet_point(
            text="Did some work",
            context={"job_title": "Developer"}
        )

        assert result['error'] == "AI produced invalid enhancement"
        assert result['enhanced'] == "Did some work"
        assert result['confidence'] == 0.0

    def test_confidence_scoring_with_action_verb(self, service_with_mock_client):
        """Test that a strong action verb at the start scores correctly"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, "Developed scalable backend infrastructure")

        result = service.enhance_bullet_point(
            text="Worked on backend",
            context={"job_title": "Backend Engineer"}
        )

        assert result['improvements']['has_action_verb'] is True
        assert result['confidence'] > 0.0

    def test_handles_api_error_gracefully(self, service_with_mock_client):
        """Test graceful error handling when Gemini API raises an exception"""
        service, mock_client = service_with_mock_client
        mock_client.models.generate_content.side_effect = Exception("API Error: Rate limit exceeded")

        result = service.enhance_bullet_point(
            text="Did some work",
            context={"job_title": "Developer"}
        )

        assert result['error'] is not None
        assert 'AI service error' in result['error']
        assert result['enhanced'] == "Did some work"
        assert result['confidence'] == 0.0

    def test_handles_missing_api_key(self):
        """Test behaviour when no API key is configured"""
        service_no_key = AIService(api_key=None)

        result = service_no_key.enhance_bullet_point(
            text="Did work",
            context={"job_title": "Developer"}
        )

        assert result['error'] is not None
        assert 'api key' in result['error'].lower()
        assert result['confidence'] == 0.0

    def test_rejects_text_too_short(self):
        """Test that text under 5 characters is rejected before calling the API"""
        service = AIService(api_key="test-key")

        result = service.enhance_bullet_point(
            text="Hi",
            context={"job_title": "Developer"}
        )

        assert 'too short' in result['error'].lower()
        assert result['confidence'] == 0.0

    def test_cleans_ai_output(self, service_with_mock_client):
        """Test that quotes and markdown are stripped from AI output"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, '"**Developed** web applications"')

        result = service.enhance_bullet_point(
            text="Built web apps",
            context={"job_title": "Developer"}
        )

        assert '"' not in result['enhanced']
        assert '**' not in result['enhanced']

    def test_detects_measurable_results(self, service_with_mock_client):
        """Test detection of numbers and percentages as measurable results"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, "Improved system performance by 40% serving 1M users")

        result = service.enhance_bullet_point(
            text="Improved system",
            context={"job_title": "Engineer"}
        )

        assert result['improvements']['has_measurable_result'] is True

    def test_validates_length_appropriate(self, service_with_mock_client):
        """Test that responses over 200 characters are rejected"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, "A" * 250)

        result = service.enhance_bullet_point(
            text="Did work",
            context={"job_title": "Developer"}
        )

        assert result['error'] == "AI produced invalid enhancement"
        assert result['confidence'] == 0.0

    # ── chat_with_cv_context tests ─────────────────────────────────────────

    def test_chat_returns_reply(self, service_with_mock_client):
        """Test that chat returns a reply string on success"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, "Here are some tips to improve your bullet points...")

        result = service.chat_with_cv_context(
            message="How can I improve my bullet points?",
            history=[],
            cv_data={
                "personal_info": {"full_name": "Jane Smith"},
                "target_role": {"job_title": "Software Engineer", "career_focus": ""},
                "experience": [],
                "education": [],
                "skills": {"technical": [], "soft": []},
                "professional_summary": ""
            }
        )

        assert "reply" in result
        assert len(result["reply"]) > 0
        assert "error" not in result

    def test_chat_includes_conversation_history(self, service_with_mock_client):
        """Test that previous conversation history is passed to the model"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, "Based on your previous question...")

        history = [
            {"role": "user", "content": "What is the STAR method?"},
            {"role": "assistant", "content": "STAR stands for Situation, Task, Action, Result."}
        ]

        result = service.chat_with_cv_context(
            message="Can you give me an example?",
            history=history,
            cv_data={"personal_info": {}, "target_role": {}, "experience": [],
                     "education": [], "skills": {}, "professional_summary": ""}
        )

        assert "reply" in result
        # Verify the prompt passed to Gemini includes the history
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]["contents"] if "contents" in call_args[1] else call_args[0][1]
        assert "STAR method" in prompt

    def test_chat_handles_missing_api_key(self):
        """Test that chat returns an error when no API key is set"""
        service = AIService(api_key=None)

        result = service.chat_with_cv_context(
            message="Help me with my CV",
            history=[],
            cv_data={}
        )

        assert "error" in result
        assert "api key" in result["error"].lower()

    def test_chat_handles_api_error(self, service_with_mock_client):
        """Test graceful handling when Gemini raises an exception during chat"""
        service, mock_client = service_with_mock_client
        mock_client.models.generate_content.side_effect = Exception("Gemini API unavailable")

        result = service.chat_with_cv_context(
            message="Help me",
            history=[],
            cv_data={}
        )

        assert "error" in result
        assert "AI service error" in result["error"]

    def test_chat_uses_cv_context_in_prompt(self, service_with_mock_client):
        """Test that CV data is embedded in the prompt sent to Gemini"""
        service, mock_client = service_with_mock_client
        self._mock_gemini_response(mock_client, "Great experience!")

        service.chat_with_cv_context(
            message="How does my CV look?",
            history=[],
            cv_data={
                "personal_info": {"full_name": "Kelly Lin"},
                "target_role": {"job_title": "Data Scientist", "career_focus": "ML roles"},
                "experience": [],
                "education": [],
                "skills": {"technical": ["Python", "TensorFlow"], "soft": []},
                "professional_summary": ""
            }
        )

        # Check the prompt sent to Gemini contains the user's name and target role
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]["contents"] if "contents" in call_args[1] else call_args[0][1]
        assert "Kelly Lin" in prompt
        assert "Data Scientist" in prompt