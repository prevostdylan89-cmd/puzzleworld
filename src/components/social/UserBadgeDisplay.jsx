import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

export default function UserBadgeDisplay({ userEmail }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    const fetchAndSubscribe = async () => {
      try {
        const users = await base44.entities.User.filter({ email: userEmail });
        if (users.length > 0 && users[0].role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.log('Error fetching user:', error);
      }

      // Subscribe to real-time updates
      const unsubscribe = base44.entities.User.subscribe((event) => {
        if (event.data?.email === userEmail && event.data?.role === 'admin') {
          setIsAdmin(true);
        }
      });

      return unsubscribe;
    };

    let unsubscribe;
    fetchAndSubscribe().then(unsub => { unsubscribe = unsub; });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userEmail]);

  if (!isAdmin) return null;

  return (
    <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap">
      👑 Admin
    </Badge>
  );
}