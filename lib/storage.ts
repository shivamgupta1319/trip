import { supabase } from './supabase';
import { User, Trip, Expense, AuthSession } from './types';

// ── Users ──────────────────────────────────────────────
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) console.error('getUsers error:', error);
  return data || [];
}

export async function getUserByName(name: string): Promise<User | undefined> {
  const { data, error } = await supabase.from('users').select('*').ilike('name', name).single();
  if (error && error.code !== 'PGRST116') console.error('getUserByName error:', error);
  return data || undefined;
}

export async function saveUser(user: User): Promise<void> {
  const { error } = await supabase.from('users').upsert([user]);
  if (error) console.error('saveUser error:', error);
}

// ── Trips ──────────────────────────────────────────────
export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase.from('trips').select('*');
  if (error) console.error('getTrips error:', error);
  return (data as Trip[]) || [];
}

export async function saveTrip(trip: Trip): Promise<void> {
  const { error } = await supabase.from('trips').upsert([trip]);
  if (error) console.error('saveTrip error:', error);
}

export async function getTripById(id: string): Promise<Trip | undefined> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') console.error('getTripById error:', error);
  return (data as Trip) || undefined;
}

export async function getTripsForUser(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase.from('trips').select('*').contains('memberIds', [userId]);
  if (error) console.error('getTripsForUser error:', error);
  return (data as Trip[]) || [];
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) console.error('deleteTrip error:', error);
}

export async function removeMemberFromTrip(tripId: string, memberId: string): Promise<void> {
  const trip = await getTripById(tripId);
  if (!trip) return;
  const newMembers = trip.memberIds.filter(id => id !== memberId);
  await supabase.from('trips').update({ memberIds: newMembers }).eq('id', tripId);
}

// ── Expenses ───────────────────────────────────────────
export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*');
  if (error) console.error('getExpenses error:', error);
  return (data as Expense[]) || [];
}

export async function saveExpense(expense: Expense): Promise<void> {
  const { error } = await supabase.from('expenses').upsert([expense]);
  if (error) console.error('saveExpense error:', error);
}

export async function getExpensesForTrip(tripId: string): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').eq('tripId', tripId);
  if (error) console.error('getExpensesForTrip error:', error);
  return (data as Expense[]) || [];
}

export async function getExpenseById(expenseId: string): Promise<Expense | undefined> {
  const { data, error } = await supabase.from('expenses').select('*').eq('id', expenseId).single();
  if (error && error.code !== 'PGRST116') console.error('getExpenseById error:', error);
  return (data as Expense) || undefined;
}

export async function updateExpense(expense: Expense): Promise<void> {
  const { error } = await supabase.from('expenses').upsert([expense]);
  if (error) console.error('updateExpense error:', error);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) console.error('deleteExpense error:', error);
}

// ── Session ────────────────────────────────────────────
// Session remains in localStorage as requested, to maintain user state
const SESSION_KEY = 'trip_session';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}

export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function generateId(): string {
  return crypto.randomUUID();
}
