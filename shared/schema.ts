import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("admin"), // "admin" or "dormer"
  password: varchar("password"), // For dormer accounts
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dormers table
export const dormers = pgTable("dormers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Link to user account
  name: text("name").notNull(),
  email: varchar("email"),
  room: varchar("room").notNull(),
  monthlyRent: decimal("monthly_rent").notNull().default("1500.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bills table
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  previousReading: decimal("previous_reading").notNull(),
  currentReading: decimal("current_reading").notNull(),
  ratePerKwh: decimal("rate_per_kwh").notNull(),
  totalConsumption: decimal("total_consumption").notNull(),
  totalAmount: decimal("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bill shares table (individual shares for each dormer in a bill)
export const billShares = pgTable("bill_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id),
  dormerId: varchar("dormer_id").notNull().references(() => dormers.id),
  daysStayed: integer("days_stayed").notNull(),
  shareAmount: decimal("share_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dormerId: varchar("dormer_id").notNull().references(() => dormers.id),
  month: varchar("month").notNull(), // Format: "2025-08"
  amount: decimal("amount").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  notes: text("notes"),
  status: varchar("status").notNull().default("paid"), // "paid", "pending", "overdue"
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance table for tracking daily stays
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dormerId: varchar("dormer_id").notNull().references(() => dormers.id),
  date: date("date").notNull(),
  isPresent: boolean("is_present").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertDormerSchema = createInsertSchema(dormers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
});

export const insertBillShareSchema = createInsertSchema(billShares).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Dormer = typeof dormers.$inferSelect;
export type InsertDormer = z.infer<typeof insertDormerSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type BillShare = typeof billShares.$inferSelect;
export type InsertBillShare = z.infer<typeof insertBillShareSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
