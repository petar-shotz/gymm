// MOCKED — in-memory D1/SQLite store, data lost on container sleep
const store = new Map<string, Map<string, string>>();

function getUserStore(user: string): Map<string, string> {
  let userStore = store.get(user);
  if (!userStore) {
    userStore = new Map<string, string>();
    store.set(user, userStore);
  }
  return userStore;
}

export function database() {
  return {
    prepare(sql: string) {
      let boundArgs: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          boundArgs = args;
          return stmt;
        },
        async all<T = { key: string; value: string }>(): Promise<{ results: T[] }> {
          if (sql.includes('SELECT key,value FROM fitness_records')) {
            const user = String(boundArgs[0] ?? 'local-user');
            const userStore = getUserStore(user);
            const results = Array.from(userStore.entries()).map(([key, value]) => ({
              key,
              value,
            })) as unknown as T[];
            return { results };
          }
          return { results: [] };
        },
        async run() {
          if (sql.includes('INSERT INTO fitness_records')) {
            const user = String(boundArgs[0] ?? 'local-user');
            const key = String(boundArgs[1] ?? '');
            const value = String(boundArgs[2] ?? '{}');
            getUserStore(user).set(key, value);
          }
          return { success: true, meta: { changes: 1 } };
        },
      };
      return stmt;
    },
  };
}
