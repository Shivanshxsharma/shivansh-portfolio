'use client';

import { useMemo } from 'react';

export const NODE_W = 172;
export const NODE_H = 54;

// Orthogonal-ish connector: side-to-side for same row, otherwise bottom → top with an S-curve.
export function connector(a, b) {
  if (Math.abs(a.y - b.y) < 8) {
    const dir = b.x > a.x ? 1 : -1;
    const sx = a.x + (dir * NODE_W) / 2;
    const ex = b.x - (dir * NODE_W) / 2;
    return `M${sx} ${a.y} L${ex} ${b.y}`;
  }
  const down = b.y > a.y ? 1 : -1;
  const sx = a.x;
  const sy = a.y + (down * NODE_H) / 2;
  const ex = b.x;
  const ey = b.y - (down * NODE_H) / 2;
  const my = (sy + ey) / 2;
  return `M${sx} ${sy} C${sx} ${my} ${ex} ${my} ${ex} ${ey}`;
}

// `revealed` = number of steps shown so far; the last revealed step is the active one.
export default function SystemDiagram({ project, revealed }) {
  const { nodes, edges, steps, color, viewBox } = project;
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const shown = new Set(steps.slice(0, revealed).flatMap((s) => s.nodes));
  const active = new Set(steps[revealed - 1]?.nodes ?? []);

  return (
    <svg viewBox={`0 0 ${viewBox[0]} ${viewBox[1]}`} className="h-full w-full" role="img" aria-label={`${project.name} system architecture`}>
      <defs>
        <marker id={`arr-${project.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {edges.map(([a, b]) => {
        const A = byId[a];
        const B = byId[b];
        const d = connector(A, B);
        const on = shown.has(a) && shown.has(b);
        const hot = on && (active.has(a) || active.has(b));
        return (
          <g key={`${a}-${b}`}>
            {/* ghost blueprint line */}
            <path d={d} fill="none" stroke="#2A313B" strokeWidth="1.2" strokeDasharray="3 5" />
            <path
              d={d}
              fill="none"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={on ? 0 : 1}
              stroke={hot ? color : '#55606D'}
              strokeWidth={hot ? 2 : 1.4}
              markerEnd={on ? `url(#arr-${project.id})` : undefined}
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.2,.8,.2,1), stroke 0.4s' }}
            />
            {hot && (
              <circle r="4" fill="#D4FF3A">
                <animateMotion dur="1.4s" repeatCount="indefinite" path={d} />
              </circle>
            )}
          </g>
        );
      })}

      {nodes.map((n) => {
        const on = shown.has(n.id);
        const hot = active.has(n.id);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x - NODE_W / 2} ${n.y - NODE_H / 2})`}
            style={{ opacity: on ? 1 : 0.28, transition: 'opacity 0.6s ease' }}
          >
            <rect
              width={NODE_W}
              height={NODE_H}
              rx="12"
              fill={hot ? '#14161C' : '#0E1014'}
              stroke={hot ? color : on ? '#3A424D' : '#2A313B'}
              strokeWidth={hot ? 1.8 : 1.2}
              strokeDasharray={on ? undefined : '4 4'}
              style={{ transition: 'stroke 0.4s, fill 0.4s' }}
            />
            {n.core && <circle cx="14" cy="14" r="3" fill={on ? color : '#3A424D'} />}
            <text x={NODE_W / 2} y="24" textAnchor="middle" fill={on ? '#E9ECEF' : '#6B7380'} fontSize="14.5" fontWeight="500">
              {n.label}
            </text>
            <text x={NODE_W / 2} y="41" textAnchor="middle" fill="#8B939E" fontSize="10.5" fontFamily="var(--font-mono)">
              {n.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
