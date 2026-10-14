'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import SplitText from '@/components/SplitText';
import { PROFILE } from '@/lib/data';

const LINES = [
  ['$', 'curl -s shivansh.dev/api/whoami'],
  ['{', ''],
  ['  "role":', '"backend & ai systems"'],
  ['  "shipping":', '["alfred", "docintel", "hex"]'],
  ['  "status":', '"open to opportunities"'],
  ['}', ''],
];

export default function Contact() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('[data-term] p', {
        opacity: 0,
        x: -12,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-term]', start: 'top 85%', once: true },
      });
      // the big line scales up as it arrives
      gsap.fromTo('[data-big]', { scale: 0.86 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top 20%', scrub: true } });
    },
    { scope: root }
  );

  const links = [
    ['GitHub', PROFILE.links.github],
    ['Alfred — live', PROFILE.links.alfred],
    ['LinkedIn', PROFILE.links.linkedin],
    ['Resume', PROFILE.links.resume],
  ].filter(([, href]) => href && href !== '#');
  const email = PROFILE.links.email.replace('mailto:', '');

  return (
    <section id="contact" ref={root} className="relative overflow-hidden border-t border-line bg-void pb-10 pt-24 md:pt-36">
      <div className="dotgrid pointer-events-none absolute inset-0 opacity-50" />
      <div className="frame relative">
        <p className="mono text-faint">§ 06 — Contact</p>
        <div data-big className="origin-left">
          <SplitText className="display mt-6 text-[clamp(3.4rem,11vw,11rem)]" lines={['Let’s build', <span key="s" className="text-signal">something that ships.</span>]} />
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-end">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href={PROFILE.links.email}
                className="group inline-flex w-fit items-center gap-4 rounded-full bg-signal py-3 pl-6 pr-3 text-[16px] font-medium text-void transition-transform hover:-translate-y-0.5"
              >
                Say hello
                <span className="grid h-9 w-9 place-items-center rounded-full bg-void text-signal transition-transform duration-300 group-hover:rotate-[-45deg]">→</span>
              </a>
              <a href={PROFILE.links.email} className="font-mono text-[14px] text-ink transition-colors hover:text-signal">
                {email}
              </a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {links.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="text-[15px] text-dim underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-signal">
                  {label} ↗
                </a>
              ))}
            </div>
          </div>

          <div data-term className="overflow-x-auto rounded-[24px] border border-line bg-base p-5 font-mono text-[11.5px] leading-[1.9] sm:text-[13px]">
            <div className="mb-3 flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
            </div>
            {LINES.map(([a, b], i) => (
              <p key={i} className="whitespace-pre">
                <span className={i === 0 ? 'text-signal' : 'text-dim'}>{a}</span> <span className="text-ink">{b}</span>
              </p>
            ))}
          </div>
        </div>

        <footer className="mt-24 flex flex-col justify-between gap-3 border-t border-line pt-6 text-faint sm:flex-row">
          <p className="mono">© 2026 {PROFILE.name}</p>
          <p className="mono">Built with Next.js · three.js · GSAP · React Flow</p>
        </footer>
      </div>
    </section>
  );
}
