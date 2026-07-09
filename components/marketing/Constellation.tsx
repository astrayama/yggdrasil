'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { rng, setupCanvas, prefersReducedMotion } from './canvas';

type Star = { x: number; y: number; r: number; ph: number; drift: number; gold: boolean };

/**
 * Hero background: a faint field of drifting stars with hairline links between
 * near neighbours — a quiet "constellation" that twinkles behind the wordmark.
 * Deterministic (seeded) so it looks the same on every visit; static and dim
 * under prefers-reduced-motion.
 */
export function Constellation({ style = {} }: { style?: CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let ro: ResizeObserver | null = null;

    const start = () => {
      const env = setupCanvas(canvasRef);
      if (!env) return;
      const { ctx, W, H } = env;
      const reduced = prefersReducedMotion();
      const rnd = rng(2718);
      // Density scales with area, capped so large screens stay tasteful.
      const count = Math.min(84, Math.round((W * H) / 15000));
      const stars: Star[] = Array.from({ length: count }, () => ({
        x: rnd() * W,
        y: rnd() * H,
        r: 0.5 + rnd() * 1.4,
        ph: rnd() * 6.28,
        drift: 3 + rnd() * 7,
        gold: rnd() < 0.16,
      }));
      const linkDist = Math.min(150, W * 0.14);
      const t0 = performance.now();

      const frame = (now: number) => {
        const t = (now - t0) / 1000;
        ctx.clearRect(0, 0, W, H);
        // Positions for this frame (gentle vertical drift + horizontal sway).
        const pts = stars.map((s) => {
          const yy = reduced ? s.y : ((((s.y - t * s.drift) % (H + 20)) + H + 20) % (H + 20)) - 10;
          const xx = reduced ? s.x : s.x + Math.sin(t * 0.25 + s.ph) * 10;
          return { xx, yy, s };
        });
        // Hairline links between near neighbours.
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].xx - pts[j].xx;
            const dy = pts[i].yy - pts[j].yy;
            const d = Math.hypot(dx, dy);
            if (d < linkDist) {
              const a = (1 - d / linkDist) * 0.16;
              ctx.strokeStyle = `rgba(123,174,138,${a.toFixed(3)})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(pts[i].xx, pts[i].yy);
              ctx.lineTo(pts[j].xx, pts[j].yy);
              ctx.stroke();
            }
          }
        }
        // Stars, with a slow twinkle.
        for (const { xx, yy, s } of pts) {
          const tw = reduced ? 0.5 : 0.4 + 0.35 * Math.sin(t * 0.9 + s.ph);
          const base = s.gold ? 'rgba(201,168,76,' : 'rgba(232,224,208,';
          ctx.fillStyle = base + Math.max(0.08, 0.5 * tw).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(xx, yy, s.r, 0, 6.29);
          ctx.fill();
          if (s.gold) {
            ctx.fillStyle = `rgba(201,168,76,${(0.06 * tw).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(xx, yy, s.r * 4, 0, 6.29);
            ctx.fill();
          }
        }
        if (!reduced) raf = requestAnimationFrame(frame);
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };

    start();
    // Re-lay out on resize so the field always fills the hero.
    if (typeof ResizeObserver !== 'undefined' && canvasRef.current) {
      let tid = 0 as unknown as ReturnType<typeof setTimeout>;
      ro = new ResizeObserver(() => {
        clearTimeout(tid);
        tid = setTimeout(start, 150);
      });
      ro.observe(canvasRef.current);
    }
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    />
  );
}
