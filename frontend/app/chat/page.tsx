"use client";
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Bar from '@/components/Bar'

const Chat = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/log-in');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex">
      <Bar user={user} />
      <div className="flex-1 p-5">
        <h1>Chat Page - Welcome {user.email}</h1>
      </div>
    </div>
  );
};

export default Chat
