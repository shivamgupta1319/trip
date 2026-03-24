'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import {
  getTripById, getExpensesForTrip, getUsers, saveTrip, deleteTrip, removeMemberFromTrip
} from '@/lib/storage';
import { Trip, User, Expense } from '@/lib/types';
import { formatCurrency, calculateTripSummary } from '@/lib/calculations';

export default function TripDetailPage() {
  const { session, loading } = useRequireAuth();
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!session) return;
    (async () => {
      const t = await getTripById(tripId);
      if (!t) { router.replace('/dashboard'); return; }
      if (!mounted) return;
      setTrip(t);
      const [allUsers, exps] = await Promise.all([
        getUsers(),
        getExpensesForTrip(tripId)
      ]);
      if (!mounted) return;
      setMembers(allUsers.filter((u) => t.memberIds.includes(u.id)));
      setExpenses(exps);
    })();
    return () => { mounted = false; };
  }, [session, tripId]);

  const toggleStatus = async () => {
    if (!trip) return;
    const updated = { ...trip, status: trip.status === 'active' ? 'completed' as const : 'active' as const };
    await saveTrip(updated);
    setTrip(updated);
  };

  const handleDeleteTrip = async () => {
    if (confirm('Are you sure you want to delete this trip fully? This cannot be undone.')) {
      await deleteTrip(tripId);
      router.replace('/dashboard');
    }
  };

  const handleRemoveMember = async (m: User) => {
    const isPayer = expenses.some(e => e.paidBy === m.id);
    const isSplit = expenses.some(e => e.splitAmong.includes(m.id));
    if (isPayer || isSplit) {
      alert(`Cannot remove ${m.name} because they are part of existing expenses.`);
      return;
    }
    if (confirm(`Remove ${m.name} from the trip?`)) {
      await removeMemberFromTrip(tripId, m.id);
      setMembers(members.filter(member => member.id !== m.id));
    }
  };

  if (loading || !trip) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  const realExpenses = expenses.filter((e) => e.title !== 'Settlement Payment');
  const { totalExpenses: total, memberBalances } = calculateTripSummary(expenses, members);
  const recentExpenses = [...realExpenses].sort((a, b) =>
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
          <div className="stat-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(1fr)' }}>
            <div className="stat-card">
              <div className="stat-card__label">Total Trip Spent</div>
              <div className="stat-card__value stat-card__value--accent">{formatCurrency(total)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Total Expenses</div>
              <div className="stat-card__value">{realExpenses.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Total Members</div>
              <div className="stat-card__value">{members.length}</div>
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
            {session.userId === trip.createdBy && (
              <Link href={`/trips/${tripId}/add-member`} className="btn btn--ghost">
                👤 Add Member
              </Link>
            )}
          </div>

          {/* Members */}
          <div className="section-header">
            <h2>Members & Balances</h2>
            {session.userId === trip.createdBy && (
              <Link href={`/trips/${tripId}/add-member`} className="btn btn--ghost btn--sm">+ Add Member</Link>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {members.map((m) => {
              const bal = memberBalances.find(b => b.userId === m.id);
              const paid = bal?.totalPaid || 0;
              const share = bal?.totalOwed || 0;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: '16px', width: '100%'
                  }}
                >
                  <div className="avatar" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{m.name}</span>
                      {m.id === trip.createdBy && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 12 }}>creator</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: '0.88rem' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>Paid: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{formatCurrency(paid)}</span></div>
                      <div style={{ color: 'var(--text-secondary)' }}>Share: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{formatCurrency(share)}</span></div>
                    </div>
                  </div>
                  {m.id !== trip.createdBy && session.userId === trip.createdBy && (
                    <button
                      onClick={() => handleRemoveMember(m)}
                      style={{
                        background: 'var(--bg-elevated)', border: 'none', color: 'var(--danger)',
                        width: 36, height: 36, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                        fontSize: '1.2rem', fontWeight: 300
                      }}
                      aria-label="Remove member"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
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

          {/* Trip status toggle & Delete */}
          {session.userId === trip.createdBy && (
            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button
                onClick={toggleStatus}
                className={`btn btn--sm ${trip.status === 'active' ? 'btn--ghost' : 'btn--ghost'}`}
                style={{ opacity: 0.7 }}
              >
                {trip.status === 'active' ? '✅ Mark completed' : '🔄 Reopen trip'}
              </button>
              <button
                onClick={handleDeleteTrip}
                className="btn btn--sm btn--danger"
              >
                🗑️ Delete Trip
              </button>
            </div>
          )}
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
