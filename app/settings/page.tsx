'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import { getUsers, saveUsers } from '@/lib/storage';

export default function SettingsPage() {
  const { session, loading } = useRequireAuth();

  // Old PIN refs
  const oldRef0 = useRef<HTMLInputElement>(null);
  const oldRef1 = useRef<HTMLInputElement>(null);
  const oldRef2 = useRef<HTMLInputElement>(null);
  const oldRef3 = useRef<HTMLInputElement>(null);
  const oldRefs = [oldRef0, oldRef1, oldRef2, oldRef3];

  // New PIN refs
  const newRef0 = useRef<HTMLInputElement>(null);
  const newRef1 = useRef<HTMLInputElement>(null);
  const newRef2 = useRef<HTMLInputElement>(null);
  const newRef3 = useRef<HTMLInputElement>(null);
  const newRefs = [newRef0, newRef1, newRef2, newRef3];

  // Confirm PIN refs
  const confRef0 = useRef<HTMLInputElement>(null);
  const confRef1 = useRef<HTMLInputElement>(null);
  const confRef2 = useRef<HTMLInputElement>(null);
  const confRef3 = useRef<HTMLInputElement>(null);
  const confRefs = [confRef0, confRef1, confRef2, confRef3];

  const [oldPin, setOldPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (
    arr: string[],
    setArr: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[],
    index: number,
    value: string
  ) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...arr];
    next[index] = value;
    setArr(next);
    if (value && index < 3) refs[index + 1].current?.focus();
  };

  const handleKeyDown = (
    arr: string[],
    refs: React.RefObject<HTMLInputElement | null>[],
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !arr[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const old = oldPin.join('');
    const nw = newPin.join('');
    const conf = confirmPin.join('');

    if (old.length !== 4 || nw.length !== 4 || conf.length !== 4)
      return setError('All PIN fields must be 4 digits.');
    if (nw !== conf) return setError('New PINs do not match.');

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === session!.userId);
    if (idx === -1) return setError('User not found.');
    if (users[idx].pin !== old) return setError('Current PIN is incorrect.');

    users[idx] = { ...users[idx], pin: nw };
    saveUsers(users);
    setOldPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setSuccess('PIN updated successfully! 🎉');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  const renderPinRow = (
    label: string,
    prefix: string,
    arr: string[],
    setArr: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => (
    <div className="field">
      <label>{label}</label>
      <div className="pin-input-group">
        {arr.map((digit, i) => (
          <input
            key={i}
            ref={refs[i]}
            className="pin-input"
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            id={`${prefix}-${i}`}
            onChange={(e) => handleChange(arr, setArr, refs, i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(arr, refs, i, e)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <Navbar />
      <div className="page-content">
        <div className="container">
          <div className="page-header">
            <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account</p>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.2rem' }}>
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{session.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                  Logged in as {session.name}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: 18, fontSize: '1rem' }}>Change PIN</h2>
            <form onSubmit={handleSubmit} className="form-stack">
              {renderPinRow('Current PIN', 'old', oldPin, setOldPin, oldRefs)}
              {renderPinRow('New PIN', 'new', newPin, setNewPin, newRefs)}
              {renderPinRow('Confirm New PIN', 'conf', confirmPin, setConfirmPin, confRefs)}
              {error && <div className="alert alert--error">{error}</div>}
              {success && <div className="alert alert--success">{success}</div>}
              <button type="submit" className="btn btn--primary btn--full">
                Update PIN
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
