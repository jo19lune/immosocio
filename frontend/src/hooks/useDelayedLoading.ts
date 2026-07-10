import { useState, useEffect } from 'react';

export function useDelayedLoading(
  isLoading: boolean,
  delayMs: number = 200,
  minDisplayMs: number = 500
): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let minDisplayTimeoutId: ReturnType<typeof setTimeout>;
    let startTimestamp: number;

    if (isLoading) {
      // Start the delay timer
      timeoutId = setTimeout(() => {
        setShouldShow(true);
        startTimestamp = Date.now();
      }, delayMs);
    } else {
      if (shouldShow) {
        // We are currently showing the loader. Calculate how long it's been shown.
        const elapsed = Date.now() - (startTimestamp! || Date.now());
        const remainingMinDisplayTime = minDisplayMs - elapsed;

        if (remainingMinDisplayTime > 0) {
          // Keep showing until minDisplayMs has passed
          minDisplayTimeoutId = setTimeout(() => {
            setShouldShow(false);
          }, remainingMinDisplayTime);
        } else {
          // Already shown long enough
          setShouldShow(false);
        }
      } else {
        // Loader wasn't shown yet (or at all)
        setShouldShow(false);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(minDisplayTimeoutId);
    };
  }, [isLoading, delayMs, minDisplayMs, shouldShow]);

  return shouldShow;
}
