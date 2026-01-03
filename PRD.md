# BriefingBuddy Web Portal — Product Requirements Document (PRD)

## 1. Scope Overview
The MVP delivers:
- Secure, self-serve user accounts
- PDF or pasted NOTAM ingestion
- Deterministic NOTAM parsing and categorisation
- Time-aware filtering and visual emphasis
- Optional AI-generated briefing summary (paid feature)
- Stored briefing history (90 days)

---

## 2. User Flow (MVP)
1. User signs up / logs in
2. Landing page presents:
   - Drag-and-drop PDF zone
   - Toggle to switch to paste mode
3. User submits briefing
4. System parses and processes NOTAMs
5. Results page shows:
   - AI briefing summary (if enabled)
   - NOTAMs grouped by Location/FIR
   - Sub-grouped by operational category
6. User filters by time window and visibility
7. User may export or share results

---

## 3. Authentication & Accounts
- Self-serve signup
- Email + password (or equivalent simple auth)
- Single-user accounts only (MVP)

### User profile fields (stored but unused initially)
- Aircraft type (future AI tailoring)
- Operation type (Part 91 / 121 / 135 etc.)

### Anonymous usage
- Limited anonymous submissions allowed
- Anonymous briefings are not stored

---

## 4. Input Methods

### 4.1 PDF Upload
- Accept ForeFlight briefing PDFs
- Auto-detect NOTAM sections
- Ignore non-NOTAM sections

### 4.2 Paste Mode
- Accept raw ICAO NOTAM text
- Support mixed aerodromes and FIR NOTAMs

---

## 5. NOTAM Parsing

### 5.1 Parsing Strategy (Strict-First)
MVP parsing is strict and deterministic:
- Valid ICAO field formats only
- Unparseable fields result in flagged errors
- Raw text always preserved

### 5.2 Field Support

| Field | Source | MVP Support |
|------|--------|-------------|
| Q | ICAO text | Yes |
| A | ICAO text | Yes |
| B | ICAO text | Yes |
| C | ICAO text | Yes (PERM supported) |
| D | Schedule | Limited |
| E | ICAO text | Yes |
| F/G | ICAO text | Yes |

If any critical field fails parsing:
- NOTAM is shown with a warning badge
- Raw source text is displayed for troubleshooting

---

## 6. Grouping & Categorisation

### 6.1 Primary Grouping
1. Location / FIR (derived from header and A))
2. Operational Category

### 6.2 Category Determination
- Primary: Q-code mapping
- Secondary: weighted keyword fallback
- FIR NOTAMs use prefix and keyword heuristics

Category definitions and weights are sourced from existing BriefingBuddy logic.

---

## 7. Time Window Logic (Canonical)

### 7.1 Window Definition
- Window = [now, now + selectedDuration]

### 7.2 Inclusion Rule (Overlap)
A NOTAM is included if:
- `validFrom < windowEnd` **AND** `validTo > now`

This applies to:
- UI filtering
- AI input selection
- Counts and badges

### 7.3 Derived Visibility State
Each NOTAM derives a state:
- active_now
- future_in_window
- future_outside_window
- expired
- perm_active
- perm_future

PERM NOTAMs use an explicit flag plus a far-future `validTo` sentinel.

**Expired NOTAMs**
- Hidden by default
- Shown only when user toggles “Include expired”

---

## 8. Visual Design & Emphasis
- Minimalist, calm UI
- Colour and typography used for emphasis, not decoration

**Visual rules**
- Category influences heading colour/icon
- Time state influences validity styling
- Raw text remains readable and accessible

Colours are fixed (MVP), not user-themeable.

---

## 9. Filtering Controls
Floating control bar provides:
- Time window: 6h / 12h / 24h / All
- Toggle expired

Filtering hides/shows NOTAMs; no data is deleted or suppressed.

---

## 10. AI Briefing (Paid Feature)

### 10.1 Scope
- NOTAMs only (no MET/TAF in MVP)
- Uses filtered NOTAM set based on selected time window
- Includes “heads-up” awareness of key NOTAMs just outside window

### 10.2 Output
- Separate panel above NOTAM list
- Narrative operational summary
- Optional inline references to source NOTAMs (hover / link)

### 10.3 Inputs
- Filtered NOTAM set
- Aircraft type (if provided)

**Disclaimer**
- Advisory only
- Source NOTAMs remain authoritative

---

## 11. History & Storage
For authenticated users, store:
- Original PDF
- Extracted raw text
- Parsed NOTAM objects
- AI outputs

Retention: **90 days**

Errors and parsing warnings are stored with the briefing.

---

## 12. Export & Sharing

### Exports
- Raw NOTAMs
- Categorised view
- AI summary + NOTAMs

### Sharing
- Private, expiring links
- Read-only

---

## 13. Technical Constraints (Non-binding)
- Desktop-first, mobile web supported
- No offline support
- Architecture must allow reuse of categorisation logic

Implementation language, frameworks, and storage solutions are intentionally deferred to the Architect role.

---

## 14. MVP Non-Goals
- Weather briefing
- Route-aware relevance scoring
- Organisation accounts
- Editable NOTAM annotations
- Real-time NOTAM fetching

---

## 15. Success Criteria (MVP)
- Pilot can identify time-critical NOTAMs in seconds
- Pilot can still access all NOTAMs if desired
- Parsing failures are transparent, not silent
- AI output is helpful but never obscures source data

---

## 16. Next Steps (Agent Workflow)
1. Planner extracts `FEATURES.md` from this PRD
2. Architect selects stack and documents ADRs
3. Features implemented incrementally via agent workflow
4. Security review triggered by auth + file upload
