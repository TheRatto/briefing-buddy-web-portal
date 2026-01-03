# Artefact Definitions

This document defines the **types of artefacts used by the framework**.
It specifies structure and ownership, not content.

---

## Core Artefacts (Always Present)

### PROJECT_BRIEF.md

**Purpose:** Single-page project orientation  
**Owner:** Planner  

**Required Sections:**
- Project goal
- Target users
- Non-goals
- Definition of success

---

### FEATURES.md

**Purpose:** Source of truth for all work  
**Owner:** Planner / Release Manager  

Each feature must include:
- Feature ID
- Title
- Status
- Scope (bullet points)
- Acceptance criteria
- Tests required
- Notes / links to related artefacts

---

### STATUS.md

**Purpose:** Shared situational awareness  
**Owner:** Release Manager / Reviewer  

Contains:
- Current focus
- Recently completed features
- Known risks and technical debt
- Upcoming decisions or milestones

---

## Planning & Design Artefacts

### PRD.md

**Purpose:** Problem framing and intent  
**Owner:** Planner  

Notes:
- Describes *what* and *why*
- Does not prescribe implementation details

---

### UI_SPEC.md

**Purpose:** UI behaviour and states  
**Owner:** Designer  

Includes:
- Screens or components
- States and transitions
- User-facing copy (if relevant)

Conforms to UI_SPEC_SCHEMA.md

---

### ARCHITECTURE.md

**Purpose:** High-level system structure  
**Owner:** Architect / Reviewer  

Includes:
- Major components
- Data flow
- Key constraints

Conforms to ARCHITECTURE_SCHEMA.md

---

## Decision Tracking

### ADRs (`/ADR/`)

**Purpose:** Record architectural decisions  
**Owner:** Architect / Reviewer  

Each ADR must include:
- Context
- Decision
- Consequences

---

## Documentation Artefacts

### CHANGELOG.md

**Purpose:** Track externally relevant changes  
**Owner:** Documentation Agent  

Includes:
- User-visible behaviour changes
- Configuration changes
- Breaking changes

---

## Usage Rule

Artefacts coordinate work.  
Chat history does not.

If information is important, it belongs in an artefact.
