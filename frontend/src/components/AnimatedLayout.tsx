/**
 * AnimatedLayout.tsx — Implémentation du pattern anime.js createLayout
 *
 * Reproduit exactement le comportement de :
 *   import { createLayout, stagger } from 'animejs';
 *   const layout = createLayout('.layout-container');
 *   layout.update(({ root }) => { root.dataset.grid = (++i % 4) + 1; }, {
 *     duration: 1000, delay: stagger(150), onComplete: () => animateLayout()
 *   });
 *
 * Usage :
 *   <AnimatedLayout autoPlay interval={2500}>
 *     <div className="item">A</div>
 *     <div className="item">B</div>
 *     <div className="item">C</div>
 *     <div className="item">D</div>
 *   </AnimatedLayout>
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { animate, stagger } from 'animejs';

interface AnimatedLayoutProps {
  children:    React.ReactNode;
  autoPlay?:   boolean;   // lance le cycle automatiquement (défaut : true)
  interval?:   number;    // ms entre chaque changement  (défaut : 2500)
  className?:  string;
  style?:      React.CSSProperties;
}

export default function AnimatedLayout({
  children,
  autoPlay   = true,
  interval   = 2500,
  className  = '',
  style,
}: AnimatedLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indexRef     = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Cycle de grille ─────────────────────────────────────────────────── */
  const animateLayout = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;

    // Incrément circulaire : 1 → 2 → 3 → 4 → 1 → …
    indexRef.current = (indexRef.current % 4) + 1;
    root.dataset.grid = String(indexRef.current);

    const items = root.querySelectorAll<HTMLElement>('.item');
    if (!items.length) return;

    // Stagger d'entrée des items après le changement de grille
    animate(items, {
      opacity:   [0.3, 1],
      scale:     [0.85, 1],
      translateY:[8, 0],
      delay:     stagger(120),
      duration:  800,
      easing:    'easeOutExpo',
      onComplete: () => {
        // Planifie le prochain cycle
        if (autoPlay && containerRef.current) {
          timerRef.current = setTimeout(animateLayout, interval);
        }
      },
    });
  }, [autoPlay, interval]);

  /* ── Animation initiale ──────────────────────────────────────────────── */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Init : data-grid = "1"
    root.dataset.grid = '1';
    indexRef.current  = 1;

    const items = root.querySelectorAll<HTMLElement>('.item');
    animate(items, {
      opacity:   [0, 1],
      scale:     [0.7, 1],
      delay:     stagger(100, { grid: [2, 2], from: 'center' }),
      duration:  600,
      easing:    'easeOutBack',
      onComplete: () => {
        if (autoPlay) {
          timerRef.current = setTimeout(animateLayout, interval);
        }
      },
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoPlay, interval, animateLayout]);

  return (
    <div
      ref={containerRef}
      className={`grid-layout layout-container ${className}`}
      data-grid="1"
      style={style}
    >
      {children}
    </div>
  );
}
