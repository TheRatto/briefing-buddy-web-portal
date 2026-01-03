# STATUS

## Current Focus

- F-014, F-015, F-016: New features defined to improve NOTAM parsing and filtering
- Problem: ForeFlight PDFs contain non-NOTAM content (flight plans, waypoints, fuel tables) being incorrectly parsed as NOTAMs
- Solution: Three-layer approach:
  1. F-015: Section boundary detection (extract only NOTAM sections from PDF)
  2. F-014: Block pre-validation (validate NOTAM structure before parsing)
  3. F-016: Enhanced splitting (better multi-NOTAM separation)
- Next: Begin implementation of F-014 (foundational validation logic)

## Recently Completed

- F-001: Project scaffolding
- Architecture decisions: ADR-001 through ADR-006 documented and accepted
- ARCHITECTURE.md: Created with high-level system structure
- Security Review: SEC-001 completed, security requirements incorporated into FEATURES.md
- F-002: User authentication (done)
- F-003: Landing page briefing input (done)
- F-005: Deterministic NOTAM parsing (done)
- F-006: NOTAM categorisation (done)
- F-007: Time window filtering (done)
- F-008: Categorised NOTAM presentation (done)
- F-009: Visual emphasis & filtering controls (done)
- F-012: Export & sharing (done)
- F-013: Backend test infrastructure migration (done)

## Blocked / At Risk

- F-004 (NOTAM ingestion): Implementation in progress, may be affected by F-014/F-015/F-016 improvements
- F-010 (Briefing history & storage): In progress, depends on F-004 completion

## Upcoming Decisions

- F-014/F-015/F-016 implementation order and coordination with F-004
- NOTAM section heading patterns for various briefing formats (ForeFlight, Garmin Pilot, etc.)
- Balance between strict validation (fewer false positives) and permissive parsing (handle edge cases)

## Technical Debt Notes

- None
