import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const attendees = pgTable('attendees', {
	id: serial('id').primaryKey(),
	firstName: varchar('first_name', { length: 255 }).notNull(),
	lastName: varchar('last_name', { length: 255 }).notNull(),
	nickname: varchar('nickname', { length: 255 }),
});

export type InsertAttendee = typeof attendees.$inferInsert;
export type SelectAttendee = typeof attendees.$inferSelect;
