import {
  users,
  dormers,
  bills,
  billShares,
  payments,
  attendance,
  type User,
  type UpsertUser,
  type Dormer,
  type InsertDormer,
  type Bill,
  type InsertBill,
  type BillShare,
  type InsertBillShare,
  type Payment,
  type InsertPayment,
  type Attendance,
  type InsertAttendance,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Dormer operations
  getDormers(): Promise<Dormer[]>;
  getDormer(id: string): Promise<Dormer | undefined>;
  createDormer(dormer: InsertDormer): Promise<Dormer>;
  updateDormer(id: string, dormer: Partial<InsertDormer>): Promise<Dormer>;
  deleteDormer(id: string): Promise<void>;

  // Bill operations
  getBills(): Promise<Bill[]>;
  getBill(id: string): Promise<Bill | undefined>;
  createBill(bill: InsertBill): Promise<Bill>;
  getBillShares(billId: string): Promise<BillShare[]>;
  createBillShare(billShare: InsertBillShare): Promise<BillShare>;

  // Payment operations
  getPayments(): Promise<Payment[]>;
  getPaymentsByDormer(dormerId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;

  // Attendance operations
  getAttendanceByDormer(dormerId: string, month?: string): Promise<Attendance[]>;
  upsertAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance>;

  // Authentication operations for dormers
  getUserByEmailAndPassword(email: string, password: string): Promise<User | undefined>;
  createDormerWithUser(dormerData: InsertDormer & { password: string }): Promise<Dormer>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Dormer operations
  async getDormers(): Promise<Dormer[]> {
    return await db.select().from(dormers).orderBy(dormers.room);
  }

  async getDormer(id: string): Promise<Dormer | undefined> {
    const [dormer] = await db.select().from(dormers).where(eq(dormers.id, id));
    return dormer;
  }

  async createDormer(dormer: InsertDormer): Promise<Dormer> {
    const [newDormer] = await db.insert(dormers).values(dormer).returning();
    return newDormer;
  }

  async updateDormer(id: string, dormer: Partial<InsertDormer>): Promise<Dormer> {
    const [updatedDormer] = await db
      .update(dormers)
      .set({ ...dormer, updatedAt: new Date() })
      .where(eq(dormers.id, id))
      .returning();
    return updatedDormer;
  }

  async deleteDormer(id: string): Promise<void> {
    await db.delete(dormers).where(eq(dormers.id, id));
  }

  // Bill operations
  async getBills(): Promise<Bill[]> {
    return await db.select().from(bills).orderBy(desc(bills.createdAt));
  }

  async getBill(id: string): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    return bill;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const [newBill] = await db.insert(bills).values(bill).returning();
    return newBill;
  }

  async getBillShares(billId: string): Promise<BillShare[]> {
    return await db.select().from(billShares).where(eq(billShares.billId, billId));
  }

  async createBillShare(billShare: InsertBillShare): Promise<BillShare> {
    const [newBillShare] = await db.insert(billShares).values(billShare).returning();
    return newBillShare;
  }

  // Payment operations
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByDormer(dormerId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.dormerId, dormerId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Attendance operations
  async getAttendanceByDormer(dormerId: string, month?: string): Promise<Attendance[]> {
    if (month) {
      // Filter by month (format: YYYY-MM)
      const startDate = `${month}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().split('T')[0];
      
      return await db.select().from(attendance)
        .where(
          and(
            eq(attendance.dormerId, dormerId),
            // Add date range filtering here if needed
          )
        )
        .orderBy(desc(attendance.date));
    }
    
    return await db.select().from(attendance)
      .where(eq(attendance.dormerId, dormerId))
      .orderBy(desc(attendance.date));
  }

  async upsertAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db
      .insert(attendance)
      .values(attendanceData)
      .onConflictDoUpdate({
        target: [attendance.dormerId, attendance.date],
        set: {
          isPresent: attendanceData.isPresent,
          updatedAt: new Date(),
        },
      })
      .returning();
    return attendanceRecord;
  }

  async updateAttendance(id: string, attendanceData: Partial<InsertAttendance>): Promise<Attendance> {
    const [updatedAttendance] = await db
      .update(attendance)
      .set({ ...attendanceData, updatedAt: new Date() })
      .where(eq(attendance.id, id))
      .returning();
    return updatedAttendance;
  }

  // Authentication operations for dormers
  async getUserByEmailAndPassword(email: string, password: string): Promise<User | undefined> {
    const bcrypt = require('bcrypt');
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (user && user.password && await bcrypt.compare(password, user.password)) {
      return user;
    }
    
    return undefined;
  }

  async createDormerWithUser(dormerData: InsertDormer & { password: string }): Promise<Dormer> {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(dormerData.password, 10);
    
    // Create user account first
    const user = await this.upsertUser({
      email: dormerData.email!,
      firstName: dormerData.name.split(' ')[0],
      lastName: dormerData.name.split(' ').slice(1).join(' ') || '',
      role: 'dormer',
      password: hashedPassword,
    });

    // Create dormer record linked to the user
    const { password, ...dormerWithoutPassword } = dormerData;
    const dormer = await this.createDormer({
      ...dormerWithoutPassword,
      userId: user.id,
    });

    return dormer;
  }
}

export const storage = new DatabaseStorage();
