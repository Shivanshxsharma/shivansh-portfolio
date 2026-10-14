'use client';

import { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap';
import { PROFILE } from '@/lib/data';

const LINKS = [
  ['Graph', '#graph'],
  ['Work', '#work'],
  ['Lab', '#lab'],
  ['Path', '#experience'],
  ['Contact', '#contact'],
];

export default function Nav() {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.from(ref.current, { y: -80, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.9 });
    // hide on scroll down, show on scroll up
    const show = gsap.to(ref.current, { yPercent: -160, duration: 0.45, ease: 'power3.out', paused: true });
    ScrollTrigger.create({
      start: 'top -120',
      onUpdate: (self) => (self.direction === 1 ? show.play() : show.reverse()),
    });
  });

  return (
    <header ref={ref} className="fixed inset-x-0 top-4 z-50">
      <nav className="frame flex items-center justify-between gap-3">
        <a
          href="#top"
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-panel/80 font-mono text-[13px] font-medium backdrop-blur-md"
          aria-label="Back to top"
        >
          SS
        </a>
        <div className="hidden items-center gap-1 rounded-full border border-line bg-panel/80 p-1 backdrop-blur-md md:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 text-[13px] text-dim transition-colors hover:bg-raised hover:text-ink">
              {label}
            </a>
          ))}
        </div>
        <a
          href="#contact"
          className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-panel/80 px-4 text-[13px] backdrop-blur-md"
        >
          <span className="relative h-2 w-2 rounded-full bg-signal" />
          <span className="hidden sm:inline">{PROFILE.status}</span>
          <span className="sm:hidden">Hire me</span>
        </a>
      </nav>
    </header>
  );
}
