# Quick Start Guide

## ✅ PostgreSQL Setup Complete!

Your database is configured and ready to use:
- **Database**: `briefing_buddy`
- **User**: `paulrattigan` (your macOS user)
- **Tables Created**: `user`, `session`, `account`, `verification`

## Next Steps

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will run on `http://localhost:3005`

### 2. Start the Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3004`

### 3. Test Authentication

1. Open `http://localhost:3004` in your browser
2. Click "Sign Up" to create an account
3. Log in with your credentials
4. Verify session persistence by refreshing the page

## Environment Configuration

Your `.env` file is configured with:
- ✅ Database connection string
- ✅ Secure Better Auth secret (generated)
- ✅ Server ports and URLs

**Important**: Never commit `.env` to git - it contains sensitive secrets!

## Troubleshooting

### Server won't start
- Check PostgreSQL is running: `brew services list | grep postgresql`
- Verify database exists: `psql -d briefing_buddy -c "SELECT current_database();"`
- Check `.env` file exists and has correct `DATABASE_URL`

### Database connection errors
- Verify PostgreSQL is running: `brew services start postgresql@14`
- Check connection: `psql -d briefing_buddy`
- Verify `.env` has correct `DATABASE_URL`

### Better Auth errors
- Ensure all dependencies are installed: `npm install`
- Check `BETTER_AUTH_SECRET` is set in `.env` (minimum 32 characters)
- Verify `BETTER_AUTH_URL` matches your server URL

## Database Management

View tables:
```bash
psql -d briefing_buddy -c "\dt"
```

View users:
```bash
psql -d briefing_buddy -c "SELECT id, email, name FROM \"user\";"
```

View sessions:
```bash
psql -d briefing_buddy -c "SELECT * FROM session LIMIT 5;"
```

## File Locations

- Backend config: `backend/src/auth.ts`
- Environment variables: `backend/.env` (not in git)
- Database migrations: `backend/better-auth_migrations/`
- Frontend config: `frontend/src/auth.ts`

