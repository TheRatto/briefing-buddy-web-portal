// Mock toNodeHandler for Jest tests
// Since Better Auth uses ESM and Jest has trouble with it,
// we use a dynamic import approach
export async function toNodeHandler(auth: any) {
  // Dynamically import the actual toNodeHandler at runtime
  // This bypasses Jest's static analysis
  const { toNodeHandler: actualToNodeHandler } = await import("better-auth/node");
  return actualToNodeHandler(auth);
}

// For synchronous use in tests, we export a wrapper
export function toNodeHandlerSync(auth: any) {
  // This is a workaround - we'll need to use async/await in tests
  // Or we can make the handler async
  return async (req: any, res: any) => {
    const handler = await toNodeHandler(auth);
    return handler(req, res);
  };
}

