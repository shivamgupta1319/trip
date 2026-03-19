'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import {
  getTripById, getUsers, saveUser, getTrips, saveTrip, generateId
} from '@/lib/storage';
import { Trip, User } from '@/lib/types';

export default function AddMemberPage() {
  const { session, loading } = useRequireAuth();
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<User | null | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const [success, setSuccess] = useState('');
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
      setMembers(allUsers.filter((u) => t.memberIds.includes(u.id)));
    })();
    return () => { mounted = false; };
  }, [session, tripId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const allUsers = await getUsers();
    const match = allUsers.find(
      (u) => u.name.toLowerCase() === query.trim().toLowerCase()
    );
    setFound(match || null);
    setSearched(true);
  };

  const addExistingMember = async () => {
    if (!found || !trip) return;
    if (trip.memberIds.includes(found.id)) {
      return setError(`${found.name} is already a member.`);
    }
    const updatedTrip = { ...trip, memberIds: [...trip.memberIds, found.id] };
    await saveTrip(updatedTrip);
    setTrip(updatedTrip);
    setMembers([...members, found]);
    setSuccess(`${found.name} added to the trip! 🎉`);
    setQuery(''); setFound(undefined); setSearched(false);
  };

  const createAndAdd = async () => {
    if (!trip) return;
    const name = query.trim();
    if (!name) return setError('Please enter a name.');
    const allUsers = await getUsers();
    const existing = allUsers.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (existing) return setError('A user with this name already exists.');

    const newUser: User = {
      id: generateId(),
      name,
      pin: '1234',
      createdAt: new Date().toISOString(),
    };
    await saveUser(newUser);

    const updatedTrip = { ...trip, memberIds: [...trip.memberIds, newUser.id] };
    await saveTrip(updatedTrip);
    setTrip(updatedTrip);
    setMembers([...members, newUser]);
    setSuccess(`Created "${name}" with default PIN 1234 and added to trip! 🎉 They can change their PIN after logging in.`);
    setQuery(''); setFound(undefined); setSearched(false);
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
            <h1 className="page-title">Add Member</h1>
            <p className="page-subtitle">Search for an existing user or create a new one</p>
          </div>

          {/* Search form */}
          <div className="card" style={{ marginBottom: 20 }}>
            <form onSubmit={handleSearch} className="form-stack">
              <div className="field">
                <label htmlFor="member-name">Member Name</label>
                <input
                  id="member-name"
                  type="text"
                  placeholder="Enter name to search…"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSearched(false); setFound(undefined); }}
                />
              </div>
              <button type="submit" className="btn btn--primary btn--full">Search</button>
            </form>

            {/* Search result */}
            {searched && found && (
              <div style={{ marginTop: 16 }}>
                <div className="alert alert--info">
                  Found: <strong>{found.name}</strong>
                </div>
                {trip.memberIds.includes(found.id) ? (
                  <div className="alert alert--error" style={{ marginTop: 10 }}>
                    {found.name} is already a member of this trip.
                  </div>
                ) : (
                  <button
                    onClick={addExistingMember}
                    className="btn btn--primary btn--full"
                    style={{ marginTop: 12 }}
                  >
                    Add {found.name} to Trip
                  </button>
                )}
              </div>
            )}

            {searched && found === null && query.trim() && (
              <div style={{ marginTop: 16 }}>
                <div className="alert alert--error" style={{ marginBottom: 12 }}>
                  No user named &quot;{query.trim()}&quot; found.
                </div>
                <button onClick={createAndAdd} className="btn btn--primary btn--full">
                  Create &quot;{query.trim()}&quot; with PIN 1234 &amp; Add
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8, textAlign: 'center' }}>
                  They can log in with PIN 1234 and change it in Settings
                </p>
              </div>
            )}

            {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}
            {success && <div className="alert alert--success" style={{ marginTop: 12 }}>{success}</div>}
          </div>

          {/* Current members */}
          <div className="section-header">
            <h2>Current Members ({members.length})</h2>
          </div>
          <div className="stack">
            {members.map((m) => (
              <div className="list-item" key={m.id} style={{ cursor: 'default' }}>
                <div className="avatar">{m.name.charAt(0).toUpperCase()}</div>
                <div className="list-item__body">
                  <div className="list-item__title">{m.name}</div>
                  {m.id === trip.createdBy && (
                    <div className="list-item__sub">Trip creator</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
