# Workflow Rules

This document defines the **mandatory, project-agnostic workflow**
for all agent-driven development using this framework.

---

## Feature Lifecycle States

Each feature must exist in exactly one of the following states:

1. `todo` – Defined but not started
2. `doing` – Being implemented by a Coder
3. `review` – Awaiting Reviewer feedback
4. `test` – Under validation by Tester
5. `done` – Meets Definition of Done
6. `blocked` – Cannot progress (reason documented)

State transitions must be explicitly updated in `FEATURES.md`.

---

## Feature Status Transitions

The following rules govern feature state changes:

- Planner creates features in `todo`
- Coder moves features from `todo` → `doing` when implementation begins
- Reviewer does not change feature status
- Tester moves features from `doing` → `done` after tests pass
- If testing fails, Tester returns the feature to `doing` with documented issues

This ensures clear ownership of progress and prevents premature completion.

---

## Mandatory Feature Flow

For every feature:

1. Planner defines or updates the feature (if required)
2. Coder implements **one feature only**
3. Reviewer approves or rejects the implementation
4. Tester validates behaviour
5. Feature is marked `done`
6. Documentation is updated **if required**

Skipping steps is not permitted.

---

---

## Security & Threat Review Gate (Conditional)

A Security Review is required **only** when a feature or architectural change
crosses a defined risk boundary.

### Security Review Triggers

Invoke the Security Reviewer when one or more of the following occur:

- Introduction of external input (CLI args, files, user input)
- Introduction of persistence (filesystem, database)
- Introduction of network access
- Introduction of authentication or authorisation
- Handling of secrets, credentials, or tokens
- Addition of third-party dependencies
- Significant architectural refactor
- Change from internal to external distribution
- Entry into a regulated or safety-critical domain

### Workflow Integration

- The Reviewer must flag when a Security Review is required
- The Security Reviewer performs threat and vulnerability assessment
- Security Review outputs are documented (e.g. SECURITY_REVIEW.md)
- The Security Reviewer does **not** approve or reject features
- Identified mitigations may result in new follow-up features

Security Review is a **gate**, not a feature lifecycle step.

---

## Project-Level Coordination

- STATUS.md is updated by the role that introduces or resolves a **project-level** change in focus, risk, or readiness
- Feature-level progress belongs exclusively in FEATURES.md
- Tool usage must follow MCP_TOOLING_GUIDE.md.

---

## Definition of Done (DoD)

A feature may only be marked `done` if **all** of the following are true:

- Acceptance criteria are met
- Required tests pass (or an explicit waiver is documented)
- No unexplained TODOs are introduced
- Architecture remains consistent with existing patterns
- Documentation is updated if behaviour or configuration changed
- Feature state is correctly updated in `FEATURES.md`

The **Reviewer** is accountable for enforcing the DoD.

---

## Cleanup & Refactoring

- Cleanup is **scheduled**, not opportunistic
- Cleanup agents run:
  - On cadence (e.g. every N features), or
  - When the Reviewer flags structural debt
- Cleanup must not introduce new features or scope changes

---

## Release Discipline

- Only `done` features may be released
- Release state must be explicit
- Experimental or partial features must be clearly flagged

---

## Execution Aids

Runbooks and helper files may be used to reduce execution friction.

- **FEATURE_RUNNER.md** may be used as a convenience checklist for stepping through a feature.
- These aids do not replace the mandatory workflow defined in this document.
- Authority and state transitions remain governed by role definitions and artefacts.