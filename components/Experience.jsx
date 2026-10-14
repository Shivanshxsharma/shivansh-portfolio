'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import SplitText from '@/components/SplitText';
import Image from 'next/image';
import { EXPERIENCE, PROFILE } from '@/lib/data';

export default function Experience() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const list = root.current.querySelector('[data-list]');
      gsap.from('[data-badge]', {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-badge]', start: 'top 90%', once: true },
      });
      // slow parallax drift inside the photo frame
      gsap.fromTo('[data-photo]', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(
        '[data-rail]',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 65%', end: 'bottom 60%', scrub: true } }
      );
      gsap.utils.toArray('[data-item]', root.current).forEach((el) => {
        const dot = el.querySelector('[data-dot]');
        gsap.from(el.querySelectorAll('[data-fade]'), {
          x: 40,
          opacity: 0,
          duration: 1,
          stagger: 0.06,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 72%', once: true },
        });
        gsap.fromTo(
          dot,
          { scale: 0.4, backgroundColor: '#222831' },
          { scale: 1, backgroundColor: '#D4FF3A', duration: 0.5, ease: 'back.out(3)', scrollTrigger: { trigger: el, start: 'top 62%', toggleActions: 'play none none reverse' } }
        );
      });
    },
    { scope: root }
  );

  return (
    <section id="experience" ref={root} className="relative border-t border-line bg-void py-24 md:py-32">
      <div className="frame grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mono text-faint">§ 04 — The path</p>
          <SplitText className="display mt-6 text-[clamp(2.8rem,6vw,5.5rem)]" lines={['Short history.', 'Steep slope.']} />
          <p className="mt-6 max-w-sm text-[16px] leading-[1.55] text-dim">
            I’m early in my career, so I optimise for depth: fewer projects, each one taken all the way to production.
          </p>

          <figure data-badge className="group mt-8 flex max-w-sm items-stretch gap-4 rounded-[24px] border border-line bg-panel p-3">
            <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl">
              <Image
                data-photo
                src={PROFILE.photo.portrait}
                alt={`Portrait of ${PROFILE.name}`}
                fill
                sizes="112px"
                className="scale-110 object-cover object-[50%_20%] saturate-[0.55] transition-[filter] duration-700 group-hover:saturate-100"
              />
            </div>
            <figcaption className="flex min-w-0 flex-col justify-between py-1 pr-1">
              <div>
                <p className="text-[17px] font-medium tracking-[-0.02em]">{PROFILE.name}</p>
                <p className="mt-1 text-[13px] text-dim">{PROFILE.role}</p>
              </div>
              <div className="space-y-1">
                <p className="mono text-faint">{PROFILE.location}</p>
                <p className="mono flex items-center gap-2 text-signal">
                  <span className="relative h-1.5 w-1.5 rounded-full bg-signal" />
                  {PROFILE.status}
                </p>
              </div>
            </figcaption>
          </figure>
        </div>

        <ol data-list className="relative pl-10 md:pl-14">
          <span className="absolute bottom-2 left-[7px] top-2 w-px bg-line md:left-[11px]" />
          <span data-rail className="absolute bottom-2 left-[7px] top-2 w-px origin-top bg-signal md:left-[11px]" />
          {EXPERIENCE.map((e) => (
            <li key={e.title} data-item className="relative pb-14 last:pb-0">
              <span data-dot className="absolute -left-10 top-1.5 h-[15px] w-[15px] rounded-full border-4 border-void bg-signal md:-left-14 md:h-[23px] md:w-[23px]" />
              <p data-fade className="mono text-signal">
                {e.when}
              </p>
              <h3 data-fade className="mt-3 text-[clamp(1.6rem,2.8vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
                {e.title}
              </h3>
              <p data-fade className="mt-2 text-[15px] text-dim">
                {e.org}
              </p>
              <p data-fade className="mt-4 max-w-xl text-[16px] leading-[1.55] text-ink/85">
                {e.body}
              </p>
              <div data-fade className="mt-4 flex flex-wrap gap-1.5">
                {e.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
