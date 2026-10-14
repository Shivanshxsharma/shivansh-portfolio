'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import SplitText from '@/components/SplitText';
import { STACK } from '@/lib/data';

export default function Stack() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('[data-card]', {
        y: 60,
        opacity: 0,
        rotateX: -12,
        transformOrigin: '50% 100%',
        duration: 1.1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-grid]', start: 'top 80%', once: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative border-t border-line bg-base py-24 md:py-32">
      <div className="frame">
        <p className="mono text-faint">§ 05 — Toolbox</p>
        <SplitText className="display mt-6 text-[clamp(2.8rem,6vw,5.5rem)]" lines={['The primitives', 'I reach for.']} />
        <div data-grid className="mt-14 grid gap-3 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((g, i) => (
            <div key={g.group} data-card className="group rounded-[24px] border border-line bg-panel p-6 transition-colors duration-300 hover:border-faint">
              <div className="flex items-center justify-between">
                <p className="text-[18px] font-medium tracking-[-0.02em]">{g.group}</p>
                <span className="mono text-faint">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <span key={it} className="chip transition-colors duration-300 group-hover:border-faint group-hover:text-ink">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
