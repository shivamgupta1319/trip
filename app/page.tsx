'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
}
