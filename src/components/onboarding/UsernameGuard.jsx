import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import UsernameSetupModal from './UsernameSetupModal';
import OnboardingTutorial from './OnboardingTutorial';

export default function UsernameGuard() {
  const children = null;
  const [user, setUser] = useState(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!currentUser.username_set) {
        setNeedsUsername(true);
      }
    } catch (e) {
      // Not logged in
    } finally {
      setChecked(true);
    }
  };

  const handleComplete = (data) => {
    setNeedsUsername(false);
    setUser(prev => ({ ...prev, ...data }));
    // Show tutorial right after username setup
    setShowTutorial(true);
  };

  return (
    <>
      {children}
      {checked && needsUsername && user && (
        <UsernameSetupModal user={user} onComplete={handleComplete} />
      )}
      <OnboardingTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}