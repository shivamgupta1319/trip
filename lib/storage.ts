'use client';

import { User, Trip, Expense, AuthSession } from './types';

const KEYS = {
  USERS: 'trip_users',
  TRIPS: 'trip_trips',
  EXPENSES: 'trip_expenses',
  SESSION: 'trip_session',
};

function get<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Users ──────────────────────────────────────────────
export function getUsers(): User[] {
  return get<User>(KEYS.USERS);
}

export function saveUsers(users: User[]): void {
  set(KEYS.USERS, users);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByName(name: string): User | undefined {
  return getUsers().find(
    (u) => u.name.toLowerCase() === name.toLowerCase()
  );
}

// ── Trips ──────────────────────────────────────────────
export function getTrips(): Trip[] {
  return get<Trip>(KEYS.TRIPS);
}

export function saveTrips(trips: Trip[]): void {
  set(KEYS.TRIPS, trips);
}

export function getTripById(id: string): Trip | undefined {
  return getTrips().find((t) => t.id === id);
}

export function getTripsForUser(userId: string): Trip[] {
  return getTrips().filter((t) => t.memberIds.includes(userId));
}

export function deleteTrip(tripId: string): void {
  const trips = getTrips().filter((t) => t.id !== tripId);
  saveTrips(trips);
  const expenses = getExpenses().filter((e) => e.tripId !== tripId);
  saveExpenses(expenses);
}

export function removeMemberFromTrip(tripId: string, memberId: string): void {
  const trip = getTripById(tripId);
  if (!trip) return;
  trip.memberIds = trip.memberIds.filter((id) => id !== memberId);
  const trips = getTrips().map((t) => (t.id === tripId ? trip : t));
  saveTrips(trips);
}

// ── Expenses ───────────────────────────────────────────
export function getExpenses(): Expense[] {
  return get<Expense>(KEYS.EXPENSES);
}

export function saveExpenses(expenses: Expense[]): void {
  set(KEYS.EXPENSES, expenses);
}

export function getExpensesForTrip(tripId: string): Expense[] {
  return getExpenses().filter((e) => e.tripId === tripId);
}

export function getExpenseById(expenseId: string): Expense | undefined {
  return getExpenses().find((e) => e.id === expenseId);
}

export function updateExpense(expense: Expense): void {
  const exps = getExpenses().map((e) => (e.id === expense.id ? expense : e));
  saveExpenses(exps);
}

export function deleteExpense(expenseId: string): void {
  const exps = getExpenses().filter((e) => e.id !== expenseId);
  saveExpenses(exps);
}

// ── Session ────────────────────────────────────────────
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.SESSION);
}

// ── ID generator ───────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
