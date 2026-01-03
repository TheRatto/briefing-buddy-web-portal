# Project Name

## Overview

This project is being developed using a structured, agent-based workflow.
The goal is to build the product incrementally with clear ownership,
explicit state, and predictable handoffs between planning, implementation,
review, testing, and documentation.

---

## What This Project Does

Briefly describe what the project does and the problem it solves.
Keep this high level and readable for someone new to the repository.

For detailed intent and context, see:
- PROJECT_BRIEF.md
- PRD.md

---

## Who This Is For

- Primary users or stakeholders
- Secondary users (if applicable)

---

## Current Status

The current state of work can be found in:
- STATUS.md

Planned and completed work is tracked in:
- FEATURES.md

---

## How to Run or Develop (High Level)

Provide a short overview of how to work with the project locally.
Avoid deep technical detail here.

Examples:
- How to start the app
- How to run tests
- Key prerequisites

Detailed technical information belongs elsewhere.

---

## Project Structure

Key files and folders:

- FEATURES.md — authoritative list of features and scope
- STATUS.md — current focus and project health
- PROJECT_BRIEF.md — high-level project intent
- PRD.md — product context and reasoning
- CHANGELOG.md — notable changes over time
- framework/ — workflow rules, agent roles, schemas, and guides
- src/ — application source code

---

## How Work Happens

This project uses an agent-based workflow with explicit roles.

Key workflow and role definitions live in:
- framework/WORKFLOW.md
- framework/agents/

Agents are started using standard prompts defined in:
- framework/agents/AGENT_STARTUP_PROMPTS.md

---

## Contributing

If you are contributing to this project:

- Follow the workflow defined in framework/
- Do not bypass FEATURES.md or STATUS.md
- Use the appropriate agent role for each task

---

## Change History

Notable changes are recorded in:
- CHANGELOG.md

---

## Working with Cursor

This project is designed to be used with Cursor and agent-based workflows.

- **framework/CURSOR_GIT_GUIDE.md**  
  Practical guidance for managing branches, commits, and reviews safely within Cursor.

Agents follow role definitions and workflows in the framework; Git merges and final authority remain with the human operator.
