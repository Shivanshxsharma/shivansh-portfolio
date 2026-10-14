'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap, sceneState, prefersReducedMotion } from '@/lib/gsap';

// ---------- deterministic graph generation ----------
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HUBS = [
  { color: '#F4F6F8', size: 30 }, // me (center)
  { color: '#9D7BFF', size: 22 }, // alfred
  { color: '#3FD8F2', size: 22 }, // docintel
  { color: '#FF8A5C', size: 22 }, // hex
  { color: '#D4FF3A', size: 20 }, // internship
];

function buildGraph(count = 120) {
  const rand = rng(7);
  const pos = [];
  // center node
  pos.push(new THREE.Vector3(0, 0, 0));
  // hubs on an inner ring
  const hubDirs = [
    [-1.5, 0.9, 0.6],
    [-1.2, -1.1, -0.5],
    [1.5, -0.9, 0.4],
    [1.3, 1.0, -0.6],
  ];
  hubDirs.forEach((d) => pos.push(new THREE.Vector3(...d)));
  // outer shell — fibonacci sphere with jitter, slightly flattened
  const n = count - pos.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const radius = 2.4 + rand() * 1.5;
    pos.push(
      new THREE.Vector3(
        Math.cos(th) * r * radius + (rand() - 0.5) * 0.5,
        y * radius * 0.72 + (rand() - 0.5) * 0.5,
        Math.sin(th) * r * radius + (rand() - 0.5) * 0.5
      )
    );
  }

  // edges: k-nearest neighbours + center→hubs
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const seen = new Set();
  const edges = [];
  const add = (a, b) => {
    const k = key(a, b);
    if (a === b || seen.has(k)) return;
    seen.add(k);
    edges.push([a, b]);
  };
  for (let h = 1; h < HUBS.length; h++) add(0, h);
  for (let i = 1; i < pos.length; i++) {
    const near = pos
      .map((p, j) => [j, p.distanceToSquared(pos[i])])
      .filter(([j]) => j !== i && j !== 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, i < HUBS.length ? 6 : 2);
    near.forEach(([j]) => add(i, j));
  }

  const adjacency = pos.map(() => []);
  edges.forEach(([a, b], ei) => {
    adjacency[a].push(ei);
    adjacency[b].push(ei);
  });

  // color each node by its nearest hub (subtle tint) — hubs keep their own color
  const base = new THREE.Color('#7E8896');
  const colors = pos.map((p, i) => {
    if (i < HUBS.length) return new THREE.Color(HUBS[i].color);
    let best = 1;
    let bd = Infinity;
    for (let h = 1; h < HUBS.length; h++) {
      const d = p.distanceTo(pos[h]);
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return base.clone().lerp(new THREE.Color(HUBS[best].color), Math.max(0, 0.55 - bd * 0.12));
  });
  const sizes = pos.map((_, i) => (i < HUBS.length ? HUBS[i].size : 5 + rand() * 6));
  const phases = pos.map(() => rand() * Math.PI * 2);

  return { pos, edges, adjacency, colors, sizes, phases, rand };
}

// ---------- shaders ----------
const pointVert = /* glsl */ `
  attribute float size;
  attribute float phase;
  attribute vec3 color;
  uniform float uTime;
  uniform float uReveal;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRing;
  void main() {
    vColor = color;
    vRing = step(15.0, size);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float r = length(position);
    float reveal = smoothstep(r - 0.6, r, uReveal * 5.5);
    gl_PointSize = size * reveal * uPixelRatio * (5.2 / -mv.z);
    vAlpha = reveal * clamp(1.4 - (-mv.z - 4.0) * 0.08, 0.25, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const pointFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRing;
  void main() {
    // crisp, anti-aliased shapes: small nodes are discs, hubs are a ring + centre dot
    float d = length(gl_PointCoord - 0.5);
    float aa = fwidth(d) * 1.2;
    float disc = 1.0 - smoothstep(0.5 - aa, 0.5, d);
    float ring = disc * smoothstep(0.40 - aa, 0.40, d);
    float centre = 1.0 - smoothstep(0.2 - aa, 0.2, d);
    float a = mix(disc, max(ring, centre), vRing);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

function makePointMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: pointVert,
    fragmentShader: pointFrag,
    transparent: true,
    depthWrite: false,
  });
}

// ---------- scene ----------
function Network() {
  const group = useRef();
  const { camera, gl, size } = useThree();
  const graph = useMemo(() => buildGraph(130), []);

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(graph.pos.flatMap((p) => [p.x, p.y, p.z]), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(graph.colors.flatMap((c) => [c.r, c.g, c.b]), 3));
    g.setAttribute('size', new THREE.Float32BufferAttribute(graph.sizes, 1));
    g.setAttribute('phase', new THREE.Float32BufferAttribute(graph.phases, 1));
    return g;
  }, [graph]);

  const edgeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = [];
    const c = [];
    graph.edges.forEach(([a, b]) => {
      const A = graph.pos[a];
      const B = graph.pos[b];
      p.push(A.x, A.y, A.z, B.x, B.y, B.z);
      const ca = graph.colors[a];
      const cb = graph.colors[b];
      c.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
    });
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    return g;
  }, [graph]);

  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );
  const nodeMat = useMemo(makePointMaterial, []);
  const packetMat = useMemo(makePointMaterial, []);

  // packets travelling along edges
  const PACKETS = 70;
  const packets = useMemo(() => {
    const r = graph.rand;
    return Array.from({ length: PACKETS }, () => {
      const e = Math.floor(r() * graph.edges.length);
      return { e, dir: r() > 0.5 ? 1 : -1, t: r(), speed: 0.25 + r() * 0.55 };
    });
  }, [graph]);

  const packetGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(PACKETS * 3), 3));
    const signal = new THREE.Color('#D4FF3A');
    const white = new THREE.Color('#FFFFFF');
    const cols = [];
    packets.forEach((_, i) => {
      const c = i % 3 === 0 ? white : signal;
      cols.push(c.r, c.g, c.b);
    });
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.setAttribute('size', new THREE.Float32BufferAttribute(packets.map((_, i) => (i % 3 === 0 ? 5 : 7)), 1));
    g.setAttribute('phase', new THREE.Float32BufferAttribute(packets.map(() => 0), 1));
    return g;
  }, [packets]);

  useEffect(() => {
    const pr = gl.getPixelRatio();
    nodeMat.uniforms.uPixelRatio.value = pr;
    packetMat.uniforms.uPixelRatio.value = pr;
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to([nodeMat.uniforms.uReveal, packetMat.uniforms.uReveal], { value: 1, duration: reduced ? 0 : 2.6, ease: 'power3.out' });
    tl.to(edgeMat, { opacity: 0.3, duration: reduced ? 0 : 2, ease: 'power2.out' }, 0.4);
    return () => tl.kill();
  }, [gl, nodeMat, packetMat, edgeMat]);

  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const smooth = useRef({ x: 0, y: 0, p: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    nodeMat.uniforms.uTime.value = t;

    // packets
    const arr = packetGeo.attributes.position.array;
    packets.forEach((pk, i) => {
      pk.t += pk.speed * dt * 0.9;
      if (pk.t >= 1) {
        const [a, b] = graph.edges[pk.e];
        const end = pk.dir === 1 ? b : a;
        const next = graph.adjacency[end];
        pk.e = next[Math.floor(Math.random() * next.length)];
        pk.dir = graph.edges[pk.e][0] === end ? 1 : -1;
        pk.t = 0;
      }
      const [a, b] = graph.edges[pk.e];
      const from = graph.pos[pk.dir === 1 ? a : b];
      const to = graph.pos[pk.dir === 1 ? b : a];
      tmpA.copy(from).lerp(to, pk.t);
      arr[i * 3] = tmpA.x;
      arr[i * 3 + 1] = tmpA.y;
      arr[i * 3 + 2] = tmpA.z;
    });
    packetGeo.attributes.position.needsUpdate = true;

    // pointer + scroll easing
    const s = smooth.current;
    s.x += (sceneState.pointerX - s.x) * 0.05;
    s.y += (sceneState.pointerY - s.y) * 0.05;
    s.p += (sceneState.heroProgress - s.p) * 0.12;

    const wide = size.width > 900;
    const g = group.current;
    g.rotation.y += dt * 0.06;
    g.rotation.x = s.y * 0.25 + s.p * 0.5;
    g.rotation.z = s.x * -0.08;
    g.position.x = (wide ? 1.9 : 0) * (1 - s.p);
    g.position.y = wide ? 0 : 0.9 * (1 - s.p);

    const ease = s.p * s.p * (3 - 2 * s.p);
    camera.position.z = (wide ? 9.5 : 12) - ease * (wide ? 7.4 : 9.6);
    camera.position.x = s.x * 0.35;
    camera.position.y = -s.y * 0.25;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <lineSegments geometry={edgeGeo} material={edgeMat} />
      <points geometry={nodeGeo} material={nodeMat} />
      <points geometry={packetGeo} material={packetMat} />
    </group>
  );
}

export default function NetworkScene({ active = true }) {
  useEffect(() => {
    const onMove = (e) => {
      sceneState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 9.5], fov: 45, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Network />
    </Canvas>
  );
}
