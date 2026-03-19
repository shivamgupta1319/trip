'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import { getTripById, getExpensesForTrip, getUsers } from '@/lib/storage';
import { Trip, User } from '@/lib/types';
import { calculateTripSummary, formatCurrency } from '@/lib/calculations';

export default function TripDashboardPage() {
  const { session, loading } = useRequireAuth();
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof calculateTripSummary> | null>(null);

  useEffect(() => {
    if (!session) return;
    const t = getTripById(tripId);
    if (!t) { router.replace('/dashboard'); return; }
    setTrip(t);
    const allUsers = getUsers();
    const mems = allUsers.filter((u) => t.memberIds.includes(u.id));
    setMembers(mems);
    const expenses = getExpensesForTrip(tripId);
    setSummary(calculateTripSummary(expenses, mems));
  }, [session, tripId]);

  if (loading || !trip || !summary) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content hero-gradient">
        <div className="container container--wide">
          <div className="page-header">
            <Link href={`/trips/${tripId}`} className="back-link">← {trip.name}</Link>
            <h1 className="page-title">💰 Settlement Dashboard</h1>
            <p className="page-subtitle">Who owes what</p>
          </div>

          {/* Total */}
          <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(124,110,240,0.15), rgba(124,110,240,0.05))', borderColor: 'rgba(124,110,240,0.3)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Total Trip Spend
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>
                {formatCurrency(summary.totalExpenses)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                across {members.length} members
              </div>
            </div>
          </div>

          {/* Per-person balances */}
          <div className="section-header">
            <h2>Member Balances</h2>
          </div>
          <div className="card" style={{ marginBottom: 20 }}>
            {summary.memberBalances.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No expenses recorded yet.</p>
            ) : (
              summary.memberBalances.map((mb) => {
                const positive = mb.netBalance >= 0;
                return (
                  <div className="balance-row" key={mb.userId}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{mb.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mb.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Paid {formatCurrency(mb.totalPaid)} · Owes {formatCurrency(mb.totalOwed)}
                        </div>
                      </div>
                    </div>
                    <div className="balance-row__right">
                      <div
                        className="balance-row__net"
                        style={{ color: positive ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {positive ? '+' : ''}{formatCurrency(mb.netBalance)}
                      </div>
                      <div className="balance-row__detail">
                        {Math.abs(mb.netBalance) < 0.01
                          ? 'settled up'
                          : positive
                          ? 'gets back'
                          : 'owes'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Settlement suggestions */}
          <div className="section-header">
            <h2>Settlements</h2>
          </div>
          {summary.settlements.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, color: 'var(--success)' }}>Everyone is settled up!</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  No payments needed.
                </div>
              </div>
            </div>
          ) : (
            <div className="stack">
              {summary.settlements.map((s, i) => (
                <div className="settlement-card" key={i}>
                  <div className="avatar">{s.fromName.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{s.fromName}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                    <span style={{ fontWeight: 600 }}>{s.toName}</span>
                  </div>
                  <div className="settlement-card__amount">
                    {formatCurrency(s.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expense breakdown by category */}
          <div className="section-header" style={{ marginTop: 28 }}>
            <h2>Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/trips/${tripId}/add-expense`} className="btn btn--primary">
              + Add Expense
            </Link>
            <Link href={`/trips/${tripId}/expenses`} className="btn btn--ghost">
              View All Expenses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
