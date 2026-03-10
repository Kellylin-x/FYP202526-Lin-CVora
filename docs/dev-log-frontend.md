# Frontend Development Log

## 3-4 Mar 2026 - Frontend Development Begins

### Context
Backend fully complete and tested (68 tests passing). Beginning frontend
development with fully tested API to integrate against.

**Tech stack:** React 19, TypeScript, Tailwind CSS, Vite, React Router v6
**Existing:** Landing page, Header, Hero, FeatureCard, Footer components
already built in February alongside initial backend setup.

---

### Routing Setup (4 Mar 2026)

**Updated `frontend/src/main.tsx`:**
- Wrapped app in `BrowserRouter` from react-router-dom
- Required for all React Router hooks (`useNavigate`, `useRoutes`) to work

**Updated `frontend/src/App.tsx`:**
- Added `Routes` and `Route` from react-router-dom
- Extracted landing page content into `LandingPage` component
- Set up two routes: `/` (landing) and `/upload` (Upload CV page)
- "Upload CV" button now navigates to `/upload` via `useNavigate`
- "Start Building" button placeholder (coming soon)

**Updated `frontend/src/components/Header.tsx`:**
- Replaced `<a href="#">` with `<Link to="/">` from react-router-dom
- "Get Started" button now navigates to `/upload`
- Logo click navigates back to home

---

### Upload CV Page (3-4 Mar 2026)

**Created `frontend/src/pages/UploadCV.tsx`**

Full file upload page connecting to `POST /api/cv/upload` backend endpoint.

**UI States:**
- `idle` — drag and drop zone with upload icon and instructions
- `dragging` — cyan border highlight and scale animation on drag over
- `uploading` — spinning loader with "Analysing your CV..." message
- `error` — red zone with error message and try again option
- `success` — results display with all parsed CV sections

**File Validation (client-side):**
- Accepts PDF and DOCX only (validated by MIME type)
- Maximum 10MB file size
- Clear error messages for invalid files

**Results Display:**
- Green success banner with filename
- Amber warnings box for parser suggestions
- Personal Information card (name, email, phone, location, linkedin, github)
- Detected Skills card (technical tags in purple, soft skills in slate)
- Experience Detected card (job title, company with cyan left border)
- Education Detected card (degree, institution with purple left border)
- "Upload a different CV" reset button

**API Integration:**
- `fetch()` to `http://localhost:8000/api/cv/upload`
- FormData for multipart file upload
- Error handling for network failures and backend errors
- TypeScript interfaces for all API response shapes

**Reusable Components:**
- `ResultCard` — internal component for consistent section display
- Accepts icon, title, color (cyan/purple), children

**Design:**
- Consistent with landing page (cyan/purple scheme, rounded-3xl, slate text)
- Back button with animated arrow on hover
- Gradient text heading matching Hero component style

---

### CI Fix (4 Mar 2026)

**Issue:** GitHub Actions frontend-tests failing after routing was added
**Root cause:** `App.test.tsx` rendered `<App />` without Router context,
but App now uses `useRoutes` which requires a Router parent
**Fix:** Wrapped both test renders in `<MemoryRouter>` from react-router-dom
**Result:** CI frontend-tests passing again

---

### Current Status (4 Mar 2026)

**Completed:**
- ✅ React Router setup
- ✅ Upload CV page with full backend integration
- ✅ Real CV upload tested and working (Kelly's CV parsed correctly)
- ✅ CI passing (backend-tests + frontend-tests)

**Next Steps:**
- Job Analysis page (`/job-analysis`)
- CV Builder page (`/build`) with multi-step form
- AI chat panel for both Enhance and Build flows


## 4 Mar 2026 (continued) - Job Analysis Page and Upload CV Enhancements

### Job Analysis Page

**Created `frontend/src/pages/JobAnalysis.tsx`**

Standalone page connecting to `POST /api/cv/job/analyze` backend endpoint.

**Two flows supported:**

Flow 1 — Job description only:
- Extracts STEM keywords from job posting
- Displays extracted keywords as purple tags
- Recommends uploading CV for match score

Flow 2 — Job description + CV text:
- Displays match score (0-100%) with colour coded progress bar
- Green (70%+) Strong Match, Amber (40-69%) Partial Match, Red (<40%) Weak Match
- Matched keywords shown in green tags
- Missing keywords shown in amber tags with advice to add if applicable
- Numbered recommendations list

**UI Features:**
- Collapsible CV text input via toggle button
- Character counter with encouragement to paste full job description
- Colour coded `AnalysisCard` reusable component (green, amber, purple, red variants)
- "Analyse a different job" reset button

**API Integration:**
- `fetch()` to `http://localhost:8000/api/cv/job/analyze`
- JSON body with `job_description` and optional `cv_text`
- Full TypeScript interfaces for `AnalysisResult`

**Routing:**
- Added `/job-analysis` route to `App.tsx`
- Added third feature card "Analyse Job" to landing page grid (now 3 columns)
- Added `/build` placeholder route for CV Builder

---

### Upload CV Page — Job Description Enhancement

**Updated `frontend/src/pages/UploadCV.tsx`**

Added optional job description field to the upload flow.

**New Flow:**
1. User uploads CV file (required)
2. User optionally expands job description textarea
3. On submit — calls `/api/cv/upload` then `/api/cv/job/analyze` in sequence
4. Results show match score, missing keywords, recommendations above parsed CV sections

**Changes:**
- Added `JobAnalysisResult` TypeScript interface
- Added `jobDescription`, `showJobInput`, `jobAnalysis` state
- Added collapsible job description textarea (visible after file selected)
- Added `raw_text` to `UploadResponse` interface
- Uses `data.raw_text` for accurate keyword matching instead of extracted skills only
- `ResultCard` now supports `amber` colour variant
- Match score card, missing keywords and recommendations displayed above CV sections

**Testing:**
- Tested with real CV (Kelly's PDF) against JP Morgan Software Engineer job description
- Match score: 25% (accurate — CV missing Spring, AWS, CI/CD, DevOps, Agile)
- Missing keywords correctly identified
- Both flows (with and without job description) tested and working

---

### CV Builder Page

**Created `frontend/src/pages/CVBuilder.tsx`**

Full CV builder with live preview and AI chat panel.

**Layout:**
- Left side — scrollable form with all CV sections
- Right side — sticky panel with live CV preview + AI chat (visible at all times)

**Form Sections:**
- Personal Information (name, email, phone, location, LinkedIn, GitHub)
- Target Role (job title being applied for — used to tailor AI suggestions)
- Professional Summary (textarea with AI chat guidance)
- Experience — dynamic entries, add/remove positions, add/remove bullet points
- Education — dynamic entries, add/remove qualifications
- Skills — technical and soft skills, dynamic add/remove

**AI Bullet Enhancement:**
- ✨ AI button on each bullet point
- Calls `POST /api/cv/enhance-bullet` with bullet text and job context
- Replaces bullet with enhanced version using STAR method
- Loading spinner while enhancing

**Live CV Preview:**
- Updates in real time as user types
- Shows formatted CV layout with sections
- Placeholder message until content is added

**AI Chat Panel:**
- Always visible in sticky right panel
- Contextual — knows current CV state (name, target role, experience, skills)
- Calls Anthropic API directly with full CV context in system prompt
- Specialised for UK/Ireland STEM CV conventions
- Enter key to send, loading indicator while waiting
- Scrolls to latest message automatically

**Routing:**
- `/build` route updated in `App.tsx` to render `CVBuilder`

---

### Current Status (4 Mar 2026 — End of Day)

**Completed:**
- ✅ React Router setup
- ✅ Upload CV page with job description matching
- ✅ Job Analysis page (both flows tested)
- ✅ CV Builder page with live preview and AI chat
- ✅ All three landing page feature cards navigating correctly
- ✅ CI passing (backend-tests + frontend-tests)
- ✅ Backend raw_text fix for accurate match scoring

**Next Steps:**
- Test CV Builder end to end with real data
- PDF export functionality for built CV
- User evaluation preparation (Week 11)

---

## 6-9 Mar 2026 - LLM Job Analysis Integration

### Job Analysis Page Redesign

**Updated `frontend/src/pages/JobAnalysis.tsx`**

Complete redesign to integrate with new Google Gemini LLM backend endpoint (`POST /api/cv/job/analyze-llm`).

**Major Changes:**

**Backend Integration:**
- Changed API endpoint from `/api/cv/job/analyze` (keyword-based) to `/api/cv/job/analyze-llm` (LLM-powered)
- Updated `JobAnalysisResult` TypeScript interface for structured LLM response:
  - `job_title`, `company`, `tldr`, `employment_type`, `work_model`, `salary`
  - `experience_level`, `key_requirements`, `nice_to_have`, `tech_stack`, `soft_skills`
- Removed CV upload flow — now focused solely on job description analysis
- Added input cleaning (strip newlines, multiple spaces) to prevent JSON parsing issues

**UI Redesign:**

Header Card (Purple Gradient):
- Displays extracted job title and company name
- Meta badges for employment type, work model, experience level, salary (if available)
- "Analyse another" reset button in top-right
- Icons: Clock (employment), Monitor (work model), Star (experience), DollarSign (salary)

TLDR Section:
- Plain English summary of what employer is really looking for
- Purple "TL;DR" badge with green checkmark icon
- Slate background card with rounded corners

Must-Have Requirements:
- List of extracted key requirements
- Green checkmark icon and green accent border
- Bullet points in clean list format

Tech Stack:
- Purple badge tags for each technology
- Wrapped flex layout for responsive display
- Custom purple accent card with monitor icon

Nice to Have:
- Cyan badge tags for preferred skills
- Plus icon with slate accent
- Clearly separated from must-haves

Soft Skills:
- Slate badge tags for interpersonal skills
- Users icon with slate accent
- Separate section for non-technical requirements

**Design Consistency:**
- Maintained cyan/purple color scheme from landing page
- Rounded-3xl cards matching Upload CV and CV Builder pages
- Smooth transitions and hover effects
- Responsive layout with proper spacing

**Testing:**
- Tested with JP Morgan "Lead Software Engineer - Java & React" job description
- Successfully extracted and displayed:
  - ✅ Job title: "Lead Software Engineer - Java & React"
  - ✅ TLDR summary generated
  - ✅ Must-have requirements (Java/Spring, AWS, SDLC, Microsoft 365, AI integration)
  - ✅ Tech stack badges (Java, ReactJS, Spring, AWS, Microsoft 365, AI)
  - ✅ Nice-to-have (ReactJS for web dev, DevOps, AI models)
  - ✅ Soft skills (Creativity, Communication, Collaboration)
- Average response time: 2-3 seconds
- No buffering or timeout issues

**User Flow:**
1. Paste job description (minimum 50 characters)
2. Click "Analyse Job" button with search icon
3. Loading state with spinning icon and "Analysing..." text
4. Structured results display with all sections
5. "Analyse another" button to reset for new job

**Error Handling:**
- Client-side validation for minimum 50 characters
- Network error handling with clear error messages
- Red error card with X icon for failed analyses
- Graceful fallback if LLM returns partial data

---

### Current Status (9 Mar 2026)

**Completed:**
- ✅ Job Analysis page redesigned for LLM integration
- ✅ Structured output display (job title, company, TLDR, requirements, tech stack, nice-to-have, soft skills)
- ✅ End-to-end testing with real job descriptions
- ✅ All frontend features operational

**Next Steps:**
- CV Builder end-to-end testing with AI enhancement
- PDF export functionality for built CV
- User evaluation preparation (Week 11)