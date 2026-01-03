# ADR_SCHEMA.md

## Purpose

This document defines the standard structure for Architecture Decision Records (ADRs).

ADRs capture **why a technical decision was made**, not just what was chosen.
They preserve architectural intent, constraints, and trade-offs so decisions do
not need to be rediscovered or re-argued later.

Once accepted, ADRs are authoritative.

---

## File Naming Convention

ADR files must follow this pattern:

ADR-<NNN>-<short-title>.md

Examples:
- ADR-001-implementation-language.md
- ADR-002-project-structure.md
- ADR-003-rule-execution-order.md

- Numbers are sequential
- Numbers are never reused
- Filenames should be lowercase and hyphenated

---

## Required Sections

Every ADR **must** include the following sections, in this order.

---

## Title

A short, descriptive title for the decision.

The title should clearly convey what was decided.

---

## Status

One of:

- Proposed
- Accepted
- Superseded
- Deprecated

Only **Accepted** ADRs are binding.

If an ADR is superseded, it must reference the replacing ADR.

---

## Context

Describe the problem space that led to this decision.

Include:
- Relevant requirements from PRD.md or FEATURES.md
- Constraints (technical, operational, security, regulatory)
- Assumptions in place at the time
- External forces influencing the decision

This section should allow a new reader to understand *why the decision existed*.

---

## Decision

State the decision clearly and unambiguously.

Include:
- What was chosen
- Scope of the decision
- Any explicit boundaries or constraints

Avoid implementation detail unless it is intrinsic to the decision itself.

---

## Consequences

Describe the implications of the decision.

### Positive Consequences
Benefits gained as a result of this decision.

### Negative Consequences
Costs, limitations, or risks introduced.

### Trade-offs Accepted
Explicit acknowledgement of downsides that were consciously accepted.

This section is critical for future reviews and audits.

---

## Alternatives Considered

List meaningful alternatives that were evaluated.

For each alternative:
- Brief description
- Reason for rejection

This prevents future reviewers from assuming options were ignored or forgotten.

---

## Notes (Optional)

Optional clarifications, follow-ups, or guidance that does not belong in the core decision.

Examples:
- Version constraints
- Follow-up ADRs expected
- Conditions under which the decision should be revisited

---

## Modification Rules

- Accepted ADRs must not be edited retroactively
- Changes require a new ADR that supersedes the old one
- Superseded ADRs must reference the replacing ADR
- Deprecated ADRs remain for historical context

---

## Summary Rule

If a future reader asks:

“Why did we do it this way?”

The answer must be fully contained in the ADR.