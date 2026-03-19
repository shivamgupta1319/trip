'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { session, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link href="/dashboard" className="navbar__logo">
          ✈️ Trip<span>Split</span>
        </Link>
        <div className="navbar__actions">
          {session && (
            <>
              <Link href="/settings" className="btn btn--ghost btn--sm">
                Settings
              </Link>
              <div
                className="avatar"
                style={{ cursor: 'default' }}
                title={session.name}
              >
                {session.name.charAt(0).toUpperCase()}
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={logout}
              >
                Logout
              </button>
            </>
          )}
          {!session && (
            <Link href="/login" className="btn btn--primary btn--sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
