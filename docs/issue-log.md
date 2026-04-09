# Issue Log

---

## 8 Feb 2026

**Git remote already exists**
Tried to add origin after initial setup and got "error: remote origin already exists" — old remote was still pointing to the previous repo. Removed it with `git remote remove origin` and added the correct one.

**npm ERESOLVE on install**
`@testing-library/react@15` needs React 18 but the project is on React 19. Fixed with `npm install --legacy-peer-deps`. Might revisit when testing-library properly supports React 19.

**Missing jsdom for vitest**
CI failed with "Cannot find dependency jsdom" — `vitest.config.ts` specifies `environment: 'jsdom'` but jsdom wasn't in `package.json`. Added `jsdom@^24.0.0` to devDependencies and reinstalled.

**GitHub Actions failing on npm install**
CI was running plain `npm install` without `--legacy-peer-deps`. Updated the workflow file to match local install command. Fixed.

---

## 17 Feb 2026

**PowerShell execution policy blocking venv activation**
`.venv` didn't exist yet and PowerShell blocked the activation script. Created the venv, used `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` to activate it, then installed from `requirements.txt`.

**Test imports broken after backend restructure**
After moving `main.py` into `backend/app/main.py`, pytest was failing because tests still had `from main import app`. Updated to `from app.main import app`. Fixed.

---

## 18 Feb 2026

**Missing email-validator**
`PersonalInfo` uses Pydantic's `EmailStr` which needs `email-validator`. Got `ModuleNotFoundError` on import. Fixed with `pip install pydantic[email]`.

**Missing PyPDF2 and python-docx**
Both were in `requirements.txt` but not actually installed in the venv. Ran `pip install PyPDF2 python-docx`.

**.env encoding error on startup**
Server crashed with `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff` — the `.env` file had been created with UTF-16 encoding. Deleted it and recreated properly with UTF-8.

---

## 20 Feb 2026

**Location extraction too strict**
Parser was only matching hardcoded UK/Ireland city names which would miss anyone outside those. Rewrote `_extract_personal_info()` to use label-based detection ("Location:", "Based in:") and a flexible "City, Country" pattern with auto-capitalisation. Now handles international locations too.

---

## 3 Mar 2026

**AI service singleton mocking**
Initial tests all failed because the singleton `ai_service` was created at module load time with no API key, so `self.client` was already `None` before any mocking happened. Patching the `OpenAI` class after the fact did nothing. Fixed by creating a fresh `AIService` instance per test via a fixture and directly mocking `service.client`.

**Test string matching too strict**
`test_handles_missing_api_key` was checking for exact substring `'missing API key'` but the actual message was worded differently. Changed to `'api key' in result['error'].lower()`.

**Keyword matcher tests completely mismatched**
13 of 15 tests failed because they were written against an older API shape — `extract_keywords()` returns a categorised dict, not a flat list; `calculate_match_score()` returns a dict, not a float; key names were wrong throughout. Also `len(extracted) >= 25` always returned 4 (number of dict keys) not the keyword count. Checked `cv_routes.py` and `cv_models.py` first — both depend on the dict format — so updated the tests rather than changing the implementation.

**Upload tests returning 500**
Integration tests were passing minimal PDFs to the real parser which couldn't extract required `PersonalInfo` fields from 3 lines of text, so Pydantic validation failed internally. Mocked `cv_parser` at the route level with a pre-built `CVData` object instead — the parser behaviour is already covered in its own test file.

**test_upload_no_filename expected 400, got 422**
FastAPI rejects an empty filename at the validation layer before route logic runs, so it never hits the explicit 400 check. Changed assertion to `assert response.status_code in [400, 422]`.

---

## 4 Mar 2026

**Frontend commits landing on wrong branch**
Several commits went to `feat/backend-implementation` instead of `feat/frontend-development` because I didn't check the active branch first. Merged `feat/backend-implementation` into `feat/frontend-development` and resolved conflicts in `App.tsx` and `UploadCV.tsx`. Note to self: always run `git branch` before committing.

**Match score inaccurate**
Score showed 13% despite CV being relevant — only extracted skill tags were being sent to the analyzer instead of full CV text. Added `raw_text` field to `CVUploadResponse`, passed it through from the parser, updated the frontend to use it. Score went from 13% to 25%.

---

## 6-9 Mar 2026

**GEMINI_API_KEY not loading from .env**
VS Code terminals don't automatically load `.env` files. Was having to manually set the key each session. Fixed by adding `"python.terminal.useEnvFile": true` to `.vscode/settings.json`.

**CORS blocking frontend requests**
Frontend was running on port 5175 (5173 and 5174 were occupied) but CORS whitelist only had those two ports. Changed to `allow_origins=["*"]` for local dev.

**Gemini 404 on API calls**
Model name needed `models/` prefix — `"gemini-2.5-flash"` is invalid, needs to be `"models/gemini-2.5-flash"`. Fixed.

**Stale uvicorn process serving old code**
Frontend was still getting JSON parse errors even after fixing the parsing logic. Searched the codebase for the error string — it wasn't there. Turned out a stale process was still running old code on port 8000 with `--reload` not picking up changes. Force-killed everything on port 8000 and restarted clean.

---

## 11-12 Mar 2026

**ai_service.py reverted to OpenAI version on frontend branch**
The frontend branch had an old OpenAI version of `ai_service.py` from before the Gemini migration — never got updated due to working across two branches without merging. Checked out the correct files from the backend branch and re-applied the chat additions manually.

**Chat responses truncated mid-sentence**
`max_output_tokens` was set to 500 in the chat method — not enough for detailed CV advice. Increased to 1000.

**response_mime_type causing 503 on chat endpoint**
Same issue as before — `response_mime_type: "application/json"` makes Gemini fail when the response doesn't perfectly conform. Removed it and used `_parse_json_response()` instead, consistent with the job analysis method.

**Chat history lost when panel closed**
Messages were stored in local state inside `ChatPanel`. When the component unmounted (panel closed), state was gone. Lifted `chatMessages` up to the parent `CVBuilder` component so it persists.

**Wrong tip card expanding on Tips page**
Two issues: cards in a 2-column grid made it visually ambiguous which one opened, and previously open cards weren't resetting on tab switch. Fixed by switching to single column layout and adding `activeSection` to each card's React key to force remount on tab change.

**Back to wizard button leaving preview open**
After finishing the wizard and clicking "Back to wizard", the preview panel stayed open creating a weird layout. Added `setPreviewOpen(false)` to the back button's onClick.

---

## 23-25 Mar 2026

**compare_cv_to_job() returning 503**
Same `response_mime_type: "application/json"` issue again. Removed it.

**Gemini 429 RESOURCE_EXHAUSTED**
Free tier daily quota ran out from repeated testing. Waited for the reset (midnight Pacific / 8am Irish time). The fallback to keyword matching kept the app functional in the meantime.

**Match summary truncated**
`max_output_tokens` at 1000 wasn't enough for the full compare response. Increased to 1500.

**suggested_edit never returned from chat**
Chat route was returning `CVChatResponse(reply=result["reply"])` without the `suggested_edit` field. Updated to include `result.get("suggested_edit")`.

---

## 26 Mar - 1 Apr 2026

**_extract_experience returning empty list**
`lines[1:]` was skipping the first job entry — the section boundary code already strips the heading, so the first date line was at index 0 not 1. Changed to `lines` with `start=0`.

**BSc (Honours) matching achievements keyword**
"honours" inside "BSc (Honours) in Computer Science" was triggering the achievements section keyword via substring matching. Replaced with word-by-word matching with max 2 extra words allowed.

**GEMINI_API_KEY not loading when Copilot starts uvicorn**
Copilot was starting uvicorn from the project root with `--app-dir backend` so the path resolution in `main.py` pointed to the wrong `.env` location. The `ai_service` singleton was initialising before `load_dotenv` ran. Fixed by adding an explicit `load_dotenv()` call at the top of `ai_service.py` using an absolute path.

**Multiple stale uvicorn processes**
App was consistently hitting fallback mode despite the key being set. Correct terminal showed no request logs — requests were going to a different process running old code. Killed all python processes and restarted a single clean instance.

**Gemini 404 — wrong model name**
Stale process was running old `ai_service.py` with `gemini-3.1-flash-lite` (missing `-preview`). Newer SDK auto-prepends `models/` so the full string was invalid. Confirmed correct string is `gemini-3.1-flash-lite-preview`.

**thinking_config causing 400 on chat**
Had `"thinking_config": {"thinking_level": "none"}` in the chat config — `"none"` is not a valid value. Removed it entirely.