# ADR-003: Data Storage Strategy

## Title
Hybrid storage: PostgreSQL for structured data, object storage for PDFs

## Status
Accepted

## Context

The BriefingBuddy Web Portal requires storage for:

- **User accounts**: Email, password hashes, profile data
- **Briefings**: Metadata, creation timestamps, user associations
- **NOTAMs**: Structured data (Q-codes, dates, ICAO codes, categories, parsed fields)
- **Original PDFs**: Binary files uploaded by users
- **Extracted raw text**: NOTAM text extracted from PDFs
- **AI outputs**: Generated briefing summaries (paid feature)
- **Share links**: Expiring links to briefings

Requirements:
- 90-day retention policy for briefings
- Authenticated users can store briefings; anonymous users cannot
- PDF files may be large (ForeFlight briefings can be several MB)
- NOTAM data is structured (fields, categories, relationships)
- Need to query briefings by user, date, ICAO code
- Share links require expiration tracking

The PRD specifies:
- Briefings stored for 90 days
- Anonymous briefings are not stored
- Original PDFs must be preserved

## Decision

We will use a **hybrid storage approach**:

- **Relational Database (PostgreSQL)**: Store all structured data (users, briefings, NOTAMs, share links, metadata)
- **Object Storage (S3-compatible)**: Store binary files (PDFs)

PostgreSQL will store:
- User accounts and authentication data
- Briefing metadata (id, user_id, created_at, etc.)
- NOTAM records with all parsed fields
- Share link records with expiration timestamps
- AI summary text (if generated)
- Extracted raw text from PDFs (as text fields)

Object storage will store:
- Original PDF files
- Associated with briefing via foreign key reference in database

Data retention:
- Automated cleanup job will delete briefings and associated records older than 90 days
- Object storage cleanup will run in tandem with database cleanup

## Consequences

### Positive Consequences

1. **Optimal storage fit**: PostgreSQL excels at structured queries (NOTAMs by category, briefings by user/date), while object storage is efficient for large binary files.

2. **Cost efficiency**: Storing PDFs in object storage is cheaper than database BLOBs, especially at scale.

3. **Query performance**: PostgreSQL indexes enable fast queries on structured NOTAM and briefing data.

4. **Scalability**: Object storage scales independently for file storage; PostgreSQL can be scaled separately for query performance.

5. **Backup and recovery**: Well-established patterns for both PostgreSQL and S3-compatible storage.

6. **Flexibility**: PostgreSQL JSONB columns can store flexible data structures if needed (e.g., parsing metadata, error logs).

7. **Data integrity**: Foreign keys and transactions ensure consistency between briefings and NOTAMs.

### Negative Consequences

1. **Operational complexity**: Two storage systems to manage, monitor, and backup.

2. **Transaction boundaries**: Cannot use database transactions to atomically delete PDFs and database records (requires eventual consistency or two-phase operations).

3. **Orphaned files risk**: If database cleanup runs but object storage cleanup fails, PDFs may remain in storage (mitigated by cleanup job design).

4. **Query limitations**: Cannot join across database and object storage in a single query (must fetch file URLs separately).

5. **Additional dependencies**: Requires both PostgreSQL and S3-compatible storage (increased infrastructure requirements).

### Trade-offs Accepted

1. **Eventual consistency over atomicity**: Accepting that PDF deletion may lag database deletion slightly, in exchange for simpler architecture and cost efficiency.

2. **Two storage systems over one**: Accepting operational complexity for optimal performance and cost characteristics of each storage type.

3. **Manual cleanup job over TTL**: Implementing scheduled cleanup rather than relying on storage TTL features, for better control and auditability.

## Alternatives Considered

### Alternative 1: PostgreSQL Only (with BLOBs)

**Description**: Store everything in PostgreSQL, including PDFs as BYTEA/BLOB columns.

**Reasons for rejection**:
- Database size grows quickly with binary files
- Poor performance for large file operations
- Expensive database storage costs
- Database backups become very large
- Not optimal use of PostgreSQL (designed for structured data)

### Alternative 2: Object Storage Only

**Description**: Store all data (structured and binary) in object storage as JSON files.

**Reasons for rejection**:
- No efficient querying (cannot query NOTAMs by category without loading all files)
- No relational integrity (cannot enforce foreign keys)
- Complex to implement transactional updates
- Poor performance for filtering and searching
- No standard authentication/authorization patterns

### Alternative 3: MongoDB / Document Database

**Description**: Use MongoDB for both structured data and file storage (GridFS).

**Reasons for rejection**:
- Less mature ecosystem for Node.js/TypeScript ORMs
- Weaker query capabilities for complex NOTAM filtering
- GridFS has limitations for large files
- Team familiarity with PostgreSQL is higher
- PostgreSQL JSONB provides document-like flexibility when needed

### Alternative 4: Multi-Database (PostgreSQL + Redis)

**Description**: PostgreSQL for persistent data, Redis for caching and sessions.

**Reasons for rejection**:
- Redis adds complexity without clear benefit for MVP
- Session storage can be handled by JWT tokens (stateless)
- Caching can be added later if performance issues arise
- Not addressing the core storage question (structured data vs. files)

## Notes

- PostgreSQL version: 15+ (latest stable)
- Object storage: S3-compatible (AWS S3, MinIO for local development, or compatible service)
- Database schema design will be done during implementation
- Cleanup job frequency: Daily (configurable)
- Object storage bucket policies: Configure lifecycle rules as backup to application-level cleanup
- Migration strategy: Will need to migrate existing data if porting from another system (not applicable for greenfield)
- Backup strategy: Daily PostgreSQL backups; object storage versioning/enabled for critical files
