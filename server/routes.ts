import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Removed Replit auth - using Firebase only
import { 
  insertDormerSchema, 
  insertBillSchema, 
  insertBillShareSchema, 
  insertPaymentSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Using Firebase auth on frontend only

  // Auth routes - simplified for Firebase auth
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Since we're using Firebase auth on frontend, just return a simple response
      // In production, you would verify the Firebase token here
      res.json({ message: "Use Firebase authentication on frontend" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create admin account route (for initial setup)
  app.post('/api/auth/create-admin', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists by email
      const db = (await import('./db')).db;
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.upsertUser({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'admin',
        password: hashedPassword,
      });

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          role: user.role 
        }
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });

  // Dormer routes
  app.get('/api/dormers', async (req, res) => {
    try {
      const dormers = await storage.getDormers();
      res.json(dormers);
    } catch (error) {
      console.error("Error fetching dormers:", error);
      res.status(500).json({ message: "Failed to fetch dormers" });
    }
  });

  app.post('/api/dormers', async (req, res) => {
    try {
      const { password, ...dormerData } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      if (!dormerData.email) {
        return res.status(400).json({ message: "Email is required for dormer account creation" });
      }
      
      const validatedData = insertDormerSchema.parse(dormerData);
      const dormer = await storage.createDormerWithUser({ ...validatedData, password });
      res.json(dormer);
    } catch (error) {
      console.error("Error creating dormer:", error);
      res.status(400).json({ message: "Failed to create dormer" });
    }
  });

  app.put('/api/dormers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertDormerSchema.partial().parse(req.body);
      const dormer = await storage.updateDormer(id, validatedData);
      res.json(dormer);
    } catch (error) {
      console.error("Error updating dormer:", error);
      res.status(400).json({ message: "Failed to update dormer" });
    }
  });

  app.delete('/api/dormers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDormer(id);
      res.json({ message: "Dormer deleted successfully" });
    } catch (error) {
      console.error("Error deleting dormer:", error);
      res.status(400).json({ message: "Failed to delete dormer" });
    }
  });

  // Bill routes
  app.get('/api/bills', async (req, res) => {
    try {
      const bills = await storage.getBills();
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.post('/api/bills', async (req, res) => {
    try {
      const { bill, shares } = req.body;
      const validatedBill = insertBillSchema.parse(bill);
      const validatedShares = shares.map((share: any) => insertBillShareSchema.parse(share));
      
      const newBill = await storage.createBill(validatedBill);
      
      // Create bill shares
      const billSharePromises = validatedShares.map((share: any) => 
        storage.createBillShare({ ...share, billId: newBill.id })
      );
      const billShares = await Promise.all(billSharePromises);
      
      res.json({ bill: newBill, shares: billShares });
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(400).json({ message: "Failed to create bill" });
    }
  });

  app.get('/api/bills/:id/shares', async (req, res) => {
    try {
      const { id } = req.params;
      const shares = await storage.getBillShares(id);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching bill shares:", error);
      res.status(500).json({ message: "Failed to fetch bill shares" });
    }
  });

  // Payment routes
  app.get('/api/payments', async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get('/api/payments/dormer/:dormerId', async (req, res) => {
    try {
      const { dormerId } = req.params;
      const payments = await storage.getPaymentsByDormer(dormerId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching dormer payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/payments', async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  app.put('/api/payments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPaymentSchema.partial().parse(req.body);
      const payment = await storage.updatePayment(id, validatedData);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(400).json({ message: "Failed to update payment" });
    }
  });

  app.delete('/api/payments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePayment(id);
      res.json({ message: "Payment deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(400).json({ message: "Failed to delete payment" });
    }
  });

  // Attendance routes
  app.get('/api/attendance/:dormerId', async (req, res) => {
    try {
      const { dormerId } = req.params;
      const { month } = req.query;
      const attendance = await storage.getAttendanceByDormer(dormerId, month as string);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/attendance', async (req, res) => {
    try {
      const { dormerId, date, isPresent } = req.body;
      const attendance = await storage.upsertAttendance({ dormerId, date, isPresent });
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(400).json({ message: "Failed to update attendance" });
    }
  });

  // Unified authentication route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmailAndPassword(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const responseData = {
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          role: user.role 
        }
      };

      // If it's a dormer, also include their dormer profile
      if (user.role === 'dormer') {
        const dormers = await storage.getDormers();
        const dormer = dormers.find(d => d.userId === user.id);
        
        if (dormer) {
          (responseData as any).dormer = {
            id: dormer.id,
            name: dormer.name,
            room: dormer.room,
            email: dormer.email,
            monthlyRent: dormer.monthlyRent
          };
        }
      }
      
      res.json(responseData);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', async (req, res) => {
    try {
      const dormers = await storage.getDormers();
      const payments = await storage.getPayments();
      const bills = await storage.getBills();

      const activeDormers = dormers.filter(d => d.isActive).length;
      const currentMonth = new Date().toISOString().slice(0, 7); // "2025-08"
      
      const monthlyPayments = payments.filter(p => p.month === currentMonth && p.status === 'paid');
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      
      // Calculate average electric bill per person from recent bills
      let avgElectricBill = 0;
      if (bills.length > 0) {
        const recentBill = bills[0]; // Most recent bill
        const shares = await storage.getBillShares(recentBill.id);
        if (shares.length > 0) {
          avgElectricBill = shares.reduce((sum, s) => sum + parseFloat(s.shareAmount), 0) / shares.length;
        }
      }

      res.json({
        activeDormers,
        monthlyRevenue,
        pendingPayments,
        avgElectricBill: Math.round(avgElectricBill),
        totalDormers: dormers.length,
        occupancyRate: Math.round((activeDormers / Math.max(dormers.length, 1)) * 100),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
