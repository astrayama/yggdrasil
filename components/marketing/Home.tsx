'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from './Logo';
import { Button } from './Button';
import { Input } from './Input';
import { PlanCard } from './PlanCard';
import { Tag } from './Tag';
import { RootsCanvas } from './RootsCanvas';
import { Constellation } from './Constellation';
import { Reveal } from './Reveal';

const MONO = 'var(--font-mono)';
const DISPLAY = 'var(--font-display)';

/* A logo that gently breathes — used to open each "beat". */
function BeatMark({ size = 28, duration = 4 }: { size?: number; duration?: number }) {
  return (
    <div style={{ animation: `yggi-breathe ${duration}s var(--ease-gentle) infinite` }}>
      <Logo size={size} />
    </div>
  );
}

/* Small italic Cormorant line that titles each beat. */
function BeatQuote({ children, maxWidth = 640 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <p
      style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: 'clamp(24px,3vw,30px)',
        lineHeight: 1.35,
        color: '#E8E0D0',
        textAlign: 'center',
        maxWidth,
        margin: '18px 0 0',
      }}
    >
      {children}
    </p>
  );
}

/* ============ Knowledge-graph SVG (a month, mapped) ============ */
function MindMap() {
  return (
    <svg
      viewBox="0 0 920 460"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      role="img"
      aria-label="Knowledge graph: six theme clusters of journal entries with cross-links"
    >
      {/* cluster hulls */}
      <ellipse cx="300" cy="200" rx="150" ry="110" fill="rgba(201,168,76,0.045)" />
      <ellipse cx="130" cy="90" rx="105" ry="70" fill="rgba(123,174,138,0.05)" />
      <ellipse cx="700" cy="110" rx="130" ry="80" fill="rgba(139,107,74,0.06)" />
      <ellipse cx="480" cy="380" rx="130" ry="70" fill="rgba(123,174,138,0.05)" />
      <ellipse cx="790" cy="330" rx="110" ry="80" fill="rgba(139,123,174,0.06)" />
      <ellipse cx="120" cy="330" rx="95" ry="70" fill="rgba(123,174,138,0.05)" />
      {/* inter-cluster edges (weight = strength) */}
      <g fill="none" stroke="rgba(42,64,53,0.95)">
        <path d="M300 200 Q220 150 150 100" strokeWidth="2.4" />
        <path d="M300 200 Q480 130 660 115" strokeWidth="1.4" />
        <path d="M300 200 Q380 300 460 370" strokeWidth="2" />
        <path d="M300 200 Q200 270 140 320" strokeWidth="1.2" />
        <path d="M660 115 Q740 200 780 310" strokeWidth="1.6" />
        <path d="M460 370 Q620 370 760 340" strokeWidth="1.2" />
        <path d="M150 100 Q120 200 120 310" strokeWidth="1" />
        <path d="M460 370 Q560 250 660 130" strokeWidth="0.8" />
      </g>
      {/* entry satellites: worry cluster */}
      <g stroke="rgba(42,64,53,0.7)" strokeWidth="0.8">
        <line x1="300" y1="200" x2="245" y2="152" /><line x1="300" y1="200" x2="362" y2="160" />
        <line x1="300" y1="200" x2="392" y2="228" /><line x1="300" y1="200" x2="330" y2="282" />
        <line x1="300" y1="200" x2="238" y2="248" /><line x1="300" y1="200" x2="290" y2="120" />
      </g>
      <g fill="rgba(201,168,76,0.55)">
        <circle cx="245" cy="152" r="4" /><circle cx="362" cy="160" r="4" />
        <circle cx="392" cy="228" r="5" /><circle cx="330" cy="282" r="4" />
        <circle cx="238" cy="248" r="3.5" /><circle cx="290" cy="120" r="3.5" />
      </g>
      {/* entry satellites: morning clarity */}
      <g stroke="rgba(42,64,53,0.7)" strokeWidth="0.8">
        <line x1="150" y1="100" x2="95" y2="62" /><line x1="150" y1="100" x2="190" y2="55" /><line x1="150" y1="100" x2="85" y2="125" />
      </g>
      <g fill="rgba(123,174,138,0.6)">
        <circle cx="95" cy="62" r="4" /><circle cx="190" cy="55" r="3.5" /><circle cx="85" cy="125" r="4" />
      </g>
      {/* entry satellites: work & deadlines */}
      <g stroke="rgba(42,64,53,0.7)" strokeWidth="0.8">
        <line x1="660" y1="115" x2="610" y2="70" /><line x1="660" y1="115" x2="722" y2="62" />
        <line x1="660" y1="115" x2="760" y2="120" /><line x1="660" y1="115" x2="700" y2="170" />
      </g>
      <g fill="rgba(139,107,74,0.75)">
        <circle cx="610" cy="70" r="4" /><circle cx="722" cy="62" r="4.5" />
        <circle cx="760" cy="120" r="3.5" /><circle cx="700" cy="170" r="4" />
      </g>
      {/* entry satellites: relationships */}
      <g stroke="rgba(42,64,53,0.7)" strokeWidth="0.8">
        <line x1="460" y1="370" x2="405" y2="410" /><line x1="460" y1="370" x2="520" y2="415" /><line x1="460" y1="370" x2="545" y2="352" />
      </g>
      <g fill="rgba(123,174,138,0.6)">
        <circle cx="405" cy="410" r="4" /><circle cx="520" cy="415" r="4" /><circle cx="545" cy="352" r="3.5" />
      </g>
      {/* entry satellites: dreams */}
      <g stroke="rgba(42,64,53,0.7)" strokeWidth="0.8">
        <line x1="780" y1="320" x2="835" y2="280" /><line x1="780" y1="320" x2="845" y2="360" /><line x1="780" y1="320" x2="740" y2="385" />
      </g>
      <g fill="rgba(139,123,174,0.7)">
        <circle cx="835" cy="280" r="4" /><circle cx="845" cy="360" r="4.5" /><circle cx="740" cy="385" r="3.5" />
      </g>
      {/* entry satellites: gratitude */}
      <g stroke="rgba(42,64,53,0.7)" strokeWidth="0.8">
        <line x1="120" y1="320" x2="70" y2="290" /><line x1="120" y1="320" x2="80" y2="365" /><line x1="120" y1="320" x2="170" y2="375" />
      </g>
      <g fill="rgba(123,174,138,0.6)">
        <circle cx="70" cy="290" r="3.5" /><circle cx="80" cy="365" r="4" /><circle cx="170" cy="375" r="4" />
      </g>
      {/* "feels familiar" cross-link */}
      <path
        d="M392 228 Q600 300 835 280"
        fill="none"
        stroke="rgba(201,168,76,0.55)"
        strokeWidth="1.2"
        strokeDasharray="3 5"
        style={{ animation: 'yggi-shimmer 5s var(--ease-gentle) infinite' }}
      />
      <text x="612" y="292" textAnchor="middle" fill="rgba(201,168,76,0.85)" fontFamily={MONO} fontSize="11">
        ✨ feels familiar · Jun 14 ↔ Jul 4
      </text>
      {/* theme nodes */}
      <circle
        cx="300"
        cy="200"
        r="22"
        fill="rgba(201,168,76,0.9)"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'yggi-node 6s var(--ease-gentle) infinite' }}
      />
      <circle
        cx="300"
        cy="200"
        r="32"
        fill="none"
        stroke="rgba(201,168,76,0.25)"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'yggi-node 6s var(--ease-gentle) infinite 0.4s' }}
      />
      <circle cx="150" cy="100" r="13" fill="rgba(123,174,138,0.85)" />
      <circle cx="660" cy="115" r="16" fill="rgba(139,107,74,0.9)" />
      <circle cx="460" cy="370" r="14" fill="rgba(123,174,138,0.85)" />
      <circle cx="780" cy="320" r="15" fill="rgba(139,123,174,0.85)" />
      <circle cx="120" cy="320" r="12" fill="rgba(123,174,138,0.85)" />
      {/* labels */}
      <g fontFamily={MONO} fontSize="12" fill="rgba(232,224,208,0.8)">
        <text x="300" y="248" textAnchor="middle">recurring worry</text>
        <text x="300" y="264" textAnchor="middle" fontSize="10" fill="rgba(232,224,208,0.45)">9 entries · weekly</text>
        <text x="150" y="135" textAnchor="middle">morning clarity</text>
        <text x="660" y="92" textAnchor="middle">work &amp; deadlines</text>
        <text x="460" y="345" textAnchor="middle">relationships</text>
        <text x="780" y="352" textAnchor="middle">dreams</text>
        <text x="120" y="352" textAnchor="middle">gratitude</text>
      </g>
    </svg>
  );
}

/* ============ Emotion-timeline SVG (your weather, charted) ============ */
const TIMELINE_TICKS = [88, 116, 144, 172, 200, 228, 284, 312, 340, 368, 396, 424, 480, 508, 536, 564, 592, 620, 676, 704, 732, 760, 788, 816];
const TIMELINE_DOTS: [number, number, number, string][] = [
  [60, 150, 5, '#7BAE8A'], [88, 98, 5, '#C9A84C'], [102, 188, 4.5, '#FCA5A5'], [116, 132, 5, '#7BAE8A'],
  [144, 70, 5, '#C9A84C'], [172, 120, 5, '#7BAE8A'], [186, 96, 4.5, '#8B7BAE'], [200, 160, 5, '#8B6B4A'],
  [228, 84, 5, '#C9A84C'], [256, 140, 5, '#7BAE8A'], [284, 190, 5, '#FCA5A5'], [312, 150, 5, '#7BAE8A'],
  [340, 108, 4.5, '#8B7BAE'], [354, 200, 5, '#8B6B4A'], [368, 56, 5.5, '#FCA5A5'], [382, 76, 5, '#8B6B4A'],
  [396, 120, 5, '#8B6B4A'], [424, 96, 5, '#7BAE8A'], [452, 64, 5, '#C9A84C'], [480, 130, 5, '#7BAE8A'],
  [508, 110, 4.5, '#8B7BAE'], [536, 88, 5, '#C9A84C'], [564, 150, 5, '#7BAE8A'], [592, 178, 4.5, '#FCA5A5'],
  [620, 118, 5, '#7BAE8A'], [648, 86, 5, '#C9A84C'], [676, 140, 5, '#8B6B4A'], [704, 106, 5, '#7BAE8A'],
  [732, 66, 5, '#C9A84C'], [760, 126, 4.5, '#8B7BAE'], [788, 96, 5, '#7BAE8A'], [816, 144, 5, '#7BAE8A'],
];
function EmotionTimeline() {
  return (
    <svg
      viewBox="0 0 920 330"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      role="img"
      aria-label="Scatter timeline of emotion intensity over the last 30 days with trend line and annotations"
    >
      {/* weekend bands */}
      <g fill="rgba(22,35,24,0.7)">
        <rect x="152" y="24" width="56" height="240" />
        <rect x="348" y="24" width="56" height="240" />
        <rect x="544" y="24" width="56" height="240" />
        <rect x="740" y="24" width="56" height="240" />
      </g>
      {/* grid */}
      <g stroke="rgba(42,64,53,0.4)" strokeWidth="1">
        <line x1="60" y1="24" x2="860" y2="24" />
        <line x1="60" y1="84" x2="860" y2="84" />
        <line x1="60" y1="144" x2="860" y2="144" />
        <line x1="60" y1="204" x2="860" y2="204" />
      </g>
      <line x1="60" y1="264" x2="860" y2="264" stroke="#2A4035" strokeWidth="2" />
      <line x1="60" y1="24" x2="60" y2="264" stroke="#2A4035" strokeWidth="2" />
      <g fill="#7BAE8A" fontSize="10" fontFamily={MONO} textAnchor="end">
        <text x="50" y="268">0</text><text x="50" y="208">2.5</text><text x="50" y="148">5</text><text x="50" y="88">7.5</text><text x="50" y="28">10</text>
      </g>
      <text x="24" y="144" fill="rgba(123,174,138,0.7)" fontSize="10" fontFamily={MONO} textAnchor="middle" transform="rotate(-90 24 144)">
        INTENSITY
      </text>
      <g fill="#7BAE8A" fontSize="10" fontFamily={MONO} textAnchor="middle">
        <text x="60" y="284">Jun 10</text><text x="256" y="284">Jun 17</text><text x="452" y="284">Jun 24</text><text x="648" y="284">Jul 1</text><text x="844" y="284">Jul 8</text>
      </g>
      {/* day ticks */}
      <g stroke="rgba(42,64,53,0.8)" strokeWidth="1">
        {TIMELINE_TICKS.map((x) => (
          <line key={x} x1={x} y1="264" x2={x} y2="269" />
        ))}
      </g>
      {/* weekly best-fit trend segments */}
      <g stroke="rgba(123,174,138,0.6)" strokeWidth="1.8" strokeLinecap="round">
        <line x1="60" y1="140" x2="228" y2="104" />
        <line x1="256" y1="166" x2="424" y2="94" />
        <line x1="452" y1="92" x2="620" y2="152" />
        <line x1="648" y1="104" x2="844" y2="112" />
      </g>
      {/* deadline week marker */}
      <g>
        <line x1="376" y1="34" x2="376" y2="264" stroke="rgba(139,107,74,0.5)" strokeWidth="1" strokeDasharray="2 4" />
        <text x="384" y="40" fill="rgba(139,107,74,0.95)" fontSize="11" fontFamily={MONO}>deadline week</text>
      </g>
      {/* dots */}
      <g stroke="#1E2E22" strokeWidth="2">
        {TIMELINE_DOTS.map(([cx, cy, r, fill], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={fill}
            style={i === TIMELINE_DOTS.length - 1 ? { transformBox: 'fill-box', transformOrigin: 'center', animation: 'yggi-node 4s var(--ease-gentle) infinite' } : undefined}
          />
        ))}
      </g>
      {/* insight annotation */}
      <circle
        cx="424"
        cy="96"
        r="10"
        fill="none"
        stroke="rgba(201,168,76,0.7)"
        strokeWidth="1.2"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'yggi-ring 5s var(--ease-gentle) infinite' }}
      />
      <line x1="434" y1="88" x2="470" y2="46" stroke="rgba(201,168,76,0.4)" strokeWidth="1" />
      <text x="476" y="42" fill="rgba(201,168,76,0.9)" fontSize="11" fontFamily={MONO}>insight landed — “name it early”</text>
      {/* recovery annotation */}
      <path d="M592 186 Q620 210 648 96" fill="none" stroke="rgba(123,174,138,0.35)" strokeWidth="1" strokeDasharray="2 4" />
      <text x="664" y="196" fill="rgba(123,174,138,0.85)" fontSize="11" fontFamily={MONO}>back in a day</text>
    </svg>
  );
}

/* Living-tree metaphor rows (left column of the "Living Tree" beat). */
const METAPHOR: { dot: string; glow: string; kicker: string; title: string; body: string }[] = [
  {
    dot: '#8B6B4A',
    glow: 'rgba(139,107,74,0.5)',
    kicker: 'ROOTS',
    title: 'why it matters',
    body: "A value or a goal you plant — with the reason it matters written down, where you can't lose sight of it.",
  },
  {
    dot: '#C9A84C',
    glow: 'rgba(201,168,76,0.4)',
    kicker: 'TRUNK',
    title: 'the journey',
    body: 'Journal entries that touch this root link into its timeline — your awareness feeding your progress, automatically.',
  },
  {
    dot: '#7BAE8A',
    glow: 'rgba(123,174,138,0.4)',
    kicker: 'BRANCHES',
    title: "this week's practices",
    body: 'Small weekly practices — added by hand, or grown by me from what your journal has been saying.',
  },
  {
    dot: '#8B7BAE',
    glow: 'rgba(139,123,174,0.6)',
    kicker: 'FRUIT',
    title: 'proof of progress',
    body: "One measurable outcome you'll be able to point to — quiet proof that the practice is bearing something real.",
  },
];

/* Expanded RootCard recreation (right column of the "Living Tree" beat). */
function RootCard() {
  const chip = (bg: string, border: string, color: string): CSSProperties => ({
    borderRadius: 9999,
    border: `1px solid ${border}`,
    background: bg,
    padding: '2px 8px',
    fontSize: 10,
    color,
  });
  const sectionLabel: CSSProperties = { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7BAE8A' };
  return (
    <div style={{ borderRadius: 16, border: '1px solid rgba(42,64,53,0.6)', background: 'rgba(30,46,34,0.8)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
        <span
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: '1px solid rgba(201,168,76,0.3)',
            background: 'rgba(201,168,76,0.1)',
            color: '#C9A84C',
            fontSize: 16,
          }}
        >
          ✦
        </span>
        <span style={{ minWidth: 0, flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 18, color: '#E8E0D0' }}>Steadier mornings</span>
          <span style={{ ...chip('transparent', 'rgba(201,168,76,0.3)', '#C9A84C'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>goal</span>
          <span style={chip('rgba(123,174,138,0.1)', 'rgba(123,174,138,0.3)', '#7BAE8A')}>In Journey</span>
          <span style={chip('rgba(201,168,76,0.1)', 'rgba(201,168,76,0.3)', '#C9A84C')}>2 wins this week</span>
        </span>
        <span style={{ flexShrink: 0, color: '#7BAE8A', transform: 'rotate(180deg)' }}>⌄</span>
      </div>
      <div style={{ borderTop: '1px solid rgba(42,64,53,0.4)', padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <span style={sectionLabel}>Root · why this matters</span>
          <div style={{ marginTop: 4, borderRadius: 8, border: '1px dashed rgba(42,64,53,0.4)', padding: '8px 12px', fontSize: 14, color: 'rgba(232,224,208,0.9)' }}>
            Because my clearest thinking happens before the noise starts.
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={sectionLabel}>Rings · milestones of growth</span>
            <span style={{ fontSize: 12, color: '#7BAE8A' }}>+ Set a ring</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8, border: '1px solid rgba(42,64,53,0.4)', background: '#162318', padding: '8px 12px' }}>
            <span style={{ display: 'flex', height: 20, width: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.5)' }} />
            <span style={{ flex: 1, fontSize: 14, color: 'rgba(232,224,208,0.9)' }}>30 unbroken mornings</span>
            <span style={chip('transparent', 'rgba(201,168,76,0.25)', 'rgba(201,168,76,0.8)')}>🗓 Jul 28</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={chip('rgba(123,174,138,0.1)', 'rgba(123,174,138,0.3)', '#7BAE8A')}>◉ First full week</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={sectionLabel}>Branches · this week&apos;s practices</span>
            <span style={{ display: 'flex', gap: 12, fontSize: 12, color: '#7BAE8A' }}>
              <span>+ Add</span>
              <span>⟳ New week</span>
            </span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8, padding: '6px 4px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#7BAE8A', flexShrink: 0 }}>
                <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ flex: 1, fontSize: 14, color: '#7BAE8A', textDecoration: 'line-through' }}>Write 3 lines before coffee</span>
              <span style={chip('rgba(123,174,138,0.1)', 'rgba(123,174,138,0.3)', '#7BAE8A')}>Done</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8, padding: '6px 4px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#C9A84C', flexShrink: 0 }}>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 2a6 6 0 016 6H8V2z" fill="currentColor" opacity="0.4" />
              </svg>
              <span style={{ flex: 1, fontSize: 14, color: '#E8E0D0' }}>Lights out by eleven</span>
              <span style={chip('rgba(201,168,76,0.1)', 'rgba(201,168,76,0.3)', '#C9A84C')}>In progress</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8, padding: '6px 4px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#7BAE8A', flexShrink: 0 }}>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span style={{ flex: 1, fontSize: 14, color: '#E8E0D0' }}>No phone for the first hour</span>
              <span style={chip('#162318', 'rgba(42,64,53,0.6)', '#7BAE8A')}>Not started</span>
            </li>
          </ul>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ height: 6, flex: 1, overflow: 'hidden', borderRadius: 9999, background: '#162318' }}>
              <div style={{ height: '100%', width: '33%', borderRadius: 9999, background: 'rgba(201,168,76,0.7)' }} />
            </div>
            <span style={{ fontSize: 12, color: '#7BAE8A' }}>33% done</span>
          </div>
        </div>
        <div>
          <span style={sectionLabel}>Fruit · proof of progress</span>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8, border: '1px solid rgba(42,64,53,0.4)', background: '#162318', padding: '8px 12px' }}>
            <span style={{ display: 'flex', height: 20, width: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid rgba(123,174,138,0.4)' }} />
            <span style={{ fontSize: 14, color: 'rgba(232,224,208,0.9)' }}>Four calm mornings a week, by August</span>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={sectionLabel}>Trunk · the journey</span>
            <span style={chip('#162318', 'rgba(42,64,53,0.6)', '#7BAE8A')}>6 events</span>
          </div>
          <ol
            style={{
              listStyle: 'none',
              position: 'relative',
              margin: '0 0 0 8px',
              padding: '0 0 0 16px',
              borderLeft: '1px solid rgba(42,64,53,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <li style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: -22, top: 4, height: 10, width: 10, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.7)' }} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderRadius: 8,
                  border: '1px dashed rgba(201,168,76,0.25)',
                  background: 'rgba(201,168,76,0.05)',
                  padding: '8px 12px',
                }}
              >
                <span style={{ fontSize: 14, color: 'rgba(201,168,76,0.9)' }}>Growing toward: 30 unbroken mornings</span>
                <span style={{ whiteSpace: 'nowrap', ...chip('transparent', 'rgba(201,168,76,0.25)', 'rgba(201,168,76,0.8)') }}>Jul 28, 2026</span>
              </div>
            </li>
            <li style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ position: 'absolute', left: -21, top: 2, fontSize: 10, color: '#8B7BAE' }}>📖</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, color: '#E8E0D0' }}>Woke before the alarm</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: '#7BAE8A' }}>
                  The house was quiet and I didn&apos;t reach for the phone. Small, but it felt like proof…
                </span>
              </span>
              <span style={{ whiteSpace: 'nowrap', ...chip('#162318', 'rgba(42,64,53,0.6)', '#7BAE8A') }}>Jul 6, 2026</span>
            </li>
            <li style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ position: 'absolute', left: -19, top: 6, height: 8, width: 8, borderRadius: '50%', background: '#C9A84C' }} />
              <span style={{ flex: 1, fontSize: 14, color: 'rgba(232,224,208,0.9)' }}>Win: three quiet mornings in a row</span>
              <span style={{ whiteSpace: 'nowrap', ...chip('#162318', 'rgba(42,64,53,0.6)', '#7BAE8A') }}>Jul 3, 2026</span>
            </li>
            <li style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ position: 'absolute', left: -21, top: 2, fontSize: 12, color: '#C9A84C' }}>◎</span>
              <span style={{ flex: 1, fontSize: 14, color: 'rgba(232,224,208,0.9)' }}>Ring laid down: First full week</span>
              <span style={{ whiteSpace: 'nowrap', ...chip('#162318', 'rgba(42,64,53,0.6)', '#7BAE8A') }}>Jun 29, 2026</span>
            </li>
          </ol>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderTop: '1px solid rgba(42,64,53,0.4)', paddingTop: 16 }}>
          <span style={{ borderRadius: 8, border: '1px solid rgba(42,64,53,0.6)', padding: '6px 14px', fontSize: 14, color: 'rgba(232,224,208,0.8)' }}>♡ Reflect</span>
          <span style={{ borderRadius: 8, border: '1px solid rgba(42,64,53,0.6)', padding: '6px 14px', fontSize: 14, color: 'rgba(232,224,208,0.8)' }}>✎ Edit</span>
          <span style={{ borderRadius: 8, border: '1px solid rgba(123,174,138,0.3)', padding: '6px 14px', fontSize: 14, color: '#7BAE8A' }}>✓ Complete</span>
        </div>
      </div>
    </div>
  );
}

const CARD_SURFACE: CSSProperties = {
  background: '#1E2E22',
  border: '1px solid rgba(42,64,53,0.6)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-sm)',
};

export function MarketingHome() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [demoState, setDemoState] = useState<'idle' | 'thinking' | 'done'>('idle');
  const [demoText, setDemoText] = useState(
    "I keep coming back to the same worry, worn smooth like a stone in my pocket. Today it felt lighter — familiar enough that I could hold it without flinching.",
  );
  const [dateLine, setDateLine] = useState('');
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Signed-in visitors go straight to the app.
  useEffect(() => {
    if (!loading && user) router.replace('/journal');
  }, [loading, user, router]);

  // Compute the demo date after mount to avoid an SSR/CSR hydration mismatch.
  useEffect(() => {
    setDateLine(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    return () => {
      if (thinkTimer.current) clearTimeout(thinkTimer.current);
    };
  }, []);

  const countWords = (text: string) => {
    const t = (text || '').trim();
    return t ? t.split(/\s+/).length : 0;
  };
  const words = countWords(demoText);
  const overLimit = words > 100;
  const demoDisabled = !demoText.trim() || overLimit;

  const runReflect = () => {
    if (demoDisabled || demoState === 'thinking') return;
    setDemoState('thinking');
    if (thinkTimer.current) clearTimeout(thinkTimer.current);
    thinkTimer.current = setTimeout(() => setDemoState('done'), 1900);
  };

  const goBegin = () => {
    const el = document.getElementById('begin');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
  };

  const billingBtnStyle = (active: boolean): CSSProperties => ({
    padding: '8px 18px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'background 300ms var(--ease-gentle), color 300ms var(--ease-gentle)',
    border: active ? '1px solid rgba(201,168,76,0.35)' : '1px solid transparent',
    background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
    color: active ? '#C9A84C' : 'rgba(232,224,208,0.55)',
  });

  const goSignup = () => router.push('/signup');

  return (
    <div className="yggi-home" style={{ background: '#0F1A14', color: '#E8E0D0', minHeight: '100vh', scrollBehavior: 'smooth' }}>
      {/* ============ NAV (fixed / sticky) ============ */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'rgba(15,26,20,0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(42,64,53,0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            maxWidth: 1120,
            margin: '0 auto',
            padding: '18px 24px',
            boxSizing: 'border-box',
          }}
        >
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Logo size={24} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 17, letterSpacing: '0.1em', color: '#E8E0D0', lineHeight: 1 }}>YGGI</span>
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <span className="yggi-nav-links">
              <a href="#demo" className="mkt-link" style={{ fontSize: 14 }}>Try it</a>
              <a href="#how" className="mkt-link" style={{ fontSize: 14 }}>How it works</a>
              <a href="#pricing" className="mkt-link" style={{ fontSize: 14 }}>Pricing</a>
            </span>
            <Button size="sm" onClick={goBegin}>Join waitlist</Button>
          </nav>
        </div>
      </header>
      <div style={{ height: 71 }} />

      {/* ============ HERO ============ */}
      <section
        id="top"
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 72px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(120% 90% at 50% -10%, rgba(26,60,46,0.62) 0%, rgba(15,26,20,0) 60%)',
            pointerEvents: 'none',
          }}
        />
        <Constellation />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '40%',
            width: 680,
            height: 680,
            maxWidth: '90vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0) 62%)',
            animation: 'yggi-glow 9s var(--ease-gentle) infinite',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 160, background: 'linear-gradient(180deg, rgba(15,26,20,0) 0%, #0F1A14 100%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
            <span style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.18)', animation: 'yggi-ring 7s var(--ease-gentle) infinite' }} />
            <span style={{ position: 'absolute', width: 86, height: 86, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.28)', animation: 'yggi-ring 7s var(--ease-gentle) infinite 1.2s' }} />
            <div style={{ animation: 'yggi-breathe 5s var(--ease-gentle) infinite' }}>
              <Logo size={52} />
            </div>
          </div>
          <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(201,168,76,0.85)', margin: '0 0 18px' }}>SEMANTIC JOURNALING</p>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 'clamp(42px,6.2vw,74px)', lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0, color: '#E8E0D0', maxWidth: 900 }}>
            Hi, I&apos;m Yggi. Write to me —<br />
            <em style={{ color: '#C9A84C' }}>I&apos;ll show you what I see.</em>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.75, color: 'rgba(232,224,208,0.72)', maxWidth: 560, margin: '24px 0 0' }}>
            I&apos;m a journal that reads you back. I notice what returns in your words — a worry, a hope, a season — and show you its shape over time.
          </p>
          <WaitlistForm router={router} buttonSize="lg" style={{ marginTop: 34 }} />
          <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.45)', margin: '16px 0 0' }}>Launching soon · No credit card · Your entries stay yours</p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 28 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: 'rgba(232,224,208,0.35)' }}>SCROLL</span>
          <span style={{ display: 'block', width: 1, height: 26, background: 'linear-gradient(180deg,rgba(201,168,76,0.5),rgba(201,168,76,0))' }} />
          <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: '#C9A84C', animation: 'yggi-cue 2.6s var(--ease-gentle) infinite' }} />
        </div>
      </section>

      {/* ============ LIVE DEMO ============ */}
      <section id="demo" style={{ padding: '24px 24px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...CARD_SURFACE }}>
          <div style={{ padding: '18px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.45)' }} suppressHydrationWarning>
              {dateLine ? `${dateLine} · Reflection` : 'Reflection'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: 'rgba(201,168,76,0.8)', animation: 'yggi-shimmer 4s var(--ease-gentle) infinite' }}>LIVE — TRY ME</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: overLimit ? '#FCA5A5' : 'rgba(232,224,208,0.35)' }}>{words} / 100 words</span>
            </span>
          </div>
          <textarea
            value={demoText}
            onChange={(e) => setDemoText(e.target.value)}
            rows={4}
            aria-label="Write your own journal entry"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 24px 20px',
              margin: 0,
              fontSize: 15,
              lineHeight: 1.7,
              color: 'rgba(232,224,208,0.9)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-sans)',
              display: 'block',
            }}
          />
          {demoState === 'idle' && (
            <div style={{ padding: 16, borderTop: '1px solid rgba(42,64,53,0.4)', background: '#162318', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.4)', lineHeight: 1.5 }}>
                {overLimit ? 'A little shorter, please — the demo reads up to 100 words.' : 'Try it in your own words — the real site reflects live'}
              </span>
              <Button onClick={runReflect} disabled={demoDisabled}>Reflect with Yggi</Button>
            </div>
          )}
          {demoState === 'thinking' && (
            <div style={{ padding: '22px 24px', borderTop: '1px solid rgba(42,64,53,0.4)', background: '#162318' }}>
              <span style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 17, color: 'rgba(232,224,208,0.6)' }}>Yggi is thinking…</span>
            </div>
          )}
          {demoState === 'done' && (
            <div style={{ padding: 24, borderTop: '1px solid rgba(42,64,53,0.4)', background: '#162318' }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.8)', fontWeight: 600, margin: '0 0 10px' }}>Yggi Insight</p>
              <p style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 20, lineHeight: 1.45, color: '#E8E0D0', margin: '0 0 16px' }}>
                “The worry hasn&apos;t changed much — the way you hold it has. That&apos;s usually how it goes: the stone stays, the grip softens.”
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag variant="positive">Self-compassion</Tag>
                <Tag variant="neutral">Recurring worry</Tag>
                <Tag variant="positive">Softening</Tag>
              </div>
              <button type="button" onClick={() => setDemoState('idle')} className="mkt-reset-link">
                ← Edit your entry and reflect again
              </button>
            </div>
          )}
        </div>
      </section>

      {/* stem divider */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0 0' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', boxShadow: '0 0 10px rgba(201,168,76,0.4)', animation: 'yggi-shimmer 5s var(--ease-gentle) infinite' }} />
        <div style={{ width: 1, height: 64, background: 'linear-gradient(180deg,rgba(201,168,76,0.45),rgba(201,168,76,0))', marginTop: 14 }} />
      </div>

      {/* ============ BEAT 1 — beneath the surface ============ */}
      <section id="how" style={{ padding: '36px 24px 72px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <BeatMark />
          <BeatQuote>
            “I don&apos;t hand back a diagnosis. I trace your themes, your feelings, and the questions worth sitting with.”
          </BeatQuote>
          <Reveal style={{ width: '100%' }}>
            <div style={{ width: '100%', boxSizing: 'border-box', marginTop: 40, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, ...CARD_SURFACE }}>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(232,224,208,0.7)', borderLeft: '2px solid rgba(201,168,76,0.3)', paddingLeft: 16, margin: 0 }}>
                This connects to what you wrote on Sunday — the worry loosens whenever you name it early in the day.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, paddingTop: 16, borderTop: '1px solid rgba(42,64,53,0.4)' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <BeatColLabel>Themes</BeatColLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['recurring worry', 'self-trust', 'morning clarity'].map((t) => (
                      <Tag key={t} variant="neutral">{t}</Tag>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <BeatColLabel>Resonant Emotions</BeatColLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Tag variant="positive">steadiness</Tag>
                    <Tag variant="positive">tender relief</Tag>
                    <Tag variant="negative">unease</Tag>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <BeatColLabel>Keywords</BeatColLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Tag variant="keyword">the stone</Tag>
                    <Tag variant="keyword">flinching</Tag>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, paddingTop: 16, borderTop: '1px solid rgba(42,64,53,0.4)' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <BeatColLabel mb={12}>Patterns Identified</BeatColLabel>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ fontSize: 14, color: 'rgba(232,224,208,0.8)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#2A4035' }}>•</span>
                      <span>You describe the same worry with softer language each week.</span>
                    </li>
                    <li style={{ fontSize: 14, color: 'rgba(232,224,208,0.8)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#2A4035' }}>•</span>
                      <span>Naming the feeling early shortens its stay.</span>
                    </li>
                  </ul>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <BeatColLabel mb={12}>Frameworks Applied</BeatColLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Tag variant="framework">Stoic</Tag>
                    <Tag variant="framework">Self-Compassion</Tag>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, paddingTop: 16, borderTop: '1px solid rgba(42,64,53,0.4)' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <BeatColLabel mb={12}>Questions for Reflection</BeatColLabel>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ fontSize: 14, color: 'rgba(232,224,208,0.8)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'rgba(201,168,76,0.5)', fontFamily: DISPLAY, fontStyle: 'italic' }}>?</span>
                      <span>What changed that let you hold it without flinching?</span>
                    </li>
                  </ul>
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <BeatColLabel mb={12}>Action Items</BeatColLabel>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ fontSize: 14, color: 'rgba(232,224,208,0.8)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'rgba(123,174,138,0.5)' }}>→</span>
                      <span>Notice tomorrow whether the stone feels lighter — or you feel stronger.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
          <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.4)', margin: '14px 0 0' }}>Every entry gets this — themes, emotions, patterns, questions</p>
        </div>
      </section>

      {/* ============ BEAT 2 — a month, mapped ============ */}
      <section style={{ padding: '20px 24px 72px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <BeatMark />
          <BeatQuote maxWidth={600}>“…and here&apos;s a month of you, as a map.”</BeatQuote>

          <Reveal style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', padding: 28, boxSizing: 'border-box', marginTop: 40, ...CARD_SURFACE }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 24, color: '#E8E0D0' }}>Your mind, mapped</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#7BAE8A' }}>31 entries · 6 clusters · 84 connections</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(232,224,208,0.6)', margin: '4px 0 8px', maxWidth: 640 }}>
                Semantically similar entries drift together into clusters, so recurring themes become visible — an honest portrait of what keeps returning.
              </p>
              <MindMap />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(42,64,53,0.4)' }}>
                <GraphLegend color="rgba(201,168,76,0.9)">core theme</GraphLegend>
                <GraphLegend color="rgba(123,174,138,0.85)">steadying theme</GraphLegend>
                <GraphLegend color="rgba(139,107,74,0.9)">pressure theme</GraphLegend>
                <GraphLegend color="rgba(139,123,174,0.85)">dream</GraphLegend>
                <GraphLegend color="rgba(232,224,208,0.5)" size={6}>single entry</GraphLegend>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', padding: 28, boxSizing: 'border-box', marginTop: 24, ...CARD_SURFACE, border: '1px solid rgba(42,64,53,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 24, color: '#E8E0D0' }}>Your weather, charted</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#162318', border: '1px solid #2A4035', fontSize: 13, color: '#E8E0D0', borderRadius: 4, padding: '5px 10px' }}>
                  Last 30 Days <span style={{ color: '#7BAE8A', fontSize: 10 }}>⌄</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(232,224,208,0.6)', margin: '0 0 14px', lineHeight: 1.6, maxWidth: 640 }}>
                Each dot is a feeling from an analyzed entry, 0–10 in intensity. Each sage segment traces that week&apos;s trend — spikes reveal your triggers, and how quickly you come back.
              </p>
              <EmotionTimeline />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(42,64,53,0.4)' }}>
                <GraphLegend color="#7BAE8A" textColor="#7BAE8A" size={9}>calm ×12</GraphLegend>
                <GraphLegend color="#C9A84C" textColor="#C9A84C" size={9}>gratitude ×9</GraphLegend>
                <GraphLegend color="#8B6B4A" size={9}>restlessness ×6</GraphLegend>
                <GraphLegend color="#FCA5A5" textColor="#FCA5A5" size={9}>unease ×4</GraphLegend>
                <GraphLegend color="#8B7BAE" textColor="#8B7BAE" size={9}>wonder ×4</GraphLegend>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.4)' }}>weekends shaded</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ BEAT 3 — THE LIVING TREE ============ */}
      <section style={{ padding: '20px 24px 96px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <BeatMark />
          <BeatQuote maxWidth={660}>
            “Seeing yourself is where we start. When you&apos;re ready to act on it, we plant a root — and grow it into something you can point to.”
          </BeatQuote>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(201,168,76,0.8)', margin: '28px 0 0' }}>The Living Tree</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 40, width: '100%', marginTop: 36, alignItems: 'start' }}>
            {/* Left: the metaphor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 8 }}>
              {METAPHOR.map((m, i) => {
                const last = i === METAPHOR.length - 1;
                return (
                  <div key={m.kicker} style={{ display: 'flex', gap: 18 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.dot, boxShadow: `0 0 8px ${m.glow}`, marginTop: 6 }} />
                      {!last && <span style={{ flex: 1, width: 1, background: 'linear-gradient(180deg,rgba(201,168,76,0.4),rgba(201,168,76,0.15))' }} />}
                    </div>
                    <div style={{ paddingBottom: last ? 0 : 28 }}>
                      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.28em', color: 'rgba(201,168,76,0.85)' }}>{m.kicker}</div>
                      <div style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 19, color: '#E8E0D0', marginTop: 4 }}>{m.title}</div>
                      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(232,224,208,0.68)', margin: '6px 0 0' }}>{m.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: the RootCard */}
            <Reveal>
              <RootCard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" style={{ padding: '72px 24px 96px', background: 'linear-gradient(180deg,#0F1A14 0%,#162318 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(201,168,76,0.8)', margin: '0 0 14px' }}>Pricing</p>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 'clamp(30px,4vw,44px)', lineHeight: 1.12, margin: 0, color: '#E8E0D0' }}>Choose the depth you want to keep open.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(232,224,208,0.68)', margin: '16px auto 0' }}>Journaling is free, always. Paid tiers open the layers that turn seeing into growing.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, margin: '0 0 36px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: '#162318', border: '1px solid rgba(42,64,53,0.8)', borderRadius: 4, padding: 3, gap: 2 }}>
              <button type="button" onClick={() => setBilling('monthly')} style={billingBtnStyle(billing === 'monthly')}>Monthly</button>
              <button type="button" onClick={() => setBilling('yearly')} style={billingBtnStyle(billing === 'yearly')}>Yearly</button>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#7BAE8A' }}>save 3 months when billed yearly</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            <PlanCard
              title="Free"
              price="$0"
              description="The full journal, mood tracking, and your first reflections — always."
              actionLabel="Join waitlist"
              onAction={goSignup}
            />
            <PlanCard
              title="Pro"
              price={billing === 'yearly' ? '$89.99/yr' : '$8.99/mo'}
              description="The full knowledge graph, deep insights, frameworks — and the whole Living Tree."
              badge="Most Popular"
              subtext={billing === 'yearly' ? 'Save 25% — 3 months free' : 'Billed monthly, cancel anytime'}
              actionLabel="Join waitlist"
              onAction={goSignup}
            />
            <PlanCard
              title="Lifetime"
              price="$149"
              description="One payment, permanent access to everything I can do."
              badge="Founding Member"
              subtext="Will increase post-launch"
              actionLabel="Join waitlist"
              onAction={goSignup}
            />
          </div>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section id="begin" style={{ position: 'relative', padding: '120px 24px', background: 'radial-gradient(100% 120% at 50% 0%, #1A3C2E 0%, #0F1A14 70%)', overflow: 'hidden' }}>
        <RootsCanvas startWhenVisible />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ animation: 'yggi-breathe 5s var(--ease-gentle) infinite' }}>
            <Logo size={46} />
          </div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 'clamp(34px,5vw,54px)', lineHeight: 1.1, margin: '20px 0 0', color: '#E8E0D0' }}>Your roots begin here.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(232,224,208,0.72)', margin: '18px auto 32px', maxWidth: 440 }}>
            I&apos;m almost ready. Leave your email and I&apos;ll write to you first — once, when it&apos;s time.
          </p>
          <WaitlistForm router={router} buttonSize="lg" />
          <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.45)', marginTop: 16 }}>No credit card · Your entries stay yours</p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '1px solid rgba(42,64,53,0.4)', background: '#162318', padding: '44px 32px 36px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Logo size={22} />
              <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 16, letterSpacing: '0.1em', color: '#E8E0D0' }}>YGGI</span>
            </span>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(232,224,208,0.55)', margin: '14px 0 0', maxWidth: 280 }}>
              Semantic journaling — from self-awareness to self-mastery.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="#how" className="mkt-link" style={{ fontSize: 13 }}>How it works</a>
            <a href="#pricing" className="mkt-link" style={{ fontSize: 13 }}>Pricing</a>
            <a href="#top" className="mkt-link" style={{ fontSize: 13 }}>Privacy</a>
            <a href="#top" className="mkt-link" style={{ fontSize: 13 }}>Terms</a>
          </div>
        </div>
        <div style={{ maxWidth: 1000, margin: '32px auto 0', paddingTop: 20, borderTop: '1px solid rgba(42,64,53,0.4)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.4)' }}>© 2026 Yggdrasil · Rooted in old-growth wisdom</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,224,208,0.4)' }}>Grown intentionally, with purpose</span>
        </div>
      </footer>
    </div>
  );
}

/* Column label used inside the insight card. */
function BeatColLabel({ children, mb = 8 }: { children: ReactNode; mb?: number }) {
  return (
    <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7BAE8A', fontWeight: 500, margin: `0 0 ${mb}px` }}>
      {children}
    </h4>
  );
}

/* Legend swatch + label used under the graphs. */
function GraphLegend({ color, children, size = 10, textColor = 'rgba(232,224,208,0.6)' }: { color: string; children: ReactNode; size?: number; textColor?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: MONO, fontSize: 11, color: textColor }}>
      <span style={{ width: size, height: size, borderRadius: '50%', background: color }} />
      {children}
    </span>
  );
}

/* Email capture used in the hero and the closing CTA. Submits to the existing
   /api/subscribe endpoint, then hands the visitor to signup with their email. */
function WaitlistForm({
  router,
  buttonSize = 'lg',
  style = {},
}: {
  router: ReturnType<typeof useRouter>;
  buttonSize?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving) return;
        setError(null);
        if (!email.trim()) {
          router.push('/signup');
          return;
        }
        setSaving(true);
        try {
          const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), website: honeypot }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            if (res.status === 400) {
              setError(data?.error || 'That email address doesn’t look right — check it and try again.');
              setSaving(false);
              return;
            }
          }
          router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
        } catch {
          router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
        }
      }}
      style={{ width: '100%', maxWidth: 460, ...style }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          containerStyle={{ flex: 1, minWidth: 220 }}
        />
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
        />
        <Button size={buttonSize} type="submit" disabled={saving}>
          {saving ? 'One moment…' : 'Join waitlist'}
        </Button>
      </div>
      {error && <p style={{ fontSize: 13, color: 'rgba(224,165,165,0.9)', margin: '12px 0 0' }}>{error}</p>}
    </form>
  );
}
