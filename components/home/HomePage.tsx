import Link from "next/link";
import { AnimatedHeroLogo } from "./AnimatedHeroLogo";
import { HomeStackedPanels } from "./HomeStackedPanels";
import { TreeLogo } from "./TreeLogo";

type HomePageProps = {
  scriptClassName: string;
};

const homePageX = "px-[clamp(1.25rem,5vw,6rem)]";

const homeButton =
  "inline-flex items-center justify-center rounded-home-pill px-6 py-3.5 font-display text-2xl font-bold transition-colors focus:outline-none focus-visible:ring-2";

const homeCardShell =
  "flex min-h-[18rem] flex-col overflow-hidden rounded-t-home-card rounded-br-home-card rounded-bl-home-card-deep p-[clamp(1.5rem,2.604vw,3.125rem)] outline outline-1 -outline-offset-1 outline-home-outline/30";

const journalCards = [
  {
    body: "I froze again in the meeting. I knew what I wanted to say, but it felt safer to stay quiet.",
    label: "March 12",
    className: "justify-between bg-home-stone text-home-forest",
  },
  {
    body: "I froze again in the meeting. I knew what I wanted to say, but it felt safer to stay quiet.",
    label: "April 04",
    className: "justify-between bg-home-olive text-home-mist",
  },
  {
    body: "Possible shared thread: Shame -> Safety -> Silence. A recurring emotional pattern across seemingly unrelated entries.",
    label: "Insight Found",
    className: "justify-between bg-home-forest text-home-mist",
  },
];

export function HomePage({ scriptClassName }: HomePageProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-home-mist text-home-forest">
      <HeroSection />
      <UnderstandingSection />
      <HomeStackedPanels scriptClassName={scriptClassName} />
      <ConnectionsSection scriptClassName={scriptClassName} />
      <HomeFooter scriptClassName={scriptClassName} />
    </main>
  );
}

function HeroSection() {
  return (
    <section
      id="top"
      aria-labelledby="home-heading"
      className={`relative flex h-[100svh] min-h-[680px] flex-col items-start justify-center gap-[clamp(1.5rem,2.1vw,2.5rem)] overflow-visible bg-home-mist py-2.5 ${homePageX}`}
    >
      <header className="relative z-10 flex w-full items-center justify-between gap-4 py-5">
        <nav aria-label="Homepage navigation" className="flex min-w-0 items-start gap-3.5">
          <Link
            href="/"
            aria-label="Yggdrasil home"
            className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-home-forest"
          >
            <TreeLogo className="h-14 w-14" />
          </Link>
          <ul className="hidden items-start gap-[3px] sm:flex">
            {[
              ["Home", "#top"],
              ["About", "#understood"],
              ["Features", "#features"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`${homeButton} bg-home-sage text-home-mist hover:bg-home-forest focus-visible:ring-home-forest`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/signup"
          className={`${homeButton} bg-home-forest text-home-mist hover:brightness-90 focus-visible:ring-home-forest focus-visible:ring-offset-2 focus-visible:ring-offset-home-mist`}
        >
          Sign up
        </Link>
      </header>

      <section
        aria-label="Yggdrasil journal introduction"
        className="relative z-10 flex w-full flex-col items-start justify-start gap-5"
      >
        <hgroup className="flex w-full flex-col items-start justify-start">
          <h1
            id="home-heading"
            className="font-display text-[clamp(4.1rem,11.458vw,13.75rem)] font-bold leading-none tracking-normal text-home-forest"
          >
            Yggdrasil Journal
          </h1>
          <p className="font-display text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[1.02] text-home-forest">
            Turn your journal into a living map
          </p>
          <p className="max-w-[68rem] font-display text-[clamp(1.25rem,1.8vw,1.5rem)] leading-[1.25] text-home-forest">
            Yggdrasil reads every entry and surfaces the patterns, connections, and insights hidden in your writing.
          </p>
        </hgroup>
        <Link
          href="/signup"
          className={`${homeButton} bg-home-sage text-home-mist hover:bg-home-forest focus-visible:ring-home-forest`}
        >
          Start writing
        </Link>
      </section>

      <figure className="pointer-events-none flex min-h-0 w-full flex-1 items-center justify-center overflow-visible opacity-95">
        <AnimatedHeroLogo />
      </figure>
    </section>
  );
}

function UnderstandingSection() {
  return (
    <section
      id="understood"
      aria-labelledby="understood-heading"
      className={`bg-home-mist py-[clamp(5rem,9vw,9rem)] ${homePageX}`}
    >
      <div className="mx-auto max-w-[112rem]">
        <h2
          id="understood-heading"
          className="font-display text-[clamp(3.25rem,5.2vw,6rem)] font-bold leading-[1.02] text-home-forest"
        >
          Most journals save what you write.
          <span className="block font-normal text-home-olive">
            Yggdrasil helps you understand it.
          </span>
        </h2>
        <div
          className="my-[clamp(1.75rem,3vw,3rem)] w-full overflow-hidden text-home-forest"
          aria-hidden="true"
        >
          <svg
            className="home-moving-wave"
            viewBox="0 0 3440 15"
            preserveAspectRatio="none"
            fill="none"
          >
            <g>
              <path
                d="M0 7.5C71.667 1.5 143.333 1.5 215 7.5C286.667 13.5 358.333 13.5 430 7.5C501.667 1.5 573.333 1.5 645 7.5C716.667 13.5 788.333 13.5 860 7.5C931.667 1.5 1003.333 1.5 1075 7.5C1146.667 13.5 1218.333 13.5 1290 7.5C1361.667 1.5 1433.333 1.5 1505 7.5C1576.667 13.5 1648.333 13.5 1720 7.5C1791.667 1.5 1863.333 1.5 1935 7.5C2006.667 13.5 2078.333 13.5 2150 7.5C2221.667 1.5 2293.333 1.5 2365 7.5C2436.667 13.5 2508.333 13.5 2580 7.5C2651.667 1.5 2723.333 1.5 2795 7.5C2866.667 13.5 2938.333 13.5 3010 7.5C3081.667 1.5 3153.333 1.5 3225 7.5C3296.667 13.5 3368.333 13.5 3440 7.5"
                stroke="currentColor"
                strokeWidth="4"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>
        </div>
        <p className="max-w-[106rem] font-display text-[clamp(2.05rem,3.65vw,3.75rem)] font-bold leading-[1.04] text-home-forest">
          You write. It saves. You write more. It saves more. Eventually, the entries pile up and the patterns stay invisible.
          <span className="block font-normal text-home-olive">
            Yggdrasil is different. Every time you save an entry, it quietly reads for themes, emotions, people, and recurring threads, then builds a map of your inner world across time.
          </span>
        </p>
      </div>
    </section>
  );
}

function ConnectionsSection({ scriptClassName }: { scriptClassName: string }) {
  return (
    <section
      aria-labelledby="connections-heading"
      className="bg-home-mist px-[clamp(1.25rem,5.208vw,6.25rem)] py-[clamp(5rem,7.031vw,8.4375rem)]"
    >
      <div className="mx-auto max-w-[112rem]">
        <header className="flex w-full max-w-[1720px] flex-col items-start justify-start gap-5">
          <h2
            id="connections-heading"
            className="w-full text-center font-display text-[clamp(3.1rem,5vw,6rem)] font-bold leading-[1.02] text-home-forest"
          >
            The entries you forgot
            <span className="font-light italic"> may be the ones that explain you.</span>
          </h2>
          <p className="w-full text-center font-display text-[clamp(1.5rem,1.875vw,2.25rem)] font-light leading-[1.16] text-home-forest">
            Yggdrasil looks beyond simple similarity. It finds deeper relationships across your writing. The same emotional thread appearing in different moments.
          </p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-3 xl:gap-10">
          {journalCards.map((card) => (
            <article
              key={card.label}
              className={`${card.className} ${homeCardShell}`}
            >
              <p className="w-full font-display text-[clamp(1.35rem,1.25vw,1.5rem)] font-light leading-[1.24]">
                {card.body}
              </p>
              <p className={`${scriptClassName} w-full text-[clamp(3rem,3.438vw,4.125rem)] leading-none`}>
                {card.label}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeFooter({ scriptClassName }: { scriptClassName: string }) {
  return (
    <footer className="flex w-full items-center justify-center overflow-hidden bg-home-mist px-[clamp(1.25rem,5.208vw,6.25rem)]">
      <section className="flex w-full flex-1 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-t-home-card bg-home-forest px-2.5 py-[60px] text-home-mist md:rounded-t-home-footer md:outline md:outline-1 md:-outline-offset-1 md:outline-home-outline/30">
        <div className="grid w-full max-w-[1214px] gap-[50px] md:grid-cols-3">
          <section aria-labelledby="footer-map-heading" className="flex flex-col items-start justify-center gap-[30px] overflow-hidden p-2.5">
            <h2 id="footer-map-heading" className={`${scriptClassName} text-4xl leading-10`}>
              Your map awaits
            </h2>
            <p className="font-display text-2xl font-light leading-6">
              Not a mood tracker. Not a notes app. A living map of the story you are already writing.
            </p>
          </section>
          <section aria-labelledby="footer-join-heading" className="flex flex-col items-start justify-center gap-[30px] overflow-hidden p-2.5">
            <h2 id="footer-join-heading" className={`${scriptClassName} text-4xl leading-10`}>
              Join
            </h2>
            <p className="font-display text-2xl font-light leading-6">
              Start writing for free today.
            </p>
            <Link
              href="/signup"
              className={`${homeButton} gap-2.5 bg-home-mist px-[25px] py-[15px] text-home-forest hover:bg-white focus-visible:ring-home-mist`}
            >
              Create an account
            </Link>
          </section>
          <nav aria-labelledby="footer-explore-heading" className="flex flex-col items-start justify-center gap-[30px] overflow-hidden p-2.5">
            <h2 id="footer-explore-heading" className={`${scriptClassName} text-4xl leading-10`}>
              Explore
            </h2>
            <ul className="font-display text-2xl font-light leading-6">
              <li><Link href="#understood" className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-home-mist">How it works</Link></li>
              <li><Link href="#features" className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-home-mist">Philosophy</Link></li>
              <li><Link href="/signup" className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-home-mist">Pricing</Link></li>
            </ul>
          </nav>
        </div>
        <p className="font-display text-[clamp(4.25rem,11.458vw,13.75rem)] font-bold leading-none">
          Yggdrasil
        </p>
      </section>
    </footer>
  );
}
