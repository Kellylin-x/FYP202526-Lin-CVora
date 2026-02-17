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

### Phase 1: Data Models ⏳ In Progress

**Task:** Expand `cv_models.py` with complete CV data structures

**Requirements:**
- ✅ PersonalInfo model (full_name, email, phone, location, linkedin, github, website)
- ✅ Experience model (id, job_title, company, location, dates, responsibilities, achievements, technologies)
- ✅ Education model (id, degree, institution, location, graduation_date, grade, modules)
- ✅ Project model (id, title, description, technologies, link, achievements, dates)
- ✅ Skills model (technical[], soft[])
- ✅ CVData model (combines all above with professional_summary, certifications)
- ✅ Request/Response models for API (CVUploadResponse, EnhanceRequest, etc.)

**Files to Update:**
- `backend/app/models/cv_models.py` ⏳

**Status:** Ready to implement

---

### Phase 2: CV Parser 📋 Planned

**Task:** Implement PDF and DOCX parsing

**Requirements:**
- Parse PDF files using PyPDF2
- Parse DOCX files using python-docx
- Extract personal info (name, email, phone) using regex
- Identify CV sections (Experience, Education, Skills, Projects)
- Extract structured data into CVData model
- Handle malformed/inconsistent CV formats gracefully
- Return warnings for unparseable sections

**Implementation Details:**
```python
class CVParser:
    - parse_pdf(file_path: str) -> dict
    - parse_docx(file_path: str) -> dict
    - _extract_personal_info(text: str) -> PersonalInfo
    - _identify_sections(text: str) -> dict
    - _extract_experience(text: str) -> List[Experience]
    - _extract_education(text: str) -> List[Education]
    - _extract_skills(text: str) -> Skills
```

**Files to Update:**
- `backend/app/services/cv_parser.py`

**Status:** Pending Phase 1 completion

---

### Phase 3: AI Service 🤖 Planned

**Task:** Integrate OpenAI API for CV enhancement

**Requirements:**
- OpenAI API client setup with error handling
- Environment variable for API key (OPENAI_API_KEY)
- Bullet point enhancement using STAR method
- Context-aware prompts (job title, company, UK/Ireland standards)
- Temperature and token limit configuration
- Rate limiting and retry logic
- Confidence scoring for suggestions
- Ensure no fabrication of information

**Implementation Details:**
```python
class AIService:
    - __init__(api_key: str)
    - enhance_bullet_point(text: str, context: dict) -> dict
    - _build_enhancement_prompt(text: str, context: dict) -> str
    - _analyze_improvements(original: str, enhanced: str) -> dict
    - _validate_response(text: str) -> bool
```

**Files to Update:**
- `backend/app/services/ai_service.py`
- `backend/.env` (add OPENAI_API_KEY)

**Dependencies to Add:**
- `openai>=1.3.0`
- `python-dotenv>=1.0.0`

**Status:** Pending Phase 1 & 2 completion

---

### Phase 4: Keyword Matcher & ATS Analyzer 🎯 Planned

**Task:** Build ATS compatibility checker and keyword matching

**Requirements:**
- Database of 50+ STEM keywords (Python, JavaScript, React, Docker, AWS, etc.)
- Extract keywords from job descriptions
- Calculate match score (CV keywords vs job keywords)
- Identify missing keywords
- Check ATS compatibility (avoid tables, special chars, complex formatting)
- Provide actionable recommendations
- Categorize keywords (technical skills, tools, methodologies, qualifications)

**Implementation Details:**
```python
class ATSAnalyzer:
    - __init__(keyword_database: Set[str])
    - extract_keywords(text: str) -> Set[str]
    - calculate_match_score(cv_text: str, job_keywords: Set[str]) -> dict
    - identify_gaps(cv_keywords: Set[str], job_keywords: Set[str]) -> List[str]
    - check_ats_compatibility(cv_text: str) -> dict
    - _generate_recommendations(issues: List[str]) -> List[str]
```

**Files to Update:**
- `backend/app/services/keyword_matcher.py`

**Status:** Pending Phase 1-3 completion

---

### Phase 5: API Routes 🚀 Planned

**Task:** Implement real API endpoints

**Requirements:**
- POST `/api/cv/upload` - Upload CV file, parse, return structured data
- POST `/api/cv/enhance-bullet` - Enhance single bullet point with AI
- POST `/api/cv/enhance` - Enhance entire CV
- POST `/api/job/analyze` - Analyze job description and compare with CV
- GET `/api/cv/export` - Export CV as PDF
- Proper error handling (HTTPException)
- Request validation (Pydantic models)
- File upload size limits (10MB)
- Response models for consistent API

**Implementation Details:**
```python
router = APIRouter(prefix="/api/cv", tags=["cv"])

@router.post("/upload", response_model=CVUploadResponse)
@router.post("/enhance-bullet", response_model=EnhanceResponse)
@router.post("/enhance", response_model=CVData)
@router.post("/job/analyze", response_model=JobAnalysisResponse)
```

**Files to Update:**
- `backend/app/api/cv_routes.py`
- `backend/app/main.py` (register router)

**Status:** Pending Phase 1-4 completion

---

### Phase 6: Testing 🧪 Planned

**Task:** Add comprehensive test coverage

**Requirements:**
- Unit tests for cv_models (validation)
- Unit tests for cv_parser (with sample PDFs)
- Unit tests for ai_service (mock OpenAI API)
- Unit tests for keyword_matcher
- Integration tests for API endpoints
- Test fixtures (sample CVs, job descriptions)
- Achieve >70% code coverage
- All tests must pass in CI

**Files to Create:**
- `backend/tests/test_cv_models.py`
- `backend/tests/test_cv_parser.py`
- `backend/tests/test_ai_service.py`
- `backend/tests/test_keyword_matcher.py`
- `backend/tests/test_cv_routes.py`
- `backend/tests/fixtures/` (sample data)

**Status:** Pending Phase 1-5 completion

---

## Timeline & Milestones

### Week 1 (Feb 17-23, 2026)
- ✅ Backend restructuring
- ⏳ Phase 1: Complete cv_models.py
- ⏳ Phase 2: Implement cv_parser.py
- ⏳ Phase 3: Start ai_service.py (OpenAI integration)

### Week 2 (Feb 24 - Mar 2, 2026)
- Phase 3: Complete ai_service.py
- Phase 4: Implement keyword_matcher.py
- Phase 5: Start API routes

### Week 3 (Mar 3-9, 2026)
- Phase 5: Complete API routes
- Update main.py to register routers
- Phase 6: Start testing

### Week 4 (Mar 10-16, 2026)
- Phase 6: Complete testing
- Frontend components start
- Frontend-backend integration

### Week 5-6 (Mar 17-30, 2026)
- Complete both workflows (upload + build)
- PDF export functionality
- Job analysis UI
- End-to-end testing

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

**Current (Installed):**
- ✅ fastapi
- ✅ uvicorn
- ✅ pydantic
- ✅ pytest
- ✅ httpx
- ✅ python-multipart

**To Add (Phase 2-3):**
- ⏳ openai>=1.3.0
- ⏳ python-docx>=1.1.0
- ⏳ PyPDF2>=3.0.1
- ⏳ python-dotenv>=1.0.0

**Optional (Phase 5-6):**
- reportlab (for PDF export)
- spacy (for advanced NLP)

---

## Notes

- Focus on MVP features only (8-week timeline is tight)
- Prioritize working code over perfect code
- Test incrementally (after each phase)
- Document as you go (don't wait until end)
- Keep scope limited to UK/Ireland STEM CVs
- User approval required for all AI suggestions (ethical AI)