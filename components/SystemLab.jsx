'use client';

import { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import SplitText, { Reveal } from '@/components/SplitText';
import { PROJECTS } from '@/lib/data';

const SCALE_X = 1.55;
const SCALE_Y = 1.45;
const W = 190;
const H = 64;

function SysNode({ data, selected }) {
  return (
    <div
      className="relative rounded-2xl border bg-panel px-4 py-3 text-center transition-all duration-200"
      style={{
        width: W,
        borderColor: selected ? data.color : '#2A313B',
        boxShadow: selected ? `0 0 0 4px ${data.color}22` : 'none',
      }}
    >
      {['top', 'bottom', 'left', 'right'].map((side) => (
        <Handle key={`s-${side}`} id={`s-${side}`} type="source" position={Position[side[0].toUpperCase() + side.slice(1)]} className="!h-1.5 !w-1.5 !border-0 !bg-faint" />
      ))}
      {['top', 'bottom', 'left', 'right'].map((side) => (
        <Handle key={`t-${side}`} id={`t-${side}`} type="target" position={Position[side[0].toUpperCase() + side.slice(1)]} className="!h-1.5 !w-1.5 !border-0 !bg-faint" />
      ))}
      <p className="text-[14px] font-medium text-ink">{data.label}</p>
      <p className="mt-0.5 font-mono text-[10.5px] text-dim">{data.sub}</p>
      {data.core && <span className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full" style={{ background: data.color }} />}
    </div>
  );
}

const nodeTypes = { sys: SysNode };

function toFlow(p) {
  const byId = Object.fromEntries(p.nodes.map((n) => [n.id, n]));
  const nodes = p.nodes.map((n) => ({
    id: n.id,
    type: 'sys',
    position: { x: n.x * SCALE_X - W / 2, y: n.y * SCALE_Y - H / 2 },
    data: { ...n, color: p.color },
  }));
  const edges = p.edges.map(([a, b]) => {
    const A = byId[a];
    const B = byId[b];
    const sameRow = Math.abs(A.y - B.y) < 8;
    const right = B.x > A.x;
    return {
      id: `${a}-${b}`,
      source: a,
      target: b,
      sourceHandle: sameRow ? (right ? 's-right' : 's-left') : B.y > A.y ? 's-bottom' : 's-top',
      targetHandle: sameRow ? (right ? 't-left' : 't-right') : B.y > A.y ? 't-top' : 't-bottom',
      animated: true,
      style: { stroke: p.color, strokeOpacity: 0.65, strokeWidth: 1.6 },
    };
  });
  return { nodes, edges };
}

export default function SystemLab() {
  const [pid, setPid] = useState(PROJECTS[0].id);
  const [picked, setPicked] = useState(null);
  const project = PROJECTS.find((p) => p.id === pid);
  const flow = useMemo(() => toFlow(project), [project]);

  const inspected = picked && project.nodes.find((n) => n.id === picked);
  const note = inspected && project.steps.find((s) => s.nodes.includes(inspected.id));

  return (
    <section id="lab" className="relative border-t border-line bg-void py-24 md:py-32">
      <div className="frame">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mono text-faint">§ 03 — System lab</p>
            <SplitText className="display mt-6 text-[clamp(2.8rem,7vw,6.5rem)]" lines={['Open the box.', 'Drag it around.']} />
          </div>
          <Reveal className="flex flex-wrap gap-1.5 rounded-full border border-line bg-panel p-1">
            {PROJECTS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPid(p.id);
                  setPicked(null);
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors ${
                  pid === p.id ? 'bg-ink text-void' : 'text-dim hover:text-ink'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                {p.name}
              </button>
            ))}
          </Reveal>
        </div>

        <Reveal className="mt-10 grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="relative h-[68vh] min-h-[460px] overflow-hidden rounded-[28px] border border-line bg-base">
            <ReactFlow
              key={pid}
              nodes={flow.nodes}
              edges={flow.edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.3}
              maxZoom={2}
              zoomOnScroll={false}
              preventScrolling={false}
              nodesConnectable={false}
              onNodeClick={(_, n) => setPicked(n.id)}
              onPaneClick={() => setPicked(null)}
              colorMode="dark"
              proOptions={{ hideAttribution: false }}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#2A313B" />
              <Controls showInteractive={false} position="bottom-left" />
              <MiniMap pannable zoomable nodeColor={() => project.color} nodeStrokeWidth={0} maskColor="rgba(7,8,10,0.75)" className="!hidden !rounded-xl !border !border-line md:!block" />
            </ReactFlow>
            <p className="mono pointer-events-none absolute right-5 top-5 text-faint">drag · pinch · click a node</p>
          </div>

          <aside className="flex flex-col rounded-[28px] border border-line bg-panel p-6">
            <p className="mono text-faint">Inspector</p>
            {inspected ? (
              <div key={inspected.id} className="animate-[fadeUp_0.4s_ease-out]">
                <h4 className="mt-6 text-[26px] font-semibold tracking-[-0.03em]">{inspected.label}</h4>
                <p className="mono mt-2" style={{ color: project.color }}>
                  {inspected.sub}
                </p>
                {note && (
                  <>
                    <p className="mono mt-8 text-faint">Role in the system · {note.title}</p>
                    <p className="mt-2 text-[15px] leading-[1.55] text-ink/90">{note.note}</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                <h4 className="mt-6 text-[26px] font-semibold tracking-[-0.03em]">{project.name}</h4>
                <p className="mt-3 text-[15px] leading-[1.55] text-dim">{project.summary}</p>
                <p className="mt-8 text-[13px] text-faint">Click any component to see what it does and why it is there.</p>
              </div>
            )}
            <div className="mt-auto pt-8">
              <p className="mono text-faint">
                {project.nodes.length} components · {project.edges.length} connections
              </p>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
