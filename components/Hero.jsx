'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { gsap, useGSAP, sceneState, prefersReducedMotion } from '@/lib/gsap';
import SplitText from '@/components/SplitText';
import { PROFILE } from '@/lib/data';

const NetworkScene = dynamic(() => import('@/components/three/NetworkScene'), { ssr: false });

export default function Hero() {
  const root = useRef(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '100px' });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      if (!reduced) {
        gsap.from('[data-hero-fade]', { y: 24, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.7 });
      }

      // pinned dive: the camera flies into the graph while the type lifts away
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=110%',
          pin: true,
          scrub: true,
          onUpdate: (self) => (sceneState.heroProgress = self.progress),
        },
      });
      tl.to('[data-hero-name]', { yPercent: -35, opacity: 0, ease: 'none', duration: 0.45 }, 0)
        .to('[data-hero-side]', { y: -80, opacity: 0, ease: 'none', duration: 0.45 }, 0)
        .to('[data-hero-hud]', { opacity: 0, ease: 'none', duration: 0.3 }, 0)
        .fromTo('[data-hero-handoff]', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, ease: 'none', duration: 0.25 }, 0.4)
        .to('[data-hero-handoff]', { opacity: 0, ease: 'none', duration: 0.15 }, 0.9)
        // the dive ends in darkness — the constellation's core rises out of it
        .to('[data-hero-canvas]', { opacity: 0.28, ease: 'power1.in', duration: 0.25 }, 0.8);
    },
    { scope: root }
  );

  return (
    <section id="top" ref={root} className="relative h-[100svh] min-h-[620px] overflow-hidden bg-void">
      <div data-hero-canvas className="absolute inset-0">
        <NetworkScene active={active} />
      </div>
      <div className="dotgrid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,transparent_0%,transparent_35%,rgba(7,8,10,0.85)_100%)]" />

      {/* HUD */}
      <div data-hero-hud className="pointer-events-none absolute inset-x-0 top-24 hidden md:block">
        <div className="frame flex justify-between text-faint">
          <span className="mono">Fig. 00 — the graph of everything I build</span>
          <span className="mono">130 nodes · 70 packets in flight</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end pb-10 md:pb-14">
        <div className="frame grid items-end gap-8 lg:grid-cols-[1fr_minmax(0,24rem)]">
          <div data-hero-name>
            <p data-hero-fade className="mono mb-5 flex items-center gap-3 text-dim">
              <span className="h-px w-8 bg-signal" />
              {PROFILE.role}
            </p>
            <SplitText
              as="h1"
              immediate
              delay={0.25}
              stagger={0.12}
              className="display text-[clamp(2.6rem,15vw,15rem)] uppercase"
              lines={[PROFILE.first, PROFILE.last]}
            />
          </div>

          <div data-hero-side className="pointer-events-auto pb-2">
            <div data-hero-fade className="mb-5 flex items-center gap-3">
              <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-signal ring-offset-2 ring-offset-void">
                <Image src={PROFILE.photo.avatar} alt={PROFILE.name} fill sizes="48px" className="object-cover" priority />
              </span>
              <div>
                <p className="text-[15px] font-medium">Hi, I’m {PROFILE.first}.</p>
                <p className="mono mt-0.5 text-faint">{PROFILE.location}</p>
              </div>
            </div>
            <p data-hero-fade className="text-[17px] leading-[1.5] text-dim">
              {PROFILE.tagline}
            </p>
            <div data-hero-fade className="mt-6 flex flex-wrap gap-2">
              <a href="#work" className="rounded-full bg-signal px-5 py-3 text-[14px] font-medium text-void transition-transform hover:-translate-y-0.5">
                See the systems
              </a>
              <a
                href={PROFILE.links.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line bg-panel/70 px-5 py-3 text-[14px] backdrop-blur transition-colors hover:border-faint"
              >
                GitHub ↗
              </a>
            </div>
            <p data-hero-fade className="mono mt-6 text-faint">
              {PROFILE.now}
            </p>
          </div>
        </div>
      </div>

      {/* appears as the camera reaches the core */}
      <div data-hero-handoff className="pointer-events-none absolute inset-0 grid place-items-center opacity-0">
        <p className="mono text-center text-ink">
          entering the graph<span className="text-signal"> ↓</span>
        </p>
      </div>
    </section>
  );
}
