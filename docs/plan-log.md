# Plan Log

Each entry documents the plan for implementing a prompt/task before execution. This ensures you can review and approve changes before they're made.

---

## Tests & CI Setup (8 Feb 2026)

**Objective:** Add pytest (backend) + vitest (frontend) tests and GitHub Actions CI workflow

**Tasks:**
1. Backend pytest setup
   - Create `backend/tests/` directory with `__init__.py` and `test_main.py`
   - Add minimal test (FastAPI health check)
   - Update `backend/requirements.txt` to add `pytest`
   - Verify tests run locally

2. Frontend vitest setup
   - Create `frontend/src/__tests__/` directory
   - Create minimal test file (`App.test.tsx`)
   - Update `frontend/package.json` to add vitest and test script
   - Verify tests run locally

3. GitHub Actions CI workflow
   - Create `.github/workflows/tests.yml`
   - Run on push to any branch and PRs to `main`
   - Run backend tests: `cd backend && pytest`
   - Run frontend tests: `cd frontend && npm test`
   - Fail if any test fails

4. Commit all changes to `feat/branching-ci-setup`

5. Run tests locally and report results

6. Push to remote and verify CI runs on GitHub

**Files Created/Modified:**
- `backend/tests/__init__.py` ✅
- `backend/tests/test_main.py` ✅
- `backend/requirements.txt` ✅
- `frontend/src/__tests__/App.test.tsx` ✅
- `frontend/package.json` ✅
- `.github/workflows/tests.yml` ✅

**Status:** ✅ Completed (8 Feb 2026)

**Notes:** All tests passing locally and in CI. Using `--legacy-peer-deps` for React 19 compatibility.

---

## Restructure Backend (17 Feb 2026)

**Objective:** Reorganise FastAPI backend into a package layout `backend/app/` to prepare for modular development and easier imports.

**Tasks:**
1. ✅ Create `backend/app/` package and subpackages: `models`, `services`, `api`, `utils` with `__init__.py` files
2. ✅ Move `backend/main.py` into `backend/app/main.py`
3. ✅ Add placeholder modules: `models/cv_models.py`, `services/{cv_parser,ai_service,keyword_matcher}.py`, `api/cv_routes.py`
4. ✅ Create virtual environment at `backend/.venv`
5. ✅ Install dependencies from `requirements.txt`
6. ✅ Fix test imports (`from main import app` → `from app.main import app`)
7. ✅ Verify server runs and tests pass
8. ✅ Update documentation (dev-log.md, issue-log.md)

**Files Created/Modified:**
- `backend/app/__init__.py` ✅
- `backend/app/main.py` ✅ (moved from root)
- `backend/app/models/__init__.py` ✅
- `backend/app/models/cv_models.py` ✅ (basic placeholders)
- `backend/app/services/__init__.py` ✅
- `backend/app/services/cv_parser.py` ✅ (placeholder)
- `backend/app/services/ai_service.py` ✅ (stub)
- `backend/app/services/keyword_matcher.py` ✅ (placeholder)
- `backend/app/api/__init__.py` ✅
- `backend/app/api/cv_routes.py` ✅ (sample endpoint)
- `backend/app/utils/__init__.py` ✅
- `backend/.venv/` ✅ (virtual environment)
- `backend/tests/test_main.py` ✅ (updated imports)

**Status:** ✅ Completed (17 Feb 2026)

**Notes:** 
- Backend server verified running at http://localhost:8000
- Interactive docs at http://localhost:8000/docs
- 2/2 tests passing after import fix
- Ready for feature implementation

---

## Implement Core CV Features (17 Feb 2026 - Ongoing)

**Objective:** Implement production-ready code for CV builder core functionality

### Phase 1: Data Models ✅ COMPLETED

**Status:** ✅ Implemented (18 Feb 2026)

All CV data structures fully implemented with comprehensive Pydantic models:
- ✅ PersonalInfo model (full_name, email, phone, location, linkedin, github, website)
- ✅ Experience model (id, job_title, company, location, dates, responsibilities, achievements, technologies)
- ✅ Education model (id, degree, institution, location, graduation_date, grade, modules)
- ✅ Project model (id, title, description, technologies, link, achievements, dates)
- ✅ Skills model (technical[], soft[])
- ✅ CVData model (combines all above with professional_summary, certifications)
- ✅ Request/Response models for API (CVUploadResponse, EnhanceRequest, EnhanceResponse, JobAnalysisRequest, JobAnalysisResponse)

**Files Updated:**
- ✅ `backend/app/models/cv_models.py` ✅

---

### Phase 2: CV Parser 📋 ✅ COMPLETED

**Status:** ✅ Implemented (18 Feb 2026)

Comprehensive PDF and DOCX parsing with section extraction:
- ✅ Parse PDF files using PyPDF2
- ✅ Parse DOCX files using python-docx
- ✅ Extract personal info (name, email, phone, LinkedIn, GitHub, location) using regex
- ✅ Identify CV sections (Experience, Education, Skills, Projects)
- ✅ Extract structured data into CVData model
- ✅ Handle malformed/inconsistent CV formats gracefully
- ✅ Return warnings for unparseable sections
- ✅ Support UK/Ireland CV formats

**Implementation Completed:**
- ✅ `parse_pdf()` — PyPDF2.PdfReader text extraction
- ✅ `parse_docx()` — python-docx Document parsing
- ✅ `_extract_personal_info()` — Regex-based email, phone, LinkedIn, GitHub, location, name detection
- ✅ `_identify_section_boundaries()` — Section header identification
- ✅ `_extract_experience()` — Job history parsing with dates and achievements
- ✅ `_extract_education()` — Degree and institution extraction
- ✅ `_extract_skills()` — 30+ STEM keyword matching

**Files Updated:**
- ✅ `backend/app/services/cv_parser.py` ✅

---

### Phase 3: AI Service 🤖 ✅ COMPLETED

**Status:** ✅ Implemented (18-19 Feb 2026)

OpenAI API integration for CV enhancement:
- ✅ OpenAI API client setup with error handling
- ✅ Environment variable for API key (OPENAI_API_KEY)
- ✅ Bullet point enhancement using STAR method (Situation, Task, Action, Result)
- ✅ Context-aware prompts (job title, company, UK/Ireland standards)
- ✅ Temperature: 0.7, Max tokens: 150 per request
- ✅ Rate limiting and error handling
- ✅ Confidence scoring for suggestions
- ✅ Validation system to prevent fabrication of information

**Implementation Completed:**
- ✅ OpenAI client initialization with API key from environment
- ✅ STAR method prompt engineering
- ✅ Bullet point enhancement with context awareness
- ✅ Confidence scoring algorithm
- ✅ Response validation
- ✅ Error handling with graceful fallbacks

**Files Updated:**
- ✅ `backend/app/services/ai_service.py` ✅
- ✅ `backend/.env` with OPENAI_API_KEY placeholder ✅

**Dependencies Added:**
- ✅ `openai>=1.3.0` ✅
- ✅ `python-dotenv>=1.0.0` ✅

---

### Phase 4: Keyword Matcher & ATS Analyzer 🎯 ✅ COMPLETED

**Status:** ✅ Implemented (18-19 Feb 2026)

Comprehensive ATS compatibility checker and keyword matching:
- ✅ Database of 100+ STEM keywords (organized by category)
- ✅ Extract keywords from job descriptions
- ✅ Calculate match score (CV keywords vs job keywords)
- ✅ Identify missing keywords
- ✅ Check ATS compatibility (avoid tables, special chars, complex formatting)
- ✅ Provide actionable recommendations
- ✅ Categorize keywords (technical skills, tools, methodologies, qualifications)

**Implementation Completed:**
- ✅ 100+ STEM keyword database across 9 categories:
  - Programming languages: 23 keywords
  - Frontend frameworks: 12 keywords
  - Backend frameworks: 13 keywords
  - Databases: 14 keywords
  - Cloud/DevOps: 17 keywords
  - AI/ML: 15 keywords
  - Testing frameworks: 11 keywords
  - Methodologies: 9 keywords
  - Soft skills: 8 keywords
- ✅ Keyword extraction with regex word boundaries
- ✅ Match score calculation
- ✅ Missing keyword identification
- ✅ ATS compatibility checker (special characters, sections, contact info)
- ✅ Recommendations engine

**Files Updated:**
- ✅ `backend/app/services/keyword_matcher.py` ✅

---

### Phase 5: API Routes 🚀 ✅ COMPLETED

**Status:** ✅ Implemented (18-19 Feb 2026)

Full API endpoint implementation with proper error handling:
- ✅ POST `/api/cv/upload` — Upload CV file, parse, return structured data
- ✅ POST `/api/cv/enhance-bullet` — Enhance single bullet point with AI
- ✅ POST `/api/cv/job/analyze` — Analyze job description and compare with CV
- ✅ GET `/api/cv/health` — Health check with endpoint listing
- ✅ Proper error handling (HTTPException)
- ✅ Request validation (Pydantic models)
- ✅ File upload size limits (10MB)
- ✅ Response models for consistent API

**Implementation Completed:**
- ✅ File upload with PDF/DOCX validation
- ✅ Integration with cv_parser service
- ✅ AI enhancement endpoint with context awareness
- ✅ Job analysis with keyword extraction
- ✅ Health check endpoint with service status
- ✅ Comprehensive error handling
- ✅ All endpoints documented in FastAPI /docs

**Files Updated:**
- ✅ `backend/app/api/cv_routes.py` ✅
- ✅ `backend/app/main.py` (registered router) ✅

---

## Testing Progress Update (27 Feb 2026)

**Phase 6 Status Update:**

**Completed:**
- ✅ Unit tests for cv_models.py (15 tests) - All passing
- ✅ Total tests: 17 (2 health + 15 models)

**Current Testing Breakdown:**
1. **test_main.py:** 2 tests (health checks)
2. **test_cv_models.py:** 15 tests (data model validation)
   - PersonalInfo: 4 tests
   - Experience: 2 tests
   - Skills: 2 tests
   - CVData: 2 tests
   - EnhanceRequest: 2 tests
   - JobAnalysisRequest: 3 tests

**Next Steps:**
- Unit tests for cv_parser.py (sample PDFs/DOCX)
- Unit tests for ai_service.py (mocked OpenAI)
- Unit tests for keyword_matcher.py
- Integration tests for cv_routes.py
- Target: 70%+ code coverage

**Timeline:**
- Feb 27: ✅ Model tests complete
- Feb 28-Mar 1: Service tests
- Mar 2: Integration tests
- Mar 3+: Frontend development with tested backend

---

## Timeline & Milestones

### Week 1 (Feb 17-23, 2026) ✅ COMPLETE
- ✅ Backend restructuring (17 Feb)
- ✅ Phase 1: CV data models (18 Feb)
- ✅ Phase 2: CV parser implementation (18 Feb)
- ✅ Phase 3: AI service with OpenAI (18-19 Feb)
- ✅ Phase 4: Keyword matcher & ATS analyzer (18-19 Feb)
- ✅ Phase 5: API routes implementation (18-19 Feb)
- ✅ Issue #10: .env encoding fix (18 Feb)
- ✅ Testing & verification all services (19 Feb)
- **Status:** 🚀 BACKEND 100% COMPLETE — Ready for Week 2 frontend integration

### Week 2 (Feb 24 - Mar 2, 2026)
- Phase 6: Expand test coverage
  - Unit tests for all services
  - Integration tests for API endpoints
  - Target >70% code coverage
- Frontend component development
  - Create Home/Hero component
  - Create CVUploader component
  - Create CVBuilder component
  - Create CVPreview component
  - Create SuggestionPanel component
  - Create JobAnalyzer component
- Frontend-backend integration
  - Connect components to API
  - Test upload workflow
  - Test enhancement workflow

### Week 3 (Mar 3-9, 2026)
- Phase 6: Complete testing
- PDF export functionality
- Complete end-to-end workflows
- User testing preparation
- Sample CV and job description files

### Week 4 (Mar 10-16, 2026)
- Comprehensive testing
- Bug fixes based on test results
- Performance optimization
- Security review

### Week 5-6 (Mar 17-30, 2026)
- Complete both workflows (upload + build)
- PDF export functionality
- Job analysis UI
- End-to-end testing
- User evaluation setup

### Week 7 (Mar 31 - Apr 6, 2026)
- User testing (5-10 STEM students)
- Collect evaluation data
- Bug fixes

### Week 8 (Apr 7-13, 2026)
- Final documentation
- Report writing
- Presentation preparation
- **SUBMISSION**

---

## Dependencies Checklist

**Current (Installed - 19 Feb 2026):**
- ✅ fastapi
- ✅ uvicorn
- ✅ pydantic
- ✅ pytest
- ✅ httpx
- ✅ python-multipart
- ✅ email-validator
- ✅ dnspython
- ✅ PyPDF2
- ✅ python-docx
- ✅ openai
- ✅ python-dotenv

**To Add (Phase 6+):**
- ⏳ reportlab (for PDF export)
- ⏳ spacy (for advanced NLP)
- ⏳ python-jose (for JWT auth, if needed)
- ⏳ passlib (for password hashing, if needed)

**Optional (Later phases):**
- Advanced NLP libraries (textblob, nltk)
- Performance monitoring (prometheus-client)
- Caching (redis)

---

## Implementation Progress - CV Parser (18 Feb 2026)

**Status:** ✅ Completed

**Completed Components:**

1. **PDF Parsing (`parse_pdf` method)**
   - Utilizes PyPDF2.PdfReader for robust PDF text extraction
   - Concatenates text from all pages to preserve full CV content
   - Handles multi-page documents seamlessly

2. **DOCX Parsing (`parse_docx` method)**
   - Uses python-docx Document class for .docx file support
   - Extracts paragraphs while preserving document structure
   - Seamless integration with PDF functionality

3. **Personal Information Extraction (`_extract_personal_info` method)**
   - **Email Detection:** Regex pattern `r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'`
   - **Phone Extraction:** UK/Ireland pattern `r'(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}'`
   - **Social Links:** LinkedIn URL and GitHub URL extraction
   - **Location Detection:** Keywords "Based in", "Location:", "City" pattern matching
   - **Name Heuristic:** First uppercase sequence at document start

4. **Section Boundary Detection (`_identify_section_boundaries` method)**
   - Regex multiline search (re.MULTILINE | re.IGNORECASE) for section headers
   - Detects: Experience, Education, Skills, Projects, Technical Skills, Summary, Objective
   - Returns section start/end indices for targeted content extraction

5. **Experience Extraction (`_extract_experience_simple` method)**
   - Date pattern detection for start/end dates
   - Achievement bullet point extraction
   - Company and position identification

6. **Education Extraction (`_extract_education_simple` method)**
   - Degree type detection (BSc, MSc, PhD, BA, MA, diploma variants)
   - Institution name extraction
   - Grades and modules identification

7. **Skills Extraction (`_extract_skills_simple` method)**
   - 30+ STEM keyword database: Python, Java, JavaScript, C++, C#, SQL, React, Angular, Node.js, Docker, Kubernetes, AWS, Azure, GCP, machine learning, TensorFlow, PyTorch, etc.
   - Case-insensitive keyword matching
   - Returns categorized technical skills list

**Integration Points:**
- All methods follow private naming convention (_method_name) for encapsulation
- Singleton instance pattern for global parser access
- Ready for API route integration to `/parse-cv` endpoint
- Compatible with CVData Pydantic model for structured output

**Next Steps:**
- Register cv_routes with parser endpoints in app/main.py
- Implement AI summarization service for extracted data
- Add keyword matching and ATS scoring

---

## Notes

- Focus on MVP features only (8-week timeline is tight)
- Prioritize working code over perfect code
- Test incrementally (after each phase)
- Document as you go (don't wait until end)
- Keep scope limited to UK/Ireland STEM CVs
- User approval required for all AI suggestions (ethical AI)