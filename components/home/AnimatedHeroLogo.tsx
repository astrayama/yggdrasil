"use client";

import { useLayoutEffect, useRef } from "react";
import { TreeLogo } from "./TreeLogo";

type LeafSprite = {
  left: string;
  top: string;
  size: string;
  rotate: number;
  drift: number;
  tone: string;
};

const leafSprites: LeafSprite[] = [
  { left: "31%", top: "14%", size: "clamp(0.42rem,1vw,1rem)", rotate: -24, drift: 12, tone: "bg-home-olive" },
  { left: "39%", top: "10%", size: "clamp(0.44rem,1.08vw,1.08rem)", rotate: 28, drift: 15, tone: "bg-home-sage" },
  { left: "47%", top: "8%", size: "clamp(0.38rem,0.92vw,0.92rem)", rotate: -12, drift: 10, tone: "bg-home-olive" },
  { left: "55%", top: "12%", size: "clamp(0.46rem,1.1vw,1.1rem)", rotate: -36, drift: 16, tone: "bg-home-sage" },
  { left: "65%", top: "17%", size: "clamp(0.4rem,0.95vw,0.95rem)", rotate: 22, drift: 13, tone: "bg-home-olive" },
  { left: "25%", top: "23%", size: "clamp(0.34rem,0.82vw,0.82rem)", rotate: -42, drift: 11, tone: "bg-home-sage" },
  { left: "34%", top: "22%", size: "clamp(0.45rem,1.1vw,1.1rem)", rotate: -18, drift: 14, tone: "bg-home-stone" },
  { left: "43%", top: "20%", size: "clamp(0.5rem,1.2vw,1.2rem)", rotate: 26, drift: 17, tone: "bg-home-olive" },
  { left: "52%", top: "23%", size: "clamp(0.42rem,1vw,1rem)", rotate: -34, drift: 12, tone: "bg-home-sage" },
  { left: "61%", top: "26%", size: "clamp(0.5rem,1.2vw,1.2rem)", rotate: 18, drift: 15, tone: "bg-home-stone" },
  { left: "72%", top: "29%", size: "clamp(0.36rem,0.9vw,0.9rem)", rotate: 34, drift: 10, tone: "bg-home-olive" },
  { left: "22%", top: "39%", size: "clamp(0.32rem,0.78vw,0.78rem)", rotate: 18, drift: 10, tone: "bg-home-olive" },
  { left: "29%", top: "35%", size: "clamp(0.4rem,0.95vw,0.95rem)", rotate: 38, drift: 15, tone: "bg-home-sage" },
  { left: "37%", top: "36%", size: "clamp(0.42rem,1vw,1rem)", rotate: -8, drift: 12, tone: "bg-home-stone" },
  { left: "46%", top: "34%", size: "clamp(0.34rem,0.8vw,0.8rem)", rotate: -29, drift: 10, tone: "bg-home-olive" },
  { left: "55%", top: "36%", size: "clamp(0.38rem,0.9vw,0.9rem)", rotate: 28, drift: 12, tone: "bg-home-sage" },
  { left: "64%", top: "39%", size: "clamp(0.42rem,1vw,1rem)", rotate: -26, drift: 14, tone: "bg-home-stone" },
  { left: "75%", top: "43%", size: "clamp(0.34rem,0.8vw,0.8rem)", rotate: 41, drift: 11, tone: "bg-home-olive" },
  { left: "27%", top: "51%", size: "clamp(0.3rem,0.72vw,0.72rem)", rotate: -13, drift: 9, tone: "bg-home-sage" },
  { left: "35%", top: "50%", size: "clamp(0.35rem,0.85vw,0.85rem)", rotate: 15, drift: 12, tone: "bg-home-olive" },
  { left: "43%", top: "53%", size: "clamp(0.28rem,0.65vw,0.65rem)", rotate: 34, drift: 8, tone: "bg-home-stone" },
  { left: "51%", top: "51%", size: "clamp(0.3rem,0.7vw,0.7rem)", rotate: -37, drift: 9, tone: "bg-home-sage" },
  { left: "60%", top: "53%", size: "clamp(0.36rem,0.82vw,0.82rem)", rotate: -18, drift: 12, tone: "bg-home-olive" },
  { left: "69%", top: "55%", size: "clamp(0.28rem,0.65vw,0.65rem)", rotate: 12, drift: 8, tone: "bg-home-stone" },
  { left: "32%", top: "63%", size: "clamp(0.24rem,0.58vw,0.58rem)", rotate: -18, drift: 8, tone: "bg-home-olive" },
  { left: "41%", top: "65%", size: "clamp(0.28rem,0.65vw,0.65rem)", rotate: 24, drift: 9, tone: "bg-home-sage" },
  { left: "50%", top: "67%", size: "clamp(0.24rem,0.58vw,0.58rem)", rotate: -8, drift: 7, tone: "bg-home-stone" },
  { left: "59%", top: "65%", size: "clamp(0.27rem,0.64vw,0.64rem)", rotate: 29, drift: 9, tone: "bg-home-olive" },
  { left: "68%", top: "68%", size: "clamp(0.24rem,0.58vw,0.58rem)", rotate: -24, drift: 7, tone: "bg-home-sage" },
  { left: "38%", top: "76%", size: "clamp(0.22rem,0.52vw,0.52rem)", rotate: 18, drift: 6, tone: "bg-home-olive" },
  { left: "47%", top: "78%", size: "clamp(0.22rem,0.52vw,0.52rem)", rotate: -26, drift: 6, tone: "bg-home-stone" },
  { left: "56%", top: "79%", size: "clamp(0.22rem,0.52vw,0.52rem)", rotate: 30, drift: 6, tone: "bg-home-sage" },
  { left: "27%", top: "72%", size: "clamp(0.2rem,0.48vw,0.48rem)", rotate: -33, drift: 5, tone: "bg-home-stone" },
  { left: "73%", top: "73%", size: "clamp(0.2rem,0.48vw,0.48rem)", rotate: 36, drift: 5, tone: "bg-home-stone" },
];

type AnimatedHeroLogoProps = {
  className?: string;
};

export function AnimatedHeroLogo({ className = "" }: AnimatedHeroLogoProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let cleanup = () => {};
    let cancelled = false;

    void (async () => {
      const gsapModule = await import("gsap");
      if (cancelled) return;

      const gsap = gsapModule.gsap;

      const context = gsap.context(() => {
        const logo = root.querySelector(".hero-tree-logo");
        const stage = root.querySelector<HTMLElement>(".hero-logo-stage") ?? root;
        const leaves = gsap.utils.toArray<HTMLElement>(".hero-logo-leaf");

        const logoTween = gsap.fromTo(
          logo,
          { y: 8, scale: 0.995 },
          {
            y: -8,
            scale: 1.005,
            duration: 5.5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            force3D: true,
          },
        );

        const leafTweens = leaves.map((leaf, index) => {
          const startRotate = Number(leaf.dataset.rotate ?? 0);
          const drift = Number(leaf.dataset.drift ?? 8);
          const direction = index % 2 === 0 ? 1 : -1;
          const duration = 7.2 + (index % 6) * 0.45;

          const timeline = gsap.timeline({
            repeat: -1,
            repeatRefresh: true,
            defaults: {
              force3D: true,
            },
          })
            .set(leaf, {
              autoAlpha: 0,
              x: 0,
              y: () => -Math.max(4, stage.offsetHeight * 0.015),
              rotate: startRotate,
              scale: 0.9 + (index % 4) * 0.04,
            })
            .to(leaf, {
              autoAlpha: 0.88,
              duration: 0.8,
              ease: "sine.out",
            }, 0)
            .to(leaf, {
              x: direction * drift * (1.6 + (index % 3) * 0.25),
              y: () => stage.offsetHeight * 1.18,
              rotate: startRotate + direction * (190 + (index % 5) * 24),
              duration,
              ease: "none",
            }, 0)
            .to(leaf, {
              autoAlpha: 0,
              duration: 0.9,
              ease: "sine.in",
            }, duration - 0.9);

          timeline.progress(((index * 0.137) % 1));
          return timeline;
        });

        const animations = [logoTween, ...leafTweens];
        const setPaused = (paused: boolean) => {
          animations.forEach((animation) => animation.paused(paused));
        };

        const handleVisibilityChange = () => setPaused(document.hidden);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        handleVisibilityChange();

        cleanup = () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          context.revert();
        };
      }, root);
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative flex h-full w-full items-center justify-center overflow-visible ${className}`}>
      <div className="hero-logo-stage relative flex aspect-[394/418] h-full max-h-full max-w-full items-center justify-center overflow-visible">
        <TreeLogo
          className="hero-tree-logo block h-full w-full object-contain will-change-transform"
          decorative
        />
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
          {leafSprites.map((leaf, index) => (
            <span
              key={`${leaf.left}-${leaf.top}`}
              className={`hero-logo-leaf absolute block opacity-[0.65] will-change-transform ${leaf.tone}`}
              data-drift={leaf.drift}
              data-rotate={leaf.rotate}
              style={{
                left: leaf.left,
                top: leaf.top,
                width: leaf.size,
                height: `calc(${leaf.size} * 1.65)`,
                borderRadius: "80% 0 80% 0",
                transform: `rotate(${leaf.rotate}deg)`,
                transformOrigin: "50% 80%",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
