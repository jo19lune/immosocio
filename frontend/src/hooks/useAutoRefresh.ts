import { useEffect } from 'react';

/**
 * Hook to trigger a callback when a WebSocket notification is received.
 * Used for auto-refreshing page data.
 */
export function useAutoRefresh(callback: () => void) {
  useEffect(() => {
    const handleRefresh = () => {
      callback();
    };

    window.addEventListener('ws-refresh', handleRefresh);
    return () => {
      window.removeEventListener('ws-refresh', handleRefresh);
    };
  }, [callback]);
}
