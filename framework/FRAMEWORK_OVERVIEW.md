# Framework Overview

**Framework Version:** v0.1  
**Status:** Draft  

## Purpose

This framework defines how software is **designed, built, reviewed, tested, and documented**
using specialised AI agents coordinated through explicit artefacts.

The framework exists to preserve human flow by externalising memory and decision-making, not to increase ceremony.

It replaces:

- Implicit human memory
- Verbal coordination
- Informal conventions

With:

- Durable documents
- Strict role boundaries
- Predictable workflows

This framework is **agnostic to domain, tech stack, and project size**.

---

## Core Principles

### 1. Artefacts Over Conversation
All decisions, state, and intent must live in files, not chat history.

### 2. Role Purity
Each agent has a narrow, explicit responsibility.  
Agents must not “helpfully” exceed their scope.

### 3. One Agent → One Deliverable
No agent is responsible for planning, coding, testing, and documenting simultaneously.

### 4. Explicit State Beats Intuition
Feature progress is tracked through defined states, not subjective “done”.

### 5. No Implicit Memory
Agents assume nothing beyond what they read at startup.

### 6. Small, Stable Documents
Prefer many short files over large, narrative documents.

### 7. Reversible Decisions by Default
Architectural decisions must be recorded and justifiable.

---

## What This Framework Is NOT

This framework is **not**:

- A coding style guide
- A tech stack prescription
- A replacement for project-specific thinking
- A place to store business logic

Those belong in the **project layer**, not the framework.

---

## Cross-Cutting Governance

The following documents apply across all agents and workflows and define global rules:

- **MCP_TOOLING_GUIDE.md**  
  Governs how agents may use tools (including MCP-based tools), including restrictions on side effects, provenance requirements, and secret handling.

- **GIT_WORKFLOW.md**  
  Defines branching, merging, and authority boundaries enforced via Git.

- **COMMIT_CONVENTIONS.md**  
  Specifies required commit message formats to maintain traceability to FEATURES.md.

  ---

## Framework vs Project Layer

### Framework Layer (this system)

- Roles
- Rules
- Artefact types
- Workflows
- Definitions of done

### Project Layer

- Domain knowledge
- Features
- UI design
- Architecture
- Constraints

**The framework governs how work happens.**  
**The project defines what is built.**
