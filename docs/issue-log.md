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
- **Fix Applied:** Ran npm install --legacy-peer-deps
- **Status:**  Resolved
- **Notes:** Frontend can now run tests with vitest; may upgrade @testing-library/react later for React 19 native support

### Issue #3: Missing jsdom dependency for vitest
- **Date:** 8 Feb 2026
- **Description:** GitHub Actions CI failed on frontend tests with error: 'Cannot find dependency jsdom'
- **Root Cause:** vitest.config.ts specifies environment: 'jsdom' but jsdom was not added to package.json devDependencies
- **Fix Applied:** Added jsdom@^24.0.0 to frontend/package.json devDependencies and ran npm install --legacy-peer-deps
- **Status:**  Resolved
- **Local Test Result:** 2/2 frontend tests now passing
- **Notes:** jsdom is required by vitest to provide DOM/browser API in test environment
