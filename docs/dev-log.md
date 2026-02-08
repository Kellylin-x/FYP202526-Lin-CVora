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
