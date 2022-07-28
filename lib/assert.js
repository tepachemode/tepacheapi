const nodeAssert = await import('node:assert/strict');

export function assert(condition, message) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  return nodeAssert.default(condition, message);
}
