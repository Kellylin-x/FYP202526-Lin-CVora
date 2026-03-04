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