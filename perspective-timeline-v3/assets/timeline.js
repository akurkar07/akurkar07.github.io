// timeline.js — Perspective timeline (one-point perspective, time = depth).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import initStarfield from './starfield.js';

/* ── Data ─────────────────────────────────────── */
const ITEMS = [
  { year: 2026, type: 'Hackathon', title: 'BSA EPFL Stablecoin Hackathon',
    desc: 'Built ENS Pay: a Telegram-based crypto payments MVP resolving ENS names to TON payment flows with wallet connection, payment links, and QR checkout.',
    link: 'https://hackathon.bsaepfl.com/' },
  { year: 2026, type: 'Hackathon', title: 'START Hack 2026',
    desc: 'Built CHAINIQ: an audit-ready procurement agent converting free-text purchase requests into structured, policy-aware supplier recommendations.',
    link: 'https://www.startglobal.org/start-hack' },
  { year: 2026, type: 'Hackathon', title: 'HackLondon 2026',
    desc: 'Built Use-Change Hunter: a real-estate opportunity analysis platform scoring development potential and risk from planning precedents. 1st in the Society Track.',
    link: null },
  { year: 2026, type: 'University', title: 'University of Nottingham',
    desc: 'BSc Computer Science — compilers, language runtimes, mathematics, competitive programming, and low-level systems.',
    link: '../about.html' },
  { year: 2025, type: 'Hackathon', title: 'Rubber Duck Agent — DurHack X',
    desc: 'A local AI coding companion reacting to git and system activity using FastAPI, WebSockets, Gemini, and Ollama. Presented at the MLH AI Roadshow London.',
    link: 'https://devpost.com/software/rubber-duck-agent' },
  { year: 2025, type: 'Hackathon', title: 'Paladins of Pi — HackNotts',
    desc: 'LLM-powered medieval fantasy story generator with frontend UI, backend prompt pipeline, and Ollama story generation.',
    link: 'https://github.com/UoN-HackNotts/Paladins-Of-Pi' },
  { year: 2025, type: 'Contest', title: 'UKIEPC 2025',
    desc: 'Represented University of Nottingham as team LockedIn at the ICPC UK & Ireland Programming Contest. Placed 142nd overall.',
    link: 'https://ukiepc.info/2025/' },
  { year: 2025, type: 'Project', title: 'Neural Network from Scratch',
    desc: 'MNIST digit classifier with no ML libraries. Manual forward pass, matrix backpropagation, SGD — over 95% accuracy.',
    link: 'https://github.com/akurkar07/Neural-Network' },
  { year: 2025, type: 'Project', title: 'Pascal Interpreter',
    desc: 'Full Pascal interpreter in Python: hand-written lexer, parser, AST evaluator, scope resolution, and bytecode VM.',
    link: 'https://github.com/akurkar07/Interpreter' },
  { year: 2024, type: 'Internship', title: 'Code Computerlove',
    desc: 'Product Development Intern in Manchester. Prototyped a consumer-facing application across Figma, full-stack implementation, agile planning, and user feedback.',
    link: null },
  { year: 2024, type: 'Project', title: 'Discord Trading Bots',
    desc: 'Admin and trading bots built during COVID. Automated moderation, market simulation, and user economy.',
    link: 'https://github.com/akurkar07/Trading-Bots' },
  { year: 2023, type: 'Internship', title: 'Cheshire Datasystems Limited',
    desc: 'Software Engineering Intern. Shadowed hardware and software teams, learning large-scale system architecture, QA, requirements, testing, and deployment.',
    link: null },
];
const N = ITEMS.length;

/* ── Helpers ──────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ── DOM refs ─────────────────────────────────── */
const bgCanvas = document.getElementById('ptv3-bg');
const sceneCanvas = document.getElementById('ptv3-scene');
const cardsLayer = document.getElementById('ptv3-cards');
const expanded = document.getElementById('ptv3-expanded');
const expMeta = document.getElementById('ptv3-exp-meta');
const expTitle = document.getElementById('ptv3-exp-title');
const expDesc = document.getElementById('ptv3-exp-desc');
const expLink = document.getElementById('ptv3-exp-link');
const hud = document.getElementById('ptv3-hud');
const prevBtn = document.getElementById('ptv3-prev');
const nextBtn = document.getElementById('ptv3-next');

/* ── Viewport & geometry constants ────────────── */
const viewport = { width: window.innerWidth, height: window.innerHeight };

let VP, DIR, NORMAL, MIN_DIST, MAX_DIST, CARD_OFFSET, CARD_UP_OFFSET, FOCAL_DIST;
let BASE_Y, BASE_HALF;

// Perspective compression along the depth axis. Larger = tighter tunnel.
const RATE = 0.5;

function computeConstants() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;

  // Vanishing point on a low, centred horizon. The timeline recedes straight
  // "into" the screen, so the surrounding grid reads as a floor you travel over.
  VP = { x: viewport.width * 0.5, y: viewport.height * 0.32 };

  DIR = { x: 0, y: 1 };      // straight down: present is near, the past sinks to the horizon
  NORMAL = { x: 1, y: 0 };   // horizontal, so transversals lie flat like floorboards

  MIN_DIST = viewport.height * 0.15;
  MAX_DIST = viewport.height * 1.10;

  // Ground-plane footprint: a wide near edge converging to the VP.
  BASE_Y = viewport.height * 1.06;
  BASE_HALF = viewport.width * 0.46;

  CARD_OFFSET = viewport.width * 0.015; // gap from the spine to a card's inner edge
  CARD_UP_OFFSET = 0;
  // Screen distance from the VP where the focused item sits.
  FOCAL_DIST = viewport.height * 0.44;
}

function markerPos(dist) {
  return { x: VP.x + DIR.x * dist, y: VP.y + DIR.y * dist };
}

/* Perspective projection along the ray. `u` is an item's depth relative to
   the camera (u = index − cam). u = 0 is at the focus; u > 0 recedes toward
   the vanishing point (small); u < 0 flies outward past the viewer (large).
   Returns the depth scale, the on-screen distance from the VP, and the
   resulting screen position. */
function projectDepth(u) {
  const ds = Math.exp(-u * RATE);
  const screenDist = FOCAL_DIST * ds;
  return { ds, screenDist, pos: markerPos(screenDist) };
}

/* Opacity envelope: fade in as an item emerges from the VP, hold near the
   focus, fade out as it grows huge and flies past the viewer. */
function depthOpacity(ds) {
  const fadeIn = clamp((ds - 0.10) / 0.35, 0, 1);
  const fadeOut = 1 - clamp((ds - 1.7) / 1.1, 0, 1);
  return fadeIn * fadeOut;
}

/* Year boundaries sit at a fractional depth just in front of the first item
   of each year (index − 0.5), projected the same way as the items. */
function computeYearBoundaries() {
  const seen = new Set();
  const boundaries = [];
  for (let i = 0; i < N; i++) {
    const year = ITEMS[i].year;
    if (seen.has(year)) continue;
    seen.add(year);
    boundaries.push({ year, depth: i - 0.5 });
  }
  return boundaries;
}
let yearBoundaries = [];

/* ── Scroll model ─────────────────────────────── */
let targetProgress = 0;
let displayedProgress = 0;
let prevTargetProgress = 0;
let scrollVelocity = 0;
let selectedIndex = null;
let lastFrameTime = performance.now();

/* ── Three.js scene ───────────────────────────── */
const renderer = new THREE.WebGLRenderer({
  canvas: sceneCanvas,
  alpha: true,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

let camera = new THREE.OrthographicCamera(0, viewport.width, 0, viewport.height, -1, 1);
const scene = new THREE.Scene();

const GOLD = 0xc8a96e;
let rayLine = null;
let markerMeshes = [];
let tickLines = [];
let leaderLines = [];
let structureLines = [];
let tieLines = [];
let tieDepths = [];
let haloMesh = null;

function disposeThree() {
  if (rayLine) {
    rayLine.geometry.dispose();
    rayLine.material.dispose();
    scene.remove(rayLine);
    rayLine = null;
  }
  if (haloMesh) {
    haloMesh.geometry.dispose();
    haloMesh.material.dispose();
    scene.remove(haloMesh);
    haloMesh = null;
  }
  markerMeshes.forEach((m) => {
    m.geometry.dispose();
    m.material.dispose();
    scene.remove(m);
  });
  markerMeshes = [];
  tickLines.forEach((l) => {
    l.geometry.dispose();
    l.material.dispose();
    scene.remove(l);
  });
  tickLines = [];
  leaderLines.forEach((l) => {
    l.geometry.dispose();
    l.material.dispose();
    scene.remove(l);
  });
  leaderLines = [];
  structureLines.forEach((l) => {
    l.geometry.dispose();
    l.material.dispose();
    scene.remove(l);
  });
  structureLines = [];
  tieLines.forEach((l) => {
    l.geometry.dispose();
    l.material.dispose();
    scene.remove(l);
  });
  tieLines = [];
}

// Build a line that fades from the background colour at `from` (the vanishing
// point) to gold at `to` (near the viewer), reinforcing aerial perspective.
function gradientLine(from, to, opacity, order) {
  const SEG = 20;
  const pts = [];
  const cols = [];
  const nearCol = new THREE.Color(GOLD);
  const farCol = new THREE.Color(0x080a0f);
  for (let s = 0; s <= SEG; s++) {
    const f = s / SEG;
    pts.push(new THREE.Vector3(
      from.x + (to.x - from.x) * f,
      from.y + (to.y - from.y) * f,
      0,
    ));
    const c = farCol.clone().lerp(nearCol, Math.pow(f, 0.6));
    cols.push(c.r, c.g, c.b);
  }
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  geom.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity, depthTest: false,
  });
  const line = new THREE.Line(geom, mat);
  line.renderOrder = order;
  return line;
}

function buildThree() {
  disposeThree();

  // Horizon line through the vanishing point (eye level).
  const hGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, VP.y, 0),
    new THREE.Vector3(viewport.width, VP.y, 0),
  ]);
  const hMat = new THREE.LineBasicMaterial({
    color: GOLD, transparent: true, opacity: 0.12, depthTest: false,
  });
  const horizon = new THREE.Line(hGeom, hMat);
  horizon.renderOrder = -2;
  scene.add(horizon);
  structureLines.push(horizon);

  // Floor plane: longitudinal lines fanning from the VP out to a wide near
  // edge. They read as the receding ground the timeline travels across.
  const lanes = [-1, -0.6, -0.3, 0.3, 0.6, 1];
  lanes.forEach((f) => {
    const line = gradientLine(
      VP,
      { x: VP.x + f * BASE_HALF, y: BASE_Y },
      Math.abs(f) === 1 ? 0.22 : 0.09,
      -1,
    );
    scene.add(line);
    structureLines.push(line);
  });

  // Transversal floor lines: horizontal ties that compress toward the horizon
  // and stream toward the viewer as you scroll (the classic receding grid).
  tieDepths = [];
  for (let d = -1; d <= N; d++) tieDepths.push(d);
  tieDepths.forEach(() => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(NORMAL.x, NORMAL.y, 0),
      new THREE.Vector3(-NORMAL.x, -NORMAL.y, 0),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: GOLD, transparent: true, opacity: 0.14, depthTest: false,
    });
    const line = new THREE.Line(g, mat);
    line.renderOrder = 0.5;
    scene.add(line);
    tieLines.push(line);
  });

  // Timeline spine down the centre of the floor, dissolving into the VP.
  rayLine = gradientLine(VP, { x: VP.x, y: BASE_Y }, 0.32, 0);
  scene.add(rayLine);

  // Leader lines: connect each card to its marker (positioned per frame).
  ITEMS.forEach(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineBasicMaterial({
      color: GOLD, transparent: true, opacity: 0.25, depthTest: false,
    });
    const line = new THREE.Line(g, mat);
    line.renderOrder = 1;
    scene.add(line);
    leaderLines.push(line);
  });

  // Year tick lines: unit segments along NORMAL, positioned/scaled per frame.
  yearBoundaries.forEach(() => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(NORMAL.x, NORMAL.y, 0),
      new THREE.Vector3(-NORMAL.x, -NORMAL.y, 0),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: GOLD, transparent: true, opacity: 0.6, depthTest: false,
    });
    const line = new THREE.Line(g, mat);
    line.renderOrder = 2;
    scene.add(line);
    tickLines.push(line);
  });

  // Focus halo: a soft ring behind the marker nearest the camera focus.
  const haloGeom = new THREE.RingGeometry(0.74, 1, 40);
  const haloMat = new THREE.MeshBasicMaterial({
    color: GOLD, transparent: true, opacity: 0, depthTest: false,
  });
  haloMesh = new THREE.Mesh(haloGeom, haloMat);
  haloMesh.renderOrder = 3;
  scene.add(haloMesh);

  // Marker circles: unit radius, positioned/scaled per frame for depth.
  ITEMS.forEach(() => {
    const geom = new THREE.CircleGeometry(1, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: GOLD, transparent: true, opacity: 1, depthTest: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.renderOrder = 4;
    scene.add(mesh);
    markerMeshes.push(mesh);
  });
}

function resizeRenderer() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(viewport.width, viewport.height, false);
  camera.left = 0;
  camera.right = viewport.width;
  camera.top = 0;
  camera.bottom = viewport.height;
  camera.near = -1;
  camera.far = 1;
  camera.updateProjectionMatrix();
}

/* ── Card DOM ─────────────────────────────────── */
let cardEls = [];
function buildCards() {
  cardsLayer.innerHTML = '';
  cardEls = ITEMS.map((item, i) => {
    const el = document.createElement('div');
    el.className = 'ptv3-card';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${item.year}, ${item.type}: ${item.title}`);
    el.innerHTML =
      `<span class="ptv3-card-meta">${item.year} · ${item.type}</span>` +
      `<strong class="ptv3-card-title">${item.title}</strong>`;
    el.addEventListener('click', (e) => {
      if (dragMoved) { e.preventDefault(); return; }
      selectItem(i);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectItem(i);
      }
    });
    cardsLayer.appendChild(el);
    return el;
  });
}

/* ── Year label DOM ───────────────────────────── */
let yearLabelEls = [];
function buildYearLabels() {
  yearLabelEls.forEach((el) => el.remove());
  yearLabelEls = yearBoundaries.map((b) => {
    const el = document.createElement('div');
    el.className = 'ptv3-year-label';
    el.textContent = b.year;
    cardsLayer.appendChild(el);
    return el;
  });
}

/* ── Expanded panel ───────────────────────────── */
function selectItem(i) {
  selectedIndex = i;
  targetProgress = i / (N - 1);
  const item = ITEMS[i];
  expMeta.textContent = `${item.year} · ${item.type}`;
  expTitle.textContent = item.title;
  expDesc.textContent = item.desc;
  if (item.link) {
    expLink.href = item.link;
    expLink.classList.remove('is-hidden');
    if (/^https?:/.test(item.link)) {
      expLink.target = '_blank';
      expLink.rel = 'noopener';
    } else {
      expLink.removeAttribute('target');
      expLink.removeAttribute('rel');
    }
  } else {
    expLink.classList.add('is-hidden');
  }
  expanded.classList.add('is-open');
  expanded.setAttribute('aria-hidden', 'false');
}

function closeExpanded() {
  selectedIndex = null;
  expanded.classList.remove('is-open');
  expanded.setAttribute('aria-hidden', 'true');
}

/* ── Frame update ─────────────────────────────── */
function updateCards() {
  const cam = displayedProgress * (N - 1);
  const focusIndex = clamp(Math.round(cam), 0, N - 1);

  for (let i = 0; i < N; i++) {
    const u = i - cam;
    const { ds, pos } = projectDepth(u);
    const markerOp = depthOpacity(ds);
    // Card text only reads on near items, so distant ones don't pile up at
    // the vanishing point — the receding marker dots carry the depth instead.
    const cardOp = markerOp * clamp((ds - 0.38) / 0.34, 0, 1);
    const el = cardEls[i];
    const side = i % 2 === 0 ? -1 : 1; // alternate cards left / right of the spine

    // Marker: travel down the spine and scale with depth.
    const mesh = markerMeshes[i];
    let markerR = 0;
    if (mesh) {
      markerR = clamp(10 * ds, 2, 18);
      mesh.position.set(pos.x, pos.y, 0);
      mesh.scale.set(markerR, markerR, 1);
      mesh.material.opacity = markerOp;
      mesh.visible = markerOp > 0.01;
    }

    // Card sizing — fonts and width scale with depth for the dolly feel.
    const fontScale = clamp(ds, 0.4, 1.8);
    const cardWidth = clamp(210 * ds, 96, 300);
    el.style.width = cardWidth + 'px';
    const metaEl = el.firstElementChild;
    const titleEl = el.lastElementChild;
    metaEl.style.fontSize = Math.max(0.68, 0.72 * fontScale) + 'rem';
    titleEl.style.fontSize = Math.max(0.72, 1.25 * fontScale) + 'rem';

    const w = el.offsetWidth || cardWidth;
    const h = el.offsetHeight || 44;
    // Card branches to one side of the spine, its inner edge near the marker.
    const gap = CARD_OFFSET + markerR + 6;
    const anchorX = side < 0 ? pos.x - gap - w : pos.x + gap;
    const anchorY = pos.y - h * 0.5;
    const left = clamp(anchorX, 8, viewport.width - w - 8);
    const top = clamp(anchorY, 8, viewport.height - h - 8);
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.opacity = cardOp.toFixed(3);
    el.style.pointerEvents = cardOp > 0.25 ? 'auto' : 'none';
    // Nearer cards stack above farther ones.
    el.style.zIndex = String(100 + Math.round(ds * 100));
    el.classList.toggle('is-active', i === focusIndex && cardOp > 0.4);

    // Leader line from the spine marker to the card's inner edge.
    const leader = leaderLines[i];
    if (leader) {
      const innerX = side < 0 ? left + w : left;
      const p = leader.geometry.attributes.position;
      p.setXYZ(0, pos.x, pos.y, 0);
      p.setXYZ(1, innerX, top + h * 0.5, 0);
      p.needsUpdate = true;
      leader.material.opacity = 0.32 * cardOp;
      leader.visible = cardOp > 0.02;
    }
  }

  // Halo behind the marker nearest the focus, fading between focus points.
  if (haloMesh) {
    const u = focusIndex - cam;
    const { ds, pos } = projectDepth(u);
    const r = clamp(10 * ds, 2, 18) * 2.7;
    haloMesh.position.set(pos.x, pos.y, 0);
    haloMesh.scale.set(r, r, 1);
    haloMesh.material.opacity = 0.55 * (1 - clamp(Math.abs(u) * 2, 0, 1));
  }

  const pct = Math.round(displayedProgress * 100);
  hud.textContent = `${ITEMS[focusIndex].year} · ${focusIndex + 1}/${N} · ${pct}%`;
}

function updateYearLabels() {
  const cam = displayedProgress * (N - 1);
  const span = BASE_Y - VP.y;
  yearBoundaries.forEach((b, idx) => {
    const u = b.depth - cam;
    const { ds, pos } = projectDepth(u);
    const op = depthOpacity(ds);
    const half = Math.max((BASE_HALF * (pos.y - VP.y)) / span, 0);

    // A brighter full-width transversal marks the start of a year.
    const line = tickLines[idx];
    if (line) {
      line.position.set(pos.x, pos.y, 0);
      line.scale.set(half, half, 1);
      line.material.opacity = 0.42 * op;
      line.visible = op > 0.01 && half > 1;
    }

    // Year sits just beyond the right edge of the floor, like a distance marker.
    const el = yearLabelEls[idx];
    el.style.left = Math.min(pos.x + half + 12, viewport.width - 54) + 'px';
    el.style.top = pos.y + 'px';
    el.style.opacity = op.toFixed(3);
    const labelScale = clamp(ds, 0.6, 1.6);
    el.style.fontSize = Math.max(0.68, 0.72 * labelScale) + 'rem';
  });
}

// Transversal floor lines: width follows the fanning edges so they ride the
// ground plane, streaming toward the viewer and compressing at the horizon.
function updateTies(cam) {
  const span = BASE_Y - VP.y;
  for (let k = 0; k < tieLines.length; k++) {
    const u = tieDepths[k] - cam;
    const { ds, pos } = projectDepth(u);
    const half = Math.max((BASE_HALF * (pos.y - VP.y)) / span, 0);
    const line = tieLines[k];
    line.position.set(pos.x, pos.y, 0);
    line.scale.set(half, half, 1);
    const op = depthOpacity(ds) * 0.16;
    line.material.opacity = op;
    line.visible = op > 0.01 && half > 1;
  }
}

function checkAutoClose() {
  if (selectedIndex !== null) {
    const anchor = selectedIndex / (N - 1);
    if (Math.abs(displayedProgress - anchor) > 1.5 / N) {
      closeExpanded();
    }
  }
}

/* ── Animation loop ───────────────────────────── */
function animate(now) {
  const dt = Math.max((now - lastFrameTime) / 1000, 1e-4);
  lastFrameTime = now;

  displayedProgress += (targetProgress - displayedProgress) * 0.09;

  scrollVelocity = clamp((targetProgress - prevTargetProgress) / dt, -2, 2);
  prevTargetProgress = targetProgress;

  updateCards();
  updateYearLabels();
  updateTies(displayedProgress * (N - 1));
  checkAutoClose();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

/* ── Input ────────────────────────────────────── */
function setTarget(v) { targetProgress = clamp(v, 0, 1); }

window.addEventListener('wheel', (e) => {
  e.preventDefault();
  setTarget(targetProgress + e.deltaY / (600 * N));
}, { passive: false });

// Pointer drag (covers mouse + touch on modern browsers).
let pointerDown = false;
let lastPointerY = 0;
let dragMoved = false;
let dragStartY = 0;

window.addEventListener('pointerdown', (e) => {
  pointerDown = true;
  lastPointerY = e.clientY;
  dragStartY = e.clientY;
  dragMoved = false;
});
window.addEventListener('pointermove', (e) => {
  if (!pointerDown) return;
  const dy = e.clientY - lastPointerY;
  lastPointerY = e.clientY;
  setTarget(targetProgress + -dy / (viewport.height * 0.8));
  if (Math.abs(e.clientY - dragStartY) > 6) dragMoved = true;
});
window.addEventListener('pointerup', () => { pointerDown = false; });
window.addEventListener('pointercancel', () => { pointerDown = false; });

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowDown':
    case 'PageDown':
      e.preventDefault();
      setTarget(targetProgress + 1 / N);
      break;
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      setTarget(targetProgress - 1 / N);
      break;
    case 'Home':
      e.preventDefault();
      setTarget(0);
      break;
    case 'End':
      e.preventDefault();
      setTarget(1);
      break;
    default:
      break;
  }
});

prevBtn.addEventListener('click', () => setTarget(targetProgress - 1 / N));
nextBtn.addEventListener('click', () => setTarget(targetProgress + 1 / N));
expLink.addEventListener('click', (e) => e.stopPropagation());

/* ── Build / rebuild ──────────────────────────── */
function rebuildAll() {
  computeConstants();
  yearBoundaries = computeYearBoundaries();
  resizeRenderer();
  buildThree();
  buildYearLabels();
}

computeConstants();
yearBoundaries = computeYearBoundaries();
resizeRenderer();
buildThree();
buildCards();
buildYearLabels();

/* ── Starfield ────────────────────────────────── */
const star = initStarfield(
  bgCanvas,
  () => VP,
  () => scrollVelocity,
);

/* ── Resize handling ──────────────────────────── */
let resizeRaf = null;
function handleResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    rebuildAll();
    star.resize();
  });
}
if ('ResizeObserver' in window) {
  const ro = new ResizeObserver(handleResize);
  ro.observe(document.body);
}
window.addEventListener('resize', handleResize);

requestAnimationFrame((t) => { lastFrameTime = t; animate(t); });
