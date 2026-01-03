# Test Infrastructure Fixes Needed

## Issue: Jest Cannot Handle Better Auth ESM Modules

Better Auth uses ES Modules (ESM), which Jest cannot handle by default. This prevents tests from running.

### Current Status

Tests have been updated to:
- ✅ Use `toNodeHandler(auth)` correctly (via mock wrapper)
- ✅ Test actual behavior instead of accessing non-existent `auth.config`
- ✅ Include `name` field in signup requests (matching frontend behavior)
- ✅ Fix Vitest globals configuration for frontend tests

However, Jest still cannot import `better-auth` due to ESM compatibility issues.

### Solutions

#### Option 1: Use Vitest for Backend Tests (Recommended)

Vitest has better ESM support than Jest. Consider migrating backend tests to Vitest:

```bash
npm install -D vitest @vitest/ui
```

Update `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

#### Option 2: Configure Jest for ESM (Complex)

Requires significant Jest configuration changes and may have limitations.

#### Option 3: Integration Tests Only

Test authentication through actual HTTP requests to a running server instead of unit tests.

#### Option 4: Mock Better Auth Entirely

Create comprehensive mocks for Better Auth, but this reduces test value.

### Recommendation

Use **Option 1 (Vitest)** - it's the cleanest solution and will work with Better Auth's ESM modules.

