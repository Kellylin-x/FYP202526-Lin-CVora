from typing import Dict, List, Set, Optional
import re


class ATSAnalyzer:
    """
    ATS (Applicant Tracking System) Analyzer
    Checks CV compatibility and keyword matching for STEM roles
    """
    
    def __init__(self):
        # Comprehensive STEM keywords database
        self.stem_keywords = self._load_stem_keywords()
    
    def _load_stem_keywords(self) -> Set[str]:
        """
        Load comprehensive database of STEM keywords
        Organized by category for better matching
        """
        keywords = set()
        
        # Programming Languages
        languages = [
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'c',
            'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab',
            'php', 'perl', 'shell', 'bash', 'powershell', 'sql', 'html', 'css'
        ]
        keywords.update(languages)
        
        # Frontend Frameworks & Libraries
        frontend = [
            'react', 'angular', 'vue', 'vue.js', 'svelte', 'next.js', 'nuxt.js',
            'jquery', 'bootstrap', 'tailwind', 'material-ui', 'redux', 'webpack'
        ]
        keywords.update(frontend)
        
        # Backend Frameworks
        backend = [
            'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
            '.net', 'asp.net', 'rails', 'laravel', 'symfony', 'nestjs'
        ]
        keywords.update(backend)
        
        # Databases
        databases = [
            'sql', 'mysql', 'postgresql', 'oracle', 'sql server', 'mongodb',
            'redis', 'cassandra', 'dynamodb', 'elasticsearch', 'firebase',
            'mariadb', 'sqlite', 'neo4j', 'couchdb'
        ]
        keywords.update(databases)
        
        # Cloud & DevOps
        cloud = [
            'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
            'jenkins', 'gitlab', 'github actions', 'circleci', 'terraform',
            'ansible', 'puppet', 'chef', 'ci/cd', 'devops'
        ]
        keywords.update(cloud)
        
        # AI/ML & Data Science
        aiml = [
            'machine learning', 'deep learning', 'neural networks', 'tensorflow',
            'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'nlp',
            'computer vision', 'data science', 'big data', 'spark', 'hadoop'
        ]
        keywords.update(aiml)
        
        # Tools & Technologies
        tools = [
            'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
            'slack', 'teams', 'postman', 'swagger', 'graphql', 'rest api',
            'microservices', 'api', 'linux', 'unix', 'windows', 'macos'
        ]
        keywords.update(tools)
        
        # Testing
        testing = [
            'unit testing', 'integration testing', 'tdd', 'bdd', 'jest',
            'pytest', 'junit', 'selenium', 'cypress', 'mocha', 'chai'
        ]
        keywords.update(testing)
        
        # Methodologies & Practices
        methodologies = [
            'agile', 'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd',
            'pair programming', 'code review', 'version control'
        ]
        keywords.update(methodologies)
        
        # Soft Skills (important for STEM roles)
        soft_skills = [
            'problem solving', 'analytical', 'communication', 'teamwork',
            'leadership', 'collaboration', 'time management', 'critical thinking'
        ]
        keywords.update(soft_skills)
        
        return keywords
    
    def extract_keywords(self, text: str) -> Dict[str, List[str]]:
        """
        Extract relevant keywords from job description or CV text
        
        Args:
            text: Job description or CV text
            
        Returns:
            Dictionary with categorized keywords
        """
        text_lower = text.lower()
        
        found_keywords = {
            'technical_skills': [],
            'soft_skills': [],
            'tools': [],
            'all': []
        }
        
        # Find all matching keywords
        for keyword in self.stem_keywords:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text_lower):
                found_keywords['all'].append(keyword)
                
                # Categorize (simplified - could be more sophisticated)
                if keyword in ['problem solving', 'analytical', 'communication', 
                              'teamwork', 'leadership', 'collaboration']:
                    found_keywords['soft_skills'].append(keyword)
                else:
                    found_keywords['technical_skills'].append(keyword)
        
        # Remove duplicates and sort
        for key in found_keywords:
            found_keywords[key] = sorted(list(set(found_keywords[key])))
        
        return found_keywords
    
    def calculate_match_score(self, cv_text: str, job_keywords: Set[str]) -> Dict:
        """
        Calculate how well CV matches job description keywords
        
        Args:
            cv_text: Complete CV text
            job_keywords: Set of keywords from job description
            
        Returns:
            Dictionary with match score, matched keywords, missing keywords
        """
        cv_text_lower = cv_text.lower()
        
        matched_keywords = set()
        missing_keywords = set()
        
        for keyword in job_keywords:
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            if re.search(pattern, cv_text_lower):
                matched_keywords.add(keyword)
            else:
                missing_keywords.add(keyword)
        
        total_keywords = len(job_keywords)
        match_count = len(matched_keywords)
        
        # Calculate percentage match
        match_score = (match_count / total_keywords * 100) if total_keywords > 0 else 0.0
        
        return {
            'match_score': round(match_score, 2),
            'matched_keywords': sorted(list(matched_keywords)),
            'missing_keywords': sorted(list(missing_keywords)),
            'total_keywords': total_keywords,
            'matched_count': match_count,
            'missing_count': len(missing_keywords)
        }
    
    def analyze_job_vs_cv(self, job_description: str, cv_text: str) -> Dict:
        """
        Complete analysis comparing job description with CV
        
        Args:
            job_description: Full job description text
            cv_text: Complete CV text
            
        Returns:
            Complete analysis with scores, keywords, and recommendations
        """
        # Extract keywords from job description
        job_keywords_dict = self.extract_keywords(job_description)
        job_keywords = set(job_keywords_dict['all'])
        
        # Extract keywords from CV
        cv_keywords_dict = self.extract_keywords(cv_text)
        cv_keywords = set(cv_keywords_dict['all'])
        
        # Calculate match score
        match_results = self.calculate_match_score(cv_text, job_keywords)
        
        # Check ATS compatibility
        ats_check = self.check_ats_compatibility(cv_text)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            match_results, 
            ats_check,
            job_keywords_dict,
            cv_keywords_dict
        )
        
        return {
            'match_score': match_results['match_score'],
            'matched_keywords': match_results['matched_keywords'],
            'missing_keywords': match_results['missing_keywords'],
            'ats_compatible': ats_check['is_ats_friendly'],
            'ats_issues': ats_check['issues'],
            'recommendations': recommendations,
            'job_keyword_count': len(job_keywords),
            'cv_keyword_count': len(cv_keywords)
        }
    
    def check_ats_compatibility(self, cv_text: str) -> Dict:
        """
        Check CV for ATS compatibility issues
        
        Args:
            cv_text: Complete CV text
            
        Returns:
            Dictionary with compatibility status and issues
        """
        issues = []
        
        # Check for problematic special characters
        problematic_chars = ['│', '─', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼']
        if any(char in cv_text for char in problematic_chars):
            issues.append("Contains box-drawing characters that may confuse ATS")
        
        # Check for excessive special characters (tables)
        pipe_count = cv_text.count('|')
        if pipe_count > 10:
            issues.append("High number of pipe characters detected - possible table formatting")
        
        # Check for common section headers
        required_sections = {
            'experience': ['experience', 'employment', 'work history'],
            'education': ['education', 'qualifications'],
            'skills': ['skills', 'competencies']
        }
        
        text_lower = cv_text.lower()
        for section_name, keywords in required_sections.items():
            if not any(keyword in text_lower for keyword in keywords):
                issues.append(f"Missing '{section_name}' section header")
        
        # Check for overly short content (might indicate formatting issues)
        if len(cv_text.strip()) < 200:
            issues.append("CV content seems very short - check if parsing was successful")
        
        # Check for email and phone (should be present)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        if not re.search(email_pattern, cv_text):
            issues.append("No email address detected - ensure contact info is included")
        
        return {
            'is_ats_friendly': len(issues) == 0,
            'issues': issues,
            'recommendations': self._generate_ats_recommendations(issues)
        }
    
    def _generate_ats_recommendations(self, issues: List[str]) -> List[str]:
        """Generate specific recommendations based on ATS issues"""
        recommendations = []
        
        if any('special characters' in issue.lower() or 'box-drawing' in issue.lower() for issue in issues):
            recommendations.append("Use simple formatting without special characters or symbols")
        
        if any('table' in issue.lower() or 'pipe' in issue.lower() for issue in issues):
            recommendations.append("Replace tables with simple bullet points and text")
        
        if any('section' in issue.lower() for issue in issues):
            recommendations.append("Add clear section headers: Experience, Education, Skills")
        
        if any('email' in issue.lower() for issue in issues):
            recommendations.append("Include complete contact information at the top of CV")
        
        return recommendations
    
    def _generate_recommendations(
        self, 
        match_results: Dict, 
        ats_check: Dict,
        job_keywords: Dict,
        cv_keywords: Dict
    ) -> List[str]:
        """
        Generate actionable recommendations for improving CV
        """
        recommendations = []
        
        # Match score recommendations
        match_score = match_results['match_score']
        if match_score < 50:
            recommendations.append(
                f"Your CV matches only {match_score}% of job keywords. "
                "Consider adding more relevant skills and technologies."
            )
        elif match_score < 70:
            recommendations.append(
                f"Good match ({match_score}%), but there's room for improvement. "
                "Review missing keywords below."
            )
        else:
            recommendations.append(
                f"Excellent keyword match ({match_score}%)! "
                "Your CV aligns well with the job requirements."
            )
        
        # Missing keyword recommendations
        missing = match_results['missing_keywords']
        if len(missing) > 0 and len(missing) <= 5:
            recommendations.append(
                f"Consider adding these keywords if relevant: {', '.join(missing[:5])}"
            )
        elif len(missing) > 5:
            recommendations.append(
                f"Multiple keywords missing. Top priorities: {', '.join(missing[:5])}"
            )
        
        # ATS recommendations
        if not ats_check['is_ats_friendly']:
            recommendations.append(
                "ATS compatibility issues detected - see details above"
            )
        
        return recommendations


# Singleton instance
ats_analyzer = ATSAnalyzer()