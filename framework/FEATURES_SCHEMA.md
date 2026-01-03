# FEATURES Schema

## Purpose

This document defines the **schema and conventions** for `FEATURES.md`.

It explains *how* features must be written, structured, and maintained.
It is a **reference document only** and should not be modified per project.

---

## Feature Status Definitions

Each feature must be in exactly one state:

- todo – Defined, not started
- doing – Being implemented
- review – Awaiting review
- test – Under validation
- done – Meets Definition of Done
- blocked – Cannot progress (reason documented)

---

## Feature ID Convention

Use a simple, sortable format:

- F-001
- F-002
- F-003

Rules:
- IDs are never reused
- IDs are never renumbered
- New features always get a new ID

---

## Feature Structure (Required)

Each feature must follow this structure exactly.

### Feature F-XXX: <Short, Descriptive Title>

Status:
- todo | doing | review | test | done | blocked

Owner:
- Planner – definition and scope
- Coder – implementation
- Reviewer – quality and architecture
- Tester – validation

Scope:
- What is included
- Behavioural boundaries
- Explicit exclusions if relevant

Acceptance Criteria:
- Observable and testable behaviour
- Written from a user or system perspective
- No implementation detail unless required

Tests Required:
- What must be validated
- Type of testing expected (unit, integration, manual)

Dependencies:
- Other features
- External systems
- Configuration assumptions

If none, write:
- None

Notes:
- Open questions
- Known constraints
- Links to ADRs or UI specifications

---

## Feature Writing Rules

- Prefer small features over large ones
- Each feature must be independently testable
- If a feature feels too large, split it
- If a feature cannot be tested, it is not ready
- Avoid speculative or future behaviour

---

## Change Rules

- Scope changes must be explicit
- Status changes must reflect real progress
- Blocked features must include a reason
- Completed features remain in the file

---

## Authority Rule

If there is a conflict between `FEATURES.md` and any other artefact,
`FEATURES.md` is the source of truth for **what is being built**.
