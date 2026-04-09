import pytest
from app.services.keyword_matcher import ats_analyzer


class TestKeywordMatcher:
    """Test Keyword Matcher and ATS Analyzer"""

    def test_extract_keywords_from_text(self):
        """Test keyword extraction from text"""
        text = """
        Looking for a Python developer with React experience.
        Must know Docker and AWS. Experience with PostgreSQL required.
        """

        keywords = ats_analyzer.extract_keywords(text)

        # extract_keywords returns a dict with 'all', 'technical_skills', etc.
        assert 'python' in keywords['all']
        assert 'react' in keywords['all']
        assert 'docker' in keywords['all']
        assert 'aws' in keywords['all']
        assert 'postgresql' in keywords['all']
        assert len(keywords['all']) >= 5

    def test_extract_keywords_case_insensitive(self):
        """Test that keyword extraction is case-insensitive"""
        text = "PYTHON JavaScript react DOCKER aws"

        keywords = ats_analyzer.extract_keywords(text)

        assert 'python' in keywords['all']
        assert 'javascript' in keywords['all']
        assert 'react' in keywords['all']
        assert 'docker' in keywords['all']
        assert 'aws' in keywords['all']

    def test_extract_keywords_ignores_non_keywords(self):
        """Test that non-STEM keywords are not extracted"""
        text = """
        Looking for someone who likes pizza and enjoys walking.
        Must be friendly and have a car.
        """

        keywords = ats_analyzer.extract_keywords(text)

        assert 'pizza' not in keywords['all']
        assert 'walking' not in keywords['all']
        assert 'car' not in keywords['all']
        assert 'friendly' not in keywords['all']

    def test_calculate_match_score_perfect_match(self):
        """Test match score calculation with perfect match"""
        cv_text = "Python, JavaScript, React, Docker, AWS, PostgreSQL"
        job_keywords = ['python', 'javascript', 'react', 'docker', 'aws', 'postgresql']

        result = ats_analyzer.calculate_match_score(cv_text, job_keywords)

        assert result['match_score'] == 100.0
        assert result['matched_count'] == 6
        assert result['missing_count'] == 0

    def test_calculate_match_score_partial_match(self):
        """Test match score calculation with partial match"""
        cv_text = "Python, JavaScript, React"
        job_keywords = ['python', 'javascript', 'react', 'docker', 'aws', 'postgresql']

        result = ats_analyzer.calculate_match_score(cv_text, job_keywords)

        assert result['match_score'] == 50.0
        assert result['matched_count'] == 3
        assert result['missing_count'] == 3

    def test_calculate_match_score_no_match(self):
        """Test match score calculation with no matches"""
        cv_text = "Microsoft Word, Excel, PowerPoint"
        job_keywords = ['python', 'javascript', 'react', 'docker', 'aws']

        result = ats_analyzer.calculate_match_score(cv_text, job_keywords)

        assert result['match_score'] == 0.0
        assert result['matched_count'] == 0

    def test_analyze_job_vs_cv_complete_analysis(self):
        """Test complete job vs CV analysis"""
        job_description = """
        Senior Python Developer needed.
        Must have: Python, Django, PostgreSQL, Docker, AWS
        Nice to have: React, TypeScript
        """

        cv_text = """
        Experienced developer with Python, Django, PostgreSQL, and Docker.
        Also familiar with React and JavaScript.
        """

        result = ats_analyzer.analyze_job_vs_cv(job_description, cv_text)

        # Check all keys that analyze_job_vs_cv actually returns
        assert 'match_score' in result
        assert 'matched_keywords' in result
        assert 'missing_keywords' in result
        assert 'ats_compatible' in result
        assert 'ats_issues' in result
        assert 'recommendations' in result
        assert 'job_keyword_count' in result
        assert 'cv_keyword_count' in result

        assert 'python' in result['matched_keywords']
        assert 'django' in result['matched_keywords']
        assert 'postgresql' in result['matched_keywords']
        assert 'docker' in result['matched_keywords']

        assert result['match_score'] >= 70.0

    def test_check_ats_compatibility_clean_cv(self):
        """Test ATS compatibility check with clean CV"""
        cv_text = """
        John Doe
        john@example.com
        +353 87 1234567

        EXPERIENCE
        Software Engineer at Tech Corp
        - Developed Python applications

        EDUCATION
        BSc Computer Science

        SKILLS
        Python, JavaScript, React
        """

        result = ats_analyzer.check_ats_compatibility(cv_text)

        # check_ats_compatibility uses 'is_ats_friendly', not 'is_compatible'
        assert result['is_ats_friendly'] is True
        assert result['issues'] == []

    def test_check_ats_compatibility_missing_sections(self):
        """Test ATS compatibility with missing sections"""
        cv_text = """
        John Doe
        john@example.com

        Just some random text here with over one hundred words to pass the length check.
        More text here. And more text. And even more text to make sure we have enough words.
        Additional content to ensure the word count is sufficient for the test to work properly.
        We need to make sure this is long enough so the length check passes but other checks fail.
        """

        result = ats_analyzer.check_ats_compatibility(cv_text)

        assert result['is_ats_friendly'] is False
        assert len(result['issues']) > 0

    def test_check_ats_compatibility_missing_contact(self):
        """Test ATS compatibility with missing contact info"""
        cv_text = """
        EXPERIENCE
        Software Engineer working on interesting projects for several years.

        EDUCATION
        BSc Computer Science from a good university.

        SKILLS
        Python, JavaScript, React, Docker, AWS, many other technologies.
        Additional text to make sure we have enough words for the length requirement.
        """

        result = ats_analyzer.check_ats_compatibility(cv_text)

        assert result['is_ats_friendly'] is False
        assert any('email' in issue.lower() for issue in result['issues'])

    def test_check_ats_compatibility_problematic_characters(self):
        """Test ATS compatibility detects problematic formatting"""
        cv_text = """
        John Doe \u2502 john@example.com \u2502 Phone: 123-456-7890

        \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
        \u2502   EXPERIENCE    \u2502
        \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

        Software Engineer \u2551 Tech Corp
        Worked on many Python and JavaScript projects over the years.

        EDUCATION
        BSc Computer Science

        SKILLS
        Python JavaScript React
        """

        result = ats_analyzer.check_ats_compatibility(cv_text)

        assert result['is_ats_friendly'] is False
        assert any(
            'box' in issue.lower() or 'special' in issue.lower() or 'character' in issue.lower()
            for issue in result['issues']
        )

    def test_stem_keyword_database_coverage(self):
        """Test that STEM keyword database has comprehensive coverage"""
        test_keywords = {
            'programming': ['python', 'java', 'javascript', 'c++'],
            'frontend': ['react', 'angular', 'vue'],
            'backend': ['django', 'flask', 'node.js', 'spring'],
            'databases': ['postgresql', 'mysql', 'mongodb'],
            'cloud': ['aws', 'azure', 'docker', 'kubernetes'],
            'ai_ml': ['tensorflow', 'pytorch', 'machine learning'],
            'testing': ['jest', 'pytest', 'selenium'],
            'methodologies': ['agile', 'scrum', 'devops']
        }

        text = ' '.join([' '.join(keywords) for keywords in test_keywords.values()])
        extracted = ats_analyzer.extract_keywords(text)

        # Must check extracted['all'], not len(extracted) which is always 4 (number of dict keys)
        assert len(extracted['all']) >= 25

        # Verify coverage across categories
        assert any(kw in extracted['all'] for kw in test_keywords['programming'])
        assert any(kw in extracted['all'] for kw in test_keywords['frontend'])
        assert any(kw in extracted['all'] for kw in test_keywords['backend'])
        assert any(kw in extracted['all'] for kw in test_keywords['databases'])
        assert any(kw in extracted['all'] for kw in test_keywords['cloud'])

    def test_recommendations_generation(self):
        """Test that recommendations are generated for issues"""
        cv_text = "Just a short text"

        result = ats_analyzer.check_ats_compatibility(cv_text)

        assert 'recommendations' in result
        assert len(result['recommendations']) > 0
        assert isinstance(result['recommendations'], list)

        for rec in result['recommendations']:
            assert isinstance(rec, str)
            assert len(rec) > 10

    def test_handles_empty_text(self):
        """Test handling of empty text input"""
        keywords = ats_analyzer.extract_keywords("")

        # Returns a dict — all lists should be empty
        assert isinstance(keywords, dict)
        assert keywords['all'] == []

    def test_handles_very_short_cv(self):
        """Test ATS check with very short CV"""
        cv_text = "Hi there"

        result = ats_analyzer.check_ats_compatibility(cv_text)

        assert result['is_ats_friendly'] is False
        assert any('short' in issue.lower() for issue in result['issues'])