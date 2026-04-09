# Dev Log

## 15 Jan 2026

Set up the repo and local environment today. Scaffolded the frontend with Vite (React + TypeScript) and verified the dev server was running. Pretty straightforward start.

---

## 5 Feb 2026

Configured Tailwind CSS and got the basic component structure in place — Header, Hero, FeatureCard, Footer. Set up the FastAPI backend with Python 3.13 and got CORS working between the two servers. Made the logo (1024×256px) and dropped it into the header. Both dev servers running at the same time, pushed everything to GitHub.

---

## 8 Feb 2026

Moved to a new private repo (`FYP202526-Lin-CVora`) and set up proper branching conventions. Added pytest for the backend and vitest for the frontend. Had some dependency pain with React 19 and `@testing-library/react` v15 — needed `--legacy-peer-deps` to get it installed.

Fixed a jsdom issue that was blocking frontend tests. Both test suites passing (2 backend, 2 frontend) after that. Updated the GitHub Actions workflow to include `--legacy-peer-deps` so CI wouldn't fail on install.

---

## 17 Feb 2026

Reorganised the backend into a proper package layout under `backend/app/` — models, services, api, utils folders, all with `__init__.py` files. Moved `main.py` into `backend/app/`.

Had to sort out PowerShell execution policy to activate the virtual environment on Windows (`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`). Got all dependencies installed and the FastAPI server running with health check and docs endpoints working.

Created stub files for everything — `cv_models.py`, `cv_parser.py`, `ai_service.py`, `keyword_matcher.py`, `cv_routes.py`. All placeholders at this point but the structure is there. Fixed the test imports after the restructure (changed `from main import app` to `from app.main import app`). Still 2/2 passing.

---

## 18 Feb 2026

Expanded the Pydantic models properly — PersonalInfo, Experience, Education, Project, Skills, CVData, plus all the API request/response models. Hit a missing `email-validator` dependency for Pydantic's `EmailStr` type, fixed with `pip install pydantic[email]`.

Implemented the CV parser. It handles PDF (PyPDF2) and DOCX (python-docx), extracts personal info via regex, detects sections, pulls out experience, education and skills. Regex patterns tuned for UK/Ireland formats including +353 phone numbers.

Also made location extraction more flexible — originally had hardcoded UK/Ireland cities which would have been a problem for anyone outside those. Rewrote it to handle labelled fields ("Location:", "Based in:") and "City, Country" patterns with auto-capitalisation.

---

## 18-19 Feb 2026

Implemented the AI service using OpenAI (GPT-3.5-turbo at this point). STAR method prompting for bullet enhancement, confidence scoring, output validation to prevent AI fabrication. Also built out the keyword matcher — 100+ STEM keywords across 9 categories, match score calculation, ATS compatibility checker.

Got all the routes in place: `POST /api/cv/upload`, `POST /api/cv/enhance-bullet`, `POST /api/cv/job/analyze`, `GET /api/cv/health`. Had a `.env` encoding issue on startup (UTF-16 instead of UTF-8) — deleted and recreated the file to fix it.

All 6 endpoints responding with 200 OK, docs accessible at `/docs`.

---

## 20 Feb 2026

Supervisor meeting on the 19th — recommendation was to write tests before touching the frontend. Makes sense, easier to debug later if the backend is properly covered first.

Wrote 15 unit tests for the CV models (`test_cv_models.py`) covering valid data, invalid inputs, required fields, optional fields. All passing. Then 12 tests for the parser (`test_cv_parser.py`) — auto-generates PDF/DOCX test files using ReportLab and python-docx, cleans up after. Added `reportlab` as a dev dependency for that.

Total: 29 tests passing.

---

## 3 Mar 2026

Was in London 21-23 Feb, then got tonsillitis 25 Feb - 1 Mar so no progress during that stretch. Backdated the commits to reflect when the code was actually written.

Back to it today. Wrote 10 unit tests for the AI service (`test_ai_service.py`) — mocked the OpenAI client so no real API calls during testing. Covers success cases, output validation, error handling, confidence scoring. Then 15 tests for the keyword matcher, which included fixing a bug where `len()` was being called on a dict (always returns 4) instead of `len(extracted['all'])`.

Key decision on the keyword matcher tests: the original test file didn't match the actual implementation. Rather than change the implementation, I updated the tests to match — changing production code to satisfy tests would have broken `cv_routes.py` which was already using the dict format.

Total: 54 tests passing.

---

## 4 Mar 2026

Wrote 14 integration tests for the routes (`test_cv_routes.py`) using FastAPI's `TestClient`. Mocked the parser and AI service at the route level so tests verify HTTP behaviour independently. Main challenge was that the upload route was returning 500 with minimal test PDFs because `PersonalInfo` has required fields that wouldn't be extracted from 3 lines of text — fixed by patching `cv_parser` and returning a pre-built mock CVData.

Total: 68 tests passing. Backend testing done, ready for frontend.

Also fixed a couple of parser bugs found during frontend integration — experience section not detecting properly (regex was too strict, PyPDF2 merges lines), institution name showing as "Unknown" (regex was capturing too much). All 68 tests still passing after fixes.

Added `raw_text` to `CVUploadResponse` so the job match score uses full CV text instead of just extracted skill tags. Match score jumped from 13% to 25% on my test CV which is more accurate.

---

## 5 Mar 2026

Supervisor meeting. Showed the backend, discussed next steps. Suggestion was to look at integrating an LLM for job analysis rather than just keyword matching. Decided to look at Gemini as a cheaper alternative to OpenAI.

---

## 6-9 Mar 2026

Integrated Google Gemini for job description analysis. New endpoint `POST /api/cv/job/analyze-llm` returns structured data — job title, company, TL;DR, requirements, tech stack, work model, salary if listed. Needed a 4-layer JSON parsing approach because Gemini sometimes returns markdown fences or trailing commas.

Had a few config issues: model name needed to be `models/gemini-2.5-flash` with the prefix, CORS needed to allow all origins for local dev, stale uvicorn process wasn't picking up changes and needed a manual restart. Updated the AI service test mocks from `client.generate_content` to `client.models.generate_content` after the switch.

Tested end to end with a JP Morgan job description — got back correct job title, TLDR, tech stack badges. Response time around 2-3 seconds.

All 68 tests still passing.

---

## 11-12 Mar 2026

Added the chat endpoint for the CV Builder. New Pydantic models: `ChatMessage`, `CVChatRequest`, `CVChatResponse`. The chat method injects the full CV data into the prompt so responses are specific to what you've actually written, not generic advice.

`suggested_edit` field added to `CVChatResponse` so the AI can propose direct edits to specific CV fields. Handles professional summary, experience bullets, skills and project descriptions.

Had a git branch mess — `ai_service.py` on the frontend branch was an old OpenAI version from a merge conflict. Fixed by checking out the correct files from the backend branch and re-applying the chat additions manually. Lesson learned: need to be more careful working across two branches.

Rewrote all AI service test mocks from OpenAI to Gemini pattern, added 5 new tests for the chat endpoint.

Total: 73 tests passing.

Also had a `.env` BOM issue where VS Code was writing UTF-16 BOM — switched dotenv loading to `encoding="utf-8-sig"` to handle it. Moved testing to port 8010 temporarily to avoid stale processes on 8000.

---

## 23-25 Mar 2026

Fixed the compare endpoint — `response_mime_type: "application/json"` was causing 503 errors, same issue as the chat endpoint. Removed it. Increased max output tokens to 1500 and added input truncation (12000 chars CV, 6000 chars job description) to avoid stale responses on large inputs.

Added 30 second timeouts to the LLM endpoints using `asyncio.wait_for()` so the frontend doesn't hang if something stalls. Added keyword-based fallbacks on both `/api/cv/compare` and `/api/cv/job/analyze-llm` so if Gemini quota runs out you still get a result.

Gemini free tier limit is 10 requests/minute, resets at midnight Pacific (8am Irish time). Confirmed working after quota reset.

---

## 26 Mar - 1 Apr 2026

Complete rewrite of the CV parser — found too many edge cases breaking on real CVs.

Main issues:
- Experience loop was never calling `append()` inside the loop, only after — so only the last job was ever saved
- Section detection used exact string matching which failed on ALL CAPS headers
- `lines[1:]` was skipping the first job entry because the section slicer already strips the heading
- Skills only matched ~30 CS keywords, nowhere near enough
- "BSc (Honours)" was matching the `achievements` section keyword and stealing education content

Rewrote section boundary detection to use word-by-word matching instead of substring matching. Fixed the experience parser to handle FORMAT B CVs (company name on a separate line above the title). Expanded skills keywords from ~30 to 200+ across 6 STEM categories. Added guards to stop the name being detected as a section header.

Tested against two real CVs (mine and Oisín's) — both parsing correctly with no warnings after the rewrite.

Updated `CVUploadResponse` to use `Optional[dict]` instead of `Optional[CVData]` so `dynamic_sections` passes through without Pydantic stripping it.

Fixed a recurring fallback issue that turned out to be multiple Copilot-spawned uvicorn processes running simultaneously — one of them was serving an old version of `ai_service.py` with the wrong model string (`gemini-3.1-flash-lite` missing `-preview`). Gemini was returning 404 on every call. Fixed by killing all processes and starting a clean single instance.

Correct model string is `gemini-3.1-flash-lite-preview`, no `models/` prefix needed with the newer SDK.

Also added `load_dotenv()` at the top of `ai_service.py` using an explicit path so the API key loads regardless of where uvicorn is started from — previously it was only loading if `main.py` ran first.