# Backend Setup Guide

## Prerequisites

1. **PostgreSQL** - Database server
2. **Node.js** v20+ LTS
3. **npm** or **yarn**

## Step 1: Install PostgreSQL

### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Create Database

1. Connect to PostgreSQL:
```bash
psql postgres
```

2. Create database and user:
```sql
CREATE DATABASE briefing_buddy;
CREATE USER briefing_buddy_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE briefing_buddy TO briefing_buddy_user;
\q
```

3. Test connection:
```bash
psql -U briefing_buddy_user -d briefing_buddy
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update the values:
```bash
# Update DATABASE_URL with your actual credentials
DATABASE_URL=postgresql://briefing_buddy_user:your_secure_password@localhost:5432/briefing_buddy

# Generate a secure secret for Better Auth
# Run: openssl rand -base64 32
BETTER_AUTH_SECRET=<paste-your-generated-secret-here>

# Set your URLs
BETTER_AUTH_URL=http://localhost:3005
FRONTEND_URL=http://localhost:3004
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Generate Database Schema

Better Auth will generate the necessary database tables:

```bash
npx @better-auth/cli@latest generate
```

This creates the SQL migration file. Review it if needed.

## Step 6: Apply Database Migrations

```bash
npx @better-auth/cli@latest migrate
```

Or manually apply the generated SQL:
```bash
psql -U briefing_buddy_user -d briefing_buddy < .better-auth/schema.sql
```

## Step 7: Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:3005`

## Troubleshooting

### PostgreSQL connection issues
- Verify PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check connection string format: `postgresql://user:password@host:port/database`
- Test connection manually: `psql -U your_user -d briefing_buddy`

### Better Auth CLI errors
- Ensure dependencies are installed: `npm install`
- Check that `.env` file exists and has correct values
- Verify `DATABASE_URL` is correct and database exists

### Permission errors
- Ensure database user has proper privileges
- Check PostgreSQL authentication settings in `pg_hba.conf`

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@localhost:5432/db` |
| `BETTER_AUTH_SECRET` | Secret for JWT signing (min 32 chars) | Yes | Generated via `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Backend API URL | Yes | `http://localhost:3005` |
| `FRONTEND_URL` | Frontend URL for CORS | Optional | `http://localhost:3004` |
| `PORT` | Server port | Optional | `3005` (default) |

