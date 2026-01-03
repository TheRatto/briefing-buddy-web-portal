# PRD Guide

## Purpose

This document provides **guidance** for creating and maintaining `PRD.md`.

A PRD (Product Requirements Document) captures **intent, reasoning, and context**
for a project. It supports planning and decision-making but does not control
implementation directly.

This is a guidance document, not a schema.

---

## What a PRD Is

`PRD.md` is a place to:

- Describe the problem being solved
- Capture user needs and pain points
- Explore solution approaches and trade-offs
- Record assumptions and open questions
- Provide context for feature definition

The PRD exists to help humans and agents understand *why* the project exists
and *what success looks like*.

---

## What a PRD Is Not

`PRD.md` must not be treated as:

- A strict implementation specification
- A task list or backlog
- A substitute for `FEATURES.md`
- A checklist that Coders follow line by line

If there is a conflict between `PRD.md` and `FEATURES.md`,
**FEATURES.md always takes precedence**.

---

## Ownership

The **Planner** owns `PRD.md`.

The Planner is responsible for:

- Creating the initial PRD
- Updating it when product intent changes
- Ensuring it remains concise and relevant
- Extracting concrete features into `FEATURES.md`

Other agents may read the PRD for context,
but they must not treat it as authoritative scope.

---

## Recommended Content (Flexible)

A PRD will often include:

- Problem statement
- Target users and use cases
- Goals and success metrics
- Non-goals and exclusions
- Constraints and assumptions
- Open questions or risks
- High-level solution ideas

Section names and order are flexible.

---

## How PRDs Are Typically Created

Best practice is to:

1. Draft the PRD externally (e.g. ChatGPT, notes, whiteboard)
2. Refine and simplify the content
3. Import a cleaned-up version into `PRD.md`
4. Use it as a stable reference during execution

Avoid using the code workspace for exploratory brainstorming.

---

## Update Rules

- PRD.md should change infrequently
- Minor implementation discoveries do not require PRD updates
- Material changes in goals or direction must be reflected
- Keep historical reasoning concise; avoid long narratives

---

## Final Rule

PRD.md provides **context and intent**.

`FEATURES.md` defines **what is built**.

The framework depends on keeping those roles distinct.
