# ADR-006: Authentication Framework Selection

## Title
Use Better Auth framework instead of manual JWT implementation

## Status
Accepted

## Context

ADR-004 selected a manual JWT-based authentication approach using `jsonwebtoken` library, bcrypt for password hashing, and custom cookie management. However, [Better Auth](https://www.better-auth.com) was not evaluated as an alternative.

Better Auth is a TypeScript-first authentication framework that provides:
- Built-in email/password authentication
- PostgreSQL database integration (via connection pool)
- HTTP-only cookie support with JWT
- Framework-agnostic design (React, Vue, Svelte, etc.)
- Security best practices (password hashing, CSRF protection, etc.)
- Active development and community (24.6K+ GitHub stars)
- Plugin ecosystem for extensibility

The project requirements from PRD.md and ADR-004:
- Email + password authentication
- Secure session management
- Support for anonymous usage
- Single-user accounts (MVP)
- PostgreSQL database (per ADR-003)
- TypeScript implementation (per ADR-001)
- React frontend (per ADR-002)

Manual implementation would require:
- Custom password hashing (bcrypt/Argon2)
- Custom JWT generation and validation
- Custom cookie management
- Custom database schema for users and sessions
- Manual implementation of security best practices
- Significant implementation and testing effort

## Decision

We will use **Better Auth** as the authentication framework instead of manual JWT implementation.

Better Auth will handle:
- User signup and login endpoints
- Password hashing and storage
- Session management (JWT-based with HTTP-only cookies)
- Database schema for users and sessions
- Security features (CSRF protection, secure cookies, etc.)
- TypeScript type definitions

This decision supersedes the implementation approach described in ADR-004, while maintaining the same architectural goals (stateless JWT authentication with HTTP-only cookies).

## Consequences

### Positive Consequences

1. **Reduced implementation time**: Pre-built authentication endpoints and logic eliminate weeks of development and testing effort.

2. **Improved security**: Better Auth implements security best practices by default (password hashing, CSRF protection, secure cookie settings, rate limiting) that would require careful manual implementation.

3. **Maintained codebase**: Active development and security updates from Better Auth maintainers reduce long-term maintenance burden.

4. **Type safety**: TypeScript-first design provides excellent type safety and IDE support.

5. **Database integration**: Native PostgreSQL support via connection pool aligns with ADR-003 storage strategy.

6. **Framework compatibility**: Framework-agnostic design works seamlessly with React frontend (per ADR-002).

7. **Extensibility**: Plugin ecosystem allows adding features (2FA, OAuth, etc.) later without architectural changes.

8. **Community support**: Large, active community provides examples, troubleshooting, and best practices.

9. **Testing**: Framework is already tested, reducing need for extensive custom authentication testing.

10. **Consistency**: Standard authentication patterns reduce cognitive load for developers.

### Negative Consequences

1. **Dependency addition**: Adds external dependency that must be maintained and monitored for security updates.

2. **Learning curve**: Team must learn Better Auth API and patterns (though simpler than building from scratch).

3. **Less control**: Framework abstraction means less fine-grained control over authentication internals (though customization is possible).

4. **Framework risk**: Dependency on third-party project's continued maintenance (mitigated by active development and large community).

5. **Potential over-engineering**: Framework includes features not needed for MVP (plugins, OAuth, etc.), but this is acceptable as unused features don't impact performance.

6. **Migration complexity**: If Better Auth is replaced later, migration would require more effort than replacing custom code (though unlikely given framework stability).

### Trade-offs Accepted

1. **Framework over custom implementation**: Accepting external dependency and reduced control for significantly reduced implementation time and improved security.

2. **Less code ownership over faster delivery**: Accepting that authentication code is maintained by Better Auth team rather than our team, in exchange for faster MVP delivery and better security.

3. **Feature richness over minimalism**: Accepting that Better Auth includes features beyond MVP needs (OAuth, 2FA plugins) for the benefits of a well-tested, maintained framework.

## Alternatives Considered

### Alternative 1: Stick with Manual JWT Implementation (ADR-004)

**Description**: Continue with manual JWT implementation using `jsonwebtoken`, bcrypt, and custom cookie management.

**Reasons for rejection**:
- Requires significant implementation and testing effort (weeks of work)
- Higher risk of security vulnerabilities in custom implementation
- More code to maintain long-term
- Reinvents features Better Auth provides out-of-the-box
- No clear benefit over using a well-maintained framework

### Alternative 2: NextAuth.js / Auth.js

**Description**: Use NextAuth.js (now Auth.js) for authentication.

**Reasons for rejection**:
- Originally designed for Next.js (adds framework coupling, though now framework-agnostic)
- More complex configuration and setup
- Better Auth has simpler API and better TypeScript support
- Better Auth has more active recent development and clearer documentation

### Alternative 3: Clerk / Auth0 / Supabase Auth

**Description**: Use managed authentication service (SaaS).

**Reasons for rejection**:
- Adds external service dependency and cost
- Less control over user data and authentication flow
- Vendor lock-in risk
- PRD suggests self-hosted approach (not explicitly required, but implied)
- Better Auth provides similar features without SaaS dependency

### Alternative 4: Custom Implementation with Passport.js

**Description**: Use Passport.js middleware with custom strategies.

**Reasons for rejection**:
- Passport.js requires significant configuration and middleware setup
- Still requires manual password hashing, session management, database schema
- More boilerplate than Better Auth
- Less TypeScript-native design
- Better Auth provides simpler, more integrated solution

## Notes

- Better Auth version: Latest stable (check at implementation time)
- Database: Better Auth uses existing PostgreSQL connection (per ADR-003)
- Anonymous access: Handle via Better Auth session state or application-level logic (framework supports unauthenticated routes)
- Cookie configuration: Better Auth handles HTTP-only, secure, and SameSite cookie settings automatically
- Migration from ADR-004: ADR-004's architectural goals (JWT, HTTP-only cookies, stateless design) remain valid; only implementation approach changes from manual to framework-based
- Security review: Better Auth addresses security review mitigations (SECURITY_REVIEW.md M-1: password hashing, M-2: JWT security, M-7: CSRF protection) through framework defaults. Better Auth usage still triggers Security Reviewer per WORKFLOW.md, but reduces scope of security concerns (framework handles most security aspects)
- Future enhancements: Better Auth plugins can add OAuth, 2FA, organization support if needed without changing core architecture
- Reference: [Better Auth Documentation](https://www.better-auth.com), [Better Auth GitHub](https://github.com/better-auth/better-auth)

