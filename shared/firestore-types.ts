// Firestore data types for the dormitory management system

export interface Dormer {
  id?: string;
  name: string;
  email: string;
  room: string;
  monthlyRent: string;
  role: 'dormer';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Bill {
  id?: string;
  startDate: Date;
  endDate: Date;
  previousReading: number;
  currentReading: number;
  ratePerKwh: number;
  totalConsumption: number;
  totalAmount: number;
  createdAt?: Date;
}

export interface BillShare {
  id?: string;
  billId: string;
  dormerId: string;
  daysStayed: number;
  shareAmount: number;
  createdAt?: Date;
}

export interface Payment {
  id?: string;
  dormerId: string;
  month: string; // Format: "2025-08"
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  notes?: string;
  status: 'paid' | 'pending' | 'overdue';
  createdAt?: Date;
}

export interface Attendance {
  id?: string;
  dormerId: string;
  date: string; // Format: "2025-08-31"
  month: string; // Format: "2025-08"
  isPresent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}