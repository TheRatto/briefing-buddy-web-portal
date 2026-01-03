# BriefingBuddy Backend

Backend API server for the BriefingBuddy Web Portal.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random secret (minimum 32 characters)
- `BETTER_AUTH_URL`: Backend URL (e.g., `http://localhost:3005`)
- `FRONTEND_URL`: Frontend URL (e.g., `http://localhost:3004`)

3. Set up database:
```bash
# Generate Better Auth schema
npx @better-auth/cli@latest generate

# Apply migrations (if using Better Auth CLI migrations)
npx @better-auth/cli@latest migrate
```

Or manually run the generated SQL schema on your PostgreSQL database.

4. Run development server:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

## Building

Build for production:
```bash
npm run build
npm start
```

