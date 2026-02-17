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

### Backend Tests:  PASSED
- pytest installed and configured
- 2/2 tests passing (test_health_check, test_app_is_running)
- All backend requirements.txt dependencies working

### Frontend Tests:  IN PROGRESS
- vitest installed with --legacy-peer-deps flag (React 19 / @testing-library/react v15 compatibility issue)
- Frontend dependencies installed successfully
- Ready to run npm test -- --run

### Tests Fixed & Verified (8 Feb 2026)
- **Issue #3 Resolved:** Added jsdom to frontend devDependencies
- **Backend Tests:**  2/2 PASSED (test_health_check, test_app_is_running)
- **Frontend Tests:**  2/2 PASSED (should render without crashing, should render the application)
- **All tests passing locally** - ready for GitHub Actions CI re-run

### GitHub Actions CI Fix (8 Feb 2026)
- **Issue #4:** npm install failing in CI without --legacy-peer-deps
- **Action:** Updated .github/workflows/tests.yml to include --legacy-peer-deps flag
- **Next:** CI will re-run automatically with the corrected workflow
- **Expected Result:** Both backend-tests  and frontend-tests  should now PASS

## 17 Feb 2026
- Reorganized the backend into a package layout under `backend/app/`. Added lightweight placeholders for models, services, and API routes, and moved `main.py` into `backend/app/main.py`.
- Created and activated the backend virtual environment at `backend/.venv`, upgraded `pip`, and installed dependencies from `backend/requirements.txt` (installed packages include `fastapi`, `uvicorn`, `pytest`, `httpx`, `pydantic`, and other required packages).
- Verified the FastAPI application runs locally and serves the following endpoints:
	- `GET /` — returns a welcome message
	- `GET /health` — returns service health status
	- Interactive docs available at `/docs`
- CORS configured to allow the frontend at `http://localhost:5173`.
- Added placeholder modules:
	- `backend/app/models/cv_models.py` (simple `CVContact`, `CVData` models)
	- `backend/app/services/cv_parser.py`, `ai_service.py`, `keyword_matcher.py` (stubs/placeholders)
	- `backend/app/api/cv_routes.py` (sample endpoint)


- Ran backend tests with `pytest` in `backend/` after the restructure. Initial test run failed because tests imported `app` from the old module path (`from main import app`).
- **Issue encountered:** tests failed due to import path `from main import app` after moving `main.py` into `backend/app/main.py`.
- **Fix applied:** Updated `backend/tests/test_main.py` to `from app.main import app` and re-ran `pytest`.
- Result: `2 passed` — tests now pass successfully.

Next steps:
- Expand Pydantic models to represent full CV structure.
- Implement real parsing and AI integration in `services/` (replace stubs with production logic).
- Add backend tests for new modules and endpoints.
- Update any imports across the repo that reference the old `backend.main` module path.

## 17 Feb 2026
- Restructured backend into a package layout under `backend/app/` and added lightweight placeholders for models, services, and API routes. Moved `main.py` into `backend/app/main.py` and updated repository branch `feat/branching-ci-setup`.
- Created `models/cv_models.py`, `services/{cv_parser,ai_service,keyword_matcher}.py`, `api/cv_routes.py`, and `utils/__init__.py` as starting points.
- Next: update any imports that referenced `backend.main` and extend the service implementations.

