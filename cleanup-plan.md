# Cleanup & Optimization Plan (SAFE)

This document tracks every change, report, and observed size delta. Guardrails strictly enforced:

- No changes to user-visible visuals, OD mails, or OD reports
- OD parsing, Live Preview, OD Mail, and OD Report generation must be identical
- No removal of timetable parsing, Excel ingestion, or Gmail compose/“Open in Gmail”

## Branch

- chore/cleanup-optimization-safe

## Reports (generated under `reports/`)

- file-inventory.csv
- loc-by-folder.csv
- large-assets.csv
- duplicates.csv
- dead-files.csv (heuristic; requires manual review)
- deps-audit.txt (heuristic)

Regenerate with:

```bash
npm run repo:report
```

or (PowerShell restricted) run directly:

```bash
node scripts/repo-report.mjs
```

## Proposed Removals (Pending Review)

Do not delete until reviewed and confirmed safe.

- test.txt.txt — appears to be a stray test file. Size: TBD (see file-inventory.csv)
- sample_event.xlsx — sample data; if not used by any flow, move to `/archive/` with README
- Any “dead-files.csv” entries with confidence≥low after manual verification that:
  - Not imported in TS/JS
  - Not referenced by routes, build configs, CSS, or mail templates
  - Not used by UI or emails

## Deduplication Targets (No behavior change)

- Time overlap/timetable helpers in `utils/` and `lib/utils/` — unify into one utility module with tests
- Mail fragments (bold/list/sections) — centralize in a shared mail template utility keeping rendered HTML/text identical
- Repeated CSS — consolidate into shared modules without changing class names

## Dependency Slimming (Heuristic, must keep OD flows intact)

- Prefer a single Excel library (`xlsx` currently in use). Remove alternates if present.
- Identify unused/duplicated libs from `deps-audit.txt` (requires manual verification).

## Assets Cleanup (Lossless only)

- Losslessly compress PNG/JPG/SVG where possible (no visual diffs)
- De-duplicate fonts/icons/logos
- Move unused screenshots/renders to `/archive/`

## Size Savings (to be filled post-approval)

- Total repo size before: TBD
- After removal/dedupe: TBD
- Savings: TBD (Target 25–60%)

## Tests to Guarantee Parity

- Live Preview parity test: preview “missed lectures” count equals OD Report row count for a known fixture
- OD Mail snapshot tests: formatting/spacing/bolding unchanged
- Excel ingestion fixture test: subject parsing and filtering stable

## Verification Steps

- Full build & e2e smoke after cleanup
- Upload Standard_OD_Template.xlsx and verify Live Preview matches pre-cleanup
- Generate OD Mail preview (snapshot compare)
- Download OD Report (compare columns and representative rows)

## Change Log

- 0.0.1 — Added reporting script `scripts/repo-report.mjs` and `npm run repo:report`; generated initial reports; no codepath changes
