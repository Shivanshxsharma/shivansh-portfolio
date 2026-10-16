// Single source of truth for the portfolio.
// Anything marked TODO is a placeholder waiting for real details.

export const PROFILE = {
  name: 'Shivansh Sharma',
  first: 'Shivansh',
  last: 'Sharma',
  role: 'Backend & AI systems engineer',
  tagline:
    'I build agent harnesses, retrieval pipelines and the backend plumbing between them — systems that stay correct when the demo ends.',
  status: 'Open to opportunities',
  now: 'Full-stack intern @ Cognisphere · NSUT ’27',
  location: 'Delhi, India',
  photo: { avatar: '/me/avatar.jpg', portrait: '/me/portrait.jpg' },
  links: {
    github: 'https://github.com/Shivanshxsharma',
    alfred: 'https://alfred-khaki.vercel.app',
    email: 'mailto:shivansh.work93@gmail.com',
    linkedin: 'https://www.linkedin.com/in/shivansh-sharma-a72283283/',
    resume: '#', // TODO: resume PDF
  },
};

export const ROLES = ['Backend engineering', 'Agent harnesses', 'Retrieval systems', 'System design', 'LLM orchestration'];

// ---------- Project systems: node layouts drive the scroll diagrams ----------
// Coordinates are node centers in each diagram's own viewBox.

export const PROJECTS = [
  {
    id: 'alfred',
    index: '01',
    name: 'Alfred',
    kind: 'Personal AI agent',
    color: '#9D7BFF',
    summary:
      'A solo-built, deployed agent with per-request model routing, web-grounded search, a two-layer RAG pipeline and an LLM-wiki memory that decays what it stops using.',
    metrics: [
      { value: 50, suffix: '%', label: 'lower memory retrieval latency' },
      { value: 30, suffix: '%', label: 'higher retrieval accuracy' },
      { value: 5, suffix: '', label: 'LLM providers, routed per request' },
    ],
    stack: ['FastAPI', 'LangGraph', 'Pinecone', 'MongoDB', 'Postgres', 'Next.js', 'SSE', 'JWT + OAuth'],
    links: [
      { label: 'Live app', href: 'https://alfred-khaki.vercel.app' },
      { label: 'GitHub', href: 'https://github.com/Shivanshxsharma/ALFRED' },
    ],
    viewBox: [640, 470],
    nodes: [
      { id: 'client', label: 'Next.js client', sub: 'Zustand · streaming UI', x: 320, y: 40 },
      { id: 'api', label: 'FastAPI', sub: 'SSE StreamingResponse', x: 320, y: 130 },
      { id: 'graph', label: 'LangGraph agent', sub: 'compiled state machine', x: 320, y: 220, core: true },
      { id: 'router', label: 'Model router', sub: '5 providers · per call', x: 105, y: 220 },
      { id: 'search', label: 'Web search', sub: 'Tavily', x: 535, y: 220 },
      { id: 'pg', label: 'Postgres', sub: 'encrypted keys', x: 105, y: 320 },
      { id: 'rag', label: 'Two-layer RAG', sub: 'structure-aware', x: 320, y: 320 },
      { id: 'memory', label: 'LLM-wiki memory', sub: 'relevancy decay', x: 535, y: 320 },
      { id: 'pinecone', label: 'Pinecone', sub: 'Gemini embeddings', x: 215, y: 420 },
      { id: 'mongo', label: 'MongoDB', sub: 'threads · wiki · ckpt', x: 430, y: 420 },
    ],
    edges: [
      ['client', 'api'],
      ['api', 'graph'],
      ['graph', 'router'],
      ['router', 'pg'],
      ['graph', 'search'],
      ['graph', 'rag'],
      ['graph', 'memory'],
      ['rag', 'pinecone'],
      ['memory', 'mongo'],
    ],
    steps: [
      { nodes: ['client', 'api'], title: 'Stream', note: 'The Next.js client streams tokens from a FastAPI SSE endpoint — first token on screen while the agent keeps thinking.' },
      { nodes: ['graph'], title: 'Orchestrate', note: 'A LangGraph state machine, compiled once at startup, drives every turn. Its shape never changes at runtime.' },
      { nodes: ['router', 'pg'], title: 'Route', note: 'Each request resolves its own model and provider. Keys are decrypted from Postgres behind a TTL cache — never stored in graph state.' },
      { nodes: ['rag', 'pinecone'], title: 'Retrieve', note: 'Two-layer, structure-aware RAG: MarkItDown → Gemini embeddings → Pinecone. +30% retrieval accuracy.' },
      { nodes: ['search'], title: 'Ground', note: 'When the answer lives on the web, Tavily search grounds the response with fresh sources.' },
      { nodes: ['memory', 'mongo'], title: 'Remember', note: 'An LLM-wiki long-term memory scored by relevancy and recency — 50% lower memory retrieval latency.' },
    ],
  },
  {
    id: 'docintel',
    index: '02',
    name: 'DocIntel',
    kind: 'Hybrid RAG pipeline',
    color: '#3FD8F2',
    summary:
      'Accuracy-first RAG for research papers, with answers cited to the page. Benchmarked against a standard RAG pipeline on QASPER — 45 arXiv papers, 136 expert-annotated questions.',
    metrics: [
      { value: 63, suffix: '%', label: 'fewer retrieval misses than standard RAG' },
      { value: 30, prefix: '+', suffix: '%', label: 'MRR@5' },
      { value: 45, prefix: '+', suffix: '%', label: 'nDCG@5' },
    ],
    stack: ['FastAPI', 'Docling', 'Pinecone', 'Cohere Rerank', 'Gemini', 'RRF', 'QASPER eval'],
    links: [{ label: 'GitHub', href: 'https://github.com/Shivanshxsharma/DocIntel' }],
    viewBox: [640, 620],
    nodes: [
      { id: 'upload', label: 'PDF upload', sub: 'FastAPI', x: 320, y: 40 },
      { id: 'parse', label: 'Docling parse', sub: 'layout + reading order', x: 320, y: 130 },
      { id: 'chunk', label: 'Hybrid chunker', sub: '≤512 tok · heading path', x: 320, y: 220, core: true },
      { id: 'dense', label: 'Dense index', sub: 'semantic embeddings', x: 165, y: 320 },
      { id: 'sparse', label: 'Sparse index', sub: 'learned sparse', x: 475, y: 320 },
      { id: 'rrf', label: 'Weighted RRF', sub: '0.7 dense · 0.3 sparse', x: 320, y: 410, core: true },
      { id: 'rerank', label: 'Cross-encoder', sub: 'Cohere · top 30 → 5', x: 320, y: 495 },
      { id: 'llm', label: 'Gemini Flash', sub: 'JSON + citations', x: 320, y: 580 },
    ],
    edges: [
      ['upload', 'parse'],
      ['parse', 'chunk'],
      ['chunk', 'dense'],
      ['chunk', 'sparse'],
      ['dense', 'rrf'],
      ['sparse', 'rrf'],
      ['rrf', 'rerank'],
      ['rerank', 'llm'],
    ],
    steps: [
      { nodes: ['upload', 'parse'], title: 'Parse', note: 'Docling rebuilds layout and reading order, so two-column papers, headings and tables survive the trip from PDF to text.' },
      { nodes: ['chunk'], title: 'Chunk', note: 'Structure-aware chunking keeps each paragraph whole and tags it with its heading path. Evidence kept intact in one chunk: 62.5% → 94.7%.' },
      { nodes: ['dense', 'sparse'], title: 'Index twice', note: 'Every chunk goes to a dense index for meaning and a learned-sparse index for exact terms.' },
      { nodes: ['rrf'], title: 'Fuse', note: 'Top 30 from each index merged with weighted Reciprocal Rank Fusion — it works on ranks, so incompatible score scales stop mattering.' },
      { nodes: ['rerank'], title: 'Rerank', note: 'A cross-encoder reorders and keeps the best 5 — evidence in the top 5 rises to 90.4% (from 74.3% for standard RAG). Falls back to the fused order if the reranker is down.' },
      { nodes: ['llm'], title: 'Answer', note: 'Structured JSON out: answer, page-level citations, insights and follow-up questions.' },
    ],
  },
  {
    id: 'hex',
    index: '03',
    name: 'Hex',
    kind: 'Real-time AI chat',
    color: '#FF8A5C',
    summary:
      'A real-time chat app with seven AI personas on the Gemini API. Socket.IO for the transport, token streaming for the feel, MongoDB for the memory of every conversation.',
    metrics: [
      { value: 40, suffix: '%', label: 'lower perceived response latency' },
      { value: 7, suffix: '', label: 'distinct AI personas' },
      { value: 1, suffix: '', label: 'persistent socket per session' },
    ],
    stack: ['Node.js', 'Socket.IO', 'React', 'Gemini API', 'MongoDB', 'JWT'],
    links: [{ label: 'GitHub', href: 'https://github.com/Shivanshxsharma/Hex-AI' }],
    viewBox: [640, 370],
    nodes: [
      { id: 'client', label: 'React client', sub: 'JWT auth', x: 320, y: 40 },
      { id: 'socket', label: 'Socket.IO', sub: 'bi-directional', x: 320, y: 130 },
      { id: 'server', label: 'Node.js server', sub: 'sessions + routing', x: 320, y: 220, core: true },
      { id: 'persona', label: 'Persona engine', sub: '7 personalities', x: 105, y: 220 },
      { id: 'llm', label: 'Gemini stream', sub: 'token by token', x: 535, y: 220 },
      { id: 'mongo', label: 'MongoDB', sub: 'chats + users', x: 320, y: 320 },
    ],
    edges: [
      ['client', 'socket'],
      ['socket', 'server'],
      ['server', 'persona'],
      ['server', 'llm'],
      ['server', 'mongo'],
    ],
    steps: [
      { nodes: ['client', 'socket'], title: 'Connect', note: 'A React client, authenticated with JWT, opens one Socket.IO connection per session.' },
      { nodes: ['server'], title: 'Route', note: 'The Node.js server owns sessions and routes each message to the right persona.' },
      { nodes: ['persona'], title: 'Persona', note: 'Seven personas, each with its own voice and behaviour.' },
      { nodes: ['llm'], title: 'Stream', note: 'Replies stream token by token over the socket — 40% lower perceived latency.' },
      { nodes: ['mongo'], title: 'Persist', note: 'Every conversation lands in MongoDB, so a chat survives a refresh.' },
    ],
  },
];

// ---------- The constellation (pinned scroll graph) ----------
// Clusters are laid out by a d3-force simulation around their anchors (world units, "me" at 0,0).
// `members` are real components; `dust` is a decorative particle cloud that gives each cluster mass.

export const CONSTELLATION = {
  clusters: [
    {
      id: 'alfred',
      label: 'Alfred',
      sub: 'AI agent',
      color: '#9D7BFF',
      anchor: [-640, -280],
      href: '#alfred',
      dust: 90,
      desc: 'Personal AI agent: per-request model routing, two-layer RAG and a memory that decays what it stops using.',
      members: [
        ['LangGraph', 'State machine, compiled once at startup'],
        ['Model router', 'Five providers, resolved per request'],
        ['Two-layer RAG', 'Structure-aware retrieval · +30% accuracy'],
        ['LLM-wiki memory', 'Relevancy decay · 50% lower retrieval latency'],
        ['Web search', 'Tavily-grounded answers'],
        ['SSE streaming', 'FastAPI StreamingResponse'],
        ['Encrypted keys', 'Postgres behind a TTL cache'],
        ['Rich chat', 'Mermaid, Chart.js and vision in the chat'],
      ],
    },
    {
      id: 'docintel',
      label: 'DocIntel',
      sub: 'Hybrid RAG',
      color: '#3FD8F2',
      anchor: [-600, 330],
      href: '#docintel',
      dust: 80,
      desc: 'Document Q&A that favours correct citations: dense + sparse retrieval, fused and reranked.',
      members: [
        ['Docling', 'Layout and reading order survive parsing'],
        ['Hybrid chunker', '≤512 tokens · keeps the heading path'],
        ['Dense index', 'Gemini 3072-d embeddings'],
        ['Sparse index', 'Learned sparse keywords'],
        ['Weighted RRF', '0.7 dense · 0.3 sparse, on ranks'],
        ['Cross-encoder', 'Cohere rerank · top 30 → 5'],
        ['Cited answers', 'Structured JSON with page citations'],
        ['QASPER benchmark', '63% fewer retrieval misses than standard RAG'],
        ['HPC deploy', 'Evaluated on client infrastructure'],
      ],
    },
    {
      id: 'hex',
      label: 'Hex',
      sub: 'Real-time chat',
      color: '#FF8A5C',
      anchor: [640, 300],
      href: '#hex',
      dust: 60,
      desc: 'Real-time AI chat: one socket per session, seven personas, streamed tokens.',
      members: [
        ['Socket.IO', 'One bi-directional socket per session'],
        ['7 personas', 'Distinct voices and behaviour'],
        ['Token streaming', '40% lower perceived latency'],
        ['JWT auth', 'Token-based sign-in'],
        ['Chat history', 'Every conversation persisted'],
      ],
    },
    {
      id: 'intern',
      label: 'Cognisphere',
      sub: 'Full-stack intern',
      color: '#D4FF3A',
      anchor: [600, -320],
      href: '#experience',
      dust: 36,
      desc: 'Full Stack Engineering Intern at Cognisphere Global Limited (remote, UK): a production blog platform and a social analytics dashboard.',
      members: [
        ['Blog platform', 'FastAPI · grew to 5,500 daily readers'],
        ['JWT rotation', 'Refresh-token rotation on every refresh'],
        ['Response caching', 'Cached responses + SEO optimisations'],
        ['Insights dashboard', '5+ social platforms in one role-based view'],
      ],
    },
    {
      id: 'nsut',
      label: 'NSUT',
      sub: 'B.Tech ’27',
      color: '#F5C35C',
      anchor: [20, 620],
      href: '#experience',
      dust: 34,
      desc: 'B.Tech, Netaji Subhas University of Technology — class of 2027.',
      members: [
        ['B.Tech', 'Netaji Subhas University of Technology'],
        ['CS fundamentals', 'DSA, OOP, DBMS, computer networks'],
      ],
    },
  ],
  // skills shared across clusters — they settle between the clusters that use them
  // [label, clusters, anchor] — anchors keep the bridges out of the core's way
  shared: [
    ['FastAPI', ['alfred', 'docintel'], [-430, 40]],
    ['Pinecone', ['alfred', 'docintel'], [-330, 120]],
    ['Gemini', ['alfred', 'docintel'], [-330, -50]],
    ['Retrieval', ['alfred', 'docintel'], [-240, 30]],
    ['Python', ['alfred', 'docintel', 'intern'], [-120, -330]],
    ['MongoDB', ['alfred', 'hex'], [110, -360]],
    ['React', ['alfred', 'hex'], [10, -440]],
    ['Streaming', ['alfred', 'hex'], [250, -230]],
    ['Node.js', ['hex'], [400, 170]],
    ['System design', ['alfred', 'intern', 'nsut'], [330, -40]],
    ['JWT auth', ['alfred', 'hex', 'intern'], [470, -120]],
  ],
  arcs: 46,
  captions: [
    { k: '01', title: 'One engineer.', body: 'Every node here is something I built, studied or shipped. It all starts at the centre.' },
    { k: '02', title: 'Five threads.', body: 'Three production-shaped systems, one internship, one degree.' },
    { k: '03', title: 'One shared stack.', body: 'Retrieval, orchestration, streaming — the same primitives, wired differently each time.' },
    { k: '04', title: 'Alfred.', body: 'The agent harness: model routing, two-layer RAG, memory that decays.', accent: '#9D7BFF' },
    { k: '05', title: 'DocIntel.', body: 'Retrieval you can cite: dense + sparse, fused, reranked.', accent: '#3FD8F2' },
    { k: '06', title: 'Hex.', body: 'Real-time: one socket, seven personas, streamed tokens.', accent: '#FF8A5C' },
    { k: '07', title: 'Live traffic.', body: 'Hover to trace connections. Drag a node. Click a project to open it.' },
  ],
};

export function constellationCounts() {
  const c = CONSTELLATION;
  const members = c.clusters.reduce((a, k) => a + k.members.length, 0);
  const dust = c.clusters.reduce((a, k) => a + k.dust, 0);
  const sharedLinks = c.shared.reduce((a, [, cl]) => a + cl.length, 0);
  return {
    nodes: 1 + c.clusters.length + members + dust + c.shared.length,
    edges: c.clusters.length + members + dust + sharedLinks + c.arcs,
  };
}

export const EXPERIENCE = [
  {
    when: 'Sep 2026 — now',
    title: 'Full Stack Engineering Intern',
    org: 'Cognisphere Global Limited · Remote, UK',
    body: 'Shipping a production blog platform that grew to 5,500 daily readers, and an analytics dashboard unifying 5+ social platforms.',
    tags: ['FastAPI', 'JWT', 'Caching', 'Analytics'],
  },
  {
    when: '2026',
    title: 'DocIntel — take-home → benchmarked',
    org: 'N-ERGY',
    body: 'Built a hybrid RAG pipeline as a take-home, deployed it on client HPC infrastructure, then benchmarked it on QASPER: 63% fewer retrieval misses than standard RAG.',
    tags: ['RAG', 'Hybrid search', 'Reranking'],
  },
  {
    when: '2026',
    title: 'Alfred — shipped solo',
    org: 'Open source',
    body: 'Designed, built and deployed a full-stack personal agent end to end — routing, retrieval, memory and streaming UI.',
    tags: ['LangGraph', 'FastAPI', 'Next.js'],
  },
  {
    when: '2023 — 2027',
    title: 'B.Tech',
    org: 'Netaji Subhas University of Technology, Delhi',
    body: 'Undergraduate degree, graduating in 2027.',
    tags: ['NSUT', 'Delhi'],
  },
];

// ---------- Skills: each one tied to where it was actually used ----------
export const SKILL_PROJECTS = [
  { id: 'alfred', label: 'Alfred', color: '#9D7BFF' },
  { id: 'docintel', label: 'DocIntel', color: '#3FD8F2' },
  { id: 'hex', label: 'Hex', color: '#FF8A5C' },
  { id: 'cogni', label: 'Cognisphere', color: '#D4FF3A' },
];

export const SKILLS = [
  {
    group: 'Languages',
    items: [
      ['Python', ['alfred', 'docintel', 'cogni']],
      ['JavaScript', ['alfred', 'hex']],
      ['SQL', ['alfred']],
      ['Java', []],
    ],
  },
  {
    group: 'Backend & APIs',
    items: [
      ['FastAPI', ['alfred', 'docintel', 'cogni']],
      ['REST APIs', ['alfred', 'docintel', 'cogni']],
      ['JWT & OAuth', ['alfred', 'hex', 'cogni']],
      ['Node.js', ['hex']],
      ['Express.js', []],
      ['SSE & WebSockets', ['alfred', 'hex']],
      ['Caching', ['alfred', 'cogni']],
    ],
  },
  {
    group: 'AI & retrieval',
    items: [
      ['LangGraph', ['alfred']],
      ['LangChain', ['alfred']],
      ['RAG', ['alfred', 'docintel']],
      ['Pinecone', ['alfred', 'docintel']],
      ['Docling', ['docintel']],
      ['Cohere Rerank', ['docintel']],
      ['Gemini API', ['alfred', 'docintel', 'hex']],
      ['RAG evaluation', ['docintel']],
    ],
  },
  {
    group: 'Frontend',
    items: [
      ['React', ['alfred', 'hex']],
      ['Next.js', ['alfred']],
      ['HTML / CSS', ['docintel']],
    ],
  },
  {
    group: 'Data',
    items: [
      ['MongoDB', ['alfred', 'hex']],
      ['PostgreSQL', ['alfred']],
    ],
  },
  {
    group: 'Infra & tools',
    items: [
      ['Git & GitHub', []],
      ['Render', ['alfred']],
      ['Vercel', ['alfred']],
      ['AWS EC2', []],
      ['Linux / Bash', []],
    ],
  },
  {
    group: 'Foundations',
    items: [
      ['DSA', []],
      ['OOP', []],
      ['DBMS', []],
      ['Computer Networks', []],
    ],
  },
];

// ---------- Internship ----------
export const INTERNSHIP = {
  company: 'Cognisphere Global Limited',
  short: 'Cognisphere',
  role: 'Full Stack Engineering Intern',
  when: 'Sep 2026 — Present',
  where: 'Remote · United Kingdom',
  work: [
    {
      id: 'blog',
      title: 'Production blog platform',
      body: 'A FastAPI backend with JWT authentication and refresh-token rotation, SEO optimisations and response caching — live from launch to thousands of daily readers.',
      stat: { value: 5500, suffix: '', label: 'daily readers, grown from launch' },
      stack: ['FastAPI', 'JWT rotation', 'Response caching', 'SEO'],
    },
    {
      id: 'insights',
      title: 'Insights — social analytics',
      body: 'A multi-platform social media analytics dashboard for client businesses and creators: data from five-plus platforms unified behind one role-based interface.',
      stat: { value: 5, suffix: '+', label: 'platforms unified in one view' },
      stack: ['Data integration', 'Role-based access', 'Dashboards'],
    },
  ],
};
