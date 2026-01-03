# ARCHITECTURE_SCHEMA.md

## Purpose

This document defines the structure and intent of `ARCHITECTURE.md`.

`ARCHITECTURE.md` provides a **current-state architectural overview** of the system.
It summarises accepted architectural decisions and constraints but **must not introduce new decisions**.

Authoritative architectural decisions belong in ADRs.

---

## Relationship to ADRs

- ADRs are the source of truth for architectural decisions
- ARCHITECTURE.md reflects the *current outcome* of accepted ADRs
- ARCHITECTURE.md must reference relevant ADRs
- ARCHITECTURE.md must not contradict or supersede ADRs

If a new architectural decision is required, a new ADR must be created first.

---

## Required Sections

`ARCHITECTURE.md` must include the following sections.

---

## System Overview

A brief description of:
- The purpose of the system
- The problem it solves
- Its high-level scope

This section should be understandable to a new contributor.

---

## High-Level Architecture

Describe the major components of the system.

Include:
- Key modules, services, or layers
- Their responsibilities
- High-level interaction patterns

Avoid low-level implementation details.

---

## Component Responsibilities

For each major component:
- Describe its role
- Define clear responsibility boundaries
- Note any important invariants or constraints

This section exists to guide implementation without prescribing code structure.

---

## Data Flow (If Applicable)

Describe how data moves through the system at a high level.

Include:
- Primary data inputs and outputs
- Transformation stages
- Key control or decision points

Diagrams may be referenced but are optional.

---

## Architectural Constraints

List constraints that must be respected by implementers.

Examples:
- Language or runtime constraints
- Dependency rules
- Performance or security boundaries

Each constraint should reference an ADR where applicable.

---

## Referenced ADRs

List all ADRs that define or influence the current architecture.

Example:
- ADR-001-implementation-language.md
- ADR-002-project-structure.md

This section ensures traceability between decisions and structure.

---

## Non-Goals

Explicitly state what this document does *not* cover.

Examples:
- Detailed API contracts
- Low-level design
- Implementation strategies
- Future or speculative designs

---

## Maintenance Rules

- ARCHITECTURE.md may be updated as the system evolves
- Updates must reflect accepted ADRs only
- ARCHITECTURE.md must not be used to record new decisions
- Significant architectural changes require a new ADR

---

## Summary Rule

If a reader asks:

“How is the system structured *right now*?”

ARCHITECTURE.md should answer that — without explaining *why* decisions were made.