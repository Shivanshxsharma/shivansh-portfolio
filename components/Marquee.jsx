import { ROLES } from '@/lib/data';

export default function Marquee() {
  const row = [...ROLES, ...ROLES];
  return (
    <div className="relative overflow-hidden border-y border-line bg-base py-5" aria-hidden="true">
      <div className="marquee-track flex w-max">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {row.map((r, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-8 pr-8 text-[clamp(1.5rem,3.4vw,3rem)] font-medium tracking-[-0.04em] text-ink/90">
                {r}
                <span className="inline-block h-2.5 w-2.5 rotate-45 bg-signal" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
