import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const DAILY_LIMIT = 5;

export function useScanCredits(user) {
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [resetDate, setResetDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Today's date key in Paris timezone
  const getTodayKey = () => {
    return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // YYYY-MM-DD
  };

  const loadCredits = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const me = await base44.auth.me();
      const scanData = me.daily_scan_credits || {};
      const todayKey = getTodayKey();

      if (scanData.date === todayKey) {
        setCreditsUsed(scanData.used || 0);
      } else {
        // New day → reset
        setCreditsUsed(0);
      }
      setResetDate(scanData.date);
    } catch (e) {
      setCreditsUsed(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const consumeCredit = async () => {
    const todayKey = getTodayKey();
    const newUsed = creditsUsed + 1;
    setCreditsUsed(newUsed);

    // Compute reset time: tomorrow at 00:00 Paris time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const resetAt = new Date(tomorrow.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }) + 'T00:00:00');

    await base44.auth.updateMe({
      daily_scan_credits: {
        date: todayKey,
        used: newUsed,
        reset_at: resetAt.toISOString(),
      }
    });

    return newUsed;
  };

  const remaining = Math.max(0, DAILY_LIMIT - creditsUsed);
  const isLimitReached = creditsUsed >= DAILY_LIMIT;

  // Compute reset time display
  const getResetInfo = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Set to midnight Paris
    const resetStr = new Date(tomorrow.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }) + 'T00:00:00');
    const dateStr = resetStr.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return { dateStr, timeStr: '00:00' };
  };

  return { remaining, creditsUsed, isLimitReached, consumeCredit, loading, getResetInfo, DAILY_LIMIT };
}