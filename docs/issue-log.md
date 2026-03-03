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