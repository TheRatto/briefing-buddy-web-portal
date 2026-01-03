# Architecture

## System Overview

The BriefingBuddy Web Portal is a web-based application that helps pilots review and understand NOTAMs (Notices to Airmen) by providing structured, time-aware categorization and filtering. The system processes PDF briefings or pasted NOTAM text, extracts and parses NOTAMs, categorizes them by operational significance, and presents them with time-based filtering and visual emphasis.

The portal serves as a desktop-first web complement to the BriefingBuddy iOS app, focusing on PDF-based workflows and desktop review experiences.

## High-Level Architecture

The system follows a traditional web application architecture with clear separation between frontend and backend:

- **Frontend**: Single Page Application (SPA) built with React and TypeScript, served statically
- **Backend**: RESTful API server built with Node.js and TypeScript
- **Storage**: PostgreSQL for structured data, S3-compatible object storage for PDF files
- **Authentication**: JWT-based stateless authentication with HTTP-only cookies

The architecture enables independent scaling of frontend and backend components and follows standard web application patterns for security and maintainability.

## Component Responsibilities

### Frontend (React Application)

**Responsibilities:**
- User interface rendering and interaction
- Form handling (PDF upload, NOTAM text paste)
- Client-side state management (filtering, UI state)
- API communication with backend
- User authentication UI (login, signup)
- Visual presentation of categorized NOTAMs

**Key Constraints:**
- No business logic (NOTAM parsing/categorization happens server-side)
- Stateless UI components (data fetched from backend)
- Responsive design (desktop-first, mobile-supported)

### Backend API Server

**Responsibilities:**
- User authentication and authorization
- PDF upload handling and processing
- NOTAM parsing (ICAO field extraction)
- NOTAM categorization (Q-code mapping, keyword-based classification)
- Time window filtering logic
- Database operations (briefings, NOTAMs, users)
- File storage operations (PDF uploads to object storage)
- AI service integration (for paid briefing summaries)

**Key Constraints:**
- Stateless design (JWT authentication, no server-side sessions)
- Business logic must match Dart reference implementation exactly
- All NOTAM processing happens server-side

### Database (PostgreSQL)

**Responsibilities:**
- Store user accounts and authentication data
- Store briefing metadata and associations
- Store parsed NOTAM records with all fields
- Store share link records with expiration
- Store AI-generated summaries (if applicable)

**Key Constraints:**
- 90-day retention policy (automated cleanup required)
- Relational integrity (foreign keys, constraints)
- Indexed queries for performance (by user, date, ICAO)

### Object Storage (S3-compatible)

**Responsibilities:**
- Store original PDF files uploaded by users
- Provide secure file access via signed URLs if needed
- Enable efficient file retrieval for exports

**Key Constraints:**
- Files associated with briefings via database foreign keys
- Cleanup must run in tandem with database cleanup (90-day retention)

## Data Flow

1. **User Authentication Flow:**
   - User submits email + password via frontend
   - Frontend calls Better Auth signup/login endpoints
   - Better Auth validates credentials, hashes password, generates JWT
   - Better Auth sets JWT as HTTP-only cookie in response
   - Subsequent requests include cookie automatically
   - Better Auth middleware validates JWT on protected routes

2. **Briefing Submission Flow:**
   - User uploads PDF or pastes NOTAM text via frontend
   - Frontend sends file/text to backend API
   - Backend stores PDF in object storage (if applicable)
   - Backend extracts NOTAM text from PDF (if applicable)
   - Backend parses NOTAMs (ICAO field extraction)
   - Backend categorizes NOTAMs (Q-code mapping, keyword scoring)
   - Backend stores briefing and NOTAM records in database
   - Backend returns categorized NOTAMs to frontend
   - Frontend displays grouped and filtered NOTAMs

3. **Time Filtering Flow:**
   - User selects time window (6h/12h/24h/All) via UI
   - Frontend sends filter parameters to backend (or filters client-side on cached data)
   - Backend applies time window filtering logic (interval overlap rule)
   - Filtered NOTAMs returned to frontend for display

4. **Briefing History Flow:**
   - User requests past briefings
   - Backend queries database for user's briefings (within 90-day window)
   - Backend returns briefing metadata and NOTAMs
   - Frontend displays briefing list and details

## Architectural Constraints

### Technology Constraints

- **Language**: TypeScript for all new code (see ADR-001)
- **Runtime**: Node.js v20+ LTS for backend
- **Frontend Framework**: React 18+ with TypeScript
- **Database**: PostgreSQL 15+
- **Object Storage**: S3-compatible service
- **Authentication**: Better Auth framework with JWT tokens and HTTP-only cookies (see ADR-006, supersedes ADR-004)

### Behavioral Constraints

- **NOTAM Logic Matching**: All NOTAM parsing, categorization, and filtering logic must match the Dart reference implementation in `lib/` exactly (see ADR-005)
- **Time Filtering Rule**: NOTAM inclusion follows strict interval overlap rule: `validFrom < windowEnd AND validTo > now` (see FEATURES.md F-007)
- **Data Retention**: Briefings automatically deleted after 90 days (see PRD.md)

### Security Constraints

- **Password Storage**: Better Auth handles password hashing automatically (addresses SECURITY_REVIEW.md M-1)
- **Token Storage**: Better Auth stores JWTs in HTTP-only cookies (not localStorage)
- **JWT Security**: Better Auth implements secure JWT configuration (expiration, strong secrets, cookie settings) (addresses SECURITY_REVIEW.md M-2)
- **CSRF Protection**: Better Auth provides CSRF protection via secure cookie configuration (addresses SECURITY_REVIEW.md M-7)
- **File Upload**: PDF files validated and processed server-side
- **Anonymous Access**: Anonymous users cannot store briefings (application-level constraint)
- **Authentication Framework**: Better Auth provides security best practices (CSRF protection, secure cookies, rate limiting)

### Deployment Constraints

- **Stateless Backend**: Backend must be stateless (no server-side sessions, enables horizontal scaling)
- **CORS Configuration**: Frontend and backend may be served from different origins (requires CORS configuration)
- **HTTPS Required**: Production must use HTTPS (secure cookies, API security)

## Referenced ADRs

- [ADR-001: Implementation Language Selection](./ADR/ADR-001-implementation-language.md) - TypeScript/JavaScript choice
- [ADR-002: Application Architecture](./ADR/ADR-002-application-architecture.md) - Frontend/backend separation
- [ADR-003: Data Storage Strategy](./ADR/ADR-003-data-storage-strategy.md) - PostgreSQL + object storage
- [ADR-004: Authentication Approach](./ADR/ADR-004-authentication-approach.md) - JWT-based authentication (superseded)
- [ADR-006: Authentication Framework Selection](./ADR/ADR-006-authentication-framework-selection.md) - Better Auth framework selection
- [ADR-005: NOTAM Logic Porting Strategy](./ADR/ADR-005-notam-logic-porting-strategy.md) - Test-driven porting approach

## Non-Goals

This document does not cover:

- Detailed API endpoint specifications (implementation detail)
- Database schema design (implementation detail)
- Frontend component structure (implementation detail)
- Deployment configuration (infrastructure detail)
- Third-party service integrations (AI providers, email services) beyond high-level approach
- Performance optimization strategies (implementation detail)
- Future architectural enhancements (microservices, GraphQL, etc.)

