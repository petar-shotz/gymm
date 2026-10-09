import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('fitness_records', { user: text('user').notNull(), key: text('key').notNull(), value: text('value').notNull() }, t=>[primaryKey({columns:[t.user,t.key]})]);
