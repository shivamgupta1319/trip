'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import { getTripById, getExpenseById, updateExpense, getUsers } from '@/lib/storage';
import { Trip, User, ExpenseCategory } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/calculations';

const CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'accommodation', 'activities', 'shopping', 'other'
];

export default function EditExpensePage() {
  const { session, loading } = useRequireAuth();
  const params = useParams();
  const tripId = params.tripId as string;
  const expenseId = params.expenseId as string;
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
  const [expense, setExpense] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    if (!session) return;
    (async () => {
      const t = await getTripById(tripId);
      if (!t) { router.replace('/dashboard'); return; }
      const exp = await getExpenseById(expenseId);
      if (!exp || exp.tripId !== tripId) { router.replace(`/trips/${tripId}/expenses`); return; }
      if (!mounted) return;
      
      setTrip(t);
      setExpense(exp);
      const allUsers = await getUsers();
      if (!mounted) return;
      
      const mems = allUsers.filter((u) => t.memberIds.includes(u.id));
      setMembers(mems);
      
      setForm({
        title: exp.title,
        amount: exp.amount.toString(),
        category: exp.category,
        paidBy: exp.paidBy,
      });
      
      if (exp.splitAmong.length === mems.length) {
        setSplitAll(true);
        setSelectedSplit(mems.map(m => m.id));
      } else {
        setSplitAll(false);
        setSelectedSplit(exp.splitAmong);
      }
    })();
    return () => { mounted = false; };
  }, [session, tripId, expenseId, router]);

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

    const updatedExpense = {
      ...expense,
      title: form.title.trim(),
      amount: amt,
      category: form.category,
      paidBy: form.paidBy,
      splitAmong: split,
    };

    await updateExpense(updatedExpense);
    router.push(`/trips/${tripId}/expenses`);
  };

  if (loading || !trip || !expense) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content">
        <div className="container">
          <div className="page-header">
            <Link href={`/trips/${tripId}/expenses`} className="back-link">← Back to Expenses</Link>
            <h1 className="page-title">Edit Expense</h1>
            <p className="page-subtitle">Update details for "{expense.title}"</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="form-stack">
              <div className="field">
                <label htmlFor="exp-title">What was it for?</label>
                <input
                  id="exp-title"
                  type="text"
                  placeholder="e.g. Team dinner"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

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
                  <div className="chip-group">
                    {members.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        className={`chip ${selectedSplit.includes(m.id) ? 'chip--selected' : ''}`}
                        onClick={() => toggleMember(m.id)}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
                {splitAll && (
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    Split equally among all {members.length} members
                  </p>
                )}
              </div>

              {form.amount && parseFloat(form.amount) > 0 && (
                <div className="alert alert--info">
                  ₹{(parseFloat(form.amount) / (splitAll ? members.length : selectedSplit.length || 1)).toFixed(2)} per person
                </div>
              )}

              {error && <div className="alert alert--error">{error}</div>}

              <button type="submit" className="btn btn--primary btn--full btn--lg">
                💾 Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
