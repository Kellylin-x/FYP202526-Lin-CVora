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

