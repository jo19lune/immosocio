import { useEffect, useRef } from 'react';
import { APP_REFRESH_EVENT, shouldHandleRefresh, type AppRefreshDetail, type RefreshScope } from '../lib/appEvents';

/**
 * Hook to trigger a callback when a WebSocket notification is received.
 * Used for auto-refreshing page data.
 */
export function useAutoRefresh(
  callback: () => void,
  scopes: RefreshScope[] = ['*'],
) {
  const callbackRef = useRef(callback);
  const scopeKey = scopes.join('|');

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent<AppRefreshDetail>).detail;
      const incomingScopes = detail?.scopes ?? ['*'];
      if (shouldHandleRefresh(scopes, incomingScopes)) {
        callbackRef.current();
      }
    };

    window.addEventListener(APP_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(APP_REFRESH_EVENT, handleRefresh);
    };
  }, [scopeKey]);
}
