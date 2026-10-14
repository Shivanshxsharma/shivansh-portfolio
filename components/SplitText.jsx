'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';

// Masked line reveal. `lines` is an array of strings (or nodes), each rendered as its own masked row.
// When `immediate` is true it plays on mount; otherwise when scrolled into view.
export default function SplitText({ lines, as: Tag = 'h2', className = '', lineClassName = '', delay = 0, immediate = false, stagger = 0.09 }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const inners = ref.current.querySelectorAll('.split-inner');
      gsap.set(inners, { yPercent: 110, rotate: 2 });
      gsap.to(inners, {
        yPercent: 0,
        rotate: 0,
        duration: 1.15,
        ease: 'expo.out',
        stagger,
        delay,
        scrollTrigger: immediate ? undefined : { trigger: ref.current, start: 'top 85%', once: true },
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className={`split-line ${lineClassName}`}>
          <span className="split-inner">{line}</span>
        </span>
      ))}
    </Tag>
  );
}

// Fade-up on scroll for any block.
export function Reveal({ children, className = '', delay = 0, y = 40, as: Tag = 'div' }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(ref.current, {
        y,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        delay,
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      });
    },
    { scope: ref }
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
