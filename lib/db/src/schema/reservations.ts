import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  confirmationCode: text("confirmation_code").notNull().unique(),
  status: text("status").notNull().default("confirmed"),
  checkin: date("checkin", { mode: "string" }).notNull(),
  checkout: date("checkout", { mode: "string" }).notNull(),
  guests: integer("guests").notNull(),
  rooms: integer("rooms").notNull(),
  accommodationSlug: text("accommodation_slug").notNull(),
  accommodationName: text("accommodation_name").notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({
  id: true,
  confirmationCode: true,
  createdAt: true,
});

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;