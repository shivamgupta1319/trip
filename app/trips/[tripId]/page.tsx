'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import {
  getTripById, getExpensesForTrip, getUsers, saveTrips, getTrips
} from '@/lib/storage';
import { Trip, User, Expense } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

export default function TripDetailPage() {
  const { session, loading } = useRequireAuth();
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!session) return;
    const t = getTripById(tripId);
    if (!t) { router.replace('/dashboard'); return; }
    setTrip(t);
    const allUsers = getUsers();
    setMembers(allUsers.filter((u) => t.memberIds.includes(u.id)));
    setExpenses(getExpensesForTrip(tripId));
  }, [session, tripId]);

  const toggleStatus = () => {
    if (!trip) return;
    const updated = { ...trip, status: trip.status === 'active' ? 'completed' as const : 'active' as const };
    const all = getTrips().map((t) => (t.id === tripId ? updated : t));
    saveTrips(all);
    setTrip(updated);
  };

  if (loading || !trip) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const recentExpenses = [...expenses].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  return (
    <div className="page">
      <Navbar />
      <div className="page-content hero-gradient">
        <div className="container container--wide">
          {/* Back */}
          <Link href="/dashboard" className="back-link">← Dashboard</Link>

          {/* Trip header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
              <div>
                <h1 className="page-title">{trip.name}</h1>
                {trip.destination && (
                  <p className="page-subtitle">📍 {trip.destination}</p>
                )}
                {trip.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6 }}>{trip.description}</p>
                )}
              </div>
              <div style={{ flexShrink: 0 }}>
                <span className={`badge badge--${trip.status}`}>{trip.status}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-card__label">Total Spent</div>
              <div className="stat-card__value stat-card__value--accent">{formatCurrency(total)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Expenses</div>
              <div className="stat-card__value">{expenses.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Members</div>
              <div className="stat-card__value">{members.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Per Person</div>
              <div className="stat-card__value stat-card__value--success">
                {members.length > 0 ? formatCurrency(total / members.length) : '₹0'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            <Link href={`/trips/${tripId}/add-expense`} className="btn btn--primary">
              + Add Expense
            </Link>
            <Link href={`/trips/${tripId}/dashboard`} className="btn btn--ghost">
              💰 Settlement
            </Link>
            <Link href={`/trips/${tripId}/expenses`} className="btn btn--ghost">
              📋 All Expenses
            </Link>
            <Link href={`/trips/${tripId}/add-member`} className="btn btn--ghost">
              👤 Add Member
            </Link>
          </div>

          {/* Members */}
          <div className="section-header">
            <h2>Members ({members.length})</h2>
            <Link href={`/trips/${tripId}/add-member`} className="btn btn--ghost btn--sm">+ Add</Link>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 99, padding: '6px 14px 6px 8px'
                }}
              >
                <div className="avatar" style={{ width: 26, height: 26, fontSize: '0.75rem' }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{m.name}</span>
                {m.id === trip.createdBy && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>creator</span>
                )}
              </div>
            ))}
          </div>

          {/* Recent expenses */}
          <div className="section-header">
            <h2>Recent Expenses</h2>
            <Link href={`/trips/${tripId}/expenses`} className="btn btn--ghost btn--sm">View All</Link>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state__icon">🧾</div>
              <div className="empty-state__title">No expenses yet</div>
              <div className="empty-state__sub">Add the first expense for this trip</div>
            </div>
          ) : (
            <div className="stack">
              {recentExpenses.map((exp) => {
                const payer = members.find((m) => m.id === exp.paidBy);
                return (
                  <div className="list-item" key={exp.id} style={{ cursor: 'default' }}>
                    <div className="list-item__icon" style={{ fontSize: '1.2rem' }}>
                      {getCategoryIcon(exp.category)}
                    </div>
                    <div className="list-item__body">
                      <div className="list-item__title">{exp.title}</div>
                      <div className="list-item__sub">
                        Paid by {payer?.name || 'Unknown'} &middot; split among {exp.splitAmong.length}
                      </div>
                    </div>
                    <div className="list-item__right">
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(exp.amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trip status toggle */}
          <div style={{ marginTop: 32 }}>
            <button
              onClick={toggleStatus}
              className={`btn btn--sm ${trip.status === 'active' ? 'btn--ghost' : 'btn--ghost'}`}
              style={{ opacity: 0.7 }}
            >
              {trip.status === 'active' ? '✅ Mark as Completed' : '🔄 Reopen Trip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(cat: string) {
  const icons: Record<string, string> = {
    food: '🍽️', transport: '🚗', accommodation: '🏨',
    activities: '🎯', shopping: '🛍️', other: '💼',
  };
  return icons[cat] || '💼';
}
