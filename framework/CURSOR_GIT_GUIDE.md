# CURSOR_GIT_GUIDE.md

## Purpose

This guide explains how to use Git effectively within Cursor
when working with agent-based workflows.

---

## Branch Management in Cursor

- Always check the current branch before starting work
- Create feature branches using the branch selector
- Name branches `feature/<FEATURE-ID>`

---

## Committing Changes

- Use Cursor's Git panel to stage files
- Follow COMMIT_CONVENTIONS.md
- Commit frequently with small, focused changes

---

## Switching Agents

Before starting a new agent:
- Ensure all changes are committed
- Confirm branch is correct
- Avoid carrying uncommitted changes between agents

---

## Reviewing Changes

- Use Cursor's diff view for REVIEWER role
- Review only the feature branch
- Compare against `main` for context

---

## Merging

- Do not merge inside Cursor as an agent
- Switch to human role for merge decisions
- Use merge commits, not rebase or squash

---

## Common Pitfalls

- Forgetting to switch branches
- Committing multiple features together
- Letting agents operate on `main`
- Auto-fixing conflicts without review

---

## Best Practice

Treat Cursor as:
- A powerful editor
- Not an autonomous decision-maker

Git remains the final authority.
