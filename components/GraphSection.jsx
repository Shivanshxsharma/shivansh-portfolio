'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { CONSTELLATION, PROFILE, constellationCounts } from '@/lib/data';
import { buildConstellation } from '@/lib/constellation';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const bez = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

// Andrew's monotone chain
function convexHull(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

const COUNTS = constellationCounts();
const CAPS = CONSTELLATION.captions;
const LEGEND = [...CONSTELLATION.clusters.map((c) => [c.label, c.color]), ['Shared stack', '#C9D1DA']];

export default function GraphSection() {
  const root = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const [tip, setTip] = useState(null);

  // world state the scroll timeline animates and the render loop reads
  const S = useRef({
    enter: 0,
    hubs: 0,
    bloom: 0,
    bridges: 0,
    nebula: 0,
    particles: 0,
    cam: { x: 0, y: 0, zoom: 2.9, ox: 0.5 },
    focus: { alfred: 0, docintel: 0, hex: 0 },
  }).current;

  const graph = useMemo(() => (typeof window === 'undefined' ? null : buildConstellation()), []);

  // ---------- render loop + interaction ----------
  useEffect(() => {
    if (!graph) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = prefersReducedMotion();
    const { nodes, edges, arcs, byId, neighbors, clusters, particles, sim } = graph;
    const photo = new Image();
    photo.src = PROFILE.photo.avatar;

    const css = getComputedStyle(document.documentElement);
    const SANS = css.getPropertyValue('--font-sans') || 'system-ui, sans-serif';
    const MONO = css.getPropertyValue('--font-mono') || 'ui-monospace, monospace';

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // camera helpers
    let z = 1;
    let ax = 0;
    let ay = 0;
    let camY = 0;
    const camera = () => {
      const wide = W >= 1024;
      const base = Math.min((wide ? W * 0.72 : W * 1.12) / 1750, (H * 0.98) / 1400);
      z = S.cam.zoom * base;
      ax = W * (wide ? S.cam.ox : 0.5);
      ay = H * (wide ? 0.5 : 0.42);
      // while the section rises out of the hero, the core rides near its top edge, then glides to centre
      camY = S.cam.y + (1 - S.enter) * ((ay - 110) / z);
    };
    const toWorld = (px, py) => [(px - ax) / z + S.cam.x, (py - ay) / z + camY];

    // hover / drag state
    let hoverId = null;
    let hoodId = null;
    let hoverAmt = 0;
    let drag = null;
    let pointer = null;

    const pick = (px, py) => {
      let best = null;
      let bd = Infinity;
      for (const n of nodes) {
        if (n.kind === 'dust' || n.v < 0.5 || n.dim < 0.3) continue;
        const d = Math.hypot(n.sx - px, n.sy - py);
        const hit = Math.max(n.sr + 8, 14);
        if (d < hit && d < bd) {
          bd = d;
          best = n;
        }
      }
      return best;
    };

    const setHover = (n) => {
      const id = n ? n.id : null;
      if (id === hoverId) return;
      hoverId = id;
      if (id) hoodId = id;
      canvas.style.cursor = n ? (n.href ? 'pointer' : 'grab') : 'default';
      setTip(n ? { id: n.id, label: n.label, kind: n.kind, desc: n.desc, sub: n.sub, cluster: n.cluster, color: n.kind === 'shared' ? '#C9D1DA' : n.color, href: n.href } : null);
    };

    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };

    const onMove = (e) => {
      const [px, py] = local(e);
      pointer = [px, py];
      if (drag) {
        if (!drag.moved && Math.hypot(px - drag.x0, py - drag.y0) > 4) {
          drag.moved = true;
          canvas.style.cursor = 'grabbing';
          sim.alphaTarget(0.22).restart();
        }
        if (drag.moved) {
          const [wx, wy] = toWorld(px, py);
          drag.node.fx = wx;
          drag.node.fy = wy;
        }
        return;
      }
      setHover(pick(px, py));
    };
    const onLeave = () => {
      pointer = null;
      if (!drag) setHover(null);
    };
    const onDown = (e) => {
      const [px, py] = local(e);
      const n = pick(px, py);
      if (!n) return;
      if (e.pointerType !== 'mouse') {
        // touch: tap selects (shows the tooltip), tap again opens
        if (hoverId === n.id && n.href) {
          const el = document.querySelector(n.href);
          if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.6 });
          else el?.scrollIntoView({ behavior: 'smooth' });
        }
        setHover(n);
        return;
      }
      drag = { node: n, x0: px, y0: py, moved: false };
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = (e) => {
      if (!drag) return;
      const { node, moved } = drag;
      drag = null;
      canvas.releasePointerCapture?.(e.pointerId);
      if (!moved) {
        if (node.href) {
          const el = document.querySelector(node.href);
          if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.8 });
          else el?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
      sim.alphaTarget(0);
      if (node.home) {
        // fixed nodes spring back to their anchor
        gsap.to(node, { fx: node.home[0], fy: node.home[1], duration: 1.2, ease: 'elastic.out(1, 0.45)', onUpdate: () => sim.alpha(Math.max(sim.alpha(), 0.08)).restart() });
      } else {
        node.fx = null;
        node.fy = null;
      }
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // ---------- draw ----------
    let raf = 0;
    let running = false;
    let last = performance.now();

    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = reduced ? 0 : now / 1000;
      camera();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#07080A';
      ctx.fillRect(0, 0, W, H);

      hoverAmt += ((hoverId ? 1 : 0) - hoverAmt) * 0.14;
      const hood = hoodId && hoverAmt > 0.002 ? neighbors[hoodId] : null;
      const F = S.focus;
      const fsum = F.alfred + F.docintel + F.hex;
      const pad = 120;

      // ----- node positions, visibility, dimming -----
      for (const n of nodes) {
        const bx = n.x + (n.amp ? Math.sin(t * 0.55 + n.phase) * n.amp : 0);
        const by = n.y + (n.amp ? Math.cos(t * 0.47 + n.phase * 1.3) * n.amp : 0);
        n.sx = (bx - S.cam.x) * z + ax;
        n.sy = (by - camY) * z + ay;
        let v;
        if (n.kind === 'me') v = 0.3 + 0.7 * S.enter;
        else if (n.kind === 'hub') v = clamp01((S.hubs - n.ci * 0.13 - 0.14) / 0.28);
        else if (n.kind === 'shared') v = clamp01((S.bridges - n.delay * 0.6) / 0.4);
        else v = clamp01((S.bloom - n.delay * 0.72) / 0.28);
        n.v = v;
        let own = 0;
        if (n.kind === 'me') own = fsum;
        else for (const c of n.clusters) own = Math.max(own, F[c] ?? 0);
        let dim = 1 - 0.8 * clamp01(fsum - own);
        if (hood && !hood.has(n.id)) dim *= 1 - 0.85 * hoverAmt;
        n.dim = dim;
        n.on = n.sx > -pad && n.sx < W + pad && n.sy > -pad && n.sy < H + pad;
      }

      ctx.globalCompositeOperation = 'source-over';

      // ----- cluster regions: smooth padded hull around hub + members -----
      if (S.nebula > 0.01) {
        for (const c of clusters) {
          const pts = c.hullNodes.filter((n) => n.v > 0.05).map((n) => [n.sx, n.sy]);
          if (pts.length < 3) continue;
          // minimum round footprint around the hub, so small clusters don't collapse into slivers
          const hub = c.hub;
          const rr = 95 * z;
          for (let k = 0; k < 10; k++) pts.push([hub.sx + Math.cos((k / 10) * Math.PI * 2) * rr, hub.sy + Math.sin((k / 10) * Math.PI * 2) * rr]);
          const own = F[c.id] ?? 0;
          let a = S.nebula * (1 - 0.75 * clamp01(fsum - own));
          if (hood && !hood.has(c.id)) a *= 1 - 0.6 * hoverAmt;
          if (a < 0.01) continue;
          const hull = convexHull(pts);
          const mx = hull.reduce((acc, p) => acc + p[0], 0) / hull.length;
          const my = hull.reduce((acc, p) => acc + p[1], 0) / hull.length;
          const padPx = Math.max(16, 58 * z);
          const ring = hull.map(([x, y]) => {
            const d = Math.hypot(x - mx, y - my) || 1;
            return [x + ((x - mx) / d) * padPx, y + ((y - my) / d) * padPx];
          });
          const mid = (i) => {
            const p0 = ring[i % ring.length];
            const p1 = ring[(i + 1) % ring.length];
            return [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
          };
          ctx.beginPath();
          const m0 = mid(0);
          ctx.moveTo(m0[0], m0[1]);
          for (let i = 1; i <= ring.length; i++) {
            const p = ring[i % ring.length];
            const m = mid(i);
            ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
          }
          ctx.closePath();
          ctx.globalAlpha = a * (0.04 + 0.025 * own);
          ctx.fillStyle = c.color;
          ctx.fill();
          ctx.globalAlpha = a * (0.22 + 0.2 * own);
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ----- arcs (fine hairlines between clusters) -----
      if (S.bridges > 0.01) {
        ctx.lineWidth = 0.75;
        for (const e of arcs) {
          const a = e.source;
          const b = e.target;
          if (!a.on && !b.on) continue;
          const alpha = 0.09 * S.bridges * Math.min(a.dim, b.dim);
          if (alpha < 0.004) continue;
          const dx = b.sx - a.sx;
          const dy = b.sy - a.sy;
          const cx = (a.sx + b.sx) / 2 - dy * e.curve;
          const cy = (a.sy + b.sy) / 2 + dx * e.curve;
          const g = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
          g.addColorStop(0, e.color);
          g.addColorStop(1, e.color2);
          ctx.strokeStyle = g;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          const p = S.bridges;
          if (p >= 1) ctx.quadraticCurveTo(cx, cy, b.sx, b.sy);
          else ctx.quadraticCurveTo(a.sx + (cx - a.sx) * p, a.sy + (cy - a.sy) * p, bez(a.sx, cx, b.sx, p), bez(a.sy, cy, b.sy, p));
          ctx.stroke();
        }
      }

      // ----- edges -----
      ctx.lineCap = 'round';
      for (const e of edges) {
        const a = e.source;
        const b = e.target;
        e.prog = 0;
        if (!a.on && !b.on) continue;
        let prog;
        let alpha;
        let width;
        if (e.kind === 'spine') {
          prog = clamp01((S.hubs - b.ci * 0.13) / 0.22);
          alpha = 0.85;
          width = 1.6;
        } else if (e.kind === 'member') {
          prog = b.v;
          alpha = 0.55;
          width = 1;
        } else if (e.kind === 'shared') {
          prog = b.v;
          alpha = 0.3;
          width = 0.9;
        } else {
          prog = b.v;
          alpha = 0.14;
          width = 0.6;
        }
        e.prog = prog;
        if (prog <= 0.001) continue;
        alpha *= Math.min(a.dim, b.dim);
        const lit = hood && hoverId && (a.id === hoverId || b.id === hoverId);
        if (lit) {
          alpha = Math.min(1, alpha + 0.5 * hoverAmt);
          width += 0.6 * hoverAmt;
        }
        if (alpha < 0.004) continue;
        const dx = b.sx - a.sx;
        const dy = b.sy - a.sy;
        const cx = (a.sx + b.sx) / 2 - dy * e.curve;
        const cy = (a.sy + b.sy) / 2 + dx * e.curve;
        e.cx = cx;
        e.cy = cy;
        if (e.kind === 'spine' || e.kind === 'shared') {
          const g = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
          g.addColorStop(0, e.kind === 'spine' ? '#C9D1DA' : e.color);
          g.addColorStop(1, e.kind === 'spine' ? e.color : '#8B939E');
          ctx.strokeStyle = g;
        } else ctx.strokeStyle = e.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        if (prog >= 1) ctx.quadraticCurveTo(cx, cy, b.sx, b.sy);
        else ctx.quadraticCurveTo(a.sx + (cx - a.sx) * prog, a.sy + (cy - a.sy) * prog, bez(a.sx, cx, b.sx, prog), bez(a.sy, cy, b.sy, prog));
        ctx.stroke();
      }

      // ----- particles: small solid packets -----
      if (S.particles > 0.01) {
        for (const p of particles) {
          const e = p.edge;
          if (!reduced) p.t = (p.t + dt * p.speed) % 1;
          if (e.prog < 1 || e.cx === undefined) continue;
          const a = e.source;
          const b = e.target;
          const tt = p.dir > 0 ? p.t : 1 - p.t;
          const fade = Math.min(1, Math.sin(Math.PI * tt) * 2.5);
          const alpha = S.particles * Math.min(a.dim, b.dim) * fade;
          if (alpha < 0.02) continue;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = e.kind === 'spine' ? '#D4FF3A' : e.color;
          ctx.beginPath();
          ctx.arc(bez(a.sx, e.cx, b.sx, tt), bez(a.sy, e.cy, b.sy, tt), e.kind === 'spine' ? 2.4 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ----- nodes -----
      const zr = Math.max(0.55, z);
      const VOID = '#07080A';
      // dust
      for (const n of nodes) {
        if (n.kind !== 'dust' || !n.on || n.v <= 0) continue;
        const a = n.alpha * n.v * n.dim * 0.85;
        if (a < 0.01) continue;
        const r = Math.max(0.7, n.r * zr * 0.75) * easeOutBack(n.v);
        ctx.globalAlpha = a;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
        ctx.fill();
        n.sr = r;
      }
      // members + shared
      for (const n of nodes) {
        if ((n.kind !== 'member' && n.kind !== 'shared') || !n.on || n.v <= 0) continue;
        const a = n.v * n.dim;
        const r = Math.max(3.4, n.r * zr * 1.05) * easeOutBack(n.v);
        n.sr = r;
        const hot = hoverId === n.id ? hoverAmt : 0;
        ctx.globalAlpha = a;
        // knockout keeps edges from touching the node
        ctx.fillStyle = VOID;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r + 2.5, 0, Math.PI * 2);
        ctx.fill();
        if (n.kind === 'shared') {
          ctx.strokeStyle = '#8B939E';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#C9D1DA';
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, Math.max(1.3, r * 0.32), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (hot > 0.01) {
          ctx.globalAlpha = a * hot;
          ctx.strokeStyle = n.kind === 'shared' ? '#C9D1DA' : n.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // hubs
      for (const n of nodes) {
        if (n.kind !== 'hub' || n.v <= 0) continue;
        const a = n.v * n.dim;
        const r = Math.max(9, n.r * z) * easeOutBack(n.v);
        n.sr = r;
        const hot = hoverId === n.id ? hoverAmt : 0;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#0D1014';
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        if (hot > 0.01) {
          ctx.globalAlpha = a * hot * 0.7;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, r + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // the core: you
      {
        const n = byId.me;
        const v = 0.3 + 0.7 * S.enter;
        const r = Math.max(20, n.r * z) * (0.5 + 0.5 * easeOutCubic(v));
        n.sr = r;
        const a = v * n.dim;
        ctx.globalAlpha = a;
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#171B21';
        ctx.fillRect(n.sx - r, n.sy - r, r * 2, r * 2);
        if (photo.complete && photo.naturalWidth) ctx.drawImage(photo, n.sx - r, n.sy - r, r * 2, r * 2);
        ctx.restore();
        ctx.strokeStyle = '#D4FF3A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = a * 0.28;
        ctx.strokeStyle = '#E9ECEF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ----- labels (dark outline keeps them legible over edges) -----
      ctx.globalCompositeOperation = 'source-over';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#07080A';
      const text = (str, x, y, halo = 4) => {
        ctx.lineWidth = halo;
        ctx.strokeText(str, x, y);
        ctx.fillText(str, x, y);
      };
      const zoomLabel = clamp01((z - 0.62) / 0.22);
      for (const n of nodes) {
        if (n.kind === 'dust' || !n.on || n.v < 0.05) continue;
        const inHood = hood && hood.has(n.id) ? hoverAmt : 0;
        if (n.kind === 'hub' || n.kind === 'me') {
          const a = n.v * n.dim;
          if (a < 0.02) continue;
          const y = n.sy + n.sr + (n.kind === 'me' ? 30 : 22);
          ctx.textAlign = 'center';
          ctx.globalAlpha = a;
          ctx.fillStyle = '#F4F6F8';
          ctx.font = `600 ${n.kind === 'me' ? 18 : 16}px ${SANS}`;
          text(n.label, n.sx, y, 5);
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = n.kind === 'me' ? '#D4FF3A' : '#8B939E';
          ctx.font = `500 10px ${MONO}`;
          ctx.letterSpacing = '1.5px';
          text(n.sub.toUpperCase(), n.sx, y + 18);
          ctx.letterSpacing = '0px';
        } else if (n.kind === 'member') {
          const own = F[n.clusters[0]] ?? 0;
          const a = n.v * n.dim * Math.max(zoomLabel, own, inHood);
          if (a < 0.02) continue;
          // labels radiate away from their hub
          const left = n.x < byId[n.clusters[0]].x;
          ctx.textAlign = left ? 'right' : 'left';
          ctx.globalAlpha = a;
          ctx.fillStyle = '#DDE2E7';
          ctx.font = `500 13px ${SANS}`;
          text(n.label, n.sx + (left ? -1 : 1) * (n.sr + 9), n.sy);
        } else if (n.kind === 'shared') {
          // small mono labels wait until the camera is close enough to read them
          const a = n.v * n.dim * 0.95 * Math.max(clamp01((z - 0.3) / 0.15), inHood);
          if (a < 0.02) continue;
          ctx.textAlign = 'center';
          ctx.globalAlpha = a;
          ctx.fillStyle = '#AEB6C0';
          ctx.font = `500 10.5px ${MONO}`;
          ctx.letterSpacing = '1.2px';
          text(n.label.toUpperCase(), n.sx, n.sy + n.sr + 15);
          ctx.letterSpacing = '0px';
        }
      }

      // inspector card fades with the hover
      if (tipRef.current) tipRef.current.style.opacity = hoodId ? hoverAmt.toFixed(3) : '0';

      if (running) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '200px' });
    io.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      sim.stop();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [graph, S]);

  // ---------- scroll choreography ----------
  useGSAP(
    () => {
      if (!graph) return;
      const q = gsap.utils.selector(root);
      const caps = q('[data-cap]');
      const ticks = q('[data-tick]');
      const cam = S.cam;
      const wide = window.innerWidth >= 1024;

      if (prefersReducedMotion()) {
        Object.assign(S, { enter: 1, hubs: 1, bloom: 1, bridges: 1, nebula: 1, particles: 0 });
        Object.assign(cam, { x: 0, y: 40, zoom: 1, ox: 0.6 });
        gsap.set(caps.slice(0, -1), { autoAlpha: 0 });
        gsap.set(ticks, { scaleX: 1 });
        return;
      }

      gsap.set(caps.slice(1), { autoAlpha: 0, y: 28 });
      gsap.set(q('[data-legend]'), { autoAlpha: 0, y: 12 });

      // 1. as the section rises out of the hero's dive, the core fades up
      gsap.to(S, { enter: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top top', scrub: true } });

      // 2. pinned story
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=560%', pin: true, scrub: 1.1, anticipatePin: 1 },
      });

      const swap = (i, at) => {
        tl.to(caps[i - 1], { autoAlpha: 0, y: -28, duration: 0.45, ease: 'power2.in' }, at);
        tl.to(caps[i], { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, at + 0.35);
        tl.to(ticks[i], { scaleX: 1, duration: 0.6 }, at);
      };

      tl.to(ticks[0], { scaleX: 1, duration: 0.6 }, 0);
      tl.to(cam, { zoom: 2.1, duration: 1.2, ease: 'power1.inOut' }, 0);

      // threads: five spines grow out of you
      swap(1, 1.1);
      tl.to(S, { hubs: 1, duration: 2.2, ease: 'power1.inOut' }, 1.2);
      tl.to(cam, { zoom: 1.18, ox: wide ? 0.6 : 0.5, y: 10, duration: 2.2 }, 1.2);

      // bloom: clusters, shared stack, atmosphere, traffic
      swap(2, 3.4);
      tl.to(S, { bloom: 1, duration: 2.6, ease: 'power1.inOut' }, 3.5);
      tl.to(S, { nebula: 1, duration: 2.2, ease: 'power1.out' }, 3.6);
      tl.to(S, { bridges: 1, duration: 2.0, ease: 'power1.inOut' }, 4.3);
      tl.to(S, { particles: 1, duration: 1.0 }, 5.3);
      tl.to(cam, { zoom: 1.0, y: 30, duration: 2.6 }, 3.5);
      tl.to(q('[data-legend]'), { autoAlpha: 1, y: 0, duration: 0.6 }, 5.4);

      // tour: fly through each system (zoom out → pan → zoom in)
      const tour = (id, prev, i, at) => {
        const c = graph.clusters.find((k) => k.id === id).centroid;
        swap(i, at);
        tl.to(cam, { x: c[0], y: c[1], ox: wide ? 0.66 : 0.5, duration: 1.7, ease: 'power3.inOut' }, at);
        tl.to(cam, { keyframes: [{ zoom: 0.86, duration: 0.65, ease: 'power2.out' }, { zoom: wide ? 1.95 : 2.3, duration: 1.05, ease: 'power2.inOut' }] }, at);
        tl.to(S.focus, { [id]: 1, ...(prev ? { [prev]: 0 } : {}), duration: 1.0, ease: 'power1.inOut' }, at + 0.35);
      };
      tl.to(q('[data-legend]'), { autoAlpha: 0, y: 12, duration: 0.5 }, 6.4);
      tour('alfred', null, 3, 6.4);
      tour('docintel', 'alfred', 4, 8.6);
      tour('hex', 'docintel', 5, 10.8);

      // overview: everything, live
      swap(6, 13.0);
      tl.to(q('[data-legend]'), { autoAlpha: 1, y: 0, duration: 0.6 }, 13.8);
      tl.to(cam, { x: 0, y: 30, ox: wide ? 0.62 : 0.5, duration: 1.8, ease: 'power3.inOut' }, 13.0);
      tl.to(cam, { keyframes: [{ zoom: 0.85, duration: 0.8, ease: 'power2.out' }, { zoom: 1.04, duration: 1.0, ease: 'power2.inOut' }] }, 13.0);
      tl.to(S.focus, { hex: 0, duration: 1.0 }, 13.2);
      tl.to({}, { duration: 1.0 }, 14.8);
    },
    { scope: root, dependencies: [graph] }
  );

  return (
    <section id="graph" ref={root} className="relative h-[100svh] overflow-hidden bg-void">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-pan-y" role="img" aria-label="Constellation graph: Shivansh at the centre, linked to Alfred, DocIntel, Hex, an internship and NSUT, each surrounded by the components and skills behind it." />

      {/* scrims keep captions legible over the graph */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[42%] bg-gradient-to-r from-void via-void/75 to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-void via-void/85 to-transparent lg:hidden" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-void to-transparent" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-24">
        <div className="frame flex justify-between text-faint">
          <span className="mono">§ 01 — How everything connects</span>
          <span className="mono hidden sm:block">
            {COUNTS.nodes} nodes · {COUNTS.edges} edges
          </span>
        </div>
      </div>

      {/* captions */}
      <div className="pointer-events-none absolute inset-0">
        <div className="frame flex h-full flex-col justify-end pb-10 lg:justify-center lg:pb-0">
          <div className="max-w-[22rem]">
            <div className="flex gap-1.5">
              {CAPS.map((c) => (
                <span key={c.k} className="relative h-[3px] w-7 overflow-hidden rounded-full bg-line md:w-9">
                  <span data-tick className="absolute inset-0 origin-left scale-x-0 rounded-full bg-signal" />
                </span>
              ))}
            </div>
            <div className="relative mt-6 h-[10.5rem] md:h-[12rem]">
              {CAPS.map((c) => (
                <div key={c.k} data-cap className="absolute inset-x-0 top-0">
                  <p className="mono" style={{ color: c.accent || '#D4FF3A' }}>
                    {c.k}
                  </p>
                  <h2 className="display mt-3 text-[clamp(2.4rem,4.6vw,4.2rem)]">{c.title}</h2>
                  <p className="mt-3 text-[15px] leading-[1.5] text-dim">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* legend */}
      <div data-legend className="pointer-events-none absolute bottom-8 right-0 hidden lg:block">
        <div className="frame">
          <ul className="flex flex-col items-end gap-2">
            {LEGEND.map(([label, color]) => (
              <li key={label} className="mono flex items-center gap-2.5 text-dim">
                {label}
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* tooltip */}
      <div ref={tipRef} className="pointer-events-none absolute left-4 top-36 w-[min(300px,calc(100%-2rem))] opacity-0 sm:left-6 lg:bottom-10 lg:left-10 lg:top-auto">
        {tip && (
          <div className="rounded-2xl border border-line bg-panel/90 p-4 backdrop-blur-md">
            <p className="mono flex items-center gap-2" style={{ color: tip.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tip.color }} />
              {tip.kind === 'me' ? 'Core' : tip.kind === 'hub' ? 'Thread' : tip.kind === 'shared' ? 'Shared stack' : tip.cluster}
            </p>
            <p className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-ink">{tip.label}</p>
            <p className="mt-1 text-[13px] leading-[1.5] text-dim">{tip.desc}</p>
            {tip.href && <p className="mono mt-3 text-signal">Click to open →</p>}
          </div>
        )}
      </div>

      <ul className="sr-only">
        {CONSTELLATION.clusters.map((c) => (
          <li key={c.id}>
            <a href={c.href}>
              {c.label} — {c.desc}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
