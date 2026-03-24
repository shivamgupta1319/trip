'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import {
  getTripById, getExpenses, saveExpense, getUsers, generateId
} from '@/lib/storage';
import { Trip, User, ExpenseCategory } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/calculations';

const CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'accommodation', 'activities', 'shopping', 'other'
];

export default function AddExpensePage() {
  const { session, loading } = useRequireAuth();
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [splitAll, setSplitAll] = useState(true);
  const [selectedSplit, setSelectedSplit] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'food' as ExpenseCategory,
    paidBy: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!session) return;
    (async () => {
      const t = await getTripById(tripId);
      if (!t) { router.replace('/dashboard'); return; }
      if (!mounted) return;
      setTrip(t);
      const allUsers = await getUsers();
      if (!mounted) return;
      const mems = allUsers.filter((u) => t.memberIds.includes(u.id));
      setMembers(mems);
      setForm((f) => ({ ...f, paidBy: session.userId }));
      setSelectedSplit(mems.map((m) => m.id));
    })();
    return () => { mounted = false; };
  }, [session, tripId]);

  const toggleMember = (uid: string) => {
    setSelectedSplit((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(form.amount);
    if (!form.title.trim()) return setError('Title is required.');
    if (isNaN(amt) || amt <= 0) return setError('Amount must be a positive number.');
    if (!form.paidBy) return setError('Please select who paid.');
    const split = splitAll ? members.map((m) => m.id) : selectedSplit;
    if (split.length === 0) return setError('Select at least one person for the split.');

    const newExpense = {
      id: generateId(),
      tripId,
      title: form.title.trim(),
      amount: amt,
      category: form.category,
      paidBy: form.paidBy,
      splitAmong: split,
      createdAt: new Date().toISOString(),
    };

    await saveExpense(newExpense);
    router.push(`/trips/${tripId}/expenses`);
  };

  if (loading || !trip) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content">
        <div className="container">
          <div className="page-header">
            <Link href={`/trips/${tripId}`} className="back-link">← {trip.name}</Link>
            <h1 className="page-title">Add Expense</h1>
            <p className="page-subtitle">Record a shared expense</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="form-stack">
              {/* Title */}
              <div className="field">
                <label htmlFor="exp-title">What was it for?</label>
                <input
                  id="exp-title"
                  type="text"
                  placeholder="e.g. Team dinner, Taxi, Hotel"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Amount */}
              <div className="field">
                <label htmlFor="exp-amount">Amount (₹)</label>
                <input
                  id="exp-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              {/* Category */}
              <div className="field">
                <label>Category</label>
                <div className="chip-group">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      className={`chip ${form.category === cat ? 'chip--selected' : ''}`}
                      onClick={() => setForm({ ...form, category: cat })}
                    >
                      {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid by */}
              <div className="field">
                <label htmlFor="exp-paidby">Paid by</label>
                <select
                  id="exp-paidby"
                  value={form.paidBy}
                  onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Split */}
              <div className="field">
                <label>Split among</label>
                <div className="tab-bar" style={{ marginBottom: 12 }}>
                  <button
                    type="button"
                    className={`tab-bar__item ${splitAll ? 'tab-bar__item--active' : ''}`}
                    onClick={() => setSplitAll(true)}
                  >
                    All Members
                  </button>
                  <button
                    type="button"
                    className={`tab-bar__item ${!splitAll ? 'tab-bar__item--active' : ''}`}
                    onClick={() => setSplitAll(false)}
                  >
                    Select Members
                  </button>
                </div>
                {!splitAll && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {members.map((m) => {
                      const isSelected = selectedSplit.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderRadius: 12, border: '1px solid',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                            background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                            color: 'var(--text-main)', cursor: 'pointer', width: '100%', textAlign: 'left',
                            transition: 'all 0.2s',
                          }}
                          onClick={() => toggleMember(m.id)}
                        >
                          <span style={{ fontWeight: isSelected ? 600 : 400 }}>{m.name}</span>
                          <span style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, borderRadius: '50%',
                            background: isSelected ? 'var(--danger)' : 'var(--bg-card)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            fontSize: '1.2rem', lineHeight: 1
                          }}>
                            {isSelected ? '−' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {splitAll && (
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    Split equally among all {members.length} members
                  </p>
                )}
              </div>

              {/* Per-person preview */}
              {form.amount && parseFloat(form.amount) > 0 && (
                <div className="alert alert--info">
                  ₹{(parseFloat(form.amount) / (splitAll ? members.length : selectedSplit.length || 1)).toFixed(2)} per person
                </div>
              )}

              {error && <div className="alert alert--error">{error}</div>}

              <button type="submit" className="btn btn--primary btn--full btn--lg">
                💸 Add Expense
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
