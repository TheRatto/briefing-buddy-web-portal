# STATUS Schema

## Purpose

This document defines the **schema and conventions** for `STATUS.md`.

`STATUS.md` provides shared situational awareness for all agents and replaces
standups, verbal updates, and implicit context.

This is a **strict schema**. Deviation is not permitted.

---

## Required Sections

`STATUS.md` must contain the following sections **in this order**.

---

## Current Focus

- What the team is actively working on right now
- Reference feature IDs where applicable
- Keep this to 3–5 bullet points maximum

---

## Recently Completed

- Features moved to `done` since the last update
- Use feature IDs and short descriptions
- Old items should be removed regularly

---

## Blocked / At Risk

- Features that cannot currently progress
- Include reason for blockage
- Include what is needed to unblock

If none, explicitly state:
- None

---

## Upcoming Decisions

- Decisions that will be required soon
- Architectural, product, or sequencing decisions
- Link to relevant PRD or ADR context if available

If none, explicitly state:
- None

---

## Technical Debt Notes

- Known debt worth tracking
- Areas that may require cleanup
- Keep high-level only

If none, explicitly state:
- None

---

## Update Rules

- Keep STATUS.md short and current
- Prefer removing stale information over accumulating history
- This is not a journal or changelog
- Update whenever feature state meaningfully changes

---

## Authority Rule

If STATUS.md conflicts with other artefacts,
FEATURES.md remains the source of truth for scope and state.
