'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useRequireAuth } from '@/context/AuthContext';
import { getTripsForUser } from '@/lib/storage';
import { Trip, User, Expense } from '@/lib/types';
import { formatCurrency, calculateTripSummary } from '@/lib/calculations';
import { getExpensesForTrip, getUsers } from '@/lib/storage';

export default function DashboardPage() {
  const { session, loading } = useRequireAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expensesMap, setExpensesMap] = useState<Record<string, Expense[]>>({});
  const [membersMap, setMembersMap] = useState<Record<string, User[]>>({});

  useEffect(() => {
    let mounted = true;
    if (session) {
      (async () => {
        const userTrips = await getTripsForUser(session.userId);
        if (!mounted) return;
        setTrips(userTrips);

        const allUsers = await getUsers();
        const eMap: Record<string, Expense[]> = {};
        const mMap: Record<string, User[]> = {};
        for (const t of userTrips) {
          eMap[t.id] = await getExpensesForTrip(t.id);
          mMap[t.id] = allUsers.filter(u => t.memberIds.includes(u.id));
        }
        if (mounted) {
          setExpensesMap(eMap);
          setMembersMap(mMap);
        }
      })();
    }
    return () => { mounted = false; };
  }, [session]);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }
  if (!session) return null;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content hero-gradient">
        <div className="container container--wide">
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 className="page-title">Hey, {session.name} 👋</h1>
            <p className="page-subtitle">Here are all your trips</p>
          </div>

          {/* Trips list */}
          <div className="section-header">
            <h2>Your Trips</h2>
            <Link href="/trips/new" className="btn btn--primary btn--sm">
              + New Trip
            </Link>
          </div>

          {(!trips || trips.length === 0) ? (
            <div className="empty-state">
              <div className="empty-state__icon">🧳</div>
              <div className="empty-state__title">No trips yet</div>
              <div className="empty-state__sub">Create your first trip to start splitting expenses</div>
              <Link href="/trips/new" className="btn btn--primary" style={{ marginTop: 20 }}>
                Create a Trip
              </Link>
            </div>
          ) : (
            <div className="stack">
              {(trips || []).map((trip) => {
                const expenses = expensesMap[trip.id] || [];
                const members = membersMap[trip.id] || [];
                const total = expenses.reduce((s, e) => s + e.amount, 0);
                return (
                  <Link key={trip.id} href={`/trips/${trip.id}`} className="list-item">
                    <div className="list-item__icon">
                      {trip.status === 'active' ? '✈️' : '🏁'}
                    </div>
                    <div className="list-item__body">
                      <div className="list-item__title">{trip.name}</div>
                      <div className="list-item__sub">
                        📍 {trip.destination || 'No destination'} &middot; {members.length} member{members.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="list-item__right">
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent)' }}>
                        {formatCurrency(total)}
                      </div>
                      <div>
                        <span className={`badge badge--${trip.status}`}>
                          {trip.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
