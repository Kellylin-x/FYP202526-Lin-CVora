# Issue Log

## Format
Each entry includes: Date, Issue Description, Root Cause, Fix Applied, Status, Notes

---

## 8 Feb 2026

### Issue #1: Git remote already exists
- **Date:** 8 Feb 2026
- **Description:** When attempting to add origin remote after initial repo setup, git reported "error: remote origin already exists"
- **Root Cause:** Repository had a pre-existing origin remote from previous local setup pointing to the old repo
- **Fix Applied:** Removed existing origin with `git remote remove origin`, then added new origin pointing to FYP202526-Lin-CVora
- **Status:** ✅ Resolved
- **Notes:** Added before pushing main and feature branch to new remote

### Issue #2: npm ERESOLVE dependency conflict
- **Date:** 8 Feb 2026
- **Description:** npm install failed: @testing-library/react@15 requires React 18 but React 19 is installed
- **Root Cause:** Version mismatch in peer dependencies
- **Fix Applied:** Ran `npm install --legacy-peer-deps`
- **Status:** ✅ Resolved
- **Notes:** Frontend can now run tests with vitest; may upgrade @testing-library/react later for React 19 native support

### Issue #3: Missing jsdom dependency for vitest
- **Date:** 8 Feb 2026
- **Description:** GitHub Actions CI failed on frontend tests with error: 'Cannot find dependency jsdom'
- **Root Cause:** `vitest.config.ts` specifies environment: 'jsdom' but `jsdom` was not added to `package.json` devDependencies
- **Fix Applied:** Added `jsdom@^24.0.0` to `frontend/package.json` devDependencies and ran `npm install --legacy-peer-deps`
- **Status:** ✅ Resolved
- **Local Test Result:** 2/2 frontend tests now passing
- **Notes:** `jsdom` is required by vitest to provide DOM/browser API in test environment

### Issue #4: GitHub Actions npm install ERESOLVE failure
- **Date:** 8 Feb 2026
- **Description:** GitHub Actions CI job 'frontend-tests' failed during npm install with ERESOLVE peer dependency error
- **Root Cause:** `npm install` in CI was running without `--legacy-peer-deps` flag; this flag is needed for React 19 + `@testing-library/react` v15 compatibility
- **Fix Applied:** Updated `.github/workflows/tests.yml` to run `npm install --legacy-peer-deps` in the `frontend-tests` job
- **Status:** ✅ Fixed and pushed - CI will re-run automatically
- **Notes:** Local environment uses `--legacy-peer-deps`; CI must use the same flag to avoid peer dependency resolution failures

---

## 17 Feb 2026

### Issue #5: Restructure backend into package layout
- **Date:** 17 Feb 2026
- **Description:** Reorganise `backend/` into `backend/app/` package with `models`, `services`, `api`, and `utils` subpackages and move `main.py` into the package root.
- **Root Cause:** Initial prototype placed `main.py` at `backend/` root; modular development and imports will be cleaner with package layout.
- **Fix Applied:** Created `backend/app/` package, added `__init__.py` files, placeholder modules, and moved `main.py` into `backend/app/main.py`.
- **Status:** ✅ Implemented locally on branch `feat/branching-ci-setup`
- **Notes:** Placeholder modules created; update imports if any external code depended on `backend.main` module path.

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