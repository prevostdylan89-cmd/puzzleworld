import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import UsernameSetupModal from './UsernameSetupModal';

export default function UsernameGuard({ children }) {
  const [user, setUser] = useState(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user already has a username set
      if (!currentUser.username_set) {
        setNeedsUsername(true);
      }
    } catch (e) {
      // Not logged in, no need to show modal
    } finally {
      setChecked(true);
    }
  };

  const handleComplete = (data) => {
    setNeedsUsername(false);
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <>
      {children}
      {checked && needsUsername && user && (
        <UsernameSetupModal user={user} onComplete={handleComplete} />
      )}
    </>
  );
}