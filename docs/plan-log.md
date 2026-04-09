# Plan Log

---

## 8 Feb 2026 — Tests & CI setup

Plan was to get pytest on the backend and vitest on the frontend, then wire up GitHub Actions so both run on every push.

Backend side: create `backend/tests/` with a basic health check test, add pytest to requirements. Frontend: add vitest, create a minimal `App.test.tsx`. CI workflow to run both test suites and fail if either breaks.

Ran into the React 19 / testing-library peer dependency issue during this — needed `--legacy-peer-deps` both locally and in the workflow file. Also had to add jsdom explicitly to devDependencies after CI failed looking for it.

Both test suites passing locally and in CI by end of day.

---

## 17 Feb 2026 — Backend restructure

The backend was just a `main.py` sitting in the root of `backend/` which wasn't going to scale. Plan was to reorganise into a proper `backend/app/` package with `models/`, `services/`, `api/`, `utils/` subfolders, all with `__init__.py` files, and move `main.py` in too.

Also needed to create the venv properly and sort out the PowerShell execution policy issue on Windows.

After the restructure, test imports broke (`from main import app` needed to become `from app.main import app`). Fixed that, verified server still running, 2/2 tests still passing.

---

## 17 Feb - ongoing — Core backend implementation

Broke this into phases:

**Models** — full Pydantic models for PersonalInfo, Experience, Education, Project, Skills, CVData, plus all the API request/response shapes. Done 18 Feb.

**CV Parser** — PDF via PyPDF2, DOCX via python-docx, regex-based personal info extraction, section boundary detection, experience/education/skills extraction. Tuned for UK/Ireland CV formats. Done 18 Feb.

**AI Service** — OpenAI integration at this point, STAR method prompting, confidence scoring, output validation. Done 18-19 Feb.

**Keyword Matcher** — 100+ STEM keywords across 9 categories, match score calculation, ATS compatibility checker, recommendations. Done 18-19 Feb.

**Routes** — `POST /api/cv/upload`, `POST /api/cv/enhance-bullet`, `POST /api/cv/job/analyze`, `GET /api/cv/health`. Done 18-19 Feb.

All 6 endpoints responding, docs at `/docs`. Had a `.env` encoding issue (UTF-16 instead of UTF-8) that crashed the server on startup — recreated the file.

---

## 20 Feb - 4 Mar 2026 — Testing phase

Supervisor suggested doing tests before frontend. Made sense so I spent the time properly covering the backend first.

- **20 Feb:** 15 unit tests for models, 12 for the parser. Parser tests auto-generate PDF/DOCX files using ReportLab and python-docx. Also rewrote location extraction during this to handle international locations instead of just hardcoded UK/Ireland cities.
- **21-23 Feb:** London trip, no work.
- **25 Feb - 1 Mar:** Tonsillitis, no work.
- **3 Mar:** 10 unit tests for AI service (mocked client so no real API calls), 15 for keyword matcher. Had to update the keyword matcher tests significantly — they were written against an older API shape and completely mismatched the actual implementation. Updated the tests rather than the code since routes and models both depended on the existing dict format.
- **4 Mar:** 14 integration tests for routes using FastAPI's TestClient. Mocked cv_parser at route level since minimal test PDFs would fail Pydantic validation on required PersonalInfo fields.

Total: 68 tests passing. Backend testing done, started frontend the same day.

---

## 6-9 Mar 2026 — LLM job analysis

After the supervisor meeting (5 Mar) the plan was to swap out keyword-based job analysis for Gemini. Decided on `gemini-2.5-flash` via the `google-genai` package.

Plan:
- Add `analyze_job_description()` to the AI service with a structured prompt and multi-layer JSON parsing (LLMs sometimes return markdown fences, trailing commas etc.)
- New route `POST /api/cv/job/analyze-llm`
- Update CORS config and VS Code env loading
- Update AI service tests for new Gemini SDK mock shape

Main issues during this: model name needed `models/` prefix, CORS was blocking because the frontend had drifted to port 5175, stale uvicorn process was serving old code.

All sorted by 9 Mar. Tested end to end with a JP Morgan job description. 68 tests still passing.

---

## 11-12 Mar 2026 — CV Builder wizard

The existing CV Builder was a single long form. Plan was to rebuild it as a multi-step wizard based on supervisor feedback.

Architecture: central `CVFormData` state in the parent `CVBuilder` component, passed down as props to each step. All steps read from and write to the same object so preview and chat always have the full picture.

Steps: Personal Info → Target Role → Experience → Education → Skills & Projects → Summary.

Built in phases:
- Wizard shell with stepper, nav bar, per-step validation (9-10 Mar)
- Experience (collapsible cards, AI bullet enhance), Education (module tag chips), Skills & Projects, Summary (10-11 Mar)
- CV Preview panel rendering formData as a real document in real time (11-12 Mar)
- AI chat panel connected to `POST /api/cv/chat` backend endpoint (11-12 Mar)

Chat history lifted to parent state so it persists when panel is closed. After finishing the wizard, both preview and chat open side by side.

Backend additions: `ChatMessage`, `CVChatRequest`, `CVChatResponse` models, `chat_with_cv_context()` Gemini method, `POST /api/cv/chat` route. 5 new tests added, total 73 passing.

Had a branch mess midway through — `ai_service.py` on the frontend branch was an old OpenAI version. Checked out the correct files from the backend branch and re-applied chat additions manually.

---

## 12 Mar 2026 — Tips page + colour update

Added a Tips & Guidance page with four tabbed sections (CV Writing, ATS Advice, STAR Method, Interview Tips) and collapsible cards. Added it to the landing page as a fourth feature card.

Also updated the brand colour to Rebecca Purple (`#663399`) across the app using Tailwind arbitrary values.

---

## 17-19 Mar — Liverpool trip, no work.

---

## 23-25 Mar 2026 — Upload CV LLM upgrade

Plan was to bring the Upload CV page in line with the Job Analysis page — swap keyword matching for Gemini on both the job analysis and the new CV comparison call.

Both LLM calls run in parallel with `Promise.allSettled` and a 30 second frontend timeout. Backend also wrapped in `asyncio.wait_for`. Keyword-based fallbacks on both endpoints so the app keeps working if Gemini quota runs out.

Fixed a few things during this: `response_mime_type` removed from `compare_cv_to_job()` (same 503 issue as chat), `max_output_tokens` increased to 1500 on compare, `suggested_edit` was missing from the chat route response.

API base URLs also fixed back to port 8000 — had been on 8010 from earlier debugging.

---

## 26 Mar - 1 Apr 2026 — CV parser overhaul

Real CVs were exposing too many edge cases in the parser. Did a complete rewrite.

Main fixes:
- Section boundary detection now uses word-by-word matching instead of substring matching — stops "BSc (Honours)" triggering the achievements keyword
- Experience parser was only ever saving the last job (append was outside the loop). Also added FORMAT B support for CVs where company name is on its own line above the title
- Skills expanded from ~30 CS keywords to 200+ across 6 STEM categories
- Added guard to stop the name being detected as a section header
- `load_dotenv()` moved to top of `ai_service.py` with an explicit path so the key loads regardless of how uvicorn is started

Tested against my own CV and Oisín's — both parsing correctly.

Also confirmed the correct Gemini model string: `gemini-3.1-flash-lite-preview`, no `models/` prefix needed with the newer SDK. Spent a while chasing a 404 that turned out to be a stale uvicorn process running old code with the wrong model name.

---

## Remaining (as of 1 Apr 2026)

- User testing with 5 participants
- Report chapters 3, 4, 5 (Implementation, Testing, Evaluation)
- Screenshots and diagrams for report
- Remove debug print statements before submission
- Final cleanup and commit