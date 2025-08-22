import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_DELAY = 2000;
const INITIAL_WAIT_TIME = 3000; // Wait 3 seconds before first recovery attempt

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
  const recoveryAttempts = useRef(0);
  const lastRecoveryTime = useRef(0);
  const sessionProblemStartTime = useRef(0);
  const { onRecoveryExhausted, maxAttempts = MAX_RECOVERY_ATTEMPTS } = options;

  useEffect(() => {
    // Only handle authenticated sessions with missing user ID
    if (sessionStatus !== 'authenticated' || session?.user?.id) {
      // Reset all counters on successful auth or when not authenticated
      recoveryAttempts.current = 0;
      sessionProblemStartTime.current = 0;
      return;
    }

    const now = Date.now();
    
    // Track when the session problem first started
    if (sessionProblemStartTime.current === 0) {
      sessionProblemStartTime.current = now;
      console.log('Session problem detected, waiting before recovery...');
      return;
    }
    
    // Wait for initial period before attempting any recovery
    if (now - sessionProblemStartTime.current < INITIAL_WAIT_TIME) {
      return;
    }
    
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
        // Use window.location to avoid router context issues
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
      }
      return;
    }

    // Session recovery attempt (removed console.log to avoid test brittleness)
    
    recoveryAttempts.current++;
    lastRecoveryTime.current = now;

    // Instead of reloading (which doesn't fix broken sessions), 
    // redirect to sign-in to start fresh auth flow
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
    
  }, [session, sessionStatus, maxAttempts, onRecoveryExhausted]);

  return {
    isRecovering: sessionStatus === 'authenticated' && !session?.user?.id && 
                 sessionProblemStartTime.current > 0 && 
                 (Date.now() - sessionProblemStartTime.current >= INITIAL_WAIT_TIME),
    recoveryAttempts: recoveryAttempts.current,
    maxAttempts,
    isWaitingToRecover: sessionStatus === 'authenticated' && !session?.user?.id && 
                       sessionProblemStartTime.current > 0 && 
                       (Date.now() - sessionProblemStartTime.current < INITIAL_WAIT_TIME)
  };
}
