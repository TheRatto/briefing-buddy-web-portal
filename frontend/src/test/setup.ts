import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Better Auth for tests
vi.mock("../auth", () => ({
  authClient: {},
  signUp: {
    email: vi.fn(),
  },
  signIn: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null })),
}));

