# Shivansh Sharma — Portfolio

Personal portfolio of a backend & AI systems engineer, built as a graph: every project, skill and milestone is a node, and every project opens into its real system design.

## What's inside

- **3D hero** — a three.js network that the camera dives into on scroll.
- **Constellation** — a full-screen, force-directed graph (d3-force on canvas) that assembles as you scroll, flies through each project cluster, and stays interactive (hover to trace connections, drag nodes, click to open a project).
- **Systems, drawn to scale** — Alfred, DocIntel and Hex architectures that build step by step while you scroll.
- **Internship** — the production work shipped at Cognisphere, with animated system diagrams.
- **Experience, skills, contact** — timeline, project-linked skills and links.

## Stack

Next.js 15 · React 19 · Tailwind CSS · GSAP ScrollTrigger + Lenis · three.js / @react-three/fiber · d3-force

## Run it

```bash
npm install
npm run dev   # http://localhost:3100
```

## Editing content

All copy, metrics, project architectures and graph data live in [`lib/data.js`](lib/data.js) — the scroll diagrams and the constellation both render from it.
