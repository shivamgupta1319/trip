'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import { getTripById, getExpensesForTrip, getUsers, deleteExpense } from '@/lib/storage';
import { Trip, User, Expense } from '@/lib/types';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/calculations';

export default function ExpensesPage() {
  const { session, loading } = useRequireAuth();
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<User[]>([]);

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
      setExpenses(exps.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    })();
    return () => { mounted = false; };
  }, [session, tripId]);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Delete the expense "${title}"?`)) {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  if (loading || !trip) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page">
      <Navbar />
      <div className="page-content">
        <div className="container container--wide">
          <div className="page-header">
            <Link href={`/trips/${tripId}`} className="back-link">← {trip.name}</Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 className="page-title">All Expenses</h1>
                <p className="page-subtitle">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} · Total {formatCurrency(total)}</p>
              </div>
              <Link href={`/trips/${tripId}/add-expense`} className="btn btn--primary btn--sm">
                + Add
              </Link>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🧾</div>
              <div className="empty-state__title">No expenses yet</div>
              <div className="empty-state__sub">Add the first expense for {trip.name}</div>
              <Link href={`/trips/${tripId}/add-expense`} className="btn btn--primary" style={{ marginTop: 20 }}>
                Add Expense
              </Link>
            </div>
          ) : (
            <div className="stack">
              {expenses.map((exp) => {
                const payer = members.find((m) => m.id === exp.paidBy);
                const splitNames = exp.splitAmong
                  .map((id) => members.find((m) => m.id === id)?.name)
                  .filter(Boolean);
                return (
                  <div className="list-item" key={exp.id} style={{ cursor: 'default' }}>
                    <div className="list-item__icon">
                      {CATEGORY_ICONS[exp.category] || '💼'}
                    </div>
                    <div className="list-item__body">
                      <div className="list-item__title">{exp.title}</div>
                      <div className="list-item__sub">
                        {CATEGORY_LABELS[exp.category]} · Paid by {payer?.name || 'Unknown'}
                      </div>
                      <div className="list-item__sub" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                        Split: {splitNames.length === members.length ? 'Everyone' : splitNames.join(', ')}
                      </div>
                    </div>
                    <div className="list-item__right" style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                        {formatCurrency(exp.amount)}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
                        {new Date(exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Link 
                          href={`/trips/${tripId}/expenses/${exp.id}/edit`}
                          style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(exp.id, exp.title)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
