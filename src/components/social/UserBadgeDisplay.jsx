import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

export default function UserBadgeDisplay({ userEmail }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    base44.entities.User.filter({ email: userEmail })
      .then(users => {
        if (users.length > 0 && users[0].role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(error => console.log('Error fetching user:', error));

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.User.subscribe((event) => {
      if (event.data?.email === userEmail && event.data?.role === 'admin') {
        setIsAdmin(true);
      }
    });

    return () => unsubscribe();
  }, [userEmail]);

  if (!isAdmin) return null;

  return (
    <span className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold whitespace-nowrap">
      👑 Admin
    </span>
  );
}