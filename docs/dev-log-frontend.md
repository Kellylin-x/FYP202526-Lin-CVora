# Dev Log

## Mar 3-4 — Frontend starts

Backend had 68 tests passing so started on the frontend properly. Stack is React 19, TypeScript, Tailwind, Vite, React Router v6. Had a landing page, header and footer already from back in Feb.

Set up routing first — wrapped the app in BrowserRouter, split out a LandingPage component, got `/` and `/upload` routes working. Upload CV button and logo clicks navigate properly now.

Built the Upload CV page (`UploadCV.tsx`). Accepts PDF and DOCX, max 10MB, validates on the client side before even hitting the backend. Has a drag and drop zone which was fun to do. Connects to `POST /api/cv/upload`. Shows parsed results — personal info, skills, experience, education — in cards.

CI broke after adding routing because the existing `App.test.tsx` was rendering `<App />` without a Router parent. Fixed by wrapping in `<MemoryRouter>`. CI passing again after that.

---

## Mar 4 (continued) — Job Analysis page + Upload CV improvements

Added a Job Analysis page. Two flows — paste just a job description and get keywords back, or paste a job description *and* your CV text and get a match score with missing keywords and recommendations. Match score is colour coded (green/amber/red).

Also added an optional job description field to the Upload CV page. So you can upload your CV and paste a job description in the same flow and see both at once. Tested it with my own CV against a JP Morgan job spec — got 25% which is accurate, my CV is missing Spring, AWS, CI/CD etc.

Built the CV Builder page too. Multi-section form on the left, live preview + AI chat on the right. Has an AI enhance button on each bullet point that calls `/api/cv/enhance-bullet`. Got the basic layout working.

---

## Mar 6-9 — Job Analysis LLM redesign

Swapped the Job Analysis page from keyword matching to the Gemini LLM endpoint (`/api/cv/job/analyze-llm`). Completely redesigned the results display — now shows a purple header card with job title and company, a TL;DR section, must-have requirements, tech stack badges, nice to haves, soft skills.

Tested with the same JP Morgan job description. Got back job title, TLDR, tech stack (Java, ReactJS, Spring, AWS), soft skills etc. Looks a lot better than the keyword version.

---

## Mar 9-12 — CV Builder wizard rebuild

The original CV Builder was one long form which wasn't great. Rebuilt it as a multi-step wizard based on supervisor feedback. Each step is its own component, all writing to a shared `CVFormData` state so the preview and chat always have the full picture.

Steps: Personal Info → Target Role → Experience → Education → Skills & Projects → Summary.

Experience and Education cards are collapsible — start open, collapse once filled. Skills use a tag chip input. Summary is last on purpose so you have context to write it by then.

Added an AI chat panel (`ChatPanel`). Sends full CV data with each request so answers are specific to what you've actually written. Suggested prompt chips shown before first message. Enter to send. Auto-scrolls to latest message.

Also added a CV Preview panel that renders your actual CV in real time using Georgia font. Both panels toggle — only one open at a time while in the wizard, both open side by side after you finish.

When you click Finish the wizard is replaced with a full two-column layout: preview on the left, chat on the right.

Test suite updated — rewrote all the AI service mocks from OpenAI pattern to Gemini pattern. Added 5 new chat tests. Up to 73 passing.

Had to change the API base URL to port 8010 temporarily during integration because stale uvicorn processes were serving old code from 8000.

---

## Mar 12 — Tips page + colour update

Added a Tips & Guidance page with four tabbed sections: CV Writing, ATS Advice, STAR Method, Interview Tips. Each section has collapsible tip cards. Had a bug where cards in a 2-column grid appeared to open the wrong one — fixed it by switching to single column and adding the active section to card keys so they remount on tab switch.

Added it to the landing page grid as a fourth feature card.

Changed the brand colour from Tailwind's purple-500/violet-600 gradient to Rebecca Purple (`#663399`) across the app. Updated FeatureCard, JobAnalysis, CVBuilder, TipsPage. Used Tailwind arbitrary values (`bg-[#663399]`) mostly.

---

## Mar 17-19 — Liverpool trip

Away for the match. No dev work these days.

---

## Mar 23-25 — Upload CV LLM upgrade

Upgraded the Upload CV page job analysis from keyword-based to LLM-powered, same as the Job Analysis page. Now calls both `/api/cv/job/analyze-llm` and `/api/cv/compare` in parallel using `Promise.allSettled`. Added a 30 second timeout so the frontend doesn't hang if the backend stalls.

New results layout when a job description is provided: match score header card, strengths, gaps, recommendations, then the job breakdown, then the parsed CV sections.

Tested with my CV against an Arista Networks graduate role. Got 65% (Partial Match) which seems right. Fixed the API base URL back to port 8000 in UploadCV, JobAnalysis and CVBuilder — had forgotten it was still on 8010.