// MOCKED — in-memory Drizzle stub for AI Studio runtime
const noOp = {
  findMany: async () => [],
  findFirst: async () => null,
  findUnique: async () => null,
  create: async (d: { data?: unknown }) => d?.data ?? {},
  update: async (d: { data?: unknown }) => d?.data ?? {},
  delete: async () => ({}),
};

export const db = new Proxy(
  {},
  {
    get: (_, prop) =>
      prop === "query" ? new Proxy({}, { get: () => noOp }) : async () => [],
  }
);

export function getDb() {
  return db;
}
