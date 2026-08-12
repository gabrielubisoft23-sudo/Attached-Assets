import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const hotelRoomTypesTable = pgTable("hotel_room_types", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  maxGuests: integer("max_guests").notNull(),
  totalRooms: integer("total_rooms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHotelRoomTypeSchema = createInsertSchema(hotelRoomTypesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertHotelRoomType = z.infer<typeof insertHotelRoomTypeSchema>;
export type HotelRoomType = typeof hotelRoomTypesTable.$inferSelect;