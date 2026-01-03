# CHANGELOG Schema

## Purpose

This document defines the **schema and conventions** for `CHANGELOG.md`.

`CHANGELOG.md` records **human-relevant changes** to the project over time.
It is intended to be readable in under two minutes.

This is a strict schema. Deviation is not permitted.

---

## What Belongs in the Changelog

Include entries for:

- New user-visible features or workflows
- Behaviour changes that affect usage
- Breaking changes
- Significant bug fixes
- Notable internal changes that affect contributors (e.g. new tooling)

Do not include:

- Minor refactors with no user impact
- Routine dependency bumps unless they change behaviour
- Detailed commit-level history

---

## Entry Format (Required)

Each entry must use the following structure.

### YYYY-MM-DD — <Short Title>

Type:
- Added | Changed | Fixed | Removed | Security | Internal

Summary:
- 1–3 bullet points describing what changed

Impact:
- Who is affected (users / developers / operators)
- What they need to do (if anything)

Links:
- Related Feature IDs (e.g. F-012)
- ADR references (if relevant)

If there are no links, write:
- None

---

## Ordering Rules

- Newest entries at the top
- Do not reorder old entries except to correct factual mistakes

---

## Authority Rule

If there is a conflict between CHANGELOG.md and FEATURES.md,
FEATURES.md remains the source of truth for scope and state.
