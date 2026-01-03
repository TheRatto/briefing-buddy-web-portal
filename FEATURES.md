# FEATURES

## Purpose

This file is the **single source of truth for all work** in this project.

It contains only **real, active, or completed features**.
Schema explanations live in `FEATURES_SCHEMA.md`.

---

### Feature F-001: Project scaffolding

Status:
- done

Owner:
- Planner – initial setup
- Coder – repository setup
- Reviewer – structure review
- Tester – manual validation

Scope:
- Initialise repository
- Add framework files
- Create initial project documentation

Acceptance Criteria:
- Repository builds or runs
- Framework documents are present
- Project is ready for feature development

Tests Required:
- Manual verification of repository setup

Dependencies:
- None

Notes:
- Baseline feature establishing project structure

---

### Feature F-002: User authentication (self-serve)

Status:
- done

Owner:
- Planner – definition
- Architect – auth approach selection
- Coder – implementation
- Reviewer – security review
- Tester – auth flow testing

Scope:
- Self-serve signup and login
- Email + password (or equivalent simple auth)
- Authenticated session management
- Anonymous access path (limited, non-persistent)

Acceptance Criteria:
- User can create an account and log in
- Authenticated users have persistent identity
- Anonymous users can submit a briefing but cannot save history
- Passwords are stored using secure hashing (bcrypt or Argon2, never plaintext)
- JWT tokens expire after 24 hours
- JWT cookies are configured with httpOnly, secure (production), and sameSite flags
- JWT signing secrets are strong, randomly generated (not hardcoded)
- Password strength requirements enforced during signup

Tests Required:
- Signup/login success and failure cases
- Session persistence across page refresh
- Anonymous submission does not create stored records
- Security testing: password hash verification, JWT expiration, cookie configuration
- Security testing: password storage verification (no plaintext passwords)

Dependencies:
- F-001

Notes:
- No organisation or multi-user support in MVP
- Security requirements reference: SECURITY_REVIEW.md (M-1, M-2, M-7, M-15)
- Cross-cutting security: All API endpoints must return generic error messages to clients (detailed errors logged server-side only)

---

### Feature F-003: Landing page briefing input

Status:
- done

Owner:
- Planner – definition
- Coder – UI implementation
- Tester – input validation

Scope:
- Minimalist landing page
- Drag-and-drop PDF upload zone
- Toggle to switch between PDF and paste mode
- Submit action

Acceptance Criteria:
- User can upload a PDF OR paste NOTAM text
- Only one input mode active at a time
- Submit triggers parsing workflow
- PDF uploads are rejected if file size exceeds configured limit (e.g., 10MB)
- Client-side file size validation provides immediate feedback

Tests Required:
- PDF upload success and rejection (non-PDF)
- Paste mode accepts raw ICAO text
- Submit disabled until valid input present
- File size limit enforcement (rejection of oversized files)

Dependencies:
- F-001
- F-002

Notes:
- No client-side parsing logic assumed
- Security requirements reference: SECURITY_REVIEW.md (M-4, M-9)

---

### Feature F-004: NOTAM ingestion & raw extraction

Status:
- doing

Owner:
- Planner – definition
- Architect – ingestion approach
- Coder – implementation
- Tester – parsing robustness

Scope:
- Extract raw NOTAM text from uploaded PDF
- Accept pasted raw NOTAM text
- Preserve original raw source

Acceptance Criteria:
- Raw NOTAM text is extracted or accepted verbatim
- Non-NOTAM content is ignored
- Raw text is stored with briefing (if authenticated)
- PDF file type validation performed (MIME type and file signature, not just extension)
- Uploaded PDFs stored with UUID-based filenames (never user-provided filenames)
- PDF processing has timeout limits to prevent resource exhaustion
- Server enforces file size limits on upload endpoint (e.g., 10MB maximum)
- Rate limiting applied to upload endpoint (per user/IP)

Tests Required:
- Known ForeFlight PDF extracts expected text
- Mixed-content PDF does not crash ingestion
- Security testing: file type validation (MIME type, file signature)
- Security testing: filename sanitization (UUID generation, no path traversal)
- Security testing: file size limit enforcement
- Security testing: timeout handling for malformed PDFs

Dependencies:
- F-003

Notes:
- Accuracy over completeness for MVP
- Security requirements reference: SECURITY_REVIEW.md (M-4, M-5, M-9, M-11)
- Anonymous access: Rate limiting applied to anonymous submission endpoint (per IP)

---

### Feature F-005: Deterministic NOTAM parsing (strict-first)

Status:
- done

Owner:
- Planner – definition
- Architect – parsing contract
- Coder – parser implementation
- Tester – edge-case validation

Scope:
- Parse ICAO NOTAM fields (Q, A, B, C, D*, E, F, G)
- Strict-first parsing strategy
- Flag unparseable fields

Acceptance Criteria:
- Valid ICAO fields parsed into structured form
- Parsing failures are surfaced as warnings
- Raw text always preserved

Tests Required:
- Valid NOTAM parses without warnings
- Invalid/malformed NOTAM produces warnings, not silent failure

Dependencies:
- F-004

Notes:
- Field D limited support
- B/C parsing required for web context (from ICAO text, not API)
- PERM handling: set validTo = now + 10 years sentinel, set isPermanent = true
- Reference: BriefingBuddy NOTAM Logic Agent Digest

---

### Feature F-006: NOTAM categorisation (airport & FIR)

Status:
- done

Owner:
- Planner – definition
- Architect – rule porting
- Coder – categorisation engine
- Tester – category verification

Scope:
- Airport NOTAM grouping via Q-code mapping
- Keyword-weight fallback classification
- FIR NOTAM grouping via ID prefix and keywords

Acceptance Criteria:
- Each NOTAM assigned exactly one group
- Group names match NotamGroup enum (canonical source: lib/models/notam.dart)
- Behaviour matches Dart reference logic exactly
- Q-code mapping preserved from determineGroupFromQCode()
- Keyword weights and scoring preserved from _classifyByTextScoring()

Tests Required:
- Golden fixture comparison against known cases
- Q-code classification matches Dart implementation
- Keyword fallback produces same results as Dart service

Dependencies:
- F-005

Notes:
- Behavioural source of truth: BriefingBuddy NOTAM Logic Agent Digest
- Must preserve Q-code → group mapping from lib/models/notam.dart
- Must preserve keyword weights from lib/services/notam_grouping_service.dart
- FIR grouping must match lib/services/fir_notam_grouping_service.dart
- NotamGroup enum is single source of truth for group names

---

### Feature F-007: Time window filtering & visibility states

Status:
- done

Owner:
- Planner – definition
- Architect – time model
- Coder – filter implementation
- Tester – boundary condition testing

Scope:
- Time window selection (6h / 12h / 24h / All)
- Interval-overlap inclusion rule
- Derived visibility states

Acceptance Criteria:
- NOTAM inclusion follows overlap rule exactly: validFrom < windowEnd AND validTo > now
- PERM NOTAMs handled correctly (isPermanent flag + far-future sentinel)
- Expired NOTAMs hidden by default
- Visibility states computed: active_now, future_in_window, future_outside_window, expired

Tests Required:
- Edge cases around window boundaries
- PERM and future NOTAM visibility
- Interval overlap rule matches lib/providers/flight_provider.dart filterNotamsByTimeAndAirport()

Dependencies:
- F-005

Notes:
- Must match Dart behaviour exactly
- Canonical implementation: lib/providers/flight_provider.dart filterNotamsByTimeAndAirport()
- Time filter options: 6h, 12h, 24h, All
- PERM NOTAMs use isPermanent flag + validTo sentinel (now + 10 years)

---

### Feature F-008: Categorised NOTAM presentation

Status:
- done

Owner:
- Planner – definition
- Coder – UI rendering
- Tester – visual verification

Scope:
- Group NOTAMs by Location/FIR
- Sub-group by operational category
- Display raw NOTAM text

Acceptance Criteria:
- NOTAMs grouped correctly in UI
- All NOTAMs remain accessible
- Raw text readable and selectable
- User-generated content (NOTAM text) is displayed safely without XSS vulnerabilities
- React's default HTML escaping prevents script execution in rendered content

Tests Required:
- Multi-location briefing renders correctly
- Security testing: XSS prevention (malicious NOTAM text does not execute scripts)

Dependencies:
- F-006
- F-007

Notes:
- No editing or annotation in MVP
- Security requirements reference: SECURITY_REVIEW.md (M-6)

---

### Feature F-009: Visual emphasis & filtering controls

Status:
- done

Owner:
- Planner – definition
- Coder – UI behaviour
- Tester – interaction testing

Scope:
- Floating filter bar
- Time window selector
- Toggle for expired NOTAMs
- Colour emphasis by time state and category

Acceptance Criteria:
- Filters hide/show NOTAMs without data loss
- Visual cues reflect time state accurately

Tests Required:
- Filter combinations behave predictably

Dependencies:
- F-007
- F-008

Notes:
- Fixed colour palette for MVP
- Time state colours: active (amber), future (orange), expired (red), PERM (special handling)

---

### Feature F-010: Briefing history & storage

Status:
- doing

Owner:
- Planner – definition
- Architect – storage model
- Coder – persistence
- Tester – retention checks

Scope:
- Store briefings for authenticated users
- Retain for 90 days
- View previous briefings

Acceptance Criteria:
- User can access past briefings
- Data expires after retention window
- Users can only access their own briefings (authorization checks on all access endpoints)
- Briefing IDs are UUID-based (non-sequential, non-enumerable)
- Database queries use parameterized queries or ORM (never string concatenation)
- Object storage buckets configured with private access (no public read)
- PDFs accessed via signed URLs if needed (with expiration)
- Cleanup jobs handle errors gracefully and coordinate database and object storage deletion
- Cleanup job execution is logged and monitored

Tests Required:
- Retrieval of stored briefings
- Expiry behaviour after retention
- Security testing: authorization checks (users cannot access other users' briefings)
- Security testing: ID enumeration prevention (UUID-based IDs)
- Security testing: SQL injection prevention (parameterized queries)
- Security testing: object storage access control
- Security testing: cleanup job reliability and error handling

Dependencies:
- F-002
- F-004

Notes:
- Anonymous briefings not stored
- Security requirements reference: SECURITY_REVIEW.md (M-3, M-8, M-13, M-14)

---

### Feature F-011: AI-assisted NOTAM briefing (paid)

Status:
- planned

Owner:
- Planner – definition
- Architect – AI boundary
- Coder – integration
- Reviewer – safety review
- Tester – output validation

Scope:
- Generate narrative summary from filtered NOTAM set
- Heads-up for key NOTAMs outside window
- Aircraft-type aware (future)

Acceptance Criteria:
- AI output reflects filtered NOTAMs
- Source NOTAMs remain visible
- Clear advisory disclaimer present
- AI service API keys stored in environment variables (not in code)
- NOTAM data validated and sanitized before sending to AI service
- Timeout and error handling implemented for AI service calls
- Circuit breaker pattern implemented for AI service failures

Tests Required:
- AI input selection matches time filter
- Output does not omit critical NOTAMs
- Security testing: API key storage (environment variables, not hardcoded)
- Security testing: input validation and sanitization

Dependencies:
- F-007
- F-008

Notes:
- Paid feature; may be stubbed in MVP
- Security requirements reference: SECURITY_REVIEW.md (M-12)

---

### Feature F-012: Export & sharing

Status:
- done

Owner:
- Planner – definition
- Coder – export implementation
- Tester – access validation

Scope:
- Export raw NOTAMs
- Export categorised view
- Export AI summary (if present)
- Generate private, expiring share links

Acceptance Criteria:
- Exports match on-screen data
- Share links are read-only and expire
- Share link tokens are cryptographically secure and non-guessable (32+ bytes, base64url encoded)
- Share links have expiration timestamps stored in database
- Share link expiration is validated on every access
- Expired share links are hard-deleted from database
- Users can only generate share links for their own briefings

Tests Required:
- Export content accuracy
- Link expiry enforcement
- Security testing: share link token generation (cryptographic randomness, sufficient entropy)
- Security testing: expiration validation and enforcement
- Security testing: authorization checks (share links only for user's own briefings)

Dependencies:
- F-008
- F-011

Notes:
- No public or indexed sharing
- Security requirements reference: SECURITY_REVIEW.md (M-8, M-10)

---

### Feature F-013: Backend test infrastructure migration (Jest to Vitest)

Status:
- done

Owner:
- Planner – definition
- Coder – migration implementation
- Tester – validation

Scope:
- Migrate backend test runner from Jest to Vitest
- Update test configuration files
- Update test imports to use Vitest API instead of Jest
- Remove Jest dependencies
- Ensure all existing backend tests execute successfully with Vitest
- Remove Jest-specific mocks or configurations that are no longer needed

Acceptance Criteria:
- Backend test suite runs successfully with Vitest
- All existing backend tests execute without modification to test logic
- Better Auth ESM modules import successfully in tests
- Test output is clear and useful
- Test scripts in package.json use Vitest commands
- Jest dependencies removed from backend package.json
- Jest configuration files removed

Tests Required:
- All existing backend tests execute and pass with Vitest
- Test imports resolve correctly (Better Auth ESM modules work)
- Test execution time is acceptable
- Test output format is readable

Dependencies:
- F-002 (must exist, F-013 unblocks F-002 testing)

Notes:
- This feature addresses the Jest ESM limitation blocking F-002 backend tests
- Test code in `backend/src/__tests__/` is already correct and should not need changes
- Migration follows recommendation in `backend/TEST_FIXES_NEEDED.md` (Option 1)
- Frontend already uses Vitest, so this migration creates consistency across the codebase
- Reference: `reports/tests/F-002-TEST-REPORT.md` (Issue 1)

---

### Feature F-014: NOTAM block pre-validation and identification

Status:
- done

Owner:
- Planner – definition
- Coder – implementation
- Tester – validation

Scope:
- Implement pre-filtering to identify valid NOTAM blocks before parsing
- Add NOTAM block validation using structural markers (Q-line, field markers A-G)
- Reject text blocks that lack NOTAM structural characteristics
- Filter out non-NOTAM content (flight plans, waypoint data, fuel tables, procedures)
- Preserve existing parsing logic for validated NOTAM blocks

Acceptance Criteria:
- Text blocks without NOTAM field markers (A), (B), (C), (E) or Q-codes are rejected before parsing
- Flight plan text (e.g., ICAO FPL format, waypoint tables) is not treated as NOTAM
- Instrument procedure text is not treated as NOTAM
- ForeFlight PDF non-NOTAM sections (pages 1-15 in example) are correctly filtered out
- Actual NOTAM sections (page 16+ in example) are correctly identified and parsed
- Validation occurs before `parseNotam()` is called on each block
- Rejected blocks do not generate parsing warnings or appear in output
- Statistics about rejected blocks are logged (for debugging, not exposed to user)

Tests Required:
- Unit tests: validate NOTAM block identification logic with positive and negative cases
- Integration tests: ForeFlight PDF example correctly filters non-NOTAM pages
- Golden fixture: compare parsed output from real ForeFlight PDF against expected NOTAMs only
- Negative tests: flight plan text, waypoint tables, fuel calculations are rejected
- Regression tests: existing valid NOTAMs continue to parse correctly

Dependencies:
- F-004 (NOTAM ingestion & raw extraction)
- F-005 (Deterministic NOTAM parsing)

Notes:
- NOTAM structural markers from ICAO Annex 15: Q-line, A), B), C), D), E), F), G)
- Valid NOTAMs must have at minimum: Q-code OR Field A and Field E
- ForeFlight PDFs contain multi-page briefings with flight plan data before NOTAMs section
- Rejection criteria should be strict but not too restrictive (allow for format variations)
- Consider creating `notamBlockValidationService.ts` as a separate service
- Reference: ForeFlight PDF structure analysis (attached)

---

### Feature F-015: NOTAM section boundary detection for PDF extraction

Status:
- done

Owner:
- Planner – definition
- Coder – implementation
- Tester – validation

Scope:
- Detect NOTAM section boundaries in extracted PDF text
- Identify start of NOTAM section using heading markers and structure
- Identify end of NOTAM section (or end of document)
- Extract only text within NOTAM section boundaries for parsing
- Handle multi-section documents (e.g., NOTAMs for multiple locations)

Acceptance Criteria:
- ForeFlight PDF NOTAM sections are correctly identified by heading markers
- Text before NOTAM section (flight plan, fuel, waypoints) is excluded
- Text after NOTAM section (if any) is excluded
- Multi-location NOTAM sections are all included
- Section detection works for common briefing formats (ForeFlight, Garmin Pilot, others)
- If no NOTAM section is detected, entire text is passed to parser (backwards compatible)
- Section boundary detection is logged for debugging

Tests Required:
- Unit tests: section heading recognition with various formats
- Integration tests: ForeFlight PDF correctly identifies NOTAM section starting page 16
- Integration tests: multi-location briefing extracts all NOTAM sections
- Regression tests: plain NOTAM text (no sections) continues to work
- Golden fixture: real ForeFlight PDFs with known section boundaries

Dependencies:
- F-004 (NOTAM ingestion & raw extraction)
- F-014 (NOTAM block pre-validation)

Notes:
- ForeFlight NOTAMs section typically starts with heading "NOTAMs" or "NOTAM" followed by count
- Section may be identified by page breaks, headings, or structural markers
- Common heading patterns: "NOTAMs X of Y", "NOTAM", "NOTICES TO AIRMEN"
- May need heuristic approach: if heading not found, use first valid NOTAM block as section start
- Consider creating `notamSectionDetectionService.ts` as a separate service
- Reference: ForeFlight PDF example (NOTAMs start at page 16 with heading "NOTAMs 1 of 9")

---

### Feature F-016: Enhanced NOTAM splitting logic for multi-NOTAM text

Status:
- done

Owner:
- Planner – definition
- Coder – implementation
- Tester – validation

Scope:
- Improve NOTAM block splitting beyond simple blank-line separation
- Detect NOTAM boundaries using ID patterns (e.g., "A1234/24 NOTAMN")
- Handle NOTAMs with minimal spacing or non-standard formatting
- Support detection of NOTAM cancellation notices (NOTAMC, NOTAMR)
- Preserve backwards compatibility with simple blank-line splitting

Acceptance Criteria:
- NOTAMs separated by single blank line are correctly split (existing behaviour preserved)
- NOTAMs with NOTAM ID headers but no blank lines are correctly split
- NOTAM ID patterns recognized: letter(s) + digits + "/" + year + space + NOTAM type
- NOTAM type markers recognized: NOTAMN (new), NOTAMC (cancel), NOTAMR (replace)
- Consecutive NOTAMs in dense format (ForeFlight, FAA) are correctly separated
- Each split block contains exactly one NOTAM's worth of content
- Splitting logic does not incorrectly split within a single NOTAM's Field E content

Tests Required:
- Unit tests: splitting logic with various NOTAM separators and formats
- Integration tests: ForeFlight PDF multi-NOTAM page correctly splits into individual NOTAMs
- Golden fixture: known multi-NOTAM text produces correct count of parsed NOTAMs
- Edge cases: NOTAMs with embedded ID-like patterns in Field E text
- Regression tests: simple blank-line separated NOTAMs continue to work

Dependencies:
- F-005 (Deterministic NOTAM parsing)
- F-014 (NOTAM block pre-validation)

Notes:
- Current implementation splits only on blank lines (`\n\s*\n`)
- NOTAM IDs typically follow pattern: `[A-Z]+\d+/\d+` (e.g., "A1234/24", "E3201/25")
- NOTAM ID is often followed by NOTAM type: NOTAMN, NOTAMC, NOTAMR
- Must avoid splitting mid-NOTAM if Field E contains text matching ID pattern
- May need to look for ID pattern at start of line plus presence of Field markers
- Consider using combined heuristic: ID pattern + presence of Q-code or Field A
- Reference: ICAO Annex 15 NOTAM format specification
