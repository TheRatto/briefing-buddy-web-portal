# ADR-002: Application Architecture

## Title
Traditional web application architecture with separate frontend and backend

## Status
Accepted

## Context

The BriefingBuddy Web Portal must support:

- User-facing web interface (desktop-first, mobile-supported)
- Secure user authentication
- PDF upload and processing (server-side)
- NOTAM parsing and categorization (server-side business logic)
- Data persistence (user accounts, briefings, NOTAMs)
- API endpoints for AI service integration
- Real-time filtering and state management in the UI
- Export and sharing features

The PRD specifies:
- Desktop-first design (responsive to mobile)
- No offline support requirement
- Stored briefing history (90 days)
- Private, expiring share links

The system needs to handle:
- File uploads (PDFs)
- Long-running processing tasks (PDF extraction, NOTAM parsing)
- Stateful user sessions
- Secure access control

## Decision

We will use a **traditional web application architecture** with clear separation between frontend and backend:

- **Frontend**: Single Page Application (SPA) built with React and TypeScript
- **Backend**: RESTful API server built with Node.js/TypeScript (Express.js or Fastify)
- **Communication**: HTTP/JSON over HTTPS
- **Authentication**: Token-based (JWT) with HTTP-only cookies for session management
- **File Storage**: Object storage service (S3-compatible) for PDFs
- **Database**: Relational database (PostgreSQL) for structured data

The architecture follows a request-response pattern with the frontend making API calls to the backend. Server-side rendering is not required for the MVP.

## Consequences

### Positive Consequences

1. **Clear separation of concerns**: Frontend handles UI/UX, backend handles business logic and data access.

2. **Scalability**: Frontend and backend can be scaled independently based on load patterns.

3. **Security**: Sensitive operations (PDF parsing, NOTAM categorization, AI integration) run server-side, reducing exposure of business logic.

4. **Deployment flexibility**: Frontend can be served from CDN, backend from containerized services, enabling optimal performance and cost.

5. **Technology flexibility**: Frontend and backend can evolve independently (e.g., upgrade React without affecting backend).

6. **Standard patterns**: RESTful APIs are well-understood, making integration and debugging straightforward.

7. **Developer experience**: Clear boundaries make code organization and testing easier.

### Negative Consequences

1. **Network latency**: Every user action requires a round-trip to the server, though this is acceptable for the desktop-first, non-real-time use case.

2. **State synchronization**: Frontend state must be kept in sync with backend state, requiring careful state management.

3. **Deployment complexity**: Two separate applications to deploy, monitor, and maintain (though containerization mitigates this).

4. **CORS configuration**: Must properly configure CORS for frontend-backend communication if served from different origins.

5. **SEO limitations**: SPA architecture requires client-side rendering, but this is acceptable since the portal requires authentication and is not public-facing.

### Trade-offs Accepted

1. **SPA over SSR**: Accepting client-side rendering limitations for the benefits of modern React development patterns and faster subsequent page navigation.

2. **REST over GraphQL**: Using REST for simplicity and standard tooling, accepting that some requests may fetch more data than needed (acceptable for MVP).

3. **Separate services over monolith**: Accepting deployment complexity for improved scalability and maintainability.

## Alternatives Considered

### Alternative 1: Server-Side Rendered (SSR) Application

**Description**: Use Next.js or similar framework with server-side rendering.

**Reasons for rejection**:
- Adds complexity for features that don't require SSR (authentication-gated, not public SEO)
- Increased server load and deployment complexity
- MVP requirements don't benefit from SSR (desktop-first, authenticated users)
- Can be added later if needed without major refactoring

### Alternative 2: Monolithic Application

**Description**: Single application that serves both HTML and API endpoints.

**Reasons for rejection**:
- Less flexible scaling (UI and API scale together)
- Mixing concerns (templating and business logic)
- Harder to optimize frontend delivery (CDN, caching)
- Modern development practices favor separation

### Alternative 3: GraphQL API

**Description**: Use GraphQL instead of REST for backend API.

**Reasons for rejection**:
- Adds complexity and learning curve
- Overkill for MVP requirements (no complex data fetching patterns)
- REST is sufficient and simpler
- Can migrate to GraphQL later if needed without changing frontend architecture

### Alternative 4: Microservices Architecture

**Description**: Split backend into multiple services (auth service, NOTAM service, PDF service, etc.).

**Reasons for rejection**:
- Over-engineering for MVP scope
- Increased operational complexity (service discovery, inter-service communication, distributed debugging)
- Can be refactored into microservices later as requirements grow
- Single backend service is sufficient for MVP scale

## Notes

- Frontend framework: React 18+ with TypeScript
- Backend framework: Express.js or Fastify (decision deferred to implementation)
- API versioning: `/api/v1/` prefix for future-proofing
- Authentication mechanism will be detailed in ADR-004
- Storage architecture will be detailed in ADR-003
- The architecture is designed to be reversible—components can be extracted into services later if needed
