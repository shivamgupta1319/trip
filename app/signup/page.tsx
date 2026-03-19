'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUsers, saveUser, getUserByName, generateId } from '@/lib/storage';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const confirmRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = (
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

  const handlePinKeyDown = (
    arr: string[],
    setArr: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[],
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !arr[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const pinStr = pin.join('');
    const confirmStr = confirmPin.join('');

    if (!trimmedName) return setError('Please enter your name.');
    if (pinStr.length !== 4) return setError('Enter a 4-digit PIN.');
    if (pinStr !== confirmStr) return setError('PINs do not match.');

    setLoading(true);
    const existing = await getUserByName(trimmedName);
    if (existing) {
      setError('A user with this name already exists. Try logging in.');
      setLoading(false);
      return;
    }

    const newUser = {
      id: generateId(),
      name: trimmedName,
      pin: pinStr,
      createdAt: new Date().toISOString(),
    };

    const users = await getUsers();
    await saveUser(newUser);
    login({ userId: newUser.id, name: newUser.name });
    router.replace('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-box__logo">
          <h1>Trip<span>Split</span></h1>
          <p>Create your account to get started</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="form-stack">
            <div className="field">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Alice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label>Choose a 4-Digit PIN</label>
              <div className="pin-input-group">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    className="pin-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(pin, setPin, pinRefs, i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(pin, setPin, pinRefs, i, e)}
                    id={`pin-new-${i}`}
                  />
                ))}
              </div>
            </div>

            <div className="field">
              <label>Confirm PIN</label>
              <div className="pin-input-group">
                {confirmPin.map((digit, i) => (
                  <input
                    key={i}
                    ref={confirmRefs[i]}
                    className="pin-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(confirmPin, setConfirmPin, confirmRefs, i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(confirmPin, setConfirmPin, confirmRefs, i, e)}
                    id={`pin-confirm-${i}`}
                  />
                ))}
              </div>
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <button
              type="submit"
              className="btn btn--primary btn--full btn--lg"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
