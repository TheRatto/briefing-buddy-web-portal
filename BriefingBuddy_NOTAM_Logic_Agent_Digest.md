# BriefingBuddy NOTAM Logic — Agent Digest

This document is a **concise, authoritative reference** for agents implementing the BriefingBuddy Web Portal. It summarises **where the logic lives**, **what is canonical**, and **what must be ported vs re-implemented**.

It is intentionally written to support:
- Planner (feature extraction)
- Architect (core engine design)
- Coder (faithful re-implementation)
- Reviewer / Tester (behavioural verification)

---

## 1. NOTAM Categorisation — Canonical Sources

### 1.1 Airport NOTAM Categorisation

**Primary files**
- `lib/services/notam_grouping_service.dart`
- `lib/models/notam.dart`

**Mechanisms**
- **Q-code mapping** → primary classification
- **Keyword-based weighted scoring** → fallback when Q-code is missing or ambiguous

**Groups (Airport)**
- `runways`
- `taxiways`
- `instrumentProcedures`
- `airportServices`
- `lighting`
- `hazards`
- `admin`
- `other`

**Key functions**
- `_classifyByTextScoring()` — weighted keyword analysis
- `assignGroup()` — applies Q-code classification
- `determineGroupFromQCode()` — maps Q-code subject codes to groups

**Authoritative definition**
- `enum NotamGroup` in `lib/models/notam.dart`

This enum is the **single source of truth** for all group names.

---

### 1.2 FIR NOTAM Categorisation

**Primary file**
- `lib/services/fir_notam_grouping_service.dart`

**Mechanisms**
- Primary: NOTAM ID prefix classification
- Secondary: keyword inspection

**ID Prefix Mapping**
- `E` → Airspace restrictions
- `L` → ATC / navigation
- `F` → Obstacles / charts
- `H` → Infrastructure
- `G` → Drone / RPAS
- `W` → Administrative

**Groups (FIR)**
- `firAirspaceRestrictions`
- `firAtcNavigation`
- `firObstaclesCharts`
- `firInfrastructure`
- `firDroneOperations`
- `firAdministrative`

**Key function**
- `groupFIRNotam()`

FIR groups are also defined in the shared `NotamGroup` enum.

---

## 2. Time Window & Visibility Logic

### 2.1 Canonical Time-Window Inclusion Rule

The **correct and final rule** used across the app is **interval overlap**.

A NOTAM is included in a time window if:

```
validFrom < windowEnd AND validTo > now
```

**Canonical source**
- `lib/providers/flight_provider.dart`
- `filterNotamsByTimeAndAirport()`

This method should be treated as the **reference implementation**.

---

### 2.2 Time Filter State

**Options**
- 6 hours
- 12 hours
- 24 hours
- All

**Helpers**
- `_getHoursFromFilter()`
- `setTimeFilter()`

---

### 2.3 Derived Visibility States (Implicit)

Derived by comparing `now` with validity bounds:
- `active_now`
- `future_in_window`
- `future_outside_window`
- `expired`

Used primarily in:
- `lib/widgets/notam_group_content.dart`
- `_buildTimeRange()`

---

## 3. ICAO Field Parsing

### 3.1 Fields Parsed from ICAO Text

**Source**
- `lib/models/notam.dart`

**Helper**
- `_extractIcaoFields()`

**Parsed fields**
- `E)` NOTAM body
- `F)` Lower limit
- `G)` Upper limit

---

### 3.2 Schedule — Field D

- Sourced from FAA API `schedule`
- Not parsed from ICAO text
- Stored verbatim if present

---

### 3.3 Fields B / C (Validity)

- **Not parsed from ICAO text**
- Sourced from FAA API:
  - `effectiveStart`
  - `effectiveEnd`

For PDF ingestion, B/C parsing must be implemented separately.

---

## 4. PERM Logic

**Source**
- `lib/models/notam.dart`

**Behaviour**
- `PERM` / `PERMANENT` → `validTo = now + 10 years`
- `isPermanent = true`

Invalid dates fall back to the same sentinel.

---

## 5. Known Duplication

Time logic appears in:
- `flight_provider.dart` (canonical)
- `raw_data_screen.dart`
- `alternate_data_screen.dart`

Web portal should **centralise once**, using provider behaviour.

---

## 6. Porting Guidance

### Preserve exactly
- Q-code mappings
- Keyword weights
- Interval overlap rule
- PERM semantics

### Newly required for web
- ICAO B/C parsing
- Strict-first date parsing

### Promote to first-class concepts
- `NotamGroup`
- Visibility state
- Parsing error metadata

---

## 7. Architecture Recommendation

Extract rules into a language-agnostic core:
- `rules/qcode_mapping.json`
- `rules/keyword_weights.json`
- `rules/time_window.json`
- `fixtures/*.pdf`
- `expected/*.json`

Dart code remains the **golden reference**.

---

## Final Guidance

If behaviour diverges between implementations, **the Dart logic wins**.

End of document.
