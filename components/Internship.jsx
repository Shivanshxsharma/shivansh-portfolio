'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import SplitText from '@/components/SplitText';
import { INTERNSHIP } from '@/lib/data';

const ACCENT = '#D4FF3A';

// small building blocks for the two diagrams
function Box({ x, y, w = 128, h = 46, title, sub, accent }) {
  return (
    <g data-node transform={`translate(${x - w / 2} ${y - h / 2})`}>
      <rect width={w} height={h} rx="10" fill="#0E1014" stroke={accent ? ACCENT : '#3A424D'} strokeWidth={accent ? 1.5 : 1.1} />
      <text x={w / 2} y={sub ? 19 : h / 2 + 4.5} textAnchor="middle" fill="#E9ECEF" fontSize="12.5" fontWeight="500">
        {title}
      </text>
      {sub && (
        <text x={w / 2} y="34" textAnchor="middle" fill="#8B939E" fontSize="9.5" fontFamily="var(--font-mono)">
          {sub}
        </text>
      )}
    </g>
  );
}

function Wire({ d, id, packets = 0, dur = 2, color = ACCENT, reverse = false }) {
  return (
    <g>
      <path d={d} fill="none" stroke="#2A313B" strokeWidth="1" strokeDasharray="3 4" />
      <path data-wire id={id} d={d} fill="none" stroke={color} strokeOpacity="0.75" strokeWidth="1.4" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
      <g data-packets opacity="0">
        {Array.from({ length: packets }, (_, i) => (
          <circle key={i} r="2.6" fill={color}>
            <animateMotion dur={`${dur}s`} begin={`${(i * dur) / packets}s`} repeatCount="indefinite" keyPoints={reverse ? '1;0' : '0;1'} keyTimes="0;1" calcMode="linear">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        ))}
      </g>
    </g>
  );
}

function BlogDiagram() {
  return (
    <svg viewBox="0 0 560 210" className="h-auto w-full" role="img" aria-label="Readers hit a response cache in front of a FastAPI backend that issues and rotates JWT refresh tokens">
      <g data-node>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={40 + i * 14} cy={96 + (i % 2) * 14} r="6" fill="#171B21" stroke="#8B939E" strokeWidth="1" />
        ))}
        <text x="54" y="138" textAnchor="middle" fill="#8B939E" fontSize="10" fontFamily="var(--font-mono)">
          READERS
        </text>
      </g>
      <Wire id="bw1" d="M84 103 L150 103" packets={3} dur={1.6} />
      <Box x={215} y={103} title="Response cache" sub="SEO-friendly pages" />
      <Wire id="bw2" d="M279 103 L345 103" packets={2} dur={1.6} />
      <Box x={410} y={103} title="FastAPI" sub="blog platform API" accent />
      <Wire id="bw3" d="M410 80 C410 44 470 30 500 30" packets={1} dur={2.4} color="#8B939E" />
      <Box x={500} y={30} w={104} h={36} title="JWT access" />
      <Wire id="bw4" d="M410 126 C410 166 470 180 500 180" packets={1} dur={2.4} color="#8B939E" />
      <Box x={500} y={180} w={104} h={36} title="Refresh rotation" />
      {/* the rotation loop */}
      <path data-wire d="M548 48 C566 80 566 130 548 162" fill="none" stroke={ACCENT} strokeOpacity="0.6" strokeWidth="1.2" pathLength="1" strokeDasharray="1" strokeDashoffset="1" markerEnd="url(#arr-intern)" />
      <defs>
        <marker id="arr-intern" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
      </defs>
    </svg>
  );
}

function InsightsDiagram() {
  const ys = [26, 66, 106, 146, 186];
  return (
    <svg viewBox="0 0 560 210" className="h-auto w-full" role="img" aria-label="Five or more social platforms feed a unified data layer that powers a role-based dashboard">
      {ys.map((y, i) => (
        <g key={y}>
          <g data-node>
            <circle cx="44" cy={y} r="11" fill="#0E1014" stroke="#3A424D" />
            <text x="44" y={y + 3.5} textAnchor="middle" fill="#8B939E" fontSize="9.5" fontFamily="var(--font-mono)">
              {`P${i + 1}`}
            </text>
          </g>
          <Wire id={`iw${i}`} d={`M58 ${y} C150 ${y} 150 105 228 105`} packets={1} dur={2 + i * 0.25} />
        </g>
      ))}
      <Box x={290} y={105} w={124} h={52} title="Unified data" sub="one schema" accent />
      <Wire id="iw5" d="M352 105 L408 105" packets={2} dur={1.4} />
      <g data-node transform="translate(410 52)">
        <rect width="132" height="106" rx="12" fill="#0E1014" stroke="#3A424D" />
        <text x="14" y="22" fill="#E9ECEF" fontSize="12.5" fontWeight="500">
          Dashboard
        </text>
        <text x="14" y="37" fill="#8B939E" fontSize="9.5" fontFamily="var(--font-mono)">
          role-based views
        </text>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={14 + i * 36} y="50" width="30" height="8" rx="4" fill={i === 0 ? ACCENT : '#2A313B'} />
        ))}
        {[58, 40, 72, 50, 86, 64].map((h, i) => (
          <rect key={i} data-bar x={16 + i * 18} y={96 - h * 0.38} width="10" height={h * 0.38} rx="2" fill={i === 4 ? ACCENT : '#3A424D'} />
        ))}
      </g>
    </svg>
  );
}

function WorkCard({ w, children }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const num = q('[data-num]')[0];
      if (prefersReducedMotion()) {
        gsap.set(q('[data-wire]'), { strokeDashoffset: 0 });
        gsap.set(q('[data-packets]'), { opacity: 1 });
        return;
      }
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 78%', once: true } });
      tl.from(ref.current, { y: 60, opacity: 0, duration: 1, ease: 'expo.out' })
        .from(q('[data-node]'), { opacity: 0, scale: 0.85, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.07, ease: 'back.out(1.8)' }, 0.25)
        .to(q('[data-wire]'), { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: 'power2.inOut' }, 0.45)
        .from(q('[data-bar]'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 0.9)
        .to(q('[data-packets]'), { opacity: 1, duration: 0.4 }, 1.2);
      const o = { v: 0 };
      tl.to(o, { v: w.stat.value, duration: 2, ease: 'expo.out', onUpdate: () => (num.textContent = Math.round(o.v).toLocaleString('en-US')) }, 0.5);
    },
    { scope: ref }
  );

  return (
    <article ref={ref} className="flex flex-col rounded-[28px] border border-line bg-base p-5 md:p-7">
      <div className="rounded-2xl border border-line bg-void/60 p-3 md:p-4">{children}</div>
      <h3 className="mt-6 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-[1.05] tracking-[-0.035em]">{w.title}</h3>
      <div className="mt-4 flex items-end gap-4 border-t border-line pt-4">
        <p className="display text-[clamp(2.6rem,4.4vw,3.8rem)] text-signal">
          <span data-num>{w.stat.value.toLocaleString('en-US')}</span>
          {w.stat.suffix}
        </p>
        <p className="mono mb-2 max-w-[12rem] text-dim">{w.stat.label}</p>
      </div>
      <p className="mt-4 text-[15px] leading-[1.55] text-dim">{w.body}</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {w.stack.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>
    </article>
  );
}

export default function Internship() {
  const root = useRef(null);
  const I = INTERNSHIP;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('[data-role] > *', { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '[data-role]', start: 'top 85%', once: true } });
      // tenure line grows across as you scroll through the section
      gsap.fromTo('[data-tenure]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom 60%', scrub: true } });
    },
    { scope: root }
  );

  return (
    <section id="internship" ref={root} className="relative border-t border-line bg-void py-24 md:py-32">
      <div className="frame">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <div>
            <h2 className="flex items-center gap-3 text-[15px] font-medium text-ink md:text-[16px]"><span className="mono text-faint">02</span><span className="h-px w-6 bg-line" />Internship — projects I built at Cognisphere</h2>
            <SplitText className="display mt-6 text-[clamp(3rem,7.5vw,7rem)]" lines={['Shipping', 'in production.']} />
          </div>

          <div data-role className="rounded-[24px] border border-line bg-panel p-6">
            <p className="mono flex items-center gap-2 text-signal">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              Current role
            </p>
            <p className="mt-4 text-[22px] font-semibold leading-tight tracking-[-0.03em]">{I.role}</p>
            <p className="mt-1 text-[15px] text-ink/85">{I.company}</p>
            <div className="mt-5 flex justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
              <span>{I.when}</span>
              <span>{I.where}</span>
            </div>
            <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-line">
              <div data-tenure className="h-full origin-left rounded-full bg-signal" />
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <WorkCard w={I.work[0]}>
            <BlogDiagram />
          </WorkCard>
          <WorkCard w={I.work[1]}>
            <InsightsDiagram />
          </WorkCard>
        </div>
      </div>
    </section>
  );
}
