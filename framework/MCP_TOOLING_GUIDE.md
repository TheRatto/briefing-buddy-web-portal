# MCP_TOOLING_GUIDE.md

## Purpose

This document defines governance rules for tool usage (including MCP-based tools)
within the agentic framework.

Tools increase agent capability and therefore risk. This guide ensures tool usage
remains intentional, auditable, and aligned with role authority.

This policy complements platform safeguards (e.g. Cursor) and does not replace them.

---

## Core Principles

- Tools extend capability, not authority
- Tool usage must align with the active agent role
- Side effects require explicit permission
- All external information must have clear provenance
- Secrets must never be exposed or persisted

---

## Tool Categories

### 1. Read-Only Tools (Default Allowed)

Examples:
- Repository search
- File reads
- Directory listing
- Viewing logs or documentation
- Web search (if enabled and permitted)

Rules:
- May be used freely within role scope
- Must not modify files or state
- External sources must be cited

---

### 2. Compute Tools (Conditionally Allowed)

Examples:
- Running tests
- Linters
- Formatters
- Build commands
- Static analysis tools

Rules:
- Allowed if consistent with role responsibilities
- Must not introduce side effects beyond local computation
- Any generated artefacts must be committed only by authorised roles

---

### 3. Side-Effect Tools (Restricted)

Examples:
- Git merge, push, or rebase
- Dependency installation or upgrade
- Deployment commands
- Writing to external systems
- API calls that modify remote state

Rules:
- Require explicit human instruction
- Must not be invoked autonomously by agents
- Must be clearly justified before use

---

## Tool Justification Requirement

Whenever a tool is used, the agent must briefly state:

- Tool used
- Reason for use
- Expected outcome

This may be inline in agent output and need not be persisted unless relevant.

---

## Provenance and External Information

If a tool retrieves information from:
- The web
- External documentation
- Third-party services

The agent must:
- Identify the source
- Minimise copied content
- Avoid unverifiable claims

---

## Secrets and Credentials

Hard rules:
- Never paste secrets into prompts
- Never commit secrets to the repository
- If a secret is detected, stop and alert the human
- Recommend rotation or removal if exposure is suspected

---

## Logging and Artefacts

- Tool outputs that influence decisions should be referenced in artefacts
- Temporary tool outputs may be discarded unless needed for audit
- Security-related tool findings should be captured in security review artefacts

---

## Enforcement Model

- Tool misuse is a workflow violation, not a tool failure
- Reviewers may flag inappropriate tool usage
- Humans remain the final authority for side-effect actions

---

## Summary Rule

Tools may assist agents.
They must never replace judgment, authority, or accountability.
