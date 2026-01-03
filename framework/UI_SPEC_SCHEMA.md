# UI_SPEC_SCHEMA.md

## Purpose

This document defines the standard structure for `UI_SPEC.md`.

`UI_SPEC.md` is the project’s **authoritative UI contract**:
it specifies user-visible behaviour, layout intent, interaction rules, and UX constraints
so implementation and testing can be consistent.

It must describe **what the UI does**, not **how it is implemented**.

---

## When UI_SPEC.md is Required

UI_SPEC.md is required when a feature includes any of:
- new screens, panels, dialogs, or significant layout changes
- non-trivial interaction flows (multi-step, stateful UI)
- validation rules or error states
- accessibility or responsiveness requirements

For purely backend/library projects, UI_SPEC.md may be omitted.

---

## Required Sections

UI_SPEC.md must include the following sections.

---

## Overview

- What this UI covers
- Intended user(s) and context of use
- High-level goals (1–3 bullet points)

---

## Screens and Components

For each screen or major UI component:

### Name
A stable name used throughout documentation and tests.

### Purpose
What the user is trying to achieve here.

### Layout (High Level)
Describe structure using simple blocks and hierarchy.
Avoid pixel-perfect prescriptions.

Example:
- Header
- Input area
- Primary action button
- Results panel
- Secondary actions

### States
Define key UI states:
- default
- loading
- success
- empty
- error
- disabled

### Interactions
Define user actions and expected outcomes:
- clicks/taps
- keyboard interactions (if applicable)
- navigation behaviour
- focus behaviour (if applicable)

### Validation and Error Messaging
- input constraints
- validation triggers
- exact error message text (if important)
- where errors appear

---

## Behavioural Rules

Rules that apply across the UI, such as:
- formatting rules
- debounce / timing rules
- persistence rules (e.g., remembers last setting)
- undo/redo expectations

This section should be testable.

---

## Accessibility Requirements (If Applicable)

Specify any requirements such as:
- keyboard navigation
- focus indicators
- contrast requirements
- screen reader labels / alt text expectations

If not applicable, state: "None defined."

---

## Responsiveness / Platform Considerations (If Applicable)

Specify any constraints:
- mobile vs desktop layout changes
- minimum supported resolutions
- platform-specific behaviour

If not applicable, state: "None defined."

---

## Acceptance Criteria Mapping

Map UI expectations to feature IDs and acceptance criteria.

Example:
- F-004 AC-2: Error banner appears when input is empty
- F-004 AC-5: Results render within 200ms for typical input

---

## Out of Scope / Non-Goals

Explicitly list what is not covered, to prevent scope creep.

---

## Maintenance Rules

- UI_SPEC.md may be updated as UI evolves
- UI behaviour changes must update UI_SPEC.md and relevant tests
- UI_SPEC.md must not contain implementation details (framework-specific code, file paths, class names)

---

## Summary Rule

If a reader asks:

“What should the user see and be able to do?”

UI_SPEC.md must answer that clearly and testably.