import { 
  jsonb, 
  pgTable, 
  serial, 
  text, 
  timestamp,
  integer,
  boolean,
  varchar,
  primaryKey,
  uuid
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';


export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
} as const;


export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(UserRole.USER),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const trains = pgTable("trains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  totalSeats: integer("total_seats").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  trainId: integer("train_id").notNull().references(() => trains.id),
  seatNumber: integer("seat_number").notNull(),
  bookingStatus: text("booking_status").notNull().default('confirmed'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seatAvailability = pgTable("seat_availability", {
  id: serial("id").primaryKey(),
  trainId: integer("train_id").notNull().references(() => trains.id),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  availableSeats: integer("available_seats").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Train = typeof trains.$inferSelect;
export type NewTrain = typeof trains.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type SeatAvailability = typeof seatAvailability.$inferSelect;
export type NewSeatAvailability = typeof seatAvailability.$inferInsert;

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum([UserRole.ADMIN, UserRole.USER]),
});

export const insertTrainSchema = createInsertSchema(trains);
export const insertBookingSchema = createInsertSchema(bookings);
export const insertSeatAvailabilitySchema = createInsertSchema(seatAvailability);
