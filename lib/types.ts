export interface User {
  id: string;
  name: string;
  pin: string; // stored as plain string (4-digit)
  createdAt: string;
}

export type TripStatus = 'active' | 'completed';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  description: string;
  status: TripStatus;
  createdBy: string; // userId
  memberIds: string[];
  createdAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'other';

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string; // userId
  splitAmong: string[]; // userIds
  createdAt: string;
}

// Calculated types
export interface MemberBalance {
  userId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = is owed money, negative = owes money
}

export interface Settlement {
  from: string; // userId who pays
  fromName: string;
  to: string; // userId who receives
  toName: string;
  amount: number;
}

export interface TripSummary {
  totalExpenses: number;
  memberBalances: MemberBalance[];
  settlements: Settlement[];
}

export interface AuthSession {
  userId: string;
  name: string;
}
