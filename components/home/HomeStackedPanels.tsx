"use client";

import { useLayoutEffect, useRef } from "react";

type StackedPanel = {
  eyebrow?: string;
  title: string;
  body: string;
  outerBackground: string;
  panelBackground: string;
  text: string;
  contentZIndex: number;
  circleZIndex: number;
};

const panels: StackedPanel[] = [
  {
    eyebrow: "L'intelligence de soi",
    title: "A journal that reads between the lines.",
    body: "Yggdrasil turns your writing into a living system of themes, emotions, memories, and questions worth following.",
    outerBackground: "bg-home-mist",
    panelBackground: "bg-home-forest",
    text: "text-home-mist",
    contentZIndex: 1,
    circleZIndex: 0,
  },
  {
    title: "Every entry, understood",
    body: "Write freely. Yggdrasil extracts themes, emotions, people, and patterns automatically no tagging, prompts, or setup.",
    outerBackground: "bg-home-forest",
    panelBackground: "bg-home-olive",
    text: "text-home-mist",
    contentZIndex: 3,
    circleZIndex: 2,
  },
  {
    title: "A living Knowledge Graph",
    body: "Every concept, person, and theme becomes part of an interactive map that grows with every entry.",
    outerBackground: "bg-home-olive",
    panelBackground: "bg-home-sage",
    text: "text-home-mist",
    contentZIndex: 4,
    circleZIndex: 3,
  },
  {
    title: "Yggi, your companion",
    body: "Ask what has been on your mind, why two entries feel connected, or what pattern keeps returning.",
    outerBackground: "bg-home-sage",
    panelBackground: "bg-home-stone",
    text: "text-home-forest",
    contentZIndex: 6,
    circleZIndex: 5,
  },
];

type LenisInstance = {
  destroy: () => void;
  on: (event: "scroll", callback: () => void) => void;
  raf: (time: number) => void;
  resize?: () => void;
};

type HomeStackedPanelsProps = {
  scriptClassName: string;
};

export function HomeStackedPanels({ scriptClassName }: HomeStackedPanelsProps) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let cleanup = () => {};

    void (async () => {
      const lenisModule = await import("lenis");
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;

      gsap.registerPlugin(ScrollTrigger);

      const Lenis = lenisModule.default;
      const lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 1.25,
      }) as LenisInstance;
      const tickLenis = (time: number) => lenis.raf(time * 1000);

      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tickLenis);
      gsap.ticker.lagSmoothing(0);

      const context = gsap.context(() => {
        const panelEls = gsap.utils.toArray<HTMLElement>(".home-stack-stage");

        panelEls.forEach((panel) => {
          const circle = panel.querySelector<HTMLElement>(".home-offers-circle");
          if (circle) {
            gsap.set(circle, {
              y: "22vh",
              scale: 0.9,
              transformOrigin: "50% 0%",
            });

            gsap.fromTo(
              circle,
              {
                y: "22vh",
                scale: 0.9,
                transformOrigin: "50% 0%",
              },
              {
                y: "-16vh",
                scale: 1.04,
                ease: "none",
                scrollTrigger: {
                  trigger: panel,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              },
            );
          }

          const title = panel.querySelector<HTMLElement>(".home-offer-title");
          if (title) {
            gsap.set(title, {
              autoAlpha: 0,
              y: 28,
            });

            gsap.to(title, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 62%",
                toggleActions: "play none none reverse",
                invalidateOnRefresh: true,
              },
            });
          }

          const body = panel.querySelector<HTMLElement>(".home-offer-body");
          if (body) {
            gsap.set(body, {
              autoAlpha: 0,
              y: 28,
            });

            gsap.fromTo(
              body,
              { autoAlpha: 0, y: 28 },
              {
                autoAlpha: 1,
                y: 0,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: panel,
                  start: "top 54%",
                  end: "center 34%",
                  scrub: 0.8,
                  invalidateOnRefresh: true,
                },
              },
            );
          }
        });

        const closingCircle = root.querySelector<HTMLElement>(".home-stack-close-circle");
        if (closingCircle) {
          gsap.set(closingCircle, {
            y: "20vh",
            scale: 0.9,
            transformOrigin: "50% 100%",
          });

          gsap.fromTo(
            closingCircle,
            {
              y: "20vh",
              scale: 0.9,
              transformOrigin: "50% 100%",
            },
            {
              y: "-14vh",
              scale: 1.04,
              ease: "none",
              scrollTrigger: {
                trigger: closingCircle.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      }, root);

      cleanup = () => {
        context.revert();
        gsap.ticker.remove(tickLenis);
        lenis.destroy();
      };
      requestAnimationFrame(() => {
        lenis.resize?.();
        ScrollTrigger.refresh();
      });
    })();

    return () => cleanup();
  }, []);

  return (
    <section
      ref={rootRef}
      id="features"
      aria-labelledby="features-heading"
      className="overflow-hidden bg-home-mist"
    >
      <h2 id="features-heading" className="sr-only">
        What Yggdrasil understands
      </h2>
      <div className="relative">
        {panels.map((panel, index) => (
          <div
            key={panel.title}
            className={`home-stack-stage relative flex min-h-[100svh] flex-col ${panel.outerBackground}`}
          >
            <div
              className={`home-stack-circle-wrapper relative flex h-[10vh] min-h-[72px] w-full flex-col items-center justify-start overflow-visible ${panel.outerBackground}`}
              style={{ zIndex: panel.circleZIndex }}
              aria-hidden="true"
            >
              <div
                className={`home-offers-circle relative min-h-[600vw] min-w-[600vw] rounded-full will-change-transform ${panel.panelBackground}`}
                style={{
                  width: "600vw",
                  height: "600vw",
                  flexShrink: 0,
                }}
              />
            </div>
            <article
              className="absolute inset-0 flex flex-col items-center justify-center px-[clamp(1.5rem,5vw,6rem)] py-[clamp(5rem,8vw,9rem)]"
              style={{ zIndex: panel.contentZIndex }}
            >
              <div
                className={`home-offer-content mx-auto inline-flex h-full w-full max-w-[112rem] flex-col items-center justify-center gap-3.5 text-center ${panel.text}`}
              >
                {panel.eyebrow && (
                  <p
                    className={`${scriptClassName} home-offer-kicker w-full text-center text-[clamp(4rem,5vw,6rem)] leading-none`}
                  >
                    {panel.eyebrow}
                  </p>
                )}
                <h3
                  className="home-offer-title w-full text-balance text-center font-display text-[clamp(2.75rem,3.333vw,4rem)] font-bold leading-[1.02]"
                >
                  {panel.title}
                </h3>
                <p
                  className="home-offer-body w-full text-balance text-center font-display text-[clamp(1.75rem,1.875vw,2.25rem)] font-light leading-[1.15]"
                >
                  {panel.body}
                </p>
              </div>
            </article>
          </div>
        ))}
        <div
          className="home-stack-circle-wrapper relative flex h-[10vh] min-h-[72px] w-full flex-col items-center justify-end overflow-hidden bg-home-mist"
          aria-hidden="true"
        >
          <div
            className="home-stack-close-circle relative min-h-[600vw] min-w-[600vw] rounded-full bg-home-stone will-change-transform"
            style={{
              width: "600vw",
              height: "600vw",
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </section>
  );
}
