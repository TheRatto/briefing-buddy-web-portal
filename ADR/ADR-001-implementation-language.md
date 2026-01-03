# ADR-001: Implementation Language Selection

## Title
Select TypeScript/JavaScript as the primary implementation language

## Status
Accepted

## Context

The BriefingBuddy Web Portal requires:

- A web-based user interface (desktop-first, mobile-supported)
- PDF processing capabilities (ForeFlight briefing PDFs)
- Server-side NOTAM parsing and categorization logic
- User authentication and session management
- Data persistence (90-day briefing history)
- Integration with AI services for paid briefing summaries
- RESTful API endpoints

The project already contains Dart code in `lib/` that implements NOTAM parsing and categorization logic from the BriefingBuddy iOS app. FEATURES.md specifies that web portal logic must match the Dart implementation exactly for:
- NOTAM parsing (ICAO field extraction)
- NOTAM categorization (Q-code mapping and keyword-based fallback)
- Time window filtering (interval overlap logic)
- FIR NOTAM grouping

The PRD explicitly defers implementation language selection to the Architect role, leaving the decision open.

## Decision

We will use **TypeScript** as the primary implementation language for both frontend and backend:

- **Frontend**: React with TypeScript
- **Backend**: Node.js with TypeScript (Express.js or Fastify)
- **Runtime**: Node.js v20+ (LTS)

This decision applies to all new code written for the web portal. The existing Dart code in `lib/` remains as a reference implementation and behavioral specification.

## Consequences

### Positive Consequences

1. **Web ecosystem alignment**: TypeScript/JavaScript has mature, widely-adopted libraries for PDF processing, authentication, database access, and web UI frameworks.

2. **Developer experience**: TypeScript provides type safety while maintaining JavaScript's flexibility, reducing runtime errors and improving IDE support.

3. **Deployment simplicity**: Single language across the stack simplifies deployment, debugging, and code sharing (e.g., shared types between frontend and backend).

4. **Ecosystem maturity**: Rich package ecosystem (npm) for:
   - PDF parsing (pdf-parse, pdf.js)
   - Authentication (Passport.js, NextAuth)
   - Database clients (Prisma, TypeORM, pg)
   - React UI libraries
   - Testing frameworks (Jest, Vitest)

5. **Performance**: Node.js is well-suited for I/O-heavy operations (PDF parsing, database queries, API calls) required by the web portal.

6. **Hiring and maintenance**: TypeScript/JavaScript developers are widely available.

### Negative Consequences

1. **Logic porting required**: Dart NOTAM logic must be carefully ported to TypeScript, requiring:
   - Manual translation of business rules
   - Comprehensive test fixtures to verify exact behavioral match
   - Ongoing synchronization risk if Dart code evolves

2. **No direct code reuse**: Cannot directly import or compile Dart code for use in the web portal, unlike a Flutter Web approach.

3. **Potential translation errors**: Porting complex logic (Q-code mappings, keyword weights, time filtering) risks introducing subtle behavioral differences that may only be discovered through testing.

4. **Dual codebase maintenance**: Business logic exists in two languages, potentially requiring updates in both places if rules change.

### Trade-offs Accepted

1. **Porting effort over code reuse**: Accepting the porting work to gain the benefits of a mature web technology stack.

2. **Test-driven porting**: Using test fixtures and golden file comparisons to ensure behavioral equivalence, rather than attempting automated translation.

3. **Documentation dependency**: Relying on the Dart code as a reference specification, accepting that future changes may require manual updates in both codebases.

## Alternatives Considered

### Alternative 1: Flutter Web

**Description**: Use Flutter Web to build the portal, allowing direct reuse of existing Dart code.

**Reasons for rejection**:
- Flutter Web has performance and SEO limitations compared to traditional web frameworks
- Larger bundle sizes impact initial load time
- Less mature web-specific features (accessibility, browser integration)
- Desktop-first requirement favors traditional web approaches
- Limited ecosystem for PDF processing and server-side operations
- Would require a Dart server runtime (Aqueduct, Shelf) which is less common

### Alternative 2: Python (FastAPI/Django Backend + React Frontend)

**Description**: Use Python for backend services with React frontend.

**Reasons for rejection**:
- Adds language split between frontend (TypeScript) and backend (Python)
- Python PDF libraries are less mature than JavaScript options
- Still requires porting Dart logic to Python
- Deployment complexity with multiple runtimes
- Less type safety without TypeScript

### Alternative 3: Pure JavaScript (no TypeScript)

**Description**: Use JavaScript for both frontend and backend.

**Reasons for rejection**:
- Lacks type safety benefits, increasing risk of errors when porting complex logic
- Reduced IDE support and developer experience
- Higher risk of subtle bugs in NOTAM parsing logic without compile-time checks

### Alternative 4: Dart Server + Dart Web (Shelf/Aqueduct)

**Description**: Use Dart for both server and client, porting UI to Flutter Web.

**Reasons for rejection**:
- Same limitations as Flutter Web (performance, SEO, bundle size)
- Smaller ecosystem for web-specific requirements (PDF parsing, authentication providers)
- Limited deployment options and hosting support compared to Node.js
- Developer availability and community support is smaller

## Notes

- TypeScript version: 5.0+ (strict mode enabled)
- Node.js version: 20.x LTS (or latest LTS at project start)
- The Dart code in `lib/` serves as the behavioral specification for NOTAM logic
- Porting strategy will be documented in a separate ADR (ADR-005)
- If significant behavioral discrepancies are discovered during porting, they must be resolved by adjusting the TypeScript implementation to match Dart behavior
