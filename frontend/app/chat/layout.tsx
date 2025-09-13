'use client'
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Bar from '@/components/Bar';

interface User {
  email?: string;
  displayName?: string;
  uid: string;
}

const UserContext = createContext<User | null>(null);

export const useUser = () => useContext(UserContext);

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/log-in')
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <UserContext.Provider value={user}>
      <div className="flex h-screen">
        <div className="flex-shrink-0">
          <Bar user={user} />
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </UserContext.Provider>
  );
}