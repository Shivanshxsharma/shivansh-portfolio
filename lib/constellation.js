import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force';
import { CONSTELLATION, PROFILE } from './data';

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;

// Builds nodes + edges, settles them with d3-force, and returns a live (stopped) simulation for dragging.
export function buildConstellation() {
  const R = rng(1337);
  const nodes = [];
  const edges = [];
  const byId = {};
  const add = (n) => {
    nodes.push(n);
    byId[n.id] = n;
    return n;
  };
  const link = (source, target, kind, color, curve, dist = 0) => edges.push({ source, target, kind, color, curve, dist });

  add({
    id: 'me',
    kind: 'me',
    label: PROFILE.first,
    sub: 'Backend · AI systems',
    desc: `${PROFILE.role} · ${PROFILE.location}`,
    color: '#E9ECEF',
    r: 64,
    x: 0,
    y: 0,
    fx: 0,
    fy: 0,
    home: [0, 0],
    clusters: [],
    href: '#experience',
    phase: 0,
    amp: 0,
  });

  const colorOf = {};
  CONSTELLATION.clusters.forEach((c, ci) => {
    colorOf[c.id] = c.color;
    const [ax, ay] = c.anchor;
    add({ id: c.id, kind: 'hub', label: c.label, sub: c.sub, desc: c.desc, color: c.color, r: 30, x: ax, y: ay, fx: ax, fy: ay, home: [ax, ay], clusters: [c.id], ci, href: c.href, phase: R() * TAU, amp: 0 });
    link('me', c.id, 'spine', c.color, ci % 2 ? 0.1 : -0.1);

    const m = c.members.length;
    const turn = R() * TAU;
    c.members.forEach(([label, desc], mi) => {
      const ang = turn + (mi / m) * TAU + (R() - 0.5) * 0.4;
      const rad = 175 + R() * 40;
      const id = `${c.id}:${mi}`;
      add({ id, kind: 'member', label, desc, cluster: c.label, color: c.color, r: 8, x: ax + Math.cos(ang) * rad, y: ay + Math.sin(ang) * rad, clusters: [c.id], ci, anchor: c.anchor, phase: R() * TAU, amp: 1.6 });
      link(c.id, id, 'member', c.color, (R() - 0.5) * 0.35);
    });

    for (let k = 0; k < c.dust; k++) {
      const ang = R() * TAU;
      const rad = 70 + Math.pow(R(), 0.75) * 270;
      const id = `${c.id}~${k}`;
      add({ id, kind: 'dust', color: c.color, r: 1.1 + Math.pow(R(), 2) * 3.2, x: ax + Math.cos(ang) * rad, y: ay + Math.sin(ang) * rad, clusters: [c.id], ci, anchor: c.anchor, phase: R() * TAU, amp: 1.5 + R() * 4.5, alpha: 0.35 + R() * 0.6 });
      const target = R() < 0.22 ? c.id : `${c.id}:${Math.floor(R() * m)}`;
      link(target, id, 'dust', c.color, (R() - 0.5) * 0.5, 40 + R() * 120);
    }
  });

  CONSTELLATION.shared.forEach(([label, cl, at], si) => {
    const anchors = cl.map((id) => byId[id].home);
    // explicit anchor if given, else between the clusters that use the skill
    const mx = at ? at[0] : (anchors.reduce((a, p) => a + p[0], 0) / anchors.length) * 0.72;
    const my = at ? at[1] : (anchors.reduce((a, p) => a + p[1], 0) / anchors.length) * 0.72;
    const id = `s:${si}`;
    add({ id, kind: 'shared', label, desc: `Used in ${cl.map((c) => byId[c].label).join(', ')}`, color: '#C9D1DA', r: 9, x: mx + (R() - 0.5) * 40, y: my + (R() - 0.5) * 40, clusters: cl, anchor: [mx, my], phase: R() * TAU, amp: 2.2 });
    cl.forEach((c) => link(c, id, 'shared', colorOf[c], (R() < 0.5 ? -1 : 1) * (0.18 + R() * 0.16), 230));
  });

  // long sweeping arcs between clusters (pure atmosphere — no physics)
  const dustBy = {};
  nodes.filter((n) => n.kind === 'dust').forEach((n) => (dustBy[n.clusters[0]] ||= []).push(n));
  const cids = Object.keys(dustBy);
  const arcs = [];
  for (let i = 0; i < CONSTELLATION.arcs; i++) {
    const a = cids[Math.floor(R() * cids.length)];
    let b = cids[Math.floor(R() * cids.length)];
    if (b === a) b = cids[(cids.indexOf(a) + 1) % cids.length];
    const na = dustBy[a][Math.floor(R() * dustBy[a].length)];
    const nb = dustBy[b][Math.floor(R() * dustBy[b].length)];
    arcs.push({ source: na.id, target: nb.id, kind: 'arc', color: colorOf[a], color2: colorOf[b], curve: (R() < 0.5 ? -1 : 1) * (0.28 + R() * 0.2) });
  }

  const DIST = { spine: 0, member: 178, shared: 230 };
  const STRENGTH = { spine: 0, member: 0.55, shared: 0.06, dust: 0.22 };
  const CHARGE = { me: -900, hub: -600, member: -160, shared: -220, dust: -9 };
  const sim = forceSimulation(nodes)
    .force(
      'link',
      forceLink(edges)
        .id((d) => d.id)
        .distance((e) => e.dist || DIST[e.kind] || 100)
        .strength((e) => STRENGTH[e.kind] ?? 0.2)
    )
    .force('charge', forceManyBody().strength((d) => CHARGE[d.kind]).distanceMax(520))
    .force(
      'collide',
      forceCollide((d) => (d.kind === 'dust' ? d.r + 2.5 : d.kind === 'member' ? 50 : d.kind === 'shared' ? 52 : d.kind === 'hub' ? 74 : 170)).strength(0.85)
    )
    .force('x', forceX((d) => (d.anchor ? d.anchor[0] : 0)).strength((d) => (d.kind === 'dust' ? 0.03 : d.kind === 'member' ? 0.05 : d.kind === 'shared' ? 0.16 : 0)))
    .force('y', forceY((d) => (d.anchor ? d.anchor[1] : 0)).strength((d) => (d.kind === 'dust' ? 0.03 : d.kind === 'member' ? 0.05 : d.kind === 'shared' ? 0.16 : 0)))
    .stop();
  for (let i = 0; i < 420; i++) sim.tick();
  sim.alpha(0);

  arcs.forEach((a) => {
    a.source = byId[a.source];
    a.target = byId[a.target];
  });

  // reveal delays: members/dust bloom outward from their hub, cluster by cluster
  nodes.forEach((n) => {
    if (n.kind === 'member' || n.kind === 'dust') {
      const hub = byId[n.clusters[0]];
      const d = Math.hypot(n.x - hub.x, n.y - hub.y);
      n.delay = Math.min(1, n.ci * 0.09 + (d / 360) * 0.45 + R() * 0.12);
    } else if (n.kind === 'shared') {
      n.delay = R();
    }
  });

  // neighbourhoods for hover highlighting
  const neighbors = {};
  nodes.forEach((n) => (neighbors[n.id] = new Set([n.id])));
  edges.forEach((e) => {
    neighbors[e.source.id].add(e.target.id);
    neighbors[e.target.id].add(e.source.id);
  });

  // camera targets: centroid of each cluster's hub + members
  const clusters = CONSTELLATION.clusters.map((c) => {
    const own = nodes.filter((n) => n.clusters[0] === c.id && n.kind !== 'shared');
    const pts = own.filter((n) => n.kind !== 'dust');
    const cx = pts.reduce((a, n) => a + n.x, 0) / pts.length;
    const cy = pts.reduce((a, n) => a + n.y, 0) / pts.length;
    const radius = Math.max(...own.map((n) => Math.hypot(n.x - cx, n.y - cy)));
    return { id: c.id, color: c.color, hub: byId[c.id], centroid: [cx, cy], radius, hullNodes: pts };
  });

  // particles ride the structural edges
  const particles = [];
  edges.forEach((e) => {
    const n = e.kind === 'spine' ? 3 : e.kind === 'member' ? (R() < 0.7 ? 1 : 0) : e.kind === 'shared' ? 1 : 0;
    for (let i = 0; i < n; i++) particles.push({ edge: e, t: R(), speed: e.kind === 'spine' ? 0.18 + R() * 0.12 : 0.22 + R() * 0.3, dir: R() < 0.5 ? 1 : -1 });
  });

  return { nodes, edges, arcs, byId, neighbors, clusters, particles, sim };
}
