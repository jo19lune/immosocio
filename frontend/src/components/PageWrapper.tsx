/**
 * PageWrapper.tsx — Enveloppe chaque page avec une animation d'entrée anime.js
 *
 * Usage :
 *   export default function FeedPage() {
 *     return (
 *       <PageWrapper>
 *         <h1>Mon feed</h1>
 *       </PageWrapper>
 *     );
 *   }
 */
import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

interface PageWrapperProps {
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
}

export default function PageWrapper({ children, className = '', style }: PageWrapperProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Page entière : fade + slide
    animate(el, {
      opacity:    [0, 1],
      translateY: [16, 0],
      duration:   420,
      easing:     'easeOutExpo',
    });

    // Sections / cards enfants en stagger
    const sections = el.querySelectorAll<HTMLElement>(
      '.card, .post-card, .section-block, [data-animate="stagger"]'
    );
    if (sections.length) {
      animate(sections, {
        opacity:    [0, 1],
        translateY: [12, 0],
        delay:      stagger(55, { start: 80 }),
        duration:   380,
        easing:     'easeOutCubic',
      });
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`page-wrapper ${className}`}
      style={{ opacity: 0, ...style }}
    >
      {children}
    </div>
  );
}

/* ── Skeleton animé pour les listes en attente ─────────────────────────── */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton skeleton-line" style={{ width: '90%' }} />
            <div className="skeleton skeleton-line" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
      <style>{`
        .skeleton-list    { display: flex; flex-direction: column; gap: 1rem; }
        .skeleton-card    {
          display:       flex;
          gap:           1rem;
          padding:       1.25rem;
          background:    var(--bg-surface);
          border:        1px solid var(--border-color);
          border-radius: var(--radius-lg);
          animation:     fadeIn 0.3s ease both;
        }
        .skeleton-avatar {
          width:         44px;
          height:        44px;
          border-radius: 50%;
          flex-shrink:   0;
        }
        .skeleton-body  { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .skeleton-line  { height: 12px; border-radius: 6px; }
      `}</style>
    </div>
  );
}
