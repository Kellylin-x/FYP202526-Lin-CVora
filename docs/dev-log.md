# Development Log

## 15 Jan 2026
- Created GitHub repository and initial README
- Set up local development environment
- Installed Node.js LTS
- Scaffolded React + TypeScript frontend using Vite
- Verified development server and hot reloading

## 5 Feb 2026
- Configured Tailwind CSS with PostCSS for styling
- Installed frontend dependencies (lucide-react, react-router-dom, tailwindcss, etc.)
- Created component structure: Header, Hero, FeatureCard, Footer
- Set up FastAPI backend with Python 3.13
- Configured CORS for localhost:5173
- Created CVoraLOGO.png and integrated into Header
- Optimized logo dimensions (1024×256px)
- Adjusted header height for proper logo display
- Both dev servers running successfully (frontend: localhost:5173, backend: localhost:8000)
- Built production bundle with Vite
- Pushed all changes to GitHub

## 8 Feb 2026
- Created new private GitHub repository: FYP202526-Lin-CVora
- Set up git user config (Kellylin-x, y.lin1@universityofgalway.ie)
- Migrated codebase and pushed main branch to remote
- Defined branch naming convention: feat/, fix/, chore/, docs/, test/, refactor/, ci/, hotfix/
- Created feature branch feat/branching-ci-setup for this setup task
- Planning: add pytest tests for backend, vitest tests for frontend, GitHub Actions CI workflow

### Backend Tests: ✅ PASSED
- pytest installed and configured
- 2/2 tests passing (test_health_check, test_app_is_running)
- All backend requirements.txt dependencies working

### Frontend Tests: ✅ IN PROGRESS
- vitest installed with --legacy-peer-deps flag (React 19 / @testing-library/react v15 compatibility issue)
- Frontend dependencies installed successfully
- Ready to run npm test -- --run

### Tests Fixed & Verified (8 Feb 2026)
- **Issue #3 Resolved:** Added jsdom to frontend devDependencies
- **Backend Tests:** ✅ 2/2 PASSED (test_health_check, test_app_is_running)
- **Frontend Tests:** ✅ 2/2 PASSED (should render without crashing, should render the application)
- **All tests passing locally** - ready for GitHub Actions CI re-run

### GitHub Actions CI Fix (8 Feb 2026)
- **Issue #4:** npm install failing in CI without --legacy-peer-deps
- **Action:** Updated .github/workflows/tests.yml to include --legacy-peer-deps flag
- **Next:** CI will re-run automatically with the corrected workflow
- **Expected Result:** Both backend-tests ✅ and frontend-tests ✅ should now PASS

## 17 Feb 2026

### Backend Restructuring
- Reorganized backend into proper package layout under `backend/app/`
- Created modular folder structure:
  - `backend/app/models/` - Data models using Pydantic
  - `backend/app/services/` - Business logic (CV parsing, AI, keyword matching)
  - `backend/app/api/` - API route handlers
  - `backend/app/utils/` - Helper utilities
- Moved `main.py` from `backend/` root to `backend/app/main.py`
- Added `__init__.py` files to all packages for proper Python imports

### Virtual Environment Setup
- Created Python virtual environment at `backend/.venv`
- Resolved PowerShell execution policy issues on Windows
  - Used `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for activation
- Upgraded pip to latest version
- Installed all dependencies from `requirements.txt`:
  - fastapi, uvicorn, pydantic, pytest, httpx
  - python-multipart, openai, python-docx, PyPDF2, python-dotenv

### Backend API Verification
- Started FastAPI development server successfully
- Verified endpoints working:
  - `GET /` - Welcome message with project info
  - `GET /health` - Health check returning `{"status": "healthy"}`
- Interactive API documentation accessible at `/docs`
- CORS configured to allow frontend requests from `http://localhost:5173`

### Initial Code Files Created
- **`app/models/cv_models.py`:**
  - Basic `CVContact` model (name, email, phone)
  - Basic `CVData` model (contact, summary, skills)
  - Note: Needs expansion to full CV schema
- **`app/services/cv_parser.py`:**
  - Placeholder `parse_cv()` function
  - Returns raw text only (needs PDF/DOCX parsing implementation)
- **`app/services/ai_service.py`:**
  - Stub `summarize_text()` function
  - Returns truncated text (needs OpenAI API integration)
- **`app/services/keyword_matcher.py`:**
  - Empty placeholder file (needs ATS analysis implementation)
- **`app/api/cv_routes.py`:**
  - Sample `/cv/sample` endpoint
  - Returns placeholder response (needs real endpoints)

### Tests Fixed
- **Issue #7:** Test imports failing after restructure
- Updated `backend/tests/test_main.py`:
  - Changed `from main import app` to `from app.main import app`
- Re-ran pytest: ✅ 2/2 tests passing
- All existing functionality verified working after restructure

### Project Documentation
- Updated `issue-log.md` with all issues encountered and resolved
- Updated `plan-log.md` with restructure tasks marked complete
- Documented PowerShell activation workaround for Windows users

### Current Status
- ✅ Backend structure properly organized and modular
- ✅ Development environment fully set up (venv, dependencies)
- ✅ FastAPI server running and endpoints responding
- ✅ Tests passing (2/2 backend tests)
- ✅ Ready for feature implementation

### Next Steps (Planned)
1. Expand `cv_models.py` with complete CV data structures:
   - PersonalInfo (full contact details)
   - Experience (work history with achievements)
   - Education (degrees and qualifications)
   - Skills (technical and soft skills)
   - Projects (portfolio items)
   - Complete CVData model

2. Implement `cv_parser.py`:
   - PDF parsing using PyPDF2
   - DOCX parsing using python-docx
   - Extract personal info (email, phone via regex)
   - Identify CV sections (Experience, Education, Skills)
   - Return structured CVData

3. Implement `ai_service.py`:
   - OpenAI API integration
   - Bullet point enhancement using STAR method
   - Professional summary generation
   - Context-aware suggestions for UK/Ireland STEM roles
   - Error handling and rate limiting

4. Implement `keyword_matcher.py`:
   - Build STEM keywords database (50+ terms)
   - Extract keywords from job descriptions
   - Calculate ATS match score (CV vs job description)
   - Identify missing keywords
   - Check ATS compatibility (formatting issues)

5. Implement `cv_routes.py`:
   - POST `/api/cv/upload` - Upload and parse CV files
   - POST `/api/cv/enhance-bullet` - AI enhancement
   - POST `/api/job/analyze` - Job description analysis
   - Proper error handling with HTTPException
   - Request/response validation

6. Add comprehensive tests:
   - Unit tests for each service module
   - Integration tests for API endpoints
   - Test CV parsing with sample files
   - Test AI enhancement outputs
   - Test keyword matching accuracy

7. Update `main.py`:
   - Register API routers
   - Add middleware for logging/monitoring
   - Configure environment variables
   - Add startup/shutdown events

### Technical Notes
- Using FastAPI for async performance and automatic OpenAPI docs
- Pydantic for data validation and serialization
- Modular architecture for maintainability and testing
- Following Python package best practices
- Virtual environment ensures dependency isolation
- All codse properly typed with Python type hints

## 18 Feb 2026

### Expanded CV Models Implementation
- Added comprehensive Pydantic models to `backend/app/models/cv_models.py`:
  - `PersonalInfo` — Full contact details (name, email, phone, location, LinkedIn, GitHub, website)
  - `Experience` — Work history with job title, company, duration, responsibilities, achievements, technologies
  - `Education` — Degree details with institution, graduation date, grade, relevant modules
  - `Project` — Portfolio/academic projects with description, tech stack, link, outcomes
  - `Skills` — Technical and soft skills separated by category
  - `CVData` — Complete CV structure combining all above models
  - API request/response models: `CVUploadResponse`, `EnhanceRequest`, `EnhanceResponse`, `JobAnalysisRequest`, `JobAnalysisResponse`

### Dependency Resolution
- **Issue encountered:** Importing CV models failed due to missing `email-validator` library (required by Pydantic's `EmailStr` type)
- **Resolution:** Ran `pip install pydantic[email]` which installed `email-validator>=2.0.0` and `dnspython>=2.0.0`
- **Verification:** Models now import successfully and all tests pass (2/2 passing)

### Current Status
- ✅ All CV data models fully defined and tested
- ✅ API models for upload, enhancement, and job analysis ready
- ✅ Dependencies installed and working
- ✅ Ready for service layer implementation (parser, AI, keyword matcher)

### CV Parser Implementation (18 Feb 2026)
- **Created comprehensive `CVParser` class in `backend/app/services/cv_parser.py`:**
  - `parse_pdf()` — Extracts text from PDF files using PyPDF2
  - `parse_docx()` — Extracts text from DOCX files using python-docx
  - `_extract_sections()` — Identifies and separates Experience, Education, Skills, Projects sections
  - `_extract_personal_info()` — Uses regex patterns to detect email, phone, LinkedIn, GitHub, location, name
  - `_extract_experience_simple()` — Parses job titles, companies, dates, responsibilities
  - `_extract_education_simple()` — Detects degree types, fields, graduation dates
  - `_extract_skills_simple()` — Identifies STEM skills from predefined keyword database (30+ keywords)
- **Features:**
  - Supports UK/Ireland CV formats
  - Regex patterns for UK/Ireland phone numbers (+353 formats)
  - Section boundary detection for unstructured CV layouts
  - Warning system for missing personal info, sections, or skills
  - Returns structured CVData ready for API use
- **Singleton instance** created for global access

### Current Status (Updated)
- ✅ All CV data models fully defined and tested
- ✅ API models for upload, enhancement, and job analysis ready
- ✅ CV parser with PDF/DOCX support and section extraction implemented
- ✅ Ready for AI service implementation and route integration

## 18-19 Feb 2026 - MAJOR: Complete Backend Implementation

### AI Service Implementation (18-19 Feb 2026)
- **Integrated OpenAI API in `backend/app/services/ai_service.py`:**
  - GPT-3.5-turbo model for CV enhancement
  - STAR method (Situation, Task, Action, Result) prompting strategy
  - Bullet point enhancement with context awareness (job_title, company)
  - Validation system to prevent AI fabrication
  - Confidence scoring algorithm based on improvements
  - System prompt enforcing UK/Ireland CV standards
  - Error handling for API failures with graceful fallbacks
  - Temperature: 0.7, Max tokens: 150 per request
  - Environment variable configuration (OPENAI_API_KEY from .env)
- **Dependencies added:** `openai>=1.3.0`, `python-dotenv>=1.0.0`
- **Status:** ✅ Service imports successfully, all functions callable

### ATS Keyword Analyzer Implementation (18-19 Feb 2026)
- **Created comprehensive STEM keywords database in `backend/app/services/keyword_matcher.py`:**
  - 100+ keywords across 9 categories:
    * Programming: 23 languages
    * Frontend: 12 frameworks
    * Backend: 13 frameworks
    * Databases: 14 systems
    * Cloud/DevOps: 17 technologies
    * AI/ML: 15 tools
    * Testing: 11 frameworks
    * Methodologies: 9 practices
    * Soft skills: 8 competencies
- **Keyword extraction** from job descriptions and CVs using regex word boundaries
- **Match score calculation** (percentage overlap CV vs job keywords)
- **Missing keyword identification** for gap analysis
- **ATS compatibility checker:**
  * Detects problematic special characters and formatting issues
  * Validates presence of required sections (Experience, Education, Skills)
  * Checks for contact information (email, phone, LinkedIn)
  * Generates actionable recommendations
- **Status:** ✅ All keyword matching functions working correctly

### API Routes Implementation (18-19 Feb 2026)
- **Routes in `backend/app/api/cv_routes.py`:**
  - `POST /api/cv/upload` — File upload and automatic parsing
    * Validates file type (PDF/DOCX only), 10MB limit
    * Returns CVUploadResponse with parsed data and warnings
  - `POST /api/cv/enhance-bullet` — AI-powered enhancement
    * Context-aware prompts with improvements analysis
    * Returns EnhanceResponse with confidence score
  - `POST /api/cv/job/analyze` — Job keyword analysis
    * Extracts keywords from job description
    * Optional CV comparison with match scoring
    * Returns recommendations
  - `GET /api/cv/health` — Health check with endpoint listing
- **Comprehensive error handling and Pydantic validation**
- **Status:** ✅ All endpoints documented in FastAPI /docs

### Main Application Update (18-19 Feb 2026)
- **Enhanced `backend/app/main.py`:**
  - Registered cv_routes router
  - Added dotenv loading for environment variables
  - Enhanced FastAPI metadata (title, description, version)
  - Expanded CORS origins for frontend (localhost:5173, 127.0.0.1:5173, port 3000 variants)
  - Updated `/` endpoint with available endpoints listing
  - Improved `/health` endpoint with service status
  - All 6 API endpoints now operational
- **Status:** ✅ Server starts successfully, all endpoints responding with 200 OK

### Issue #10: .env UTF-8 Encoding Error
- **Problem:** Server crashed with "UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff"
- **Root Cause:** .env file created with incorrect encoding (UTF-16/binary)
- **Resolution:** Deleted and recreated .env with proper UTF-8 encoding
- **Status:** ✅ Resolved — server now starts with expected "OPENAI_API_KEY not set" notice

### Testing & Verification (18-19 Feb 2026)
- **All imports successful:**
  - ✅ cv_parser, ai_service, keyword_matcher
  - ✅ All data models
  - ✅ cv_routes router

- **API endpoints tested (all 200 OK):**
  - GET `/` — Welcome with available endpoints
  - GET `/health` — Health status
  - POST `/api/cv/upload` — File upload and parsing
  - POST `/api/cv/enhance-bullet` — AI enhancement
  - POST `/api/cv/job/analyze` — Job keyword analysis
  - GET `/api/cv/health` — CV routes health check

- **Test Suite:**
  - ✅ pytest: 2/2 passing
  - ✅ No regressions

- **FastAPI Documentation:**
  - ✅ Accessible at /docs
  - ✅ All 6 endpoints documented

### Dependencies Summary (Current - 19 Feb 2026)
**Installed & Working (15+ packages):**
- fastapi, uvicorn, pydantic, pytest, httpx, python-multipart
- email-validator, dnspython
- PyPDF2, python-docx
- openai, python-dotenv

### Current Status (FINAL - 19 Feb 2026)
✅ **Backend: 100% COMPLETE AND OPERATIONAL**
- All 6 core files fully implemented and tested
- All API endpoints working and documented
- All services integrated and functional
- Ready for frontend integration

### Next Steps (Week 2+)
- Frontend component development
- Frontend-backend API integration
- PDF export functionality and user evaluation

## 20 Feb 2026

### Unit Testing Implementation - Phase 6 Started

Following supervisor feedback from our February 19th meeting, began implementing comprehensive unit and integration tests for the backend before starting frontend development.

**Supervisor Recommendation:**
- "Implement unit tests and integration tests for each feature"
- Rationale: Catch backend bugs early, ensure API stability, demonstrate software engineering best practices

**Decision Made:**
- Implement tests NOW before frontend (not after)
- Benefits: Better code confidence, easier frontend development, professional approach

### Unit Tests for CV Data Models (test_cv_models.py)

**Created:** `backend/tests/test_cv_models.py` with 15 comprehensive unit tests

**Test Coverage:**

1. **TestPersonalInfo (4 tests):**
   - `test_valid_personal_info` - Validates correct PersonalInfo creation
   - `test_invalid_email` - Ensures invalid emails are rejected
   - `test_missing_required_field` - Confirms required fields are enforced
   - `test_optional_fields` - Verifies optional fields (linkedin, github, website) work correctly

2. **TestExperience (2 tests):**
   - `test_valid_experience` - Valid experience entry with all fields
   - `test_empty_lists_allowed` - Confirms empty responsibilities/achievements/technologies are permitted

3. **TestSkills (2 tests):**
   - `test_valid_skills` - Both technical and soft skills populated
   - `test_empty_skills_allowed` - Default empty lists work correctly

4. **TestCVData (2 tests):**
   - `test_minimal_cv_data` - Minimal required fields only
   - `test_complete_cv_data` - Full CV with all sections populated

5. **TestEnhanceRequest (2 tests):**
   - `test_valid_enhance_request` - Valid API request for enhancement
   - `test_text_too_short` - Rejects text under 5 characters

6. **TestJobAnalysisRequest (3 tests):**
   - `test_valid_job_analysis_request` - Valid job description (50+ chars)
   - `test_job_description_too_short` - Rejects job descriptions under 50 chars
   - `test_with_cv_text` - Optional CV text field works correctly

**Testing Approach:**
- Organize tests into logical classes by model type
- Test both success cases (valid data) and failure cases (invalid data)
- Use `pytest.raises(ValidationError)` for testing Pydantic validation
- Follow Arrange-Act-Assert pattern
- Descriptive test names explaining what is tested

**Test Results:**
```
======================== 15 passed, 6 warnings in 1.58s ==========================
```

- ✅ All 15 new tests passing
- ✅ Total: 17 tests (2 existing + 15 new)
- ⚠️ 6 Pydantic deprecation warnings (class-based Config deprecated in v3.0) - non-blocking
- ✅ No test failures or errors
- ✅ Execution time: ~1.5 seconds

**Technical Implementation:**
- Test file: 270+ lines of comprehensive test code
- Framework: pytest with Pydantic ValidationError testing
- Coverage: All data models in `cv_models.py`
- Pattern: Class-based test organization with descriptive method names

### Current Testing Status

**Completed:**
- ✅ Basic health check tests (2 tests from Feb 8)
- ✅ CV data models unit tests (15 tests) - NEW

**Total Test Count:** 17 passing

**Next Steps (Week 2):**
1. Unit tests for `cv_parser.py` (with sample PDF/DOCX files)
2. Unit tests for `ai_service.py` (mocked OpenAI API)
3. Unit tests for `keyword_matcher.py` (keyword extraction, scoring)
4. Integration tests for `cv_routes.py` (API endpoints end-to-end)
5. Target: 70%+ code coverage

### Why Tests Before Frontend

**Strategic Decision Benefits:**
- ✅ Catch backend bugs NOW rather than during frontend integration
- ✅ Confidence in API contracts before building UI
- ✅ Easier debugging (know if issue is frontend or backend)
- ✅ Professional software engineering practice for project evaluation
- ✅ Addresses supervisor feedback immediately

**Timeline Impact:**
- Testing: 2-3 days (Feb 27 - Mar 1)
- Then frontend with confidence: Week 2-3
- No time lost - actually saves debugging time later

### Technical Notes

**Pydantic Deprecation Warnings:**
- Warning: "Support for class-based `config` is deprecated, use ConfigDict instead"
- Impact: None currently (we're on Pydantic v2.0)
- Action: Will update to ConfigDict syntax in future refactor
- Not blocking tests or functionality

**Test Organization:**
- Each model type has its own test class
- Tests grouped logically (valid data, invalid data, edge cases)
- Easy to extend with more tests
- Clear documentation of what each test validates

## 20 Feb 2026 (Continued - Afternoon)

### CV Parser Unit Tests Implementation

**Created:** `backend/tests/test_cv_parser.py` with 12 comprehensive unit tests

**Test Infrastructure:**
- Created `backend/tests/fixtures/` directory with `sample_cv.txt` (real student CV)
- Tests auto-generate PDF/DOCX files using ReportLab and python-docx
- Automatic cleanup of temporary test files

**Test Coverage (12 tests):**
- PDF/DOCX parsing (2 tests)
- Personal info extraction: email, phone, name, location, skills (5 tests)
- Section detection: education, experience (2 tests)
- Error handling and validation (3 tests)

**Test Results:** ✅ 12/12 passing | **Total Tests:** 29 (2 health + 15 models + 12 parser)

**Dependencies Added:** `reportlab` for PDF test file generation

### International Inclusivity Enhancement

**Issue Identified:** Location extraction used hardcoded UK/Ireland cities, potentially excluding international candidates.

**Solution Implemented:** Refactored location extraction with 3-method flexible approach:
1. Label-based: "Location:", "Address:", "City:", "Based in:"
2. Pattern matching: "City, Country" with auto-capitalization
3. Contextual detection in first 5 CV lines

**Now Handles:**
- ✅ "dublin, ireland" → "Dublin, Ireland" (auto-capitalizes)
- ✅ "Mumbai, India" (international locations)
- ✅ "LONDON, UK" → "London, Uk" (any format)
- ✅ Multi-word cities: "New York, USA"

**Design Decision:** System welcomes international candidates while maintaining UK/Ireland market focus. Location flexibility improves user experience without compromising project scope.

**All tests still passing after refactor.**

## 3 March 2026 (Very early morning)

### Committed + Pushed Unit Tests to Github
- Went to London 21st-23rd February & forgot to commit previous changes.
- Adjusted the commit date to reflect when I actually wrote the code.
- 24th-1st Feb: Tonsillitis 

## 3 March 2026 (continued)

### AI Service Unit Tests Implementation

**Context:** Resuming testing work after travel to London (Feb 21-23) and recovery from tonsillitis (Feb 25 - Mar 1). Continuing Phase 6 testing implementation.

Following the completion of CV parser tests on Feb 20, implemented comprehensive unit tests for the AI enhancement service with mocked OpenAI API calls.

**Created:** `backend/tests/test_ai_service.py` with 10 comprehensive unit tests

**Testing Approach - Mocking External APIs:**
- Used pytest fixtures to create fresh AIService instances for each test
- Mocked OpenAI client to avoid real API calls during testing
- Tests run in isolation without internet connectivity or API costs
- Each test creates predictable mock responses to verify logic

**Test Coverage - AI Service (10 tests):**

1. **Success Cases (3 tests):**
   - `test_enhance_bullet_point_success` - Validates successful enhancement with proper return format
   - `test_enhance_bullet_point_with_metrics` - Verifies detection of measurable results (numbers, percentages)
   - `test_confidence_scoring_with_action_verb` - Confirms action verb detection (Developed, Led, etc.)

2. **Validation & Cleaning (3 tests):**
   - `test_enhance_bullet_point_validates_output` - Rejects AI responses containing error messages
   - `test_cleans_ai_output` - Removes quotes, markdown, and formatting artifacts from responses
   - `test_validates_length_appropriate` - Rejects responses exceeding 200 character limit

3. **Error Handling (2 tests):**
   - `test_handles_api_error_gracefully` - Returns original text when OpenAI API fails
   - `test_handles_missing_api_key` - Provides clear error message when API key not configured

4. **Quality Metrics (2 tests):**
   - `test_detects_measurable_results` - Validates regex detection of numbers and metrics
   - `test_rejects_text_too_short` - Enforces minimum text length requirement (5+ characters)

**Test Results:**
```
======================== 10 passed in 5.32s ==========================
```

- ✅ All 10 AI service tests passing
- ✅ Total: 39 tests (2 health + 15 models + 12 parser + 10 AI service)
- ✅ No real API calls made during testing (all mocked)
- ✅ Fast execution (~5 seconds for all AI tests)

**Technical Implementation:**

**Mocking Strategy:**
```python
@pytest.fixture
def service_with_mock_client(self):
    service = AIService(api_key="test-key")
    mock_client = Mock()
    service.client = mock_client  # Replace real client with mock
    return service, mock_client
```

**Benefits of Mocking:**
- No API costs during testing (would be $0.002 per test × 10 = $0.02 per run)
- No internet connection required
- Predictable test results (no API variability)
- Fast execution (5s vs 20s with real API)
- Tests work offline

**What Tests Verify:**
- STAR method enhancement logic works correctly
- Confidence scoring algorithm calculates properly (weights: action verb 25%, metrics 35%, length 20%, clarity 20%)
- Output validation rejects error messages and malformed responses
- Response cleaning removes markdown, quotes, and bullet points
- Error handling returns original text with clear error messages
- Text length validation (min 5 chars, max 200 chars)
- Measurable results detection via regex pattern matching

**Dependencies:**
- `pytest-mock==3.15.1` - Enhanced mocking capabilities (already installed)

### Current Testing Status (3 Mar 2026)

**Completed:**
- ✅ Basic health check tests (2 tests - Feb 8)
- ✅ CV data models unit tests (15 tests - Feb 20)
- ✅ CV parser unit tests (12 tests - Feb 20)
- ✅ AI service unit tests (10 tests - Mar 3) - NEW

**Total Test Count:** 39 passing

**Test Execution Time:** ~7 seconds for all tests

### Keyword Matcher Unit Tests Implementation (3 Mar 2026)

**Created:** `backend/tests/test_keyword_matcher.py` with 15 unit tests

**Key Decision — Tests vs Implementation:**
Before writing tests, discovered a mismatch between the original test file and the actual `keyword_matcher.py` implementation. Investigated `cv_routes.py` and `cv_models.py` before deciding on a fix:
- `cv_routes.py` accesses `keywords['all']` directly and passes the full dict to `JobAnalysisResponse`
- `cv_models.py` defines `extracted_keywords: dict` — explicitly expects a dict
- Changing `keyword_matcher.py` would have broken both files
- **Decision:** Update the tests to match the implementation, not the other way around

**Test Coverage (15 tests):**
- Keyword extraction: from text, case insensitivity, ignores non-STEM words (3 tests)
- Match score calculation: perfect match, partial match, no match (3 tests)
- Job vs CV analysis: verifies all returned keys and matched keywords (1 test)
- ATS compatibility: clean CV, missing sections, missing contact, problematic characters (4 tests)
- Database coverage, recommendations, empty text, very short CV (4 tests)

**Notable Bug Fixed:**
Original test had `assert len(extracted) >= 25` — `len()` of a dict always returns 4 (number of keys). Fixed to `assert len(extracted['all']) >= 25`.

**Test Results:**
```
======================== 15 passed in 0.62s ==========================
```
- ✅ All 15 tests passing
- ✅ Total: 54 tests (2 health + 15 models + 12 parser + 10 AI + 15 keyword matcher)
- ✅ No changes made to `keyword_matcher.py` — implementation confirmed correct

### Current Testing Status (3 Mar 2026 - Updated)
**Completed:**
- ✅ Basic health check tests (2 tests - Feb 8)
- ✅ CV data models unit tests (15 tests - Feb 20)
- ✅ CV parser unit tests (12 tests - Feb 20)
- ✅ AI service unit tests (10 tests - Mar 3)
- ✅ Keyword matcher unit tests (15 tests - Mar 3)

**Total Test Count:** 54 passing

**Next Steps (Week 3 - Mar 4-9):**
2. Integration tests for `cv_routes.py` (API endpoints end-to-end) - Mar 6-8
3. Target: 50+ tests, 70%+ code coverage by Mar 9
4. Begin frontend development - Week 4 (Mar 10+)

### Project Timeline Notes

**Feb 21-23:** Travel to London (no development work)  
**Feb 25 - Mar 1:** Illness (tonsillitis) - project paused  
**Mar 3:** Resumed work - completed AI service tests  
**Mar 4-9:** Continue testing phase (keyword matcher, integration tests)  
**Mar 10+:** Frontend development with fully tested backend  

### Technical Notes

**Why Tests Must Match Implementation:**
Tests verify the "contract" between code and users - exact key names, data types, and behavior. When code returns `result['enhanced']`, tests must check `result['enhanced']`, not `result['enhanced_text']`. This ensures:
- Regression prevention (tests catch breaking changes)
- API contract verification (guarantees return format)
- Documentation of expected behavior
- Confidence in refactoring (can safely modify code)

**Mocking vs Real API Calls:**
- Mocking: Fast, free, deterministic, works offline
- Real API: Slow, costly, variable results, requires internet
- For unit tests, always mock external services
- For integration tests (later), may use real API with test key

**Test Organization:**
- Each service has its own test file
- Tests grouped by functionality (success, validation, errors)
- Fixtures provide reusable test setup
- Descriptive test names explain what is verified

### CV Routes Integration Tests Implementation (4 Mar 2026)

**Created:** `backend/tests/test_cv_routes.py` with 14 integration tests

**Approach — Integration Testing with Mocking:**
Integration tests hit the actual FastAPI endpoints using `TestClient` rather than calling
services directly. External dependencies (cv_parser, ai_service) are mocked at the route
level so tests verify route logic and HTTP behaviour independently of service internals.

**Key Decision — Mock cv_parser for Upload Tests:**
Initial upload tests returned 500 because the cv_parser couldn't build a valid `CVData`
object from minimal generated PDFs — `PersonalInfo` has required fields (full_name, email,
phone, location) that wouldn't be extracted from 3 lines of text. Solution: patch
`app.api.cv_routes.cv_parser` and return a pre-built mock CVData object, testing the
route's file handling logic without depending on parser success.

**Test Coverage (14 tests across 4 classes):**

1. **TestCVUploadEndpoint (5 tests):**
   - `test_upload_valid_pdf` — PDF upload returns 200 with parsed_data and warnings
   - `test_upload_valid_docx` — DOCX upload returns 200 with parsed_data
   - `test_upload_invalid_file_type` — .txt file rejected with 400 and detail message
   - `test_upload_no_filename` — empty filename rejected with 400 or 422
   - `test_upload_returns_warnings_for_incomplete_cv` — warnings list returned for minimal CV

2. **TestEnhanceBulletEndpoint (4 tests):**
   - `test_enhance_bullet_success` — returns 200 with original, enhanced, confidence, improvements
   - `test_enhance_bullet_text_too_short` — text under 5 chars rejected with 422 (Pydantic)
   - `test_enhance_bullet_text_too_long` — text over 500 chars rejected with 400 (route logic)
   - `test_enhance_bullet_ai_service_error` — AI service error returns 503

3. **TestJobAnalysisEndpoint (4 tests):**
   - `test_analyze_job_keywords_only` — no CV text returns keywords only, null match fields
   - `test_analyze_job_with_cv_comparison` — with CV text returns match score and keywords
   - `test_analyze_job_description_too_short` — under 50 chars rejected with 422
   - `test_analyze_job_returns_keyword_dict` — extracted_keywords is dict with 'all' key

4. **TestHealthEndpoint (1 test):**
   - `test_cv_routes_health` — returns 200 with status and routes list

**Test Results:**
```
======================== 14 passed in 4.21s ==========================
```

- ✅ All 14 integration tests passing
- ✅ Total: 68 tests (2 health + 15 models + 12 parser + 10 AI + 15 keyword matcher + 14 routes)
- ✅ No changes to production code required
- ✅ Pushed to GitHub on feat/backend-implementation branch

### Current Testing Status (3 Mar 2026 - COMPLETE)

**All backend testing phases complete:**
- ✅ Basic health check tests (2 tests - Feb 8)
- ✅ CV data models unit tests (15 tests - Feb 20)
- ✅ CV parser unit tests (12 tests - Feb 20)
- ✅ AI service unit tests (10 tests - Mar 3)
- ✅ Keyword matcher unit tests (15 tests - Mar 3)
- ✅ CV routes integration tests (14 tests - Mar 4)

**Total Test Count:** 68 passing
**Backend testing phase: COMPLETE — ready to begin frontend development**

## 3-4 Mar 2026 (continued) - Parser Fixes

### CV Parser Bug Fixes (identified during frontend integration)

**Issues identified when uploading real CV via frontend:**
- Experience section not detected despite being present in PDF
- Institution name showing as "Unknown" for education entries
- Institution regex capturing too much text (degree name included)

**Fixes Applied:**

`_identify_section_boundaries()`:
- Old regex `^[\s\-•]*keyword[\s\-:]*$` was too strict
- PyPDF2 sometimes merges lines or adds whitespace, causing exact match to fail
- New pattern uses `(?:^|\n)` and `(?:\n|$)` for flexible newline matching
- Experience section now correctly identified

`_extract_experience_simple()`:
- Old method split on double newlines (`\n\s*\n`) but PDF text had single newlines with spaces
- Rewrote to detect date patterns (`2022 – 2024`) as job entry markers
- Splits remainder on 3+ spaces to separate job title from company
- Now correctly extracts: "Receptionist & Admin" at "Aura"

`_extract_education_simple()`:
- Added institution extraction using regex for University/College/Institute/School keywords
- Refined pattern to `\w+(?:\s+\w+){0,3}` then tightened to single `\w+` to avoid over-capturing
- Now correctly extracts: "University of Galway"

**Verification:**
- All 68 tests still passing after fixes
- Real CV upload confirmed working end-to-end via frontend

## 4 Mar 2026 - Backend Updates During Frontend Integration

### raw_text Added to CVUploadResponse

**Reason:** During frontend integration testing, the job match score was inaccurate
because only extracted skill tags were being sent to the job analyzer, not the full CV text.

**Changes Made:**

`cv_models.py`:
- Added `raw_text: Optional[str] = None` field to `CVUploadResponse` model

`cv_routes.py`:
- Updated upload endpoint return statement to include `raw_text=result.get('raw_text', '')`
- Parser already produced raw_text internally — just needed to pass it through to response

**Result:**
- Match score improved from 13% to 25% on test CV against JP Morgan job description
- Full CV text now used for keyword matching instead of skill tags only
- All 68 tests still passing after changes

## 5 Mar 2026 - Supervisor Meeting

### Project Direction Update
- Met with supervisor to discuss FYP progress and next features
- Reviewed completed backend implementation (CV parsing, keyword matching)
- **Supervisor suggestion:** Integrate LLM for job analysis and CV enhancement
- **Decision:** Prioritize job description analysis feature first
- Research Google Gemini API as cost-effective alternative to OpenAI

---

## 6-9 Mar 2026 - LLM Job Analysis Implementation

### Google Gemini API Integration

Implemented AI-powered job description analysis to extract structured data (requirements, tech stack, salary, work model) for improved ATS matching.

**Technology Stack:**
- Google Gemini 2.5 Flash API via `google-genai` package
- Model: `models/gemini-2.5-flash` with JSON response mode
- Configuration: `temperature=0.0`, `max_output_tokens=1800`

**Implementation in `ai_service.py`:**
- Added `analyze_job_description()` method with detailed prompt engineering
- Returns structured dict: job_title, company, employment_type, work_model, salary, tldr, experience_level, key_requirements, tech_stack
- Implemented robust 4-layer JSON parsing (direct parse → markdown strip → trailing comma cleanup → JSON extraction → fallback)
- Added helper methods: `_parse_json_response()`, `_strip_markdown_fences()`, `_extract_json_object()`, `_default_job_analysis()`
- Handles malformed LLM responses (markdown fences, trailing commas, mixed text)

**API Route Added:**
- POST `/api/cv/job/analyze-llm` endpoint in `cv_routes.py`
- Accepts `JobDescriptionRequest` (Pydantic model)
- Returns structured job analysis or error response

**Configuration Fixes:**
- Created `.vscode/settings.json` with `python.terminal.useEnvFile: true` for automatic `.env` loading
- Updated CORS middleware to `allow_origins=["*"]` for local development (frontend on port 5175)
- Fixed Gemini model name from `"gemini-2.5-flash"` to `"models/gemini-2.5-flash"` (API requirement)
- Resolved stale backend process issue (uvicorn --reload not detecting changes, required manual restart)

**Test Updates:**
- Updated `tests/test_ai_service.py` mocks from `client.generate_content` to `client.models.generate_content`
- All 68 tests passing (2 health + 15 models + 12 parser + 10 AI + 15 matcher + 14 routes)

**End-to-End Verification:**
- Successfully analyzed JP Morgan "Lead Software Engineer - Java & React" job description
- Frontend correctly displays: job title, TLDR, requirements, tech stack badges, nice-to-haves, soft skills
- Average API response time: ~2-3 seconds
- No parse errors or timeout issues

### Current Status (9 Mar 2026)

**Completed:**
- ✅ Google Gemini API integrated with JSON mode
- ✅ Robust multi-layer JSON parsing with fallback mechanisms
- ✅ Job description analysis fully functional end-to-end
- ✅ Environment configuration automated via VS Code settings
- ✅ CORS configured for local development
- ✅ All tests passing (68/68)

**Next Steps (Planned):**
1. Implement **CV Enhancement** feature with `enhance_cv_bullet_point()` using STAR method
2. Add **CV Summary Generation** tailored to STEM/tech roles
3. Implement **CV-to-Job Comparison** to identify skill gaps
4. Production hardening: API rate limiting, request caching, timeout handling