'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';
import SplitText from '@/components/SplitText';
import { SKILLS, SKILL_PROJECTS } from '@/lib/data';

const ALL = 'all';
const PROJECT = Object.fromEntries(SKILL_PROJECTS.map((p) => [p.id, p]));
const TOTAL = SKILLS.reduce((a, g) => a + g.items.length, 0);

function Chip({ name, used, active }) {
  const on = active === ALL || used.includes(active);
  const color = active !== ALL && on ? PROJECT[active].color : null;
  return (
    <span
      data-chip
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[12px] transition-all duration-500 ease-out"
      style={{
        borderColor: color || '#222831',
        background: color ? `${color}14` : '#111419',
        color: on ? '#E9ECEF' : '#525A66',
        opacity: on ? 1 : 0.45,
        transform: color ? 'translateY(-2px)' : 'none',
      }}
    >
      {name}
      {used.length > 0 && (
        <span className="flex gap-[3px]" aria-label={`Used in ${used.map((u) => PROJECT[u].label).join(', ')}`}>
          {used.map((u) => (
            <span key={u} className="h-[5px] w-[5px] rounded-full transition-opacity duration-500" style={{ background: PROJECT[u].color, opacity: active === ALL || active === u ? 1 : 0.25 }} />
          ))}
        </span>
      )}
    </span>
  );
}

export default function Stack() {
  const root = useRef(null);
  const [active, setActive] = useState(ALL);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);

  const counts = useMemo(() => {
    const c = { [ALL]: TOTAL };
    SKILL_PROJECTS.forEach((p) => (c[p.id] = SKILLS.reduce((a, g) => a + g.items.filter(([, u]) => u.includes(p.id)).length, 0)));
    return c;
  }, []);

  // tour the projects while the section is on screen, until someone takes over
  useEffect(() => {
    if (!auto || !inView || prefersReducedMotion()) return;
    const order = [ALL, ...SKILL_PROJECTS.map((p) => p.id)];
    let i = order.indexOf(active);
    const id = setInterval(() => {
      i = (i + 1) % order.length;
      setActive(order[i]);
    }, 2400);
    return () => clearInterval(id);
  }, [auto, inView]); // eslint-disable-line react-hooks/exhaustive-deps

  const take = (id) => {
    setAuto(false);
    setActive(id);
  };

  useGSAP(
    () => {
      ScrollTrigger.create({ trigger: root.current, start: 'top 70%', end: 'bottom 20%', onToggle: (s) => setInView(s.isActive) });
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: '[data-grid]', start: 'top 82%', once: true } });
      tl.from('[data-card]', { y: 70, opacity: 0, rotateX: -16, transformOrigin: '50% 100%', duration: 1.1, stagger: 0.07, ease: 'expo.out' });
      tl.from('[data-chip]', { opacity: 0, scale: 0.7, y: 10, duration: 0.5, stagger: 0.012, ease: 'back.out(2)', clearProps: 'transform,opacity' }, 0.25);
      gsap.from('[data-filter]', { y: 20, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '[data-filters]', start: 'top 88%', once: true } });
    },
    { scope: root }
  );

  const label = active === ALL ? `${TOTAL} skills across 4 projects` : `${PROJECT[active].label} uses ${counts[active]} of ${TOTAL}`;

  return (
    <section id="skills" ref={root} className="relative border-t border-line bg-base py-24 md:py-32">
      <div className="frame">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="flex items-center gap-3 text-[15px] font-medium text-ink md:text-[16px]"><span className="mono text-faint">05</span><span className="h-px w-6 bg-line" />Technical skills</h2>
            <SplitText className="display mt-6 text-[clamp(2.8rem,6vw,5.5rem)]" lines={['The primitives', 'I reach for.']} />
          </div>
          <p className="max-w-sm text-[15px] leading-[1.55] text-dim lg:text-right">
            Every skill is linked to where I used it. Pick a project to see its stack light up.
          </p>
        </div>

        {/* project switcher */}
        <div data-filters className="mt-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" onMouseLeave={() => !auto && setActive(ALL)}>
          <div className="flex flex-wrap gap-1.5 rounded-full border border-line bg-panel p-1">
            {[{ id: ALL, label: 'All', color: '#E9ECEF' }, ...SKILL_PROJECTS].map((p) => (
              <button
                key={p.id}
                data-filter
                onClick={() => take(p.id)}
                onMouseEnter={() => take(p.id)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors duration-300 ${active === p.id ? 'bg-ink text-void' : 'text-dim hover:text-ink'}`}
              >
                {p.id !== ALL && <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />}
                {p.label}
                {active === p.id && auto && <span className="absolute inset-x-4 -bottom-[3px] h-[2px] origin-left animate-[grow_2.4s_linear] rounded-full bg-signal" />}
              </button>
            ))}
          </div>
          <p key={label} className="mono animate-[fadeUp_0.4s_ease-out] text-dim">
            {label}
          </p>
        </div>

        <div data-grid className="mt-8 gap-3 [perspective:1400px] sm:columns-2 lg:columns-3">
          {SKILLS.map((g, i) => {
            const hits = active === ALL ? g.items.length : g.items.filter(([, u]) => u.includes(active)).length;
            return (
              <div
                key={g.group}
                data-card
                className="mb-3 break-inside-avoid rounded-[24px] border bg-panel p-6 transition-colors duration-500"
                style={{ borderColor: active !== ALL && hits > 0 ? `${PROJECT[active].color}55` : '#222831' }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[18px] font-medium tracking-[-0.02em]">{g.group}</p>
                  <span className="mono text-faint">
                    {String(i + 1).padStart(2, '0')} · {hits}/{g.items.length}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {g.items.map(([name, used]) => (
                    <Chip key={name} name={name} used={used} active={active} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
