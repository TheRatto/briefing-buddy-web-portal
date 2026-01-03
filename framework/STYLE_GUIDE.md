# Style Guide

## Purpose

This document defines **writing, formatting, and structural conventions**
used across all artefacts and agent outputs.

Its goal is consistency, clarity, and low cognitive load.

This style guide applies to documentation, artefacts, and agent outputs only.
Product UI, branding, and visual design rules must live in project-specific documents (e.g. DESIGN_GUIDE.md, UI_SPEC.md).

---

## Writing Style

- Use clear, direct language
- Prefer short sentences
- Be factual and neutral
- Avoid marketing or promotional tone
- Do not speculate or invent behaviour
- Write in complete thoughts, not fragments

---

## Markdown Conventions

- Exactly one `#` heading per file (the document title)
- Use `##` for major sections
- Use `###` for subsections
- Use `-` for bullet points (not `*`)
- One blank line between:
  - Headings and content
  - Lists and paragraphs
- Avoid deeply nested lists

---

## Terminology Consistency

- Use the same terms across all docs
- Feature states must match those defined in `WORKFLOW.md`
- Refer to artefacts by filename (e.g. `FEATURES.md`)
- Do not invent new role names or states

---

## Structure Over Prose

Where a schema or template exists:
- Follow it exactly
- Do not reorder sections
- Do not omit required headings

Free-form prose is allowed only where no template is defined.

---

## Authority Rule

If documentation conflicts with code:
- Code is the source of truth
- Documentation must be updated to match reality
