import { useCallback, useRef, useState, type RefCallback } from 'react';

export interface UseIntersectionObserverOptions {
  /**
   * Margin around root. 200px triggers ~200px before viewport bottom.
   * @default '200px'
   */
  rootMargin?: string;
  
  /**
   * 0 = trigger immediately on intersect, 1 = fully visible.
   * @default 0
   */
  threshold?: number;
  
  /**
   * Disable re-trigger after first load (prevents duplicate API calls).
   * @default true
   */
  freezeOnceVisible?: boolean;
}

export default function useIntersectionObserver(
  onIntersect: () => void,
  options: UseIntersectionObserverOptions = {}
): { ref: RefCallback<HTMLElement>; isIntersecting: boolean } {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const frozenRef = useRef(false);

  const ref: RefCallback<HTMLElement> = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !frozenRef.current) {
          frozenRef.current = Boolean(options.freezeOnceVisible);
          onIntersect();
          setIsIntersecting(true);
        }
      },
      {
        rootMargin: options.rootMargin ?? '200px',
        threshold: options.threshold ?? 0,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [onIntersect, options.rootMargin, options.threshold, options.freezeOnceVisible]);

  return { ref, isIntersecting };
}
