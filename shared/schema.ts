import { z } from "zod";

// Re-export Firebase types from shared/firestore-types.ts
export * from "./firestore-types";

// Zod validation schemas for Firebase data
export const insertDormerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  room: z.string().min(1, "Room is required"),
  monthlyRent: z.string().min(1, "Monthly rent is required"),
  isActive: z.boolean().default(true),
});

export const insertBillSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  previousReading: z.number().min(0),
  currentReading: z.number().min(0),
  ratePerKwh: z.number().min(0),
  totalConsumption: z.number().min(0),
  totalAmount: z.number().min(0),
});

export const insertBillShareSchema = z.object({
  billId: z.string().min(1),
  dormerId: z.string().min(1),
  daysStayed: z.number().min(0).max(31),
  shareAmount: z.number().min(0),
});

export const insertPaymentSchema = z.object({
  dormerId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in format YYYY-MM"),
  amount: z.number().min(0),
  paymentDate: z.date(),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(["paid", "pending", "overdue"]).default("paid"),
});

export const insertAttendanceSchema = z.object({
  dormerId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in format YYYY-MM"),
  isPresent: z.boolean().default(false),
});

// Export types for validation
export type InsertDormer = z.infer<typeof insertDormerSchema>;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type InsertBillShare = z.infer<typeof insertBillShareSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
