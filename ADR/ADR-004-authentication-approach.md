# ADR-004: Authentication Approach

## Title
JWT-based stateless authentication with HTTP-only cookies

## Status
Superseded by ADR-006

## Context

The BriefingBuddy Web Portal requires:

- Self-serve user signup and login
- Email + password authentication (or equivalent simple auth)
- Secure session management
- Support for anonymous usage (limited, non-persistent)
- Single-user accounts only (MVP)
- Session persistence across page refreshes
- Secure token storage (not exposed to XSS)

The PRD specifies:
- Self-serve signup
- Email + password authentication
- Anonymous users can submit briefings but cannot save history
- Single-user accounts (no organization support in MVP)

Security requirements:
- Password storage must be hashed (not plaintext)
- Tokens must be secure from XSS attacks
- Session must expire appropriately
- Must support logout functionality

## Decision

We will use **JWT-based stateless authentication** with the following approach:

- **Token format**: JSON Web Tokens (JWT)
- **Token storage**: HTTP-only cookies (not localStorage or sessionStorage)
- **Password hashing**: bcrypt (or Argon2) with appropriate salt rounds
- **Token expiration**: Access tokens expire after 24 hours; refresh tokens expire after 7 days (if refresh mechanism is implemented for MVP)
- **Anonymous access**: Special session token or null authentication (handled in application logic)

Authentication flow:
1. User signs up or logs in with email + password
2. Server validates credentials and generates JWT
3. Server sets JWT as HTTP-only cookie in response
4. Client sends cookie automatically with subsequent requests
5. Server validates JWT on protected routes
6. Anonymous users access routes without authentication token (handled by application logic)

## Consequences

### Positive Consequences

1. **Stateless scalability**: No server-side session storage required, enabling horizontal scaling without session affinity.

2. **XSS protection**: HTTP-only cookies are not accessible to JavaScript, preventing token theft via XSS attacks.

3. **CSRF protection**: Cookies are automatically sent with requests, but CSRF tokens can be added if needed (or SameSite cookie attribute used).

4. **Standard implementation**: JWT is a well-understood standard with good library support.

5. **Token payload flexibility**: JWT can contain user ID, roles, and other claims, reducing database lookups.

6. **Simple logout**: Clear the cookie (no server-side session invalidation needed, though token blacklist can be added if needed).

7. **Cross-origin support**: Can configure CORS and cookie settings for frontend-backend separation.

### Negative Consequences

1. **Token revocation complexity**: JWT tokens are valid until expiration; cannot easily revoke individual tokens without maintaining a blacklist (adds state).

2. **No server-side logout**: Logout only clears client-side cookie; token remains valid until expiration (acceptable for MVP, can add blacklist later).

3. **Cookie size limitations**: Cookies have size limits (~4KB), but JWT payload should remain small (user ID, email, basic claims).

4. **CSRF risk**: Cookies are automatically sent, requiring CSRF protection (SameSite cookie attribute or CSRF tokens).

5. **Token payload exposure**: JWT payload is base64-encoded (not encrypted), so sensitive data should not be stored in tokens.

### Trade-offs Accepted

1. **Stateless over stateful sessions**: Accepting token revocation limitations for scalability and simplicity benefits.

2. **Cookie over localStorage**: Accepting cookie limitations (size, CSRF considerations) for XSS protection benefits.

3. **Simple expiration over refresh tokens**: For MVP, 24-hour token expiration is acceptable; refresh token mechanism can be added later if needed.

## Alternatives Considered

### Alternative 1: Session-based Authentication (Server-Side Sessions)

**Description**: Store session IDs in cookies, maintain session data in server memory or database.

**Reasons for rejection**:
- Requires server-side session storage (Redis, database, or memory)
- Needs sticky sessions or shared session store for horizontal scaling
- More complex infrastructure requirements
- HTTP-only cookies still used, so no additional security benefit

### Alternative 2: JWT in localStorage

**Description**: Store JWT in localStorage or sessionStorage, send via Authorization header.

**Reasons for rejection**:
- Vulnerable to XSS attacks (malicious JavaScript can read tokens)
- Requires manual token management in frontend code
- Less secure than HTTP-only cookies
- No automatic cookie handling benefits

### Alternative 3: OAuth2 / Third-Party Auth (Google, GitHub, etc.)

**Description**: Use OAuth2 providers for authentication instead of email/password.

**Reasons for rejection**:
- PRD specifies email + password as requirement
- Adds external dependency and complexity
- Users may prefer not to link third-party accounts
- Can be added later as additional auth option without changing core approach

### Alternative 4: API Keys / Bearer Tokens

**Description**: Use long-lived API keys sent via Authorization header.

**Reasons for rejection**:
- Not appropriate for user-facing web application
- No expiration mechanism (security risk)
- Requires manual token management
- Not user-friendly (users cannot easily manage keys)

## Notes

- JWT library: `jsonwebtoken` (Node.js) or similar
- Password hashing: bcrypt with 10+ salt rounds (or Argon2 if preferred)
- Cookie settings:
  - `httpOnly: true` (prevent JavaScript access)
  - `secure: true` (HTTPS only in production)
  - `sameSite: 'strict'` or `'lax'` (CSRF protection)
  - `maxAge`: 24 hours (or match token expiration)
- Token payload should include: `userId`, `email`, `iat` (issued at), `exp` (expiration)
- Anonymous access: Handle via absence of authentication cookie or special anonymous token
- Security review: Authentication implementation will trigger Security Reviewer per WORKFLOW.md (external input, credentials handling)
- Future enhancements: Refresh tokens, token blacklist, OAuth2 providers can be added without changing core architecture

**Note**: This ADR has been superseded by ADR-006, which selects Better Auth framework instead of manual JWT implementation. The architectural goals (JWT, HTTP-only cookies, stateless design) remain valid, but the implementation approach now uses Better Auth rather than manual implementation.
