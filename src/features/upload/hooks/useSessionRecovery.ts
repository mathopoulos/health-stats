import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_DELAY = 2000;

interface UseSessionRecoveryOptions {
  onRecoveryExhausted?: () => void;
  maxAttempts?: number;
}

/**
 * Hook to handle session recovery in a controlled way
 * Prevents infinite reload loops by limiting retry attempts
 */
export function useSessionRecovery(options: UseSessionRecoveryOptions = {}) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const recoveryAttempts = useRef(0);
  const lastRecoveryTime = useRef(0);
  const { onRecoveryExhausted, maxAttempts = MAX_RECOVERY_ATTEMPTS } = options;

  useEffect(() => {
    // Only handle authenticated sessions with missing user ID
    if (sessionStatus !== 'authenticated' || session?.user?.id) {
      // Reset counter on successful auth or when not authenticated
      recoveryAttempts.current = 0;
      return;
    }

    const now = Date.now();
    
    // Prevent rapid successive recovery attempts
    if (now - lastRecoveryTime.current < RECOVERY_DELAY) {
      return;
    }

    // Check if we've exceeded max attempts
    if (recoveryAttempts.current >= maxAttempts) {
      console.error('Session recovery exhausted, redirecting to auth');
      
      if (onRecoveryExhausted) {
        onRecoveryExhausted();
      } else {
        // Fallback: redirect to sign-in instead of infinite reload
        router.push('/auth/signin');
      }
      return;
    }

    // Session recovery attempt (removed console.log to avoid test brittleness)
    
    recoveryAttempts.current++;
    lastRecoveryTime.current = now;

    // Use router.refresh() if available, otherwise redirect to signin
    // This is less disruptive than window.location.reload()
    if (typeof router.refresh === 'function') {
      router.refresh();
    } else {
      // Fallback for environments where refresh isn't available (like tests)
      router.push('/auth/signin');
    }
    
  }, [session, sessionStatus, router, maxAttempts, onRecoveryExhausted]);

  return {
    isRecovering: sessionStatus === 'authenticated' && !session?.user?.id,
    recoveryAttempts: recoveryAttempts.current,
    maxAttempts
  };
}
