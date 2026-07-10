import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import logoSrc from '../assets/logo.svg';

/**
 * LoadingScreen — Écran de chargement animé avec anime.js v4
 *
 * Animation :
 *   1. Logo : scale-in + fade
 *   2. Grille de cellules : stagger reveal (inspiré du pattern createLayout)
 *   3. Barre de progression en bas
 */
export default function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef      = useRef<HTMLDivElement>(null);
  const logoRef      = useRef<HTMLImageElement>(null);
  const progressRef  = useRef<HTMLDivElement>(null);
  const textRef      = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // ── 1. Logo animation ───────────────────────────────────────────────────
    animate(logoRef.current!, {
      opacity:   [0, 1],
      scale:     [0.6, 1],
      translateY: [20, 0],
      duration: 700,
      easing: 'easeOutExpo',
    });

    // ── 2. Texte ────────────────────────────────────────────────────────────
    animate(textRef.current!, {
      opacity:    [0, 1],
      translateY: [10, 0],
      delay: 300,
      duration: 500,
      easing: 'easeOutCubic',
    });

    // ── 3. Cellules de la grille (pattern stagger avec effet ondulation) ──
    const cells = gridRef.current?.querySelectorAll('.ls-cell');
    if (cells && cells.length) {
      animate(cells, {
        opacity:   [0, 1],
        scale:     [0.5, 1],
        delay:     stagger(60, { grid: [4, 3], from: 'center' }),
        duration:  500,
        easing:    'easeOutBack',
      });

      // Cycle layout changes like the animejs createLayout pattern
      let gridIndex = 0;
      const gridConfigs = [
        { rows: '1fr 1fr 1fr', cols: '1fr 1fr' },
        { rows: '1fr 1fr',     cols: 'repeat(3, 1fr)' },
        { rows: '1fr 1fr 1fr', cols: '1fr 1fr' },
        { rows: '1fr 1fr',     cols: 'repeat(3, 1fr)' },
      ];

      const cycleGrid = () => {
        gridIndex = (gridIndex + 1) % gridConfigs.length;
        const config = gridConfigs[gridIndex];
        if (gridRef.current) {
          gridRef.current.style.gridTemplateRows    = config.rows;
          gridRef.current.style.gridTemplateColumns = config.cols;
        }
        animate(cells, {
          opacity: [0.4, 1],
          scale:   [0.8, 1],
          delay:   stagger(80, { grid: [4, 3], from: 'random' }),
          duration: 600,
          easing: 'easeInOutQuad',
          onComplete: () => {
            // Only continue cycling while component is mounted
            if (gridRef.current) cycleGrid();
          },
        });
      };

      const cycleTimeout = setTimeout(cycleGrid, 900);
      return () => clearTimeout(cycleTimeout);
    }

    // ── 4. Barre de progression ─────────────────────────────────────────────
    animate(progressRef.current!, {
      width: ['0%', '85%'],
      duration: 2400,
      easing: 'easeInOutQuart',
    });
  }, []);

  return (
    <div className="ls-root" ref={containerRef}>
      {/* Fond grain */}
      <div className="ls-grain" />

      {/* Logo + titre */}
      <div className="ls-brand">
        <img
          ref={logoRef}
          src={logoSrc}
          alt="Logo"
          className="ls-logo"
          style={{ opacity: 0 }}
        />
        <span ref={textRef} className="ls-tagline" style={{ opacity: 0 }}>
          Chargement en cours…
        </span>
      </div>

      {/* Grille animée (pattern createLayout) */}
      <div ref={gridRef} className="ls-grid" data-grid="1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="ls-cell" style={{ opacity: 0 }} />
        ))}
      </div>

      {/* Barre de progression */}
      <div className="ls-progress-track">
        <div ref={progressRef} className="ls-progress-bar" />
      </div>

      <style>{`
        /* ── LoadingScreen styles ─────────────────────────────────────────── */
        .ls-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          background: var(--bg-page, #0f1117);
          overflow: hidden;
        }

        /* Subtle grain overlay */
        .ls-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          opacity: 0.5;
        }

        /* Brand block */
        .ls-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          z-index: 1;
        }

        /* Logo avec effet glow */
        .ls-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          filter: var(--logo-filter, drop-shadow(0 0 24px rgba(99,102,241,0.6)));
          border-radius: 16px;
          transition: filter 0.3s ease;
        }
        [data-theme="light"] .ls-logo {
          filter: drop-shadow(0 4px 16px rgba(99,102,241,0.3));
        }

        .ls-tagline {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.875rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted, rgba(255,255,255,0.45));
        }

        /* ── Grid animée (anime.js layout pattern) ────────────────────────── */
        .ls-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr 1fr;
          gap: 6px;
          width: 160px;
          height: 120px;
          z-index: 1;
          transition: grid-template-columns 0.6s ease, grid-template-rows 0.6s ease;
        }

        .ls-cell {
          border-radius: 6px;
          background: var(--color-primary, #6366f1);
          opacity: 0;
          transition: background 0.4s ease;
        }
        .ls-cell:nth-child(odd)  { background: var(--color-primary, #6366f1); }
        .ls-cell:nth-child(even) { background: var(--color-accent,  #8b5cf6); }
        .ls-cell:nth-child(3n)   { background: var(--color-secondary, #06b6d4); }

        /* ── Barre de progression ─────────────────────────────────────────── */
        .ls-progress-track {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255,255,255,0.07);
          z-index: 2;
        }
        .ls-progress-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(
            90deg,
            var(--color-primary, #6366f1),
            var(--color-accent,  #8b5cf6),
            var(--color-secondary, #06b6d4)
          );
          background-size: 200% 100%;
          animation: progressShimmer 1.5s linear infinite;
          border-radius: 0 2px 2px 0;
        }

        @keyframes progressShimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}
