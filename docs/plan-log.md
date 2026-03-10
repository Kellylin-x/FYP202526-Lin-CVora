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

---

## Testing Progress Update (20 Feb - 3 Mar 2026)

**Phase 6: Testing 🧪 IN PROGRESS**

**Status:** ⏳ Unit tests in progress - models, parser, and AI service complete

**Completed (20 Feb 2026):**
- ✅ Test framework setup (pytest)
- ✅ FastAPI TestClient integration
- ✅ Health check verification (2 tests)
- ✅ **Unit tests for cv_models.py (15 tests) - COMPLETE**
  - PersonalInfo validation (4 tests)
  - Experience model (2 tests)
  - Skills model (2 tests)
  - CVData complete structure (2 tests)
  - EnhanceRequest API model (2 tests)
  - JobAnalysisRequest API model (3 tests)
  - All tests passing (15/15)
  - Test file: `backend/tests/test_cv_models.py`

**Completed (20 Feb 2026 - Continued):**
- ✅ **Unit tests for cv_parser.py (12 tests) - COMPLETE**
  - PDF/DOCX parsing validation (2 tests)
  - Personal info extraction (5 tests: email, phone, name, location, skills)
  - Section detection (2 tests: education, experience)
  - Error handling and validation (3 tests)
  - All tests passing (12/12)
  - Test file: `backend/tests/test_cv_parser.py`
  - Test fixtures: `backend/tests/fixtures/sample_cv.txt`
  - Uses real student CV data for authentic validation
  - Auto-generates PDF/DOCX files using ReportLab and python-docx
  - Enhanced location extraction for international support

**Timeline Break:**
- **Feb 21-23:** Travel to London (no development work)
- **Feb 25 - Mar 1:** Illness (tonsillitis) - project paused
- **Mar 3:** Resumed testing work

**Completed (3-4 Mar 2026):**
- ✅ **Unit tests for ai_service.py (10 tests) - COMPLETE**
  - Success cases: enhancement, metrics detection, action verbs (3 tests)
  - Validation & cleaning: output validation, cleaning, length checks (3 tests)
  - Error handling: API errors, missing API key (2 tests)
  - Quality metrics: measurable results, text length (2 tests)
  - All tests passing (10/10)
  - Test file: `backend/tests/test_ai_service.py`
  - Uses mocked OpenAI API (no real API calls, no costs)
  - Execution time: ~5 seconds for all AI tests
- ✅ **Unit tests for keyword_matcher.py (15 tests) - COMPLETE**
  - Completed same day as AI service tests (Mar 3)
- ✅ **Integration tests for cv_routes.py (14 tests) - COMPLETE**
  - Completed Mar 4 — ahead of schedule

**Testing Achievements:**
- Established proper mocking pattern for external APIs (pytest fixtures)
- Resolved singleton pattern mocking issue (Issue #12)
- All tests run without internet connectivity or API keys
- Fast execution (~7 seconds total for all 68 tests)
- Zero API costs during testing
- Backend testing phase fully complete ahead of schedule

**Final Progress (4 Mar 2026):**
- Total tests: 68 passing (2 health + 15 models + 12 parser + 10 AI + 15 keyword matcher + 14 routes)
- No blocking issues
- Professional mocking techniques demonstrated
- Frontend development begun ahead of schedule

**Completed ahead of schedule — Next Steps moved to frontend development**
- ✅ React Router setup and routing
- ✅ Upload CV page with job description matching
- ✅ Job Analysis page (both flows)
- ✅ CV Builder with live preview and AI chat panel

**Target:**
- ✅ 70%+ code coverage across all backend services
- ✅ 68 total tests (exceeded 50+ target)
- ✅ All core functionality tested
- ✅ Integration tests for complete workflows

**Files:**
- ✅ `backend/tests/test_main.py` (2 tests passing)
- ✅ `backend/tests/test_cv_models.py` (15 tests passing) - COMPLETE
- ✅ `backend/tests/test_cv_parser.py` (12 tests passing) - COMPLETE
- ✅ `backend/tests/test_ai_service.py` (10 tests passing) - COMPLETE
- ✅ `backend/tests/fixtures/sample_cv.txt` - Real CV test data
- ✅ `backend/tests/test_keyword_matcher.py` (15 tests passing) - COMPLETE
- ✅ `backend/tests/test_cv_routes.py` (14 tests passing)

**Timeline Update:**
- Feb 20: ✅ Data model tests (15 tests) + CV parser tests (12 tests)
- Feb 21-23: Travel to London
- Feb 25 - Mar 1: Illness recovery (tonsillitis)
- Mar 3: ✅ AI service tests (10 tests) - Resumed work
- Mar 4-5: Keyword matcher tests
- Mar 6-8: Integration tests for API routes
- Mar 10+: Begin frontend development with fully tested backend (50+ tests)

---

## LLM Job Analysis Feature (6-9 Mar 2026)

**Objective:** Implement AI-powered job description analysis using Google Gemini API to extract structured data (requirements, tech stack, salary, work model) for improved ATS matching

**Background:**
- Supervisor meeting on Mar 5 suggested integrating LLM for:
  1. Job description analysis (PRIORITY)
  2. CV enhancement (future phase)
- Current keyword matcher provides basic matching but lacks semantic understanding
- Need structured extraction from unstructured job postings

**Technology Selection:**
- Google Gemini 2.5 Flash API (cost-effective, free tier available)
- `google-genai` package (modern SDK, replaces deprecated `google.generativeai`)
- JSON response mode for structured output

**Implementation Plan:**

1. **AI Service Enhancement** (`backend/app/services/ai_service.py`)
   - Add `analyze_job_description(job_text: str)` method
   - Configure Gemini client with API key from environment
   - Set model parameters:
     - `model="models/gemini-2.5-flash"`
     - `temperature=0.0` (deterministic output)
     - `max_output_tokens=1800`
     - `response_mime_type="application/json"`
   - Implement detailed prompt engineering for JSON schema
   - Expected output fields: job_title, company, employment_type, work_model, salary, tldr, experience_level, key_requirements, tech_stack

2. **Robust JSON Parsing**
   - Implement multi-layer parsing strategy (LLMs may return malformed JSON):
     - Layer 1: Direct JSON parse
     - Layer 2: Strip markdown code fences (```json```)
     - Layer 3: Fix trailing commas
     - Layer 4: Extract JSON object from mixed text
     - Layer 5: Fallback default structure
   - Add helper methods: `_parse_json_response()`, `_strip_markdown_fences()`, `_extract_json_object()`, `_default_job_analysis()`

3. **API Route** (`backend/app/api/cv_routes.py`)
   - Add POST `/api/cv/job/analyze-llm` endpoint
   - Create `JobDescriptionRequest` Pydantic model
   - Call `ai_service.analyze_job_description()`
   - Return structured analysis or error response

4. **Environment Configuration**
   - Create `.vscode/settings.json` with `python.terminal.useEnvFile: true`
   - Add `GEMINI_API_KEY` to `backend/.env`
   - Ensure automatic environment variable loading in VS Code terminals

5. **CORS Configuration**
   - Update `backend/app/main.py` CORS settings for development
   - Change from strict port whitelist to `allow_origins=["*"]`
   - Set `allow_credentials=False` for security

6. **Testing**
   - Update `tests/test_ai_service.py` with new Gemini API mocks
   - Mock `client.models.generate_content` (new SDK structure)
   - Verify all 68 tests still passing
   - Test with real job descriptions (JP Morgan, etc.)

7. **Frontend Integration**
   - Verify Job Analysis page connects to new endpoint
   - Test structured output display (TLDR, requirements, tech stack)
   - Ensure 2-3 second response time acceptable

**Expected Challenges:**
- Gemini API model name format (requires `models/` prefix)
- JSON parsing inconsistencies from LLM responses
- Environment variable loading in VS Code
- CORS blocking when frontend port changes
- Potential stale backend processes with `--reload` flag

**Files to Create/Modify:**
- ✅ `backend/app/services/ai_service.py` (add analyze_job_description)
- ✅ `backend/app/api/cv_routes.py` (add /analyze-llm endpoint)
- ✅ `backend/app/main.py` (update CORS)
- ✅ `backend/.env` (add GEMINI_API_KEY)
- ✅ `.vscode/settings.json` (create for env loading)
- ✅ `backend/tests/test_ai_service.py` (update mocks)

**Success Criteria:**
- ✅ End-to-end job analysis working in <3 seconds
- ✅ Structured JSON output with all required fields
- ✅ Robust parsing handles malformed LLM responses
- ✅ All 68 tests passing after integration
- ✅ Frontend displays analysis results correctly

**Target Completion:** Mar 9, 2026

**Status:** ✅ COMPLETED (9 Mar 2026)

**Notes:** 
- Successfully integrated Google Gemini 2.5 Flash
- 4-layer JSON parsing handles all malformed response cases
- Fixed Issues #19-22 (env loading, CORS, model name, stale processes)
- Frontend verified with JP Morgan job description
- All tests passing (68/68)

---

## Timeline & Milestones

### Semester Context
- **Semester Start:** January 12, 2026
- **Current Week:** Week 8 (March 3, 2026)
- **Report Due:** Week 12 (April 1-3, 2026)
- **Demo/Presentation:** Week 13 (April 6-10, 2026)
- **Remaining Time:** 4 weeks to complete development, testing, and report

---

### Week 1-2 (Jan 12-25, 2026) - Initial Setup
- ✅ Created GitHub repository (Jan 15)
- ✅ Scaffolded React + TypeScript frontend using Vite (Jan 15)
- ✅ Set up FastAPI backend (Jan 15)
- ✅ Initial development log created

### Week 3 (Jan 26 - Feb 1, 2026) - Planning & Research
- Research phase
- Project Definition Document (PDD) development
- Requirements gathering

### Week 4 (Feb 2-8, 2026) - CI/CD & Testing Infrastructure
- ✅ Configured Tailwind CSS and frontend dependencies (Feb 5)
- ✅ Created CVoraLOGO and integrated into header (Feb 5)
- ✅ Set up GitHub Actions CI workflow (Feb 8)
- ✅ Added pytest (backend) and vitest (frontend) tests (Feb 8)
- ✅ Established branch naming convention and git workflow

### Week 5 (Feb 9-15, 2026) - Backend Planning
- ✅ Migrated to new private repository: FYP202526-Lin-CVora
- ✅ Created feature branch structure
- Backend architecture planning

### Week 6 (Feb 16-22, 2026) - Backend Implementation & Testing (Part 1)
- ✅ Backend restructuring into modular package layout (Feb 17)
- ✅ Implemented all 6 core backend files (Feb 18-19):
  - CV data models (Pydantic)
  - CV parser (PDF/DOCX with PyPDF2, python-docx)
  - AI service (OpenAI GPT-3.5-turbo integration)
  - Keyword matcher (100+ STEM keywords)
  - API routes (6 REST endpoints)
  - Main app integration
- ✅ All backend services operational and documented (Feb 19)
- ✅ Started Phase 6: Comprehensive testing (Feb 20)
  - Implemented 15 unit tests for CV data models
  - Implemented 12 unit tests for CV parser
  - Enhanced location extraction for international support
- ⏸️ Feb 21-23: Travel to London (project paused)

### Week 7 (Feb 23 - Mar 1, 2026) - Recovery Period
- ⏸️ Feb 25 - Mar 1: Illness (tonsillitis) - project paused
- **No development work this week**

### Week 8 (Mar 2-8, 2026) - CURRENT WEEK - Testing Continuation
- ✅ Mar 3: Resumed work - implemented 10 AI service unit tests
- ✅ Mar 3: Keyword matcher unit tests (15 tests) - completed same day
- ✅ Mar 4: Integration tests for API routes (14 tests) - completed early
- ✅ Mar 4: Total 68 tests passing (2 health + 15 models + 12 parser + 10 AI + 15 keyword matcher + 14 routes)
- ✅ Mar 4: Backend testing phase COMPLETE - ahead of schedule
- ✅ Mar 4: Frontend development started early (originally planned Week 9)
- ✅ Mar 4: React Router, Upload CV page, Job Analysis page, CV Builder all implemented
- **Goal:** ✅ Achieved - all backend testing complete, frontend development begun

### Week 9 (Mar 4-15, 2026) - Frontend Development (Started Early)
- ✅ Mar 4: React Router setup and routing configured
- ✅ Mar 4: Upload CV page built and integrated with backend
- ✅ Mar 4: Real CV upload tested end-to-end (parser fixes included)
- ✅ Mar 4: CI fixed for frontend tests with MemoryRouter
- ✅ Mar 4: Job Analysis page built and tested (both flows)
- ✅ Mar 4: CV Builder page built with live preview and AI chat panel
- ✅ Mar 4: Backend raw_text fix for accurate job match scoring
- ⏳ CV Builder end-to-end testing
- ⏳ PDF export for built CV
- **Goal:** Functional UI for all major features

### Week 10 (Mar 16-22, 2026) - CRITICAL: Integration & Polish
- Complete frontend-backend integration
- Implement all user workflows:
  - Upload CV → Parse → Display
  - Build CV → AI Enhancement → Export
  - Job Analysis → Keyword Matching
- PDF export functionality
- Error handling and user feedback
- **Goal:** Fully working application end-to-end

### Week 11 (Mar 23-29, 2026) - CRITICAL: User Testing & Report
- **Days 1-3 (Mar 23-25):** User evaluation with 5-10 STEM students
- **Days 4-7 (Mar 26-29):** Report writing (MAJOR FOCUS)
  - Introduction, Literature Review, Methodology
  - Implementation details, Testing & Evaluation
  - Results, Discussion, Conclusion
- Bug fixes from user feedback
- **Goal:** Complete draft report by Mar 29

### Week 12 (Mar 30 - Apr 5, 2026) - SUBMISSION WEEK
- **Apr 1-3:** Final report revisions and submission
- **Apr 3-5:** Prepare demo presentation
- Final code cleanup and documentation
- **REPORT SUBMISSION DEADLINE**

### Week 13 (Apr 6-10, 2026) - DEMO WEEK
- **Project Demo/Presentation**
- Final submission of all materials

---

## Critical Path Summary

**Completed (Weeks 1-8):**
- ✅ Full backend implementation (6 core files)
- ✅ 54 comprehensive unit tests
- ✅ All backend services operational

**Remaining (Weeks 8-13):**
- ⏳ Complete backend testing (Week 8)
- Full frontend development (Weeks 9-10)
- User testing + Report writing (Week 11)
- Report submission (Week 12)
- Final: Demo presentation (Week 13)

**Time Pressure:** Only 4 weeks remain to complete frontend, testing, and report! Must prioritize ruthlessly.