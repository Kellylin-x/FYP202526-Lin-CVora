import PyPDF2
from docx import Document
import re
from typing import Dict, List, Optional
from ..models.cv_models import PersonalInfo, Experience, Education, Skills, CVData


class CVParser:
    """
    CV Parser for extracting structured data from PDF and DOCX files.
    Supports UK/Ireland CV formats for STEM roles.
    Handles both neatly formatted CVs and messier real-world ones.
    """

    def __init__(self):
        # These are the section headings we look for when splitting up the CV.
        # We check the lowercased text, so capitalisation doesn't matter.
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
                'technical competencies', 'core competencies', 'key skills', 'it'
            ],
            'projects': [
                'projects', 'portfolio', 'project experience', 'key projects',
                'personal projects', 'academic projects'
            ],
            'summary': [
                'summary', 'profile', 'personal statement', 'professional summary',
                'career objective', 'about me', 'objective', 'personal profile'
            ],
            'certifications': [
                'certifications', 'certificates', 'professional certifications',
                'licences', 'licenses', 'accreditations'
            ],
            'achievements': [
                'achievements', 'awards', 'accomplishments',
                'recognition', 'scholarships'
            ],
            'volunteering': [
                'volunteering', 'volunteer experience', 'voluntary work',
                'community involvement', 'extracurricular'
            ],
            'publications': [
                'publications', 'research', 'papers', 'articles'
            ],
            'languages': [
                'languages', 'spoken languages'
            ],
            'interests': [
                'interests', 'hobbies', 'activities'
            ],
        }

    # ── Public parse methods ──────────────────────────────────────────────────

    def parse_pdf(self, file_path: str) -> Dict:
        """Parse a PDF CV file and return structured data."""
        try:
            reader = PyPDF2.PdfReader(file_path)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return self._extract_sections(text)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse PDF: {str(e)}",
                "raw_text": "",
                "parsed_data": None
            }

    def parse_docx(self, file_path: str) -> Dict:
        """Parse a DOCX CV file and return structured data."""
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

    # ── Main section extractor ────────────────────────────────────────────────

    def _extract_sections(self, text: str) -> Dict:
        """
        Split the CV text into named sections, then extract structured data
        from each one. Any sections we don't recognise get stored as
        'dynamic_sections' so the preview can still show them.
        """
        warnings = []

        personal_info = self._extract_personal_info(text)
        if not personal_info.get('full_name'):
            warnings.append("Could not detect name — please verify personal information")

        # Split the CV into labelled chunks (e.g. {"experience": "...", "education": "..."})
        named_sections, dynamic_sections = self._identify_section_boundaries(text)

        # Extract known structured sections
        experience = self._extract_experience(named_sections.get('experience', ''))
        education = self._extract_education(named_sections.get('education', ''))
        skills = self._extract_skills(named_sections.get('skills', ''), text)
        projects = self._extract_projects(named_sections.get('projects', ''))
        summary = self._extract_summary(named_sections.get('summary', ''), text, personal_info)
        certifications = self._extract_certifications(named_sections.get('certifications', ''))

        # Achievements get stored as a dynamic section so the preview shows them
        achievements_text = named_sections.get('achievements', '')
        if achievements_text:
            dynamic_sections.insert(0, {
                'title': 'Achievements',
                'content': achievements_text
            })

        if not experience:
            warnings.append("No experience section detected — please verify")
        if not education:
            warnings.append("No education section detected — please verify")
        if not skills.get('technical'):
            warnings.append("No technical skills detected — please add manually")

        return {
            "success": True,
            "raw_text": text,
            "parsed_data": {
                "personal_info": personal_info,
                "professional_summary": summary,
                "experience": experience,
                "education": education,
                "skills": skills,
                "projects": projects,
                "certifications": certifications,
                # Any sections we didn't recognise (e.g. Awards, Volunteering, Interests)
                # get passed through here so the CV preview can still show them.
                "dynamic_sections": dynamic_sections,
            },
            "warnings": warnings
        }

    # ── Section boundary detection ────────────────────────────────────────────

    def _identify_section_boundaries(self, text: str) -> tuple:
        """
        Find where each section starts in the CV text and slice out the content
        between consecutive headers.

        Key design decision: we match keywords using word-by-word comparison,
        not simple substring matching. This stops "honours" inside a degree title
        like "BSc (Honours) in Computer Science" from being detected as the
        Achievements section heading.

        Returns two things:
          named_sections   — dict of known section name → text block
          dynamic_sections — list of {title, content} for unrecognised headings
        """
        lines = text.split('\n')

        # Build a flat lookup: lowercase keyword → canonical section name
        keyword_to_name = {}
        for name, keywords in self.section_keywords.items():
            for kw in keywords:
                keyword_to_name[kw] = name

        section_hits = []  # list of (line_index, canonical_name, raw_title)

        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped or len(stripped) > 60:
                continue

            lower = stripped.lower().rstrip(':').strip()

            # Match keywords using word-by-word comparison.
            # We allow up to 2 extra words around the keyword so that
            # "OTHER WORK EXPERIENCE" matches "work experience"
            # but "BSc (Honours) in Computer Science" does NOT match "honours".
            matched_name = None
            for kw, name in keyword_to_name.items():
                if lower == kw or lower == kw + ':':
                    matched_name = name
                    break
                kw_words = kw.split()
                lower_words = lower.split()
                for start in range(len(lower_words) - len(kw_words) + 1):
                    if lower_words[start:start + len(kw_words)] == kw_words:
                        extra_words = len(lower_words) - len(kw_words)
                        if extra_words <= 2:
                            matched_name = name
                        break
                if matched_name:
                    break

            if matched_name:
                section_hits.append((i, matched_name, stripped))
            elif (
                i > 5  # skip the first few lines — they're name/contact info, not headings
                and (stripped.isupper() or (stripped.istitle() and ',' not in stripped))
                and len(stripped.split()) <= 5
                and not re.match(r'^[•\-\*]', stripped)
                and not re.search(r'\d{4}', stripped)
            ):
                section_hits.append((i, f'__dynamic__{stripped}', stripped))

        # Slice the text into blocks between each detected heading
        named_sections: Dict[str, str] = {}
        dynamic_sections: List[Dict] = []

        for idx, (line_idx, section_key, raw_title) in enumerate(section_hits):
            next_line = section_hits[idx + 1][0] if idx + 1 < len(section_hits) else len(lines)
            content_lines = lines[line_idx + 1: next_line]
            content = '\n'.join(content_lines).strip()

            if section_key.startswith('__dynamic__'):
                if content:
                    dynamic_sections.append({
                        'title': raw_title,
                        'content': content
                    })
            else:
                # For known sections, if the same section appears twice
                # (e.g. WORK EXPERIENCE and OTHER WORK EXPERIENCE),
                # concatenate them rather than dropping one.
                if section_key in named_sections:
                    named_sections[section_key] += '\n' + content
                else:
                    named_sections[section_key] = content

        return named_sections, dynamic_sections

    # ── Personal info ─────────────────────────────────────────────────────────

    def _extract_personal_info(self, text: str) -> Dict:
        """
        Pull name, email, phone, LinkedIn, GitHub and location from the top of the CV.
        Uses regex for structured data (email/phone) and heuristics for the name.
        """
        lines = [l.strip() for l in text.split('\n') if l.strip()]

        info = {
            'full_name': '',
            'email': '',
            'phone': '',
            'location': '',
            'linkedin': None,
            'github': None,
        }

        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', text)
        if email_match:
            info['email'] = email_match.group(0)

        # Matches UK (+44), Irish (+353) and generic mobile/landline formats
        phone_match = re.search(
            r'(\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}', text
        )
        if phone_match:
            info['phone'] = phone_match.group(0).strip()

        linkedin_match = re.search(r'linkedin\.com/in/[\w\-]+', text, re.IGNORECASE)
        if linkedin_match:
            info['linkedin'] = linkedin_match.group(0)

        github_match = re.search(r'github\.com/[\w\-]+', text, re.IGNORECASE)
        if github_match:
            info['github'] = github_match.group(0)

        # Name heuristic: first short line near the top that isn't an email/URL/number.
        # We also strip any post-nominal qualifications (e.g. "MA App Psychol, BSc Psychol")
        # that sometimes appear on the same line as the name in Irish/UK CVs.
        qual_pattern = re.compile(
            r',?\s*(MA|MSc|BSc|BA|BEng|MEng|MBA|PhD|Ph\.D|HDip|'
            r'App\.?\s*Psychol\.?|Psychol\.?|Hons\.?|MRICS|CEng|'
            r'ACCA|ACA|CFA|CIMA|PMP|CISSP|B\.Sc|M\.Sc)\b.*$',
            re.IGNORECASE
        )
        for line in lines[:6]:
            if (
                len(line) < 80
                and '@' not in line
                and 'http' not in line.lower()
                and not re.search(r'\d{3,}', line)
                and not any(line.lower().startswith(kw) for kw in ['skills', 'education', 'experience'])
            ):
                # Strip qualifications from the end of the name line
                cleaned_name = qual_pattern.sub('', line).strip().rstrip(',').strip()
                if cleaned_name:
                    info['full_name'] = cleaned_name
                break

        # Location — try labelled patterns first, then "City, Country" pattern
        location = None
        for pattern in [
            r'(?:Location|Address|Based in|City):\s*(.+?)(?:\n|$)',
        ]:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                location = m.group(1).strip()
                break

        if not location:
            m = re.search(
                r'\b([A-Z][a-zA-Z\s]+),\s*(?:Ireland|UK|United Kingdom|England|Scotland|Wales|Northern Ireland|[A-Z][a-z]+)\b',
                text
            )
            if m:
                location = m.group(0).strip()

        info['location'] = location or ''
        return info

    # ── Experience ────────────────────────────────────────────────────────────

    def _extract_experience(self, text: str) -> List[Dict]:
        """
        Extract all job entries from the experience section.

        Handles two common CV formats:
          Format A (date on same line as title):
            2022 – 2024  Receptionist & Admin   Aura, Tullamore

          Format B (company on its own line, then title + date below):
            Fidelity Investments – Galway, Ireland
            Software Engineer Intern   January 2025 – August 2025

        Strategy:
          - Lines with a date range are job anchors.
          - If the line BEFORE a date line looks like a company name (no date,
            not a bullet, short enough), we treat it as the company.
          - Everything after until the next date line is responsibilities.
        """
        if not text:
            return []

        lines = [l.strip() for l in text.split('\n') if l.strip()]
        experiences = []

        # Matches full and abbreviated month names + year ranges
        # e.g. "January 2025 – August 2025", "2022 – Present", "Jun 2021 - Current"
        date_pattern = re.compile(
            r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
            r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*'
            r'(\d{4})\s*[-–—]\s*'
            r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
            r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*'
            r'(\d{4}|Present|Current|Now|Today)',
            re.IGNORECASE
        )

        current_job: Optional[Dict] = None
        current_bullets: List[str] = []

        def save_current():
            if current_job:
                job = dict(current_job)
                # Merge lines that are continuations of the previous bullet
                # (short lines with no bullet character that follow a bullet)
                merged = []
                for bullet in current_bullets:
                    if merged and not re.match(r'^[A-Z]', bullet) and len(bullet) < 60:
                        merged[-1] = merged[-1].rstrip() + ' ' + bullet
                    else:
                        merged.append(bullet)
                job['responsibilities'] = merged[:]
                experiences.append(job)

        for i, stripped in enumerate(lines, start=0):  # start from 0 — the heading line is already stripped by section boundary detection
            date_match = date_pattern.search(stripped)

            if date_match:
                save_current()
                current_bullets = []

                # Remove the date range to get the remaining label text
                remainder = date_pattern.sub('', stripped).strip(' |–—-,')
                remainder = re.sub(r'\s{2,}', ' ', remainder)

                # Try to split remainder into title + company
                parts = re.split(r'\t|\s{3,}|\s*\|\s*', remainder)
                parts = [p.strip() for p in parts if p.strip()]

                job_title = parts[0] if parts else remainder.strip() or 'Position'
                company = parts[1].split(',')[0].strip() if len(parts) > 1 else ''

                # FORMAT B: if company is empty, check if the PREVIOUS line
                # looks like a company name (no date, not a bullet, short enough)
                if not company and i > 0:
                    prev = lines[i - 1].strip()
                    if (
                        prev
                        and not date_pattern.search(prev)
                        and not re.match(r'^[•\-\*\>◦▪]', prev)
                        and len(prev) < 80
                        and len(prev.split()) <= 8
                    ):
                        company = re.split(r'\s*[–—,]\s*', prev)[0].strip()

                current_job = {
                    'id': f'exp-{len(experiences) + 1}',
                    'job_title': job_title,
                    'company': company,
                    'location': '',
                    'start_date': date_match.group(1),
                    'end_date': date_match.group(2),
                    'responsibilities': [],
                    'achievements': [],
                    'technologies': [],
                }

            elif current_job:
                is_bullet = bool(re.match(r'^[•\-\*\>◦▪▸→]', stripped))

                if is_bullet:
                    cleaned = re.sub(r'^[•\-\*\>◦▪▸→]+\s*', '', stripped)
                    if cleaned:
                        current_bullets.append(cleaned)
                elif len(stripped) > 15 and not stripped.endswith(':'):
                    current_bullets.append(stripped)

        save_current()
        return experiences

    # ── Education ─────────────────────────────────────────────────────────────

    def _extract_education(self, text: str) -> List[Dict]:
        """
        Extract education entries. Looks for degree type keywords and nearby
        institution names, years, and grades.
        """
        if not text:
            return []

        education = []
        lines = [l.strip() for l in text.split('\n') if l.strip()]

        degree_pattern = re.compile(
            r'(Bachelor|BSc|BA|B\.Sc|B\.A|B\.Eng|BEng|BE|'
            r'Master|MSc|MA|M\.Sc|M\.A|MEng|MBA|'
            r'PhD|Ph\.D|Doctorate|HDip|Higher Diploma|'
            r'Level\s*\d|QQI)',
            re.IGNORECASE
        )

        inst_pattern = re.compile(
            r'(University|College|Institute|School|IT\s+\w+|Technological University)',
            re.IGNORECASE
        )

        year_pattern = re.compile(r'20\d{2}')
        grade_pattern = re.compile(
            r'(First|Second|Third|1:1|1:2|2:1|2:2|Honours|Pass|Distinction|Merit|GPA\s*[\d.]+)',
            re.IGNORECASE
        )

        i = 0
        while i < len(lines):
            line = lines[i]
            degree_match = degree_pattern.search(line)

            if degree_match:
                # Skip if line looks like a project description or module list
                if any(skip in line.lower() for skip in ['projects:', 'modules:', 'developed', 'implemented', 'leaving cert']):
                    i += 1
                    continue

                # Only look for the institution in the part BEFORE the em dash,
                # so we don't pick up the repeated text that some DOCX exports add.
                clean_line = re.split(r'\s*[—–]\s*', line)[0].strip()
                clean_window = ' '.join(
                    [clean_line] + lines[max(0, i - 1): min(len(lines), i + 2)]
                )
                
                inst_match = inst_pattern.search(clean_window)
                institution = ''
                if inst_match:
                    start = inst_match.start()
                    institution = clean_window[start:start + 60].split('\n')[0].strip()

                years = year_pattern.findall(clean_window)
                graduation = years[-1] if years else ''

                grade_match = grade_pattern.search(clean_window)
                grade = grade_match.group(0) if grade_match else None

                education.append({
                    'id': f'edu-{len(education) + 1}',
                    'degree': re.split(r'\s*[—–]\s*', line)[0].strip(),
                    'institution': institution,
                    'location': '',
                    'graduation_date': graduation,
                    'grade': grade,
                    'relevant_modules': [],
                })

            i += 1

        return education

    # ── Skills ────────────────────────────────────────────────────────────────

    def _extract_skills(self, skills_text: str, full_text: str) -> Dict:
        """
        Extract technical and soft skills from the CV.

        We search both the dedicated skills section AND the full CV text,
        so skills mentioned in job bullets or project descriptions still get picked up
        even if the person didn't list them in a skills section.

        The keyword list covers broad STEM fields:
        - Software / Web / DevOps
        - Data Science / AI / Statistics
        - Electronics / Hardware / Embedded
        - Mechanical / Civil / Electrical Engineering
        - Biology / Chemistry / Lab Sciences
        - General engineering and professional skills

        In future this could be replaced with a library like skillNer (built on spaCy
        with 30,000+ skills from the EMSI database) for much more comprehensive coverage.
        """
        search_text = (skills_text or '') + '\n' + full_text
        search_lower = search_text.lower()

        # ── Software Development ──────────────────────────────────────────────
        software_skills = {
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'c', 'ruby',
            'go', 'golang', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab',
            'php', 'perl', 'bash', 'shell', 'powershell', 'dart', 'lua', 'haskell',
            'assembly', 'fortran', 'groovy', 'julia',
            'react', 'angular', 'vue', 'vue.js', 'next.js', 'nuxt', 'svelte',
            'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'redux',
            'webpack', 'vite', 'gatsby', 'react native',
            'node.js', 'django', 'flask', 'fastapi', 'spring', 'express', 'rails',
            'laravel', 'asp.net', '.net', 'nestjs', 'graphql', 'rest', 'grpc',
            'sql', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'cassandra',
            'dynamodb', 'elasticsearch', 'firebase', 'supabase', 'oracle', 'mssql',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'google cloud',
            'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd',
            'linux', 'nginx', 'apache', 'heroku', 'vercel', 'netlify',
            'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
            'agile', 'scrum', 'kanban', 'tdd', 'unit testing', 'api',
            'microservices', 'serverless', 'figma', 'postman', 'swagger',
            'cybersecurity', 'penetration testing', 'networking', 'tcp/ip',
            'firewalls', 'oauth', 'jwt', 'ssl', 'tls', 'wireshark', 'nmap',
            'android', 'ios', 'flutter', 'xamarin',
        }

        # ── Data Science / AI / Statistics ───────────────────────────────────
        data_skills = {
            'machine learning', 'deep learning', 'nlp', 'natural language processing',
            'computer vision', 'neural networks', 'reinforcement learning',
            'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'hugging face',
            'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly',
            'jupyter', 'apache spark', 'hadoop', 'kafka', 'airflow',
            'tableau', 'power bi', 'looker',
            'data analysis', 'data engineering', 'data visualization',
            'statistical analysis', 'regression', 'hypothesis testing',
            'a/b testing', 'time series', 'feature engineering', 'mlops',
            'spss', 'sas', 'stata', 'excel', 'etl', 'data warehousing', 'big data',
        }

        # ── Electronics / Hardware / Embedded ────────────────────────────────
        electronics_skills = {
            'fpga', 'vhdl', 'verilog', 'systemverilog',
            'arduino', 'raspberry pi', 'embedded systems', 'rtos',
            'circuit design', 'pcb design', 'altium', 'kicad',
            'oscilloscope', 'signal processing', 'dsp', 'microcontroller',
            'i2c', 'spi', 'uart', 'can bus', 'modbus',
            'plc', 'scada', 'hmi', 'iot', 'mqtt',
            'analog electronics', 'digital electronics', 'power electronics',
        }

        # ── Mechanical / Civil Engineering ────────────────────────────────────
        mechanical_skills = {
            'autocad', 'solidworks', 'catia', 'ansys', 'creo', 'inventor',
            'fusion 360', 'revit', 'civil 3d',
            'cad', 'cam', 'bim', 'fea', 'cfd', 'computational fluid dynamics',
            'thermodynamics', 'fluid mechanics', 'heat transfer',
            'materials science', 'structural analysis',
            'lean manufacturing', 'six sigma', 'kaizen', 'fmea',
            '3d printing', 'cnc machining',
        }

        # ── Biology / Chemistry / Lab Sciences ───────────────────────────────
        lab_skills = {
            'pcr', 'qpcr', 'gel electrophoresis', 'western blot', 'elisa',
            'cell culture', 'microscopy', 'flow cytometry', 'crispr',
            'bioinformatics', 'genomics', 'proteomics',
            'hplc', 'mass spectrometry', 'nmr', 'chromatography',
            'lab on a chip', 'microfluidics',
            'clinical trials', 'gcp', 'gmp', 'regulatory affairs',
        }

        # ── General / Professional ────────────────────────────────────────────
        general_skills = {
            'project management', 'technical writing', 'documentation',
            'iso 9001', 'iso 27001', 'quality assurance', 'quality control',
            'risk assessment', 'root cause analysis',
            'requirements analysis', 'systems engineering',
            'uml', 'microsoft office', 'microsoft excel',
            'report writing', 'research', 'academic writing',
        }

        all_tech_keywords = (
            software_skills | data_skills | electronics_skills |
            mechanical_skills | lab_skills | general_skills
        )

        found_technical = []
        seen = set()

        for skill in sorted(all_tech_keywords):
            pattern = re.compile(
                r'(?<![a-z0-9])' + re.escape(skill) + r'(?![a-z0-9])',
                re.IGNORECASE
            )
            m = pattern.search(search_text)
            if m and skill not in seen:
                found_technical.append(m.group(0))
                seen.add(skill)

        # Also grab comma/newline separated items directly from the skills section
        # to catch anything the keyword list missed
        if skills_text:
            raw_items = re.split(r'[,\n•\-\|/]', skills_text)
            for item in raw_items:
                item_stripped = item.strip()
                item_lower = item_stripped.lower()
                if (
                    2 < len(item_stripped) < 30
                    and item_lower not in seen
                    and len(item_stripped.split()) <= 3
                    and not re.search(r'\d{4}', item_stripped)
                    and not item_stripped.endswith(':')
                    and not any(c in item_stripped for c in ['.', '(', ')', 'and', 'the'])
                ):
                    found_technical.append(item_stripped)
                    seen.add(item_lower)

        # ── Soft skills ───────────────────────────────────────────────────────
        soft_keywords = [
            'communication', 'teamwork', 'leadership', 'problem solving',
            'problem-solving', 'analytical', 'time management', 'collaboration',
            'adaptability', 'creativity', 'critical thinking', 'attention to detail',
            'project management', 'organisation', 'organization', 'presentation',
            'negotiation', 'mentoring', 'coaching', 'initiative', 'self-motivated',
            'customer service', 'stakeholder management', 'conflict resolution',
            'decision making', 'strategic thinking', 'commercial awareness',
        ]

        found_soft = []
        seen_soft = set()
        for skill in soft_keywords:
            if skill in search_lower and skill not in seen_soft:
                found_soft.append(skill.title())
                seen_soft.add(skill)

        return {
            'technical': list(dict.fromkeys(found_technical)),
            'soft': list(dict.fromkeys(found_soft)),
        }

    # ── Projects ──────────────────────────────────────────────────────────────

    def _extract_projects(self, text: str) -> List[Dict]:
        """
        Extract project entries from the projects section.
        Grabs lines that look like project titles and their descriptions/bullets.
        """
        if not text:
            return []

        projects = []
        lines = [l.strip() for l in text.split('\n') if l.strip()]

        current_project: Optional[Dict] = None
        current_bullets: List[str] = []

        def save_project():
            if current_project:
                p = dict(current_project)
                p['achievements'] = current_bullets[:]
                projects.append(p)

        for line in lines:  # heading already stripped by section boundary detection
            is_bullet = bool(re.match(r'^[•\-\*\>◦▪]', line))
            has_date = bool(re.search(r'\d{4}', line))
            looks_like_title = (
                not is_bullet
                and len(line) < 80
                and len(line.split()) >= 2
                and (line[0].isupper() or line.isupper())
            )

            if looks_like_title and not has_date:
                save_project()
                current_bullets = []
                current_project = {
                    'id': f'proj-{len(projects) + 1}',
                    'title': line,
                    'description': '',
                    'technologies': [],
                    'link': None,
                    'achievements': [],
                }
            elif current_project and is_bullet:
                cleaned = re.sub(r'^[•\-\*\>◦▪]+\s*', '', line)
                if cleaned:
                    current_bullets.append(cleaned)
            elif current_project and not current_project['description']:
                current_project['description'] = line

        save_project()
        return projects

    # ── Summary ───────────────────────────────────────────────────────────────

    def _extract_summary(self, summary_text: str, full_text: str, personal_info: Dict) -> str:
        """
        Extract the professional summary / profile statement.
        If there's a dedicated summary section, use that.
        Otherwise look for paragraph-like text near the top of the CV.
        """
        if summary_text and len(summary_text.strip()) > 30:
            lines = [l.strip() for l in summary_text.split('\n') if l.strip()]
            good_lines = [
                l for l in lines
                if len(l) > 20
                and '@' not in l
                and not re.search(r'\d{5,}', l)
            ]
            return ' '.join(good_lines[:5])

        # Fallback: look for a paragraph-ish block near the top of the CV
        top = full_text[:600]
        paragraphs = re.split(r'\n{2,}', top)
        for para in paragraphs:
            clean = para.strip()
            if 30 < len(clean) < 400 and len(clean.split()) > 8:
                if '@' not in clean and not re.search(r'\d{6,}', clean):
                    return clean

        return ''

    # ── Certifications ────────────────────────────────────────────────────────

    def _extract_certifications(self, text: str) -> List[str]:
        """Pull certification names out of the certifications section."""
        if not text:
            return []

        certs = []
        for line in text.split('\n'):
            line = line.strip()
            cleaned = re.sub(r'^[•\-\*\>◦▪]+\s*', '', line).strip()
            if cleaned and len(cleaned) > 3 and len(cleaned) < 120:
                certs.append(cleaned)

        return certs[:10]


# Singleton — one instance shared across the whole backend
cv_parser = CVParser()