
'use client';

import * as React from 'react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useSettings } from './use-settings';
import { toast } from './use-toast';
import { useTranslation } from './use-translation';

/**
 * useSessionTimeout handles the countdown and activity detection for auto-logout.
 */
export function useSessionTimeout() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { t } = useTranslation();
  const { sessionTimeout, autoLogoutEnabled } = useSettings();
  
  const [showWarning, setShowWarning] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLogout = React.useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setShowWarning(false);
    toast({
      title: t('sessionExpired'),
      description: t('sessionExpiredSub'),
      variant: "destructive"
    });
    router.push('/login');
  }, [auth, router, t]);

  const resetTimer = React.useCallback(() => {
    if (!autoLogoutEnabled || !user) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    setShowWarning(false);

    const timeoutMs = sessionTimeout * 60 * 1000;
    const warningMs = Math.max(0, timeoutMs - 60 * 1000); // 1 minute before expiry

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningMs);

    timerRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [autoLogoutEnabled, user, sessionTimeout, handleLogout]);

  React.useEffect(() => {
    if (!autoLogoutEnabled || !user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => resetTimer();

    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [autoLogoutEnabled, user, resetTimer]);

  return {
    showWarning,
    setShowWarning,
    resetTimer,
    handleLogout
  };
}
