# GIT_WORKFLOW.md

## Purpose

This document defines the Git workflow for projects using the agentic framework.
Git enforces separation of duties, feature isolation, and auditability.

---

## Related Documents

- **COMMIT_CONVENTIONS.md**  
  Defines the required commit message format. All commits must reference a Feature ID and follow these conventions.

  ---

## Core Principles

- `main` is always stable and releasable
- One feature per branch
- No direct commits to `main`
- AI agents never merge branches
- Merges represent accepted, validated work

---

## Branching Model

### Main Branch
- Name: `main`
- Contains only completed, tested features
- Always passes tests

### Feature Branches
- Naming: `feature/<FEATURE-ID>`
  - Example: `feature/F-003`
- One branch per feature
- Short-lived and disposable

---

## Feature Lifecycle

### 1. Planning
- Planner updates FEATURES.md
- No Git action required

### 2. Implementation (CODER)
- Create feature branch from `main`
- Commit code and tests
- Update FEATURES.md status `todo → doing`
- May create multiple commits
- Must not merge

### 3. Review (REVIEWER)
- Reviews code on feature branch
- Does not commit or merge
- Requests changes if needed

### 4. Security Review (conditional)
- Runs on feature branch if triggered
- Produces security artefact
- Does not commit code changes

### 5. Testing (TESTER)
- Runs tests on feature branch
- Updates FEATURES.md `doing → done`
- May commit test reports
- Does not merge

### 6. Merge
- Human merges feature branch into `main`
- Use merge commit (no rebase or squash)
- Delete feature branch after merge

---

## Authority Rules

- Only humans may merge to `main`
- AI agents may commit only within feature branches
- No agent may commit directly to `main`

---

## Rollback and Recovery

- Revert merge commits if needed
- Feature branches provide isolation for safe experimentation
