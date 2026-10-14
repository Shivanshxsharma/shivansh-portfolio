'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';
import SplitText from '@/components/SplitText';
import SystemDiagram from '@/components/SystemDiagram';
import { PROJECTS } from '@/lib/data';

function Metric({ m }) {
  const ref = useRef(null);
  useGSAP(() => {
    const el = ref.current;
    if (prefersReducedMotion()) return;
    const o = { v: 0 };
    gsap.to(o, {
      v: m.value,
      duration: 1.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-US')),
    });
  });
  return (
    <div className="border-t border-line pt-3">
      <p className="display whitespace-nowrap text-[clamp(1.7rem,2.6vw,2.6rem)]">
        {m.prefix}
        <span ref={ref}>{m.value.toLocaleString('en-US')}</span>
        <span className="text-dim">{m.suffix}</span>
      </p>
      <p className="mt-1 text-[13px] leading-snug text-dim">{m.label}</p>
    </div>
  );
}

function ProjectCase({ p }) {
  const wrap = useRef(null);
  const fig = useRef(null);
  const [revealed, setRevealed] = useState(1);
  const total = p.steps.length;
  const step = p.steps[revealed - 1];

  useGSAP(
    () => {
      const set = (progress) => setRevealed(Math.min(total, Math.floor(progress * total) + 1));
      if (prefersReducedMotion()) {
        setRevealed(total);
        return;
      }
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({ trigger: wrap.current, start: 'top top', end: 'bottom bottom', onUpdate: (s) => set(s.progress) });
      });
      mm.add('(max-width: 1023px)', () => {
        ScrollTrigger.create({ trigger: fig.current, start: 'top 75%', end: 'bottom 25%', onUpdate: (s) => set(s.progress) });
      });
      gsap.from(wrap.current.querySelectorAll('[data-in]'), {
        y: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: wrap.current, start: 'top 70%', once: true },
      });
    },
    { scope: wrap }
  );

  return (
    <section id={p.id} ref={wrap} className="relative scroll-mt-0 border-t border-line lg:h-[var(--h)]" style={{ '--h': `${(total + 1) * 55}vh` }}>
      <div className="frame grid gap-10 py-16 lg:sticky lg:top-0 lg:h-screen lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center lg:gap-14 lg:py-0">
        {/* story */}
        <div>
          <p data-in className="mono flex items-center gap-3 text-dim">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.index} — {p.kind}
          </p>
          <h3 data-in className="display mt-4 text-[clamp(3.4rem,7vw,6.5rem)]">{p.name}</h3>
          <p data-in className="mt-5 text-[16px] leading-[1.55] text-dim">
            {p.summary}
          </p>
          <div data-in className="mt-8 grid grid-cols-3 gap-4">
            {p.metrics.map((m) => (
              <Metric key={m.label} m={m} />
            ))}
          </div>
          <div data-in className="mt-8 flex flex-wrap gap-1.5">
            {p.stack.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          <div data-in className="mt-6 flex flex-wrap gap-4">
            {p.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="text-[14px] text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-signal">
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>

        {/* figure */}
        <div ref={fig} data-in className="flex min-h-0 flex-col rounded-[28px] border border-line bg-base p-4 md:p-6 lg:h-[82vh]">
          <div className="flex items-center justify-between gap-3">
            <p className="mono text-faint">
              Fig. {p.index} — {p.name.toLowerCase()} / system
            </p>
            <div className="flex gap-1">
              {p.steps.map((s, i) => (
                <span
                  key={s.title}
                  className="h-1.5 w-5 rounded-full transition-colors duration-500"
                  style={{ background: i < revealed ? (i === revealed - 1 ? '#D4FF3A' : p.color) : '#222831' }}
                />
              ))}
            </div>
          </div>
          <div className="relative mt-3 min-h-0 flex-1">
            <SystemDiagram project={p} revealed={revealed} />
          </div>
          <div className="mt-3 rounded-2xl border border-line bg-panel px-4 py-3.5 md:px-5">
            <p className="mono text-signal">
              Step {String(revealed).padStart(2, '0')}/{String(total).padStart(2, '0')} · {step.title}
            </p>
            <p key={revealed} className="mt-1.5 animate-[fadeUp_0.5s_ease-out] text-[14px] leading-[1.5] text-ink/90">
              {step.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Work() {
  return (
    <div id="work" className="relative bg-void">
      <div className="frame pb-10 pt-28 md:pt-36">
        <p className="mono text-faint">§ 02 — Selected systems</p>
        <SplitText className="display mt-6 text-[clamp(3rem,8vw,7.5rem)]" lines={['Three systems,', 'drawn to scale.']} />
        <p className="mt-6 max-w-lg text-[16px] leading-[1.55] text-dim">
          Scroll through each one. The architecture assembles step by step — every box is a real component, every edge a real call.
        </p>
      </div>
      {PROJECTS.map((p) => (
        <ProjectCase key={p.id} p={p} />
      ))}
    </div>
  );
}
