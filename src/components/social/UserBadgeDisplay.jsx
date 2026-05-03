import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function UserBadgeDisplay({ userEmail }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    // Call a backend function to safely check admin status
    base44.functions.invoke('checkUserRole', { email: userEmail })
      .then(res => {
        if (res.data?.isAdmin) {
          setIsAdmin(true);
        }
      })
      .catch(error => console.log('Error checking user role:', error));
  }, [userEmail]);

  if (!isAdmin) return null;

  return (
    <span className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold whitespace-nowrap">
      👑 Admin
    </span>
  );
}