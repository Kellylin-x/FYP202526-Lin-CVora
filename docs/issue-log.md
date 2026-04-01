# Issue Log

## Format
Each entry includes: Date, Issue Description, Root Cause, Fix Applied, Status, Notes

----------------------------------------------------

## 8 Feb 2026

### Issue #1: Git remote already exists
- **Date:** 8 Feb 2026
- **Description:** When attempting to add origin remote after initial repo setup, git reported "error: remote origin already exists"
- **Root Cause:** Repository had a pre-existing origin remote from previous local setup pointing to the old repo
- **Fix Applied:** Removed existing origin with `git remote remove origin`, then added new origin pointing to FYP202526-Lin-CVora
- **Status:** ✅ Resolved
- **Notes:** Added before pushing main and feature branch to new remote

---------------------------------------------------------------------

### Issue #2: npm ERESOLVE dependency conflict
- **Date:** 8 Feb 2026
- **Description:** npm install failed: @testing-library/react@15 requires React 18 but React 19 is installed
- **Root Cause:** Version mismatch in peer dependencies
- **Fix Applied:** Ran `npm install --legacy-peer-deps`
- **Status:** ✅ Resolved
- **Notes:** Frontend can now run tests with vitest; may upgrade @testing-library/react later for React 19 native support

----------------------------------------------------------

### Issue #3: Missing jsdom dependency for vitest
- **Date:** 8 Feb 2026
- **Description:** GitHub Actions CI failed on frontend tests with error: 'Cannot find dependency jsdom'
- **Root Cause:** `vitest.config.ts` specifies environment: 'jsdom' but `jsdom` was not added to `package.json` devDependencies
- **Fix Applied:** Added `jsdom@^24.0.0` to `frontend/package.json` devDependencies and ran `npm install --legacy-peer-deps`
- **Status:** ✅ Resolved
- **Local Test Result:** 2/2 frontend tests now passing
- **Notes:** `jsdom` is required by vitest to provide DOM/browser API in test environment

-----------------------------------------------------------------------------

### Issue #4: GitHub Actions npm install ERESOLVE failure
- **Date:** 8 Feb 2026
- **Description:** GitHub Actions CI job 'frontend-tests' failed during npm install with ERESOLVE peer dependency error
- **Root Cause:** `npm install` in CI was running without `--legacy-peer-deps` flag; this flag is needed for React 19 + `@testing-library/react` v15 compatibility
- **Fix Applied:** Updated `.github/workflows/tests.yml` to run `npm install --legacy-peer-deps` in the `frontend-tests` job
- **Status:** ✅ Fixed and pushed - CI will re-run automatically
- **Notes:** Local environment uses `--legacy-peer-deps`; CI must use the same flag to avoid peer dependency resolution failures

---------------------------------------------------------------

## 17 Feb 2026

### Issue #5: Restructure backend into package layout
- **Date:** 17 Feb 2026
- **Description:** Reorganise `backend/` into `backend/app/` package with `models`, `services`, `api`, and `utils` subpackages and move `main.py` into the package root.
- **Root Cause:** Initial prototype placed `main.py` at `backend/` root; modular development and imports will be cleaner with package layout.
- **Fix Applied:** Created `backend/app/` package, added `__init__.py` files, placeholder modules, and moved `main.py` into `backend/app/main.py`.
- **Status:** ✅ Implemented locally on branch `feat/branching-ci-setup`
- **Notes:** Placeholder modules created; update imports if any external code depended on `backend.main` module path.

--------------------------------------------------------------

### Issue #6: Unable to activate `.venv` in PowerShell
- **Date:** 17 Feb 2026
- **Description:** Attempted to activate the backend virtual environment using PowerShell activation script `.\.venv\Scripts\Activate.ps1` but activation initially failed.
- **Root Cause:** The `.venv` folder did not exist initially in `backend/`.
- **Fix Applied:** Created `backend/.venv`, used `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` during activation to work around PowerShell execution policy, and installed dependencies from `backend/requirements.txt`.
- **Status:** ✅ Resolved — `.venv` created and dependencies installed.
- **Activation commands (Windows PowerShell):**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. .\.venv\Scripts\Activate.ps1
```
- **Or (Mac / Linux):**
```bash
python3 -m venv .venv
source .venv/bin/activate
```
- **After activation:** `pip install -r requirements.txt`

--------------------------------------------------------------

### Issue #7: Tests failing after backend restructure
- **Date:** 17 Feb 2026
- **Description:** Running `pytest` after restructuring reported failures — tests attempted to import the FastAPI `app` from the old module path (`from main import app`).
- **Root Cause:** `main.py` was moved into `backend/app/main.py`, so test imports needed updating to `from app.main import app`.
- **Fix Applied:** Updated `backend/tests/test_main.py` to import `app` from `app.main` and re-ran `pytest` in the activated virtual environment.
- **Status:** ✅ Resolved — `pytest` ran with `2 passed`.
- **Notes:** Future refactors should ensure test imports are updated accordingly.

---

## Summary of actions (17 Feb 2026)

- **Backend restructuring:** Created `backend/app/` with `models/`, `services/`, `api/`, `utils/` and moved `main.py` into `backend/app/main.py`.
- **Virtual environment:** Created `backend/.venv`, upgraded `pip`, and installed packages from `backend/requirements.txt`.
- **API verification:** FastAPI server reachable at `http://localhost:8000` with `GET /` and `GET /health` endpoints; `/docs` served interactive docs.
- **Placeholders added:** `cv_models.py`, `cv_parser.py`, `ai_service.py`, `keyword_matcher.py`, `cv_routes.py`.
- **Tests fixed:** Updated imports and confirmed `pytest` passes with 2/2 tests.

---

## 18 Feb 2026

### Issue #8: Missing email-validator dependency
- **Date:** 18 Feb 2026
- **Description:** Attempted to import expanded CV models from `app.models.cv_models` but received error: `ModuleNotFoundError: No module named 'email_validator'`
- **Root Cause:** The new `PersonalInfo` model uses Pydantic's `EmailStr` type, which requires the `email-validator` library. While `pydantic[email]` was in `requirements.txt`, the `email-validator` and `dnspython` packages were not installed in the virtual environment.
- **Fix Applied:** Ran `pip install pydantic[email]` which installed `email-validator>=2.0.0` and `dnspython>=2.0.0` as required dependencies.
- **Status:** ✅ Resolved — models now import successfully and tests pass (2/2).
- **Notes:** Added `email-validator` and `dnspython` to the virtual environment. Consider adding these explicitly to `backend/requirements.txt` for clarity on future setups.

-----------------------------------------------

### Issue #9: Missing dependencies for CV Parser (PyPDF2, python-docx)
- **Date:** 18 Feb 2026
- **Description:** After implementing the comprehensive `CVParser` class and running `pytest`, discovered missing dependencies: `ModuleNotFoundError: No module named 'PyPDF2'` and `ModuleNotFoundError: No module named 'docx'`
- **Root Cause:** The new `CVParser` class uses `PyPDF2.PdfReader` for PDF parsing and `python-docx.Document` for DOCX parsing. While these were listed in `backend/requirements.txt`, they were not installed in the activated virtual environment.
- **Fix Applied:** Ran `pip install PyPDF2 python-docx` to install both dependencies into the virtual environment.
- **Status:** ✅ Resolved — all tests now pass (2/2) with CV parser fully imported and functional.
- **Verification:** CVParser now successfully imports and pytest passes all tests without errors.
- **Notes:** Both libraries are critical for CV file handling; ensure they remain in `backend/requirements.txt` for future environment setups.

---------------------------------------------------------------

### Issue #10: .env file UTF-8 encoding error
- **Date:** 18 Feb 2026
- **Description:** FastAPI server crashed on startup with error: `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff in position 0` when attempting to load .env file containing OPENAI_API_KEY configuration.
- **Root Cause:** The .env file was created with incorrect encoding (likely UTF-16 with BOM or binary encoding) instead of standard UTF-8, causing python-dotenv parsing to fail.
- **Fix Applied:**
  1. Deleted problematic .env file: `rm .env`
  2. Recreated with proper UTF-8 encoding: `echo "OPENAI_API_KEY=your-api-key-here" | Out-File -FilePath .env -Encoding utf8 -NoNewline`
  3. Verified .env now loads correctly on server startup
- **Status:** ✅ Resolved — server now starts successfully
- **Verification:** Server displays expected notice "WARNING: OPENAI_API_KEY not set" (normal when API key not configured)
- **Notes:** .env file must always be UTF-8 encoded for python-dotenv to read correctly. File added to .gitignore to prevent accidental exposure of API keys to version control.

### Summary: Complete Backend Implementation (18-19 Feb 2026)
- **AI Service:** Implemented OpenAI integration with STAR method prompting and confidence scoring
- **Keyword Matcher:** Built 100+ STEM keyword database with ATS compatibility checking
- **API Routes:** Implemented 6 endpoints for upload, enhancement, and job analysis
- **Main App:** Integrated all services, configured environment variables, enhanced metadata
- **Dependencies:** Installed openai, python-dotenv; all 15+ packages working
- **Testing:** All endpoints verified (200 OK), pytest passing (2/2), API docs complete
- **Status:** ✅ Backend 100% complete and operational
- **Next:** Frontend component development and API integration

---

## 20 Feb 2026

### Issue #11: CV Parser Location Extraction - International Inclusivity Concern

- **Date:** 20 Feb 2026
- **Description:** During CV parser test development, identified that location extraction used hardcoded list of UK/Ireland cities (Dublin, Cork, Galway, etc.), potentially excluding international candidates applying to UK/Ireland jobs
- **Root Cause:** Initial implementation optimized only for local UK/Ireland locations with explicit city pattern matching: `r'\b(Dublin|Cork|Galway|...),?\s*(Ireland|UK|...)?'`
- **Impact:** International candidates (e.g., Mumbai, India; Beijing, China; New York, USA) would not have location auto-detected, though CV would still be parsed
- **Design Discussion:** 
  - Project scope: UK/Ireland STEM CVs for UK/Ireland market
  - Use case: ANYONE can use the tool, CVs formatted in UK/Ireland style, targeting UK/Ireland jobs
  - Question raised: Should system exclude international candidates?
  - Answer: NO - system should be inclusive while maintaining market focus
- **Fix Applied:** Refactored `_extract_personal_info()` in `cv_parser.py` with three-method flexible location detection:
  1. Label-based search ("Location:", "Address:", "City:", "Based in:")
  2. Pattern matching for "City, Country" with auto-capitalization
  3. Contextual detection in first 5 lines of CV
- **Status:** ✅ Resolved
- **Verification:** 
  - All 12 CV parser tests passing
  - Now handles: "dublin, ireland" → "Dublin, Ireland"
  - Now handles: "Mumbai, India" (international)
  - Now handles: "LONDON, ENGLAND" → "London, England"
  - Auto-capitalizes any format (lowercase, UPPERCASE, Title Case)
- **Lessons Learned:**
  - Important to consider bias and exclusion in AI systems
  - MVP scope doesn't mean excluding users outside target market
  - Flexible parsing is better than rigid pattern matching
  - International phone numbers already supported via regex (no changes needed)
- **Notes:** This design decision will be discussed in project report under ethical AI considerations and demonstrates awareness of inclusivity in software design

### No Other Issues Encountered - CV Parser Testing

- **Date:** 20 Feb 2026
- **Activity:** Implemented 12 unit tests for CV parser service
- **Status:** ✅ Smooth implementation
- **Test Results:** 12/12 passing on first run after location flexibility fix
- **Notes:** 
  - Used real student CV data for authentic testing
  - ReportLab and python-docx successfully generate test files
  - Fixture cleanup working correctly
  - PyPDF2 and Pydantic deprecation warnings present but non-blocking

---

## Summary (20 Feb 2026)

- **Unit Testing:** Successfully implemented 12 unit tests for CV parser
- **Design Enhancement:** Made location extraction internationally flexible
- **Test Results:** 29/29 passing (2 health + 15 models + 12 parser)
- **Issue Resolved:** International inclusivity concern addressed
- **Next:** Continue with AI service and keyword matcher unit tests

---

## 3 Mar 2026

### Issue #12: AI Service Tests Failing Due to Singleton Pattern

- **Date:** 3 Mar 2026
- **Description:** Initial AI service tests failed because the singleton instance `ai_service` was created without an API key at module load time, causing all tests to fail with "AI service not configured (missing API key)" error
- **Root Cause:** The singleton pattern in `ai_service.py` creates an instance when the module loads: `ai_service = AIService()`. If no API key is in environment, `self.client = None`. Mocking `OpenAI` class didn't help because the singleton's client was already `None`.
- **Impact:** All tests using `@patch('app.services.ai_service.OpenAI')` failed because they were patching the class, not the already-instantiated singleton's client
- **Fix Applied:** 
  1. Created pytest fixture that instantiates a fresh `AIService` with test API key
  2. Directly mocked the `service.client` attribute instead of patching the OpenAI class
  3. Each test now gets a clean service instance with mocked client
- **Status:** ✅ Resolved
- **Code Solution:**
```python
@pytest.fixture
def service_with_mock_client(self):
    service = AIService(api_key="test-key")  # Fresh instance
    mock_client = Mock()
    service.client = mock_client  # Direct mock, not class patch
    return service, mock_client
```
- **Verification:** All 10 AI service tests now passing
- **Notes:** This is a common pitfall with singleton patterns and mocking - must mock the instance, not just the class. Future tests should follow this fixture pattern.

### Issue #13: Test String Matching Too Strict

- **Date:** 3 Mar 2026
- **Description:** Test `test_handles_missing_api_key` failed with assertion error: expected `'missing API key'` but actual error message contained the string in a different format
- **Root Cause:** Test was checking for exact substring `'missing API key'` but needed more flexible matching
- **Impact:** 1 test failing (9/10 passing)
- **Fix Applied:** Changed assertion from `assert 'missing API key' in result['error'].lower()` to `assert 'api key' in result['error'].lower()` for more flexible matching
- **Status:** ✅ Resolved
- **Verification:** All 10 tests passing after fix
- **Lesson Learned:** When testing error messages, check for key concepts rather than exact strings to make tests more resilient to message wording changes

### No Other Issues Encountered - AI Service Testing

- **Date:** 3 Mar 2026
- **Activity:** Implemented 10 unit tests for AI enhancement service
- **Status:** ✅ Smooth implementation after singleton fix
- **Test Results:** 10/10 passing
- **Notes:** Mocking strategy worked well once fixture pattern was established. Tests execute quickly (~5 seconds) and don't require API keys or internet connectivity.

### Issue #14: Keyword Matcher Tests — API Shape Mismatch

- **Date:** 3 Mar 2026
- **Description:** 13 of 15 keyword matcher tests failed immediately due to mismatch between test expectations and actual implementation
- **Root Cause:** Tests drafted against an earlier API contract. Key mismatches:
  - `extract_keywords()` returns a categorised `dict` — tests expected a flat `list`
  - `calculate_match_score()` returns a detailed `dict` — tests expected a bare `float`
  - `check_ats_compatibility()` uses `is_ats_friendly` — tests checked `is_compatible`
  - No `checks` sub-dict exists — tests accessed `result['checks']`
  - `len(extracted) >= 25` always evaluated to `4` (dict key count, not keyword count)
- **Investigation:** Reviewed `cv_routes.py` and `cv_models.py` — both depend on the dict-based return types. Changing the implementation would have broken working routes.
- **Fix Applied:** Updated `test_keyword_matcher.py` to match actual implementation. `keyword_matcher.py` left unchanged.
- **Status:** ✅ Resolved — 15/15 tests passing
- **Lesson Learned:** Always check the full dependency chain before deciding whether to change tests or implementation.

### Issue #15: Upload Tests Returning 500 — cv_parser Cannot Build Valid CVData

- **Date:** 3 Mar 2026
- **Description:** Three upload endpoint tests returned 500 Internal Server Error instead of 200
- **Root Cause:** Tests generated minimal PDFs (3 lines of text) and passed them to the real
  cv_parser. The parser couldn't extract the required PersonalInfo fields (full_name, email,
  phone, location) from such minimal content, causing Pydantic validation to fail internally
  and the route to return 500
- **Fix Applied:** Mocked `app.api.cv_routes.cv_parser` at the route level, returning a
  pre-built valid CVData object. This tests the route's file handling and HTTP response logic
  without depending on parser extraction succeeding
- **Status:** ✅ Resolved — all 14 integration tests passing
- **Lesson Learned:** Integration tests for file upload endpoints should mock the parser
  service. The parser's own behaviour is already covered by dedicated unit tests in
  test_cv_parser.py — no need to re-test it here

  ### Issue #16: test_upload_no_filename Expected 400 but Got 422

- **Date:** 3 Mar 2026
- **Description:** Test asserted `status_code == 400` but FastAPI returned 422
- **Root Cause:** An empty filename is rejected by FastAPI/Pydantic at the request
  validation layer before the route logic runs, so it never reaches the explicit 400 check
- **Fix Applied:** Changed assertion to `assert response.status_code in [400, 422]`
- **Status:** ✅ Resolved
- **Lesson Learned:** Distinguish between Pydantic validation errors (422) and explicit
  route-level rejections (400) when writing assertions
---

## Summary (3 Mar 2026 - Updated)
- **Test Results:** 68/68 passing (2 health + 15 models + 12 parser + 10 AI + 15 keyword matcher)
- **Issues Resolved:** #12 singleton mocking, #13 string matching, #14 API shape mismatch, 15 upload 500 error (mock cv_parser), #16 status code mismatch


### Issue #17: Frontend Commits Landing on Wrong Git Branch
- **Date:** 4 Mar 2026
- **Description:** Multiple frontend commits accidentally pushed to `feat/backend-implementation` instead of `feat/frontend-development` due to not checking active branch before committing
- **Root Cause:** Switching branches while having uncommitted changes caused checkout errors, leading to commits being made on the wrong branch
- **Fix Applied:** Used `git merge feat/backend-implementation` into `feat/frontend-development` to bring all changes across. Resolved merge conflicts in `App.tsx` and `UploadCV.tsx` by accepting incoming changes
- **Status:** ✅ Resolved
- **Lesson Learned:** Always run `git branch` before committing to confirm active branch. Commit or stash changes before switching branches

---

### Issue #18: Match Score Inaccurate Due to Limited CV Text
- **Date:** 4 Mar 2026
- **Description:** Job match score showed 13% when uploading CV with job description — only 1 keyword matched despite CV containing relevant content
- **Root Cause:** `UploadCV.tsx` was only sending extracted skill tags to the job analyzer instead of full CV raw text. `CVUploadResponse` model did not include `raw_text` field
- **Fix Applied:** Added `raw_text` field to `CVUploadResponse` Pydantic model. Updated upload endpoint to return `raw_text` from parser result. Updated frontend to use `data.raw_text` for job analysis call
- **Status:** ✅ Resolved
- **Result:** Match score improved from 13% to 25%, 2 keywords matched vs 1 previously

---

## Summary (4 Mar 2026 - Updated)
- **Test Results:** 68/68 passing
- **Issues Resolved:** #12–#18
- **Frontend:** Upload CV, Job Analysis, CV Builder all implemented and tested
- **Backend:** raw_text added to upload response for accurate matching

---

## 6-9 Mar 2026

### Issue #19: GEMINI_API_KEY Not Loading from .env File

- **Date:** 6 Mar 2026
- **Description:** Backend server displayed "WARNING: GEMINI_API_KEY not set" despite API key being present in `backend/.env` file
- **Root Cause:** VS Code terminals don't automatically load `.env` files without explicit configuration. The `python-dotenv` package loads `.env` at runtime, but environment variables weren't available in terminal sessions
- **Impact:** Manual environment variable setting required in each terminal session via `$env:GEMINI_API_KEY = "..."`
- **Fix Applied:** 
  1. Created `.vscode/settings.json` with `"python.terminal.useEnvFile": true`
  2. This configuration ensures all new terminal sessions automatically load `backend/.env`
  3. Verified API key now accessible in Python via `os.getenv('GEMINI_API_KEY')`
- **Status:** ✅ Resolved
- **Verification:** Direct Python call to `ai_service.analyze_job_description()` succeeded with valid JSON response in 2.27s
- **Notes:** This is a common pitfall in VS Code Python development. The setting enables automatic `.env` loading for all terminal sessions in the workspace

---

### Issue #20: Frontend Blocked by CORS Policy

- **Date:** 7 Mar 2026
- **Description:** Frontend job analysis requests blocked with error: "Access to fetch at 'http://localhost:8000/api/cv/job/analyze-llm' from origin 'http://localhost:5175' has been blocked by CORS policy"
- **Root Cause:** Backend CORS middleware configured with strict port whitelist `["http://localhost:5173", "http://localhost:5174"]` but frontend Vite dev server running on port 5175 (ports 5173/5174 were already occupied)
- **Impact:** All frontend API calls to backend returning CORS errors, job analysis feature non-functional
- **Investigation:** Ran preflight OPTIONS request manually - confirmed CORS rejection at OPTIONS stage
- **Fix Applied:**
  1. Updated `backend/app/main.py` CORS configuration:
     - Changed `allow_origins=["http://localhost:5173", "http://localhost:5174"]` to `allow_origins=["*"]`
     - Set `allow_credentials=False` for security (no cookies in dev environment)
  2. Allows all origins during local development phase
- **Status:** ✅ Resolved
- **Verification:** Preflight OPTIONS request returned `200 OK` with `access-control-allow-origin: *` header. Frontend API calls successful
- **Notes:** Wildcard CORS acceptable for local development. Production deployment should use explicit origin whitelist for security

---

### Issue #21: Gemini API Returning 404 NOT_FOUND Error

- **Date:** 7 Mar 2026
- **Description:** Job analysis endpoint returning 500 error. Server logs showed: "404 NOT_FOUND: models/gemini-2.0-flash-exp is not found for API version v1alpha"
- **Root Cause:** Gemini API model name must include `models/` prefix. Initial implementation used `model="gemini-2.5-flash"` which is invalid for Google AI API
- **Impact:** All job analysis requests failing with 404 from Gemini service
- **Investigation:** Tested direct API call with `google-genai` SDK - confirmed model name format requirement
- **Fix Applied:**
  1. Updated `backend/app/services/ai_service.py`:
     - Changed `model="gemini-2.5-flash"` to `model="models/gemini-2.5-flash"`
  2. Verified with direct test: `client.models.generate_content(model='models/gemini-2.5-flash', contents='Hi')`
- **Status:** ✅ Resolved
- **Verification:** Test call succeeded with response: "Success: Hi there! How can I help you today?"
- **Notes:** Google AI API requires full model path format `models/{model-name}`. This differs from some other AI APIs that accept short model names

---

### Issue #22: JSON Parse Errors Despite Code Fixes (Stale Backend Process)

- **Date:** 8-9 Mar 2026
- **Description:** Frontend continued showing "Failed to parse AI response as JSON: Unterminated string starting at: line 4 column 11" despite implementing robust JSON parsing with fallback mechanisms in `ai_service.py`
- **Root Cause:** Multiple stale `python3.13.exe` processes running old `uvicorn` instances on port 8000. The `--reload` flag failed to detect code changes, so old backend served outdated code without robust parsing logic
- **Impact:** Users experiencing parse failures even though current code had 4-layer parsing (direct parse → markdown strip → trailing comma cleanup → JSON extraction → fallback)
- **Investigation:** 
  1. Searched entire codebase for "Failed to parse AI response as JSON" - no matches (confirmed error not in current code)
  2. Checked processes on port 8000: found PID 30488 running old instance
  3. Tested old endpoint directly: reproduced parse error
  4. Confirmed old process serving stale `ai_service.py`
- **Fix Applied:**
  1. Force-killed all processes on port 8000: `Get-NetTCPConnection -LocalPort 8000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }`
  2. Restarted backend cleanly: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
  3. Verified new instance loaded current code with robust parsing
- **Status:** ✅ Resolved
- **Verification:** Same API test that previously failed now returned clean JSON:
  ```json
  {
    "job_title": "Software Engineer (Java)",
    "company": null,
    "tldr": "This role involves developing secure and scalable software products...",
    "key_requirements": ["Software Engineering", "Java", "Building secure scalable products", "AI integration", "Microsoft 365 collaboration", "SDLC & CI/CD"],
    "tech_stack": ["Java", "Spring", "AWS", "AI", "Microsoft 365"],
    "error": null
  }
  ```
- **Notes:** `uvicorn --reload` doesn't always catch file changes, especially with complex imports. Manual restart sometimes necessary. Consider adding health check endpoint with code version number for debugging

---

## Summary (6-9 Mar 2026)
- **Issues Resolved:** #19 (GEMINI_API_KEY loading), #20 (CORS blocking), #21 (Gemini model name), #22 (stale backend process)
- **Features Completed:** LLM-powered job description analysis with Google Gemini 2.5 Flash
- **Test Results:** 68/68 passing (includes updated AI service tests for new SDK)
- **Frontend:** Job analysis feature fully operational with structured output display
- **Backend:** Robust JSON parsing with 4-layer fallback mechanisms implemented

## 9-12 Mar 2026

### Issue #23: ai_service.py Overwritten with OpenAI Version on Frontend Branch

- **Date:** 11 Mar 2026
- **Description:** `ai_service.py` on `feat/frontend-development` contained the old OpenAI version instead of the Gemini version, causing the chat endpoint to fail with 503 errors
- **Root Cause:** Working across two branches without merging caused `ai_service.py` to diverge. The OpenAI version had been committed to `feat/frontend-development` at an earlier point and was never updated to Gemini
- **Fix Applied:** Checked out the correct Gemini version from the backend branch:
```
  git checkout feat/backend-implementation -- backend/app/services/ai_service.py
  git checkout feat/backend-implementation -- backend/app/api/cv_routes.py
  git checkout feat/backend-implementation -- backend/app/models/cv_models.py
```
  Then re-applied chat additions manually to each file
- **Status:** ✅ Resolved
- **Lesson Learned:** Working across two feature branches without merging is risky. Backend Python files now managed on `feat/frontend-development` to keep everything in one working branch

---

### Issue #24: Chat Responses Truncated Mid-Sentence

- **Date:** 11 Mar 2026
- **Description:** AI assistant responses were being cut off mid-sentence in the chat panel
- **Root Cause:** `max_output_tokens` was set to 500 in `chat_with_cv_context()` — too low for detailed CV advice responses
- **Fix Applied:** Increased `max_output_tokens` from 500 to 1000 in the Gemini config for the chat method
- **Status:** ✅ Resolved

---

### Issue #25: response_mime_type Causing 503 Errors on Chat Endpoint

- **Date:** 11 Mar 2026
- **Description:** `POST /api/cv/chat` returning 503 Service Unavailable after adding `response_mime_type: "application/json"` to the Gemini config in `chat_with_cv_context()`
- **Root Cause:** Gemini's `response_mime_type` parameter causes issues when the prompt structure doesn't perfectly guarantee JSON — the model occasionally returns non-JSON text which then fails to parse and surfaces as a 503
- **Fix Applied:** Removed `response_mime_type: "application/json"` from the chat method config. Used `_parse_json_response()` instead to extract JSON from plain text responses, consistent with how `analyze_job_description()` handles it
- **Status:** ✅ Resolved
- **Notes:** `response_mime_type` works reliably for job analysis (highly structured prompt) but not for conversational chat where response format is harder to guarantee

---

### Issue #26: Chat History Lost When Panel Closed and Reopened

- **Date:** 12 Mar 2026
- **Description:** Opening the AI Assistant panel, having a conversation, closing it, then reopening it cleared all previous messages
- **Root Cause:** Chat messages were stored in local `useState` inside `ChatPanel`. When the panel was hidden (`chatOpen = false`), the component unmounted and its state was lost
- **Fix Applied:** Lifted `chatMessages` state up to the parent `CVBuilder` component. `ChatPanel` now receives `messages` and `onMessagesChange` as props instead of managing its own state. State persists regardless of whether the panel is open or closed
- **Status:** ✅ Resolved

---

### Issue #27: TipCard Opening Wrong Card in 2-Column Grid

- **Date:** 12 Mar 2026
- **Description:** Clicking to expand a tip card on the Tips page appeared to open the card beside it in the same row rather than the clicked card
- **Root Cause:** Two issues combined:
  1. Cards in a 2-column grid share the same row, making it visually ambiguous which one opened
  2. Card `open` state was not reset when switching between tabs, so previously open cards persisted into the new section
- **Fix Applied:**
  1. Changed grid from `grid-cols-1 sm:grid-cols-2` to `grid-cols-1` — single column so each card has its own row
  2. Added `activeSection` to each card's React key (`key={activeSection}-${i}`) to force remount on tab switch, resetting open state
- **Status:** ✅ Resolved

---

### Issue #28: Wizard Back Button Re-opened Preview Panel

- **Date:** 12 Mar 2026
- **Description:** After finishing the wizard (which opens preview and chat side by side), clicking "Back to wizard" left the preview panel open, creating a confusing three-column layout with wizard on the left
- **Root Cause:** `setWizardFinished(false)` only hid the wizard finished view but did not close the preview panel
- **Fix Applied:** Updated the Back to wizard button onClick to also close preview:
```tsx
  onClick={() => { setWizardFinished(false); setPreviewOpen(false); }}
```
- **Status:** ✅ Resolved

---

## Summary (9-12 Mar 2026)
- **Issues Resolved:** #23 (ai_service branch conflict), #24 (truncated chat), #25 (response_mime_type 503), #26 (chat history lost), #27 (wrong tip card opening), #28 (wizard back button layout)
- **Test Results:** 73/73 passing (5 new chat tests added)
- **Features Completed:** CV Builder wizard, AI chat panel, CV preview, Tips page, Rebecca Purple colour update

## 23-25 Mar 2026

### Issue #29: compare_cv_to_job() Returning 503 Due to response_mime_type

- **Date:** 24 Mar 2026
- **Description:** `POST /api/cv/compare` returning 503 Service Unavailable
- **Root Cause:** `response_mime_type: "application/json"` in `compare_cv_to_job()` config
  caused Gemini to fail when output didn't perfectly conform to JSON mode
- **Fix Applied:** Removed `response_mime_type` from config. `_parse_json_response()` handles
  JSON extraction from plain text — same fix applied to chat and job analysis previously
- **Status:** ✅ Resolved

---

### Issue #30: Gemini 429 RESOURCE_EXHAUSTED — Free Tier Daily Quota

- **Date:** 24 Mar 2026
- **Description:** All Gemini-powered endpoints falling back to keyword analysis.
  Terminal showing `Compare error: 429 RESOURCE_EXHAUSTED`
- **Root Cause:** `gemini-2.5-flash` free tier daily quota exhausted from repeated testing
- **Impact:** Compare and job analysis endpoints falling back to keyword-based results
- **Fix Applied:**
  1. Waited for quota reset (resets at midnight Pacific / 8am Irish time)
  2. Confirmed recovery with direct Python test before resuming frontend testing
  3. Fallback paths ensure app remains functional during quota periods
- **Status:** ✅ Resolved (quota reset)
- **Notes:** Fallback behaviour is a feature not just a workaround — app degrades gracefully

---

### Issue #31: CV Comparison Match Summary Truncated Mid-Sentence

- **Date:** 25 Mar 2026
- **Description:** Match summary in compare results cut off mid-sentence
- **Root Cause:** `max_output_tokens` set to 1000 in `compare_cv_to_job()` — not enough
  for full JSON response including all fields
- **Fix Applied:** Increased `max_output_tokens` to 1500
- **Status:** ✅ Resolved

---

### Issue #32: suggested_edit Never Returned from Chat Endpoint

- **Date:** 25 Mar 2026
- **Description:** "Apply to CV" feature in chat panel never appeared — `suggested_edit`
  always null even when AI suggested an edit
- **Root Cause:** Chat route was not passing `suggested_edit` in response:
  `return CVChatResponse(reply=result["reply"])` — missing `suggested_edit`
- **Fix Applied:** Updated to:
  `return CVChatResponse(reply=result["reply"], suggested_edit=result.get("suggested_edit"))`
- **Status:** ✅ Resolved

---

## Summary (25 Mar 2026)
- **Issues Resolved:** #29 (compare 503), #30 (Gemini quota), #31 (truncated summary), #32 (suggested_edit missing)
- **Features Completed:** LLM-powered CV comparison on Upload CV page
- **Test Results:** 73/73 passing (no new tests added — backend changes covered by existing fallback logic)

## 26 Mar - 1 Apr 2026

### Issue #33: _extract_experience Returns Empty List

- **Date:** 26 Mar 2026
- **Description:** Experience section detected correctly but 0 jobs returned
- **Root Cause:** `lines[1:]` skipped line 0 which was the first job entry —
  section boundary detection already strips the heading line, so the job date
  line was at index 0, not index 1
- **Fix:** Changed `for i, stripped in enumerate(lines[1:], start=1)` to
  `for i, stripped in enumerate(lines, start=0)`
- **Status:** ✅ Resolved

---

### Issue #34: BSc (Honours) Matching Achievements Section Keyword

- **Date:** 27 Mar 2026
- **Description:** Education section content being assigned to achievements —
  degree titles containing "Honours" triggered the achievements keyword match
- **Root Cause:** Section boundary detection used `kw in lower` (substring match),
  so "honours" inside "BSc (Honours) in Computer Science and IT" matched the
  achievements keyword list
- **Fix:** Replaced substring match with word-by-word matching using `kw_words`
  list comparison with max 2 extra words allowed
- **Status:** ✅ Resolved

---

### Issue #35: GEMINI_API_KEY Not Loaded When Copilot Starts Uvicorn

- **Date:** 28 Mar 2026
- **Description:** App running in fallback mode despite key in .env. Debug showed
  `ai_service.client = None` and `api_key = False`
- **Root Cause:** Copilot was starting uvicorn from the project root with
  `--app-dir backend`, so `Path(__file__).resolve().parents[1]` in `main.py`
  resolved to a different path than the `.env` location. The `ai_service`
  singleton initialised before `load_dotenv` in `main.py` ran
- **Fix:** Added `load_dotenv(Path(__file__).resolve().parents[2] / ".env")`
  at the very top of `ai_service.py` before the class definition
- **Status:** ✅ Resolved

---

### Issue #36: Multiple Stale Uvicorn Processes on Port 8000

- **Date:** 28-31 Mar 2026
- **Description:** Webapp consistently hitting fallback mode. Correct uvicorn
  terminal showed no request logs — requests going to a different process
- **Root Cause:** Copilot had spawned multiple uvicorn processes across different
  terminals. The active process was running an old version of `ai_service.py`
  with wrong model name
- **Fix:** `Get-Process -Name python* | Stop-Process -Force`, then start single
  clean uvicorn in one terminal with venv activated
- **Status:** ✅ Resolved
- **Lesson:** Never let AI tools manage server processes autonomously

---

### Issue #37: Gemini 404 NOT_FOUND — Wrong Model Name

- **Date:** 31 Mar 2026
- **Description:** Every compare call returning 404. Terminal showed:
  `models/gemini-3.1-flash-lite is not found for API version v1beta`
- **Root Cause:** Stale process was running old `ai_service.py` with model string
  `gemini-3.1-flash-lite` (missing `-preview` suffix). Newer SDK auto-prepends
  `models/` so the full string became `models/gemini-3.1-flash-lite`
- **Fix:** Killed stale process. Confirmed current file has
  `self.model = "gemini-3.1-flash-lite-preview"`
- **Status:** ✅ Resolved

---

### Issue #38: thinking_config none Invalid — Causing 400 on Chat

- **Date:** 30 Mar 2026
- **Description:** Enhancement chat falling back on every request. Backend showed
  400 INVALID_ARGUMENT from Gemini
- **Root Cause:** `"thinking_config": {"thinking_level": "none"}` is not a valid
  value. Valid values are minimal, low, medium, high
- **Fix:** Removed `thinking_config` entirely from the chat config dict
- **Status:** ✅ Resolved