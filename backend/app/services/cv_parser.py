from email.mime import text
import keyword

import PyPDF2
from docx import Document
import re
from typing import Dict, List, Optional, Set
from ..models.cv_models import PersonalInfo, Experience, Education, Skills, CVData


class CVParser:
    """
    CV Parser for extracting structured data from PDF and DOCX files
    Supports UK/Ireland CV formats for STEM roles
    """
    
    def __init__(self):
        # Common section headers in UK/Ireland CVs
        self.section_keywords = {
            'experience': [
                'experience', 'employment', 'work history', 'professional experience',
                'work experience', 'employment history', 'career history'
            ],
            'education': [
                'education', 'qualifications', 'academic background', 
                'academic qualifications', 'educational background'
            ],
            'skills': [
                'skills', 'technical skills', 'competencies', 'technologies',
                'technical competencies', 'core competencies'
            ],
            'projects': [
                'projects', 'portfolio', 'project experience', 'key projects'
            ]
        }
    
    def parse_pdf(self, file_path: str) -> Dict:
        """
        Parse PDF CV file
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Dictionary with parsed CV data and warnings
        """
        try:
            reader = PyPDF2.PdfReader(file_path)
            text = ""
            
            # Extract text from all pages
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            return self._extract_sections(text)
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse PDF: {str(e)}",
                "raw_text": "",
                "parsed_data": None
            }
    
    def parse_docx(self, file_path: str) -> Dict:
        """
        Parse DOCX CV file
        
        Args:
            file_path: Path to DOCX file
            
        Returns:
            Dictionary with parsed CV data and warnings
        """
        try:
            doc = Document(file_path)
            text = '\n'.join([para.text for para in doc.paragraphs if para.text.strip()])
            
            return self._extract_sections(text)
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse DOCX: {str(e)}",
                "raw_text": "",
                "parsed_data": None
            }
    
    def _extract_sections(self, text: str) -> Dict:
        """
        Extract structured sections from CV text
        
        Args:
            text: Full CV text
            
        Returns:
            Dictionary with success status, parsed data, and warnings
        """
        warnings = []
        
        # Extract personal info
        personal_info = self._extract_personal_info(text)
        if not personal_info.get('full_name'):
            warnings.append("Could not detect name - please verify personal information")
        
        # Identify section boundaries
        sections = self._identify_section_boundaries(text)

        print("DEBUG sections found:", list(sections.keys()))
        print("DEBUG experience text:", sections.get('experience', 'NOT FOUND')[:200])
        
        # Extract each section
        experience = self._extract_experience_simple(sections.get('experience', ''))
        education = self._extract_education_simple(sections.get('education', ''))
        skills = self._extract_skills_simple(sections.get('skills', ''))
        
        # Check for missing sections
        if not experience:
            warnings.append("No experience section detected - please add manually")
        if not education:
            warnings.append("No education section detected - please add manually")
        if not skills.get('technical'):
            warnings.append("No skills detected - please add manually")
        
        return {
            "success": True,
            "raw_text": text,
            "parsed_data": {
                "personal_info": personal_info,
                "professional_summary": "",  # User should write this
                "experience": experience,
                "education": education,
                "skills": skills,
                "projects": [],  # Complex to parse, let user add
                "certifications": []
            },
            "warnings": warnings
        }
    
    def _extract_personal_info(self, text: str) -> Dict:
        """
        Extract personal information from CV text
        Uses regex patterns for email, phone, and heuristics for name
        """
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        info = {
            'full_name': '',
            'email': '',
            'phone': '',
            'location': '',
            'linkedin': None,
            'github': None
        }
        
        # Extract email (usually near top)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match:
            info['email'] = email_match.group(0)
        
        # Extract phone (UK/Ireland formats)
        # Matches: +353 123 456789, 087 1234567, (01) 234 5678, etc.
        phone_pattern = r'(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}'
        phone_match = re.search(phone_pattern, text)
        if phone_match:
            info['phone'] = phone_match.group(0).strip()
        
        # Extract LinkedIn
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
        if linkedin_match:
            info['linkedin'] = linkedin_match.group(0)
        
        # Extract GitHub
        github_pattern = r'github\.com/[\w-]+'
        github_match = re.search(github_pattern, text, re.IGNORECASE)
        if github_match:
            info['github'] = github_match.group(0)
        
        # Heuristic for name: first non-empty line that's not a URL/email
        # and is relatively short (< 50 chars) and doesn't contain numbers
        for line in lines[:5]:  # Check first 5 lines
            if (len(line) < 50 and 
                '@' not in line and 
                'http' not in line.lower() and
                not re.search(r'\d{3,}', line)):  # No long numbers
                info['full_name'] = line
                break
        
        # Extract location (flexible, international-friendly)
        location = None

        # Method 1: Look for labeled location (most flexible)
        location_labels = [
            r'Location:\s*(.+?)(?:\n|Email|Phone|$)',
            r'Address:\s*(.+?)(?:\n|Email|Phone|$)',
            r'City:\s*(.+?)(?:\n|Email|Phone|$)',
            r'Based in:\s*(.+?)(?:\n|Email|Phone|$)',
        ]

        for pattern in location_labels:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                location = match.group(1).strip()
                # Clean up any extra whitespace or newlines
                location = ' '.join(location.split())
                break
         
        # Method 2: Pattern matching for "City, Country" (case-insensitive)
        if not location:
            # Try to find any "Word, Word" pattern that looks like a location
            city_country = re.search(
                r'\b([A-Za-z\s]+),\s*([A-Za-z\s]+?)(?:\n|Phone|Email|$)',
                text,
                re.MULTILINE
            )
    
            if city_country:
                city = city_country.group(1).strip().title()
                country = city_country.group(2).strip().title()
                location = f"{city}, {country}"

        # Method 3: Look for known patterns near start of CV
        if not location:
            # Sometimes location is just listed near the top without label
            lines = text.split('\n')[:5]  # Check first 5 lines
            for line in lines:
                # Skip if line looks like name or email
                if '@' in line or len(line) < 3:
                    continue
                # If line has a comma, might be "City, Country"
                if ',' in line:
                    parts = line.split(',')
                    if len(parts) == 2:
                        location = f"{parts[0].strip().title()}, {parts[1].strip().title()}"
                        break

        info['location'] = location

        return info

    
    def _identify_section_boundaries(self, text: str) -> Dict[str, str]:
        """
        Identify where each CV section starts and ends
        """
        text_lower = text.lower()
        sections = {}
        
        # Find all section headers and their positions
        section_positions = []
        
        for section_name, keywords in self.section_keywords.items():
            for keyword in keywords:
                # NEW - more flexible, allows extra whitespace and doesn't require exact line end
                pattern = r'(?:^|\n)[\s\-•]*' + re.escape(keyword) + r'[\s\-:]*(?:\n|$)'
                matches = re.finditer(pattern, text_lower, re.MULTILINE | re.IGNORECASE)
                
                for match in matches:
                    section_positions.append({
                        'name': section_name,
                        'start': match.start(),
                        'keyword': keyword
                    })
                    break  # Only take first match for each section
        
        # Sort by position
        section_positions.sort(key=lambda x: x['start'])
        
        # Extract text between section headers
        for i, section in enumerate(section_positions):
            start = section['start']
            end = section_positions[i + 1]['start'] if i + 1 < len(section_positions) else len(text)
            
            section_text = text[start:end]
            sections[section['name']] = section_text
        
        return sections
    
    def _extract_experience_simple(self, text: str) -> List[Dict]:
        if not text:
            return []

        experiences = []
        lines = [l.strip() for l in text.split('\n') if l.strip()]
    
        # Find date lines — these mark the start of a job entry
        date_pattern = r'(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)'
    
        current_job = None
        responsibilities = []

        for line in lines[1:]:  # Skip "Experience" header
            date_match = re.search(date_pattern, line, re.IGNORECASE)
        
            if date_match:
                # Save previous job if exists
                if current_job:
                    current_job['responsibilities'] = responsibilities[:5]
                    experiences.append(current_job)
                    responsibilities = []
            
                # Parse this line for job title and company
                # Format: "2022 – 2024 Job Title    Company, Location"
                remainder = re.sub(date_pattern, '', line).strip()
                parts = re.split(r'\s{3,}', remainder)  # Split on 2+ spaces
            
                job_title = parts[0].strip() if parts else 'Position'
                company = parts[1].split(',')[0].strip() if len(parts) > 1 else 'Unknown'

                current_job = {
                    'id': f'exp-{len(experiences)+1}',
                    'job_title': job_title,
                    'company': company,
                    'location': 'Unknown',
                    'start_date': date_match.group(1),
                    'end_date': date_match.group(2),
                    'responsibilities': [],
                    'achievements': [],
                    'technologies': []
                }
        
            elif current_job and re.match(r'^[•\-\*]', line):
                # Bullet point — add as responsibility
                cleaned = re.sub(r'^[•\-\*]\s*', '', line)
                responsibilities.append(cleaned)
    
        # Don't forget the last job
        if current_job:
            current_job['responsibilities'] = responsibilities[:5]
            experiences.append(current_job)
    
        return experiences
    
    def _extract_education_simple(self, text: str) -> List[Dict]:
        """
        Simple education extraction
        """
        if not text:
            return []
        
        education = []
        
        # Look for degree keywords
        degree_patterns = [
            r'(Bachelor|BSc|BA|B\.Sc|B\.A|B\.Eng|BEng)\s+(?:of\s+)?(\w+(?:\s+\w+)*)',
            r'(Master|MSc|MA|M\.Sc|M\.A|MEng)\s+(?:of\s+)?(\w+(?:\s+\w+)*)',
            r'(PhD|Ph\.D|Doctorate)\s+(?:in\s+)?(\w+(?:\s+\w+)*)',
        ]
        
        for idx, pattern in enumerate(degree_patterns, 1):
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                degree_type = match.group(1)
                field = match.group(2) if len(match.groups()) > 1 else ""

                # Look for institution name near the degree match
                institution = 'Unknown'
                # Search for university/college/institute keywords near the degree
                inst_pattern = r'(University|College|Institute|School)\s+(?:of\s+)?\w+'
                inst_match = re.search(inst_pattern, text, re.IGNORECASE)
                if inst_match:
                    institution = inst_match.group(0).strip()[:60]
                
                # Look for year nearby
                year_pattern = r'20\d{2}'
                year_matches = re.findall(year_pattern, text)
                graduation = year_matches[-1] if year_matches else "Unknown"
                
                education.append({
                    'id': f'edu-{idx}',
                    'degree': f'{degree_type} {field}'.strip(),
                    'institution': institution,  # Hard to parse
                    'location': 'Unknown',
                    'graduation_date': graduation,
                    'grade': None,
                    'relevant_modules': []
                })
                break  # One degree per pattern
        
        return education
    
    def _extract_skills_simple(self, text: str) -> Dict:
        """
        Simple skills extraction
        Looks for common STEM keywords
        """
        if not text:
            return {'technical': [], 'soft': []}
        
        # Common STEM skills (expand this list)
        tech_keywords = {
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go',
            'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'spring',
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp',
            'git', 'ci/cd', 'jenkins', 'linux', 'agile', 'scrum'
        }
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in tech_keywords:
            if skill in text_lower:
                # Preserve original case if possible
                pattern = re.compile(re.escape(skill), re.IGNORECASE)
                match = pattern.search(text)
                if match:
                    found_skills.append(match.group(0))
        
        return {
            'technical': list(set(found_skills)),  # Remove duplicates
            'soft': []  # Hard to parse reliably
        }


# Singleton instance
cv_parser = CVParser()