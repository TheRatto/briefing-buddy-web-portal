# COMMIT_CONVENTIONS.md

## Purpose

This document defines commit message conventions to improve traceability
and align commits with FEATURES.md.

---

## Commit Message Format

<FEATURE-ID>: <short summary>

Example:
F-003: add TrimLeadingAndTrailingWhitespace rule

---

## Commit Body (Optional)

Use the commit body to add:
- Context
- Notes for reviewer
- Known limitations

Example:

F-003: add TrimLeadingAndTrailingWhitespace rule

Implements rule using strings.TrimSpace.
Includes unit tests covering Unicode whitespace.

---

## Rules

- Every commit must reference a Feature ID
- One feature per commit
- Avoid vague messages (e.g. "fix bug", "update code")
- Do not reference multiple features in one commit

---

## Agent Guidance

- CODER commits implementation and tests
- TESTER commits test reports and status updates
- DOCS commits documentation changes
- REVIEWER and SECURITY_REVIEWER do not commit code
