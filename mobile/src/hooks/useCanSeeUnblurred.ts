import { useState, useEffect, useRef } from 'react';
import { usersApi } from '../api/client';

const cache = new Map<string, boolean>();

/**
 * Single authority for blur: can the current viewer see this user's unblurred photos?
 * Fetches GET /v1/photos/check/:userId. Caches per userId for the session.
 * Pass result to ProfilePhoto canSeeUnblurred. When null, ProfilePhoto blurs (never expose).
 * @see docs/FRONTEND_REFACTOR_STRATEGY.md §4 Blur invariant
 */
export function useCanSeeUnblurred(targetUserId: string | null | undefined): boolean | null {
  const [canSee, setCanSee] = useState<boolean | null>(() =>
    targetUserId ? (cache.has(targetUserId) ? cache.get(targetUserId)! : null) : null,
  );
  const fetched = useRef(false);

  useEffect(() => {
    if (!targetUserId) {
      setCanSee(null);
      return;
    }
    if (cache.has(targetUserId)) {
      setCanSee(cache.get(targetUserId)!);
      return;
    }
    let cancelled = false;
    fetched.current = true;
    usersApi
      .canSeeUnblurred(targetUserId)
      .then((res) => {
        const value = res.data?.unblurred ?? false;
        cache.set(targetUserId, value);
        if (!cancelled) setCanSee(value);
      })
      .catch(() => {
        if (!cancelled) setCanSee(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  return canSee;
}
