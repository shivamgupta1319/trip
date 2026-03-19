'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import { saveTrip, generateId } from '@/lib/storage';

export default function NewTripPage() {
  const { session, loading } = useRequireAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    destination: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Trip name is required.');
    setSubmitting(true);

    const newTrip = {
      id: generateId(),
      name: form.name.trim(),
      destination: form.destination.trim(),
      description: form.description.trim(),
      status: 'active' as const,
      createdBy: session!.userId,
      memberIds: [session!.userId],
      createdAt: new Date().toISOString(),
    };

    await saveTrip(newTrip);
    router.push(`/trips/${newTrip.id}`);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return null;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content">
        <div className="container">
          <div className="page-header">
            <Link href="/dashboard" className="back-link">← Dashboard</Link>
            <h1 className="page-title">Create New Trip</h1>
            <p className="page-subtitle">Where are you heading?</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="form-stack">
              <div className="field">
                <label htmlFor="trip-name">Trip Name *</label>
                <input
                  id="trip-name"
                  type="text"
                  placeholder="e.g. Goa 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="destination">Destination</label>
                <input
                  id="destination"
                  type="text"
                  placeholder="e.g. Goa, India"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="A quick note about this trip…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {error && <div className="alert alert--error">{error}</div>}

              <button
                type="submit"
                className="btn btn--primary btn--full btn--lg"
                disabled={submitting}
              >
                {submitting ? 'Creating…' : '🚀 Create Trip'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
