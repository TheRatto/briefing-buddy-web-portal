# BriefingBuddy Web Portal

Desktop-first web portal for parsing, categorising, filtering, and reviewing aviation NOTAMs, with optional AI-assisted briefings.

This project is a **companion to the BriefingBuddy iOS app**, designed to support PDF-based workflows and larger-screen review while preserving deterministic, auditable behaviour.

---

## Purpose

Pilots are routinely presented with very large volumes of NOTAMs that are difficult to review, prioritise, and mentally model.

This project exists to:
- Reduce cognitive load during NOTAM review
- Highlight *when* NOTAMs matter at a glance
- Group NOTAMs logically without hiding raw data
- Preserve deterministic behaviour while enabling optional AI assistance

Completeness is not enough — **comprehension is the goal**.

---

## Core Principles

- **Deterministic first**  
  Parsing, categorisation, and filtering must be explainable and testable.

- **Time-aware by default**  
  NOTAM relevance is driven by validity overlap, not static lists.

- **Raw data is authoritative**  
  AI output never replaces or obscures source NOTAMs.

- **Calm UI**  
  Visual emphasis is used to reduce scanning effort, not add noise.

---

## Scope (MVP)

- Secure, self-serve user accounts
- PDF or pasted NOTAM ingestion
- Strict ICAO NOTAM parsing
- Deterministic categorisation (airport + FIR)
- Time-window filtering with visual emphasis
- Optional AI-generated NOTAM briefing (paid feature)
- Stored briefing history (90-day retention)

### Explicit Non-Goals (MVP)

- Weather briefing (MET/TAF)
- Route-aware relevance scoring
- Dispatcher or operations workflows
- Offline support
- Real-time NOTAM fetching

---

## Behavioural Source of Truth

This project reuses and mirrors logic developed in the BriefingBuddy iOS app.

The following document is **authoritative for behaviour**:
