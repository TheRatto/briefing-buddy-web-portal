# SECURITY_REVIEW_SCHEMA.md

## Purpose

This document defines the standard schema for Security / Threat Review artefacts.
It is intended to ensure reviews are consistent, auditable, and appropriately scoped.

Security reviews are **risk-triggered**, not mandatory for every feature or change.

---

## Document Metadata

- **Project:** <project name>
- **Review ID:** SEC-<number>
- **Review Type:** Security Review / Threat Assessment
- **Scope:** <feature(s), architectural change, release milestone>
- **Date:** <YYYY-MM-DD>
- **Reviewer:** <name or agent>
- **Trigger:** <risk boundary that caused this review>

---

## Context Summary

Brief description of:
- What changed
- Why this review was triggered
- What is in scope and explicitly out of scope

---

## System Overview (Relevant Only)

Describe only the parts of the system relevant to this review:
- Components involved
- Data flows
- Trust boundaries
- External dependencies (if any)

Keep this concise.

---

## Identified Threats and Risks

For each identified risk, include:

### Risk <N>

- **Description:** What could go wrong
- **Threat Type:** <e.g. abuse, misuse, injection, DoS, data exposure>
- **Attack Surface:** <where/how the threat manifests>
- **Likelihood:** Low / Medium / High
- **Impact:** Low / Medium / High
- **Overall Risk Rating:** Low / Medium / High

---

## Analysis Notes

Optional section for:
- Reasoning behind risk ratings
- Why certain threats were excluded
- Assumptions made during analysis

---

## Recommended Mitigations

For each risk where mitigation is advised:

- **Risk Reference:** <Risk N>
- **Mitigation Description:** What should be done
- **Mitigation Type:** Preventive / Detective / Corrective
- **Implementation Owner:** Planner / Architect / Coder
- **Follow-up Required:** Yes / No

Mitigations may result in:
- New features
- Architectural constraints
- Additional tests
- Documentation updates

---

## Accepted Risks

For risks that will not be mitigated:

- **Risk Reference:** <Risk N>
- **Reason for Acceptance:** <cost, complexity, low impact, etc.>
- **Acceptance Owner:** <role or decision-maker>

Explicit risk acceptance is required; silence is not acceptance.

---

## Residual Risk Summary

Overall security posture after mitigations and accepted risks:

- **Residual Risk Level:** Low / Medium / High
- **Key Assumptions:** <if any>
- **Recommended Next Review Trigger:** <if applicable>

---

## Review Outcome

- **Security Review Status:** Complete
- **Blocks Progress:** Yes / No
- **Conditions for Proceeding (if any):** <clear conditions>

---

## Notes

- This review does not approve or reject features.
- This document informs architectural, planning, and testing decisions.
- Security findings must be addressed through normal workflow artefacts (FEATURES.md, ADRs, tests).
