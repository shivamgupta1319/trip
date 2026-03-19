'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserByName } from '@/lib/storage';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const { login } = useAuth();
  const router = useRouter();

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const pinStr = pin.join('');

    if (!trimmedName) return setError('Please enter your name.');
    if (pinStr.length !== 4) return setError('Enter your 4-digit PIN.');

    setLoading(true);
    const user = getUserByName(trimmedName);
    if (!user) {
      setError('No account found. Please sign up first.');
      setLoading(false);
      return;
    }
    if (user.pin !== pinStr) {
      setError('Incorrect PIN. Try again.');
      setLoading(false);
      return;
    }

    login({ userId: user.id, name: user.name });
    router.replace('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-box__logo">
          <h1>Trip<span>Split</span></h1>
          <p>Sign in to manage your trips &amp; expenses</p>
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
              <label>4-Digit PIN</label>
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
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    id={`pin-${i}`}
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            No account?{' '}
            <Link href="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
