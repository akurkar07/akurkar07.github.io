import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const shell = document.getElementById("tsd-shell");
const stage = document.getElementById("tsd-stage");
const canvas = document.getElementById("tsd-scene");
const stepLabel = document.getElementById("tsd-step");
const headingLabel = document.getElementById("tsd-heading");
const copyLabel = document.getElementById("tsd-copy");
const depthLabel = document.getElementById("tsd-depth");
const fill = document.getElementById("tsd-fill");
const linkLabel = document.getElementById("tsd-link");
const labelLayer = document.getElementById("tsd-labels");
const indexLabel = document.getElementById("tsd-index");
const prevButton = document.getElementById("tsd-prev");
const nextButton = document.getElementById("tsd-next");

const stops = [
  {
    z: 38,
    step: "Current | University",
    year: "2026",
    title: "University of Nottingham",
    type: "University",
    copy: "BSc Computer Science: compilers, language runtimes, mathematics, competitive programming, and low-level systems.",
    href: "../about.html",
    linkText: "Open about",
  },
  {
    z: 30,
    step: "Active | Project",
    year: "2026",
    title: "Interpreter",
    type: "Project",
    copy: "Pascal interpreter and custom bytecode VM with interactive browser shell, hand-written lexer, parser, AST evaluator, and stack runtime.",
    href: "../interpreter.html",
    linkText: "Try live demo",
  },
  {
    z: 22,
    step: "Mar 2026 | Hackathon",
    year: "2026",
    title: "BSA EPFL Stablecoin",
    type: "Hackathon",
    copy: "Built ENS Pay, a Telegram-based crypto payments MVP resolving ENS names to wallet-ready TON payment flows.",
    href: "https://hackathon.bsaepfl.com/",
    linkText: "Open event",
  },
  {
    z: 14,
    step: "Mar 2026 | Hackathon",
    year: "2026",
    title: "START Hack 2026",
    type: "Hackathon",
    copy: "Built CHAINIQ, an audit-ready procurement agent for structured, policy-aware supplier recommendations.",
    href: "https://www.startglobal.org/start-hack",
    linkText: "Open event",
  },
  {
    z: 6,
    step: "Feb 2026 | Hackathon",
    year: "2026",
    title: "HackLondon 2026",
    type: "Hackathon",
    copy: "Built Use-Change Hunter, a real-estate opportunity analysis platform. Placed 1st in the Society Track.",
  },
  {
    z: -2,
    step: "Nov 2025 | Hackathon",
    year: "2025",
    title: "Rubber Duck Agent",
    type: "Hackathon",
    copy: "DurHack X project: a local AI coding companion reacting to git and system activity with FastAPI, WebSockets, Gemini, Ollama, Python, and JavaScript.",
    href: "https://devpost.com/software/rubber-duck-agent",
    linkText: "Open project",
  },
  {
    z: -10,
    step: "Oct 2025 | Hackathon",
    year: "2025",
    title: "Paladins of Pi",
    type: "Hackathon",
    copy: "HackNotts '25 project: an LLM-powered medieval fantasy story generator with frontend UI and backend prompt pipeline.",
    href: "https://github.com/UoN-HackNotts/Paladins-Of-Pi",
    linkText: "Open repo",
  },
  {
    z: -18,
    step: "18 Oct 2025 | Contest",
    year: "2025",
    title: "UKIEPC 2025",
    type: "Contest",
    copy: "Represented the University of Nottingham at the ICPC UK and Ireland Programming Contest as part of team LockedIn.",
    href: "https://ukiepc.info/2025/",
    linkText: "Open contest",
  },
  {
    z: -26,
    step: "Sep 2025 | GitHub",
    year: "2025",
    title: "Neural Network",
    type: "Project",
    copy: "MNIST digit classifier from scratch with manual forward pass, matrix backpropagation, and stochastic gradient descent.",
    href: "https://github.com/akurkar07/Neural-Network",
    linkText: "Open repo",
  },
  {
    z: -34,
    step: "Nov 2024 | Archive",
    year: "2024",
    title: "Discord Bots",
    type: "Archive",
    copy: "Admin and trading bots built during COVID: automated moderation, market simulation, and user economy.",
    href: "https://github.com/akurkar07/Trading-Bots",
    linkText: "Open repo",
  },
  {
    z: -42,
    step: "Aug-Sept 2024 | Internship",
    year: "2024",
    title: "Code Computerlove",
    type: "Internship",
    copy: "Product Development Intern in Manchester, prototyping a consumer-facing application across Figma, full-stack implementation, agile planning, and user feedback.",
  },
  {
    z: -50,
    step: "Aug-Sept 2023 | Internship",
    year: "2023",
    title: "Cheshire Datasystems",
    type: "Internship",
    copy: "Software Engineering Intern, shadowing hardware and software teams and learning architecture, QA workflows, requirements, testing, and deployment.",
  },
];

const maxZ = stops[0].z;
const minZ = stops[stops.length - 1].z;
const travel = maxZ - minZ;
let progress = 0;
let targetProgress = 0;
let activeIndex = 0;
let pointerStartY = 0;
let pointerStartProgress = 0;
const timelineNodes = [];

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x0d0b14, 0);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0d0b14, 0.022);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 180);
camera.position.set(0, 0.8, maxZ);

const rig = new THREE.Group();
scene.add(rig);

const ambient = new THREE.AmbientLight(0xffffff, 0.48);
scene.add(ambient);

const key = new THREE.PointLight(0xa78bfa, 720, 70);
key.position.set(-8, 7, 18);
scene.add(key);

const warm = new THREE.PointLight(0xf3e4c8, 320, 60);
warm.position.set(10, -6, -14);
scene.add(warm);

const gateMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xa78bfa, emissive: 0x332064, metalness: 0.34, roughness: 0.34 }),
  new THREE.MeshStandardMaterial({ color: 0xc4b5fd, emissive: 0x392a66, metalness: 0.32, roughness: 0.36 }),
  new THREE.MeshStandardMaterial({ color: 0xf3e4c8, emissive: 0x3d2e1c, metalness: 0.22, roughness: 0.48 }),
];

const ringGeometry = new THREE.TorusGeometry(1.18, 0.024, 8, 72);
const knotGeometry = new THREE.SphereGeometry(0.22, 24, 16);
const barGeometry = new THREE.BoxGeometry(0.035, 1.4, 0.035);
const starGeometry = new THREE.IcosahedronGeometry(0.045, 0);
const starsMaterial = new THREE.MeshBasicMaterial({ color: 0xf0eeff, transparent: true, opacity: 0.54 });
const stars = new THREE.InstancedMesh(starGeometry, starsMaterial, 120);
const matrix = new THREE.Matrix4();

for (let i = 0; i < 120; i += 1) {
  const z = THREE.MathUtils.randFloat(minZ - 18, maxZ + 18);
  const radius = THREE.MathUtils.randFloat(4.4, 11);
  const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
  matrix.compose(
    new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, z),
    new THREE.Quaternion(),
    new THREE.Vector3().setScalar(THREE.MathUtils.randFloat(0.7, 1.8))
  );
  stars.setMatrixAt(i, matrix);
}
rig.add(stars);

stops.forEach((stop, index) => {
  const gate = new THREE.Group();
  gate.position.set(Math.sin(index * 1.08) * 1.65, Math.cos(index * 0.72) * 0.72, stop.z);
  gate.rotation.z = index * 0.22;

  const ring = new THREE.Mesh(ringGeometry, gateMaterials[index % gateMaterials.length]);
  ring.rotation.x = Math.PI / 2;
  gate.add(ring);

  const crossBars = index % 2 === 0 ? 10 : 7;
  for (let i = 0; i < crossBars; i += 1) {
    const bar = new THREE.Mesh(barGeometry, gateMaterials[(index + 1) % gateMaterials.length]);
    const angle = (i / crossBars) * Math.PI * 2;
    bar.position.set(Math.cos(angle) * 1.18, Math.sin(angle) * 1.18, 0);
    bar.rotation.z = angle;
    gate.add(bar);
  }

  const knot = new THREE.Mesh(knotGeometry, gateMaterials[(index + 2) % gateMaterials.length]);
  knot.position.set(index % 2 === 0 ? -0.46 : 0.48, index % 2 === 0 ? 0.32 : -0.28, 0.12);
  knot.scale.setScalar(0.9 + index * 0.025);
  gate.add(knot);

  rig.add(gate);
  const label = document.createElement("div");
  label.className = "tsd-label";
  label.innerHTML = `<span>${stop.year}</span><strong>${stop.title}</strong>${stop.type}`;
  labelLayer.appendChild(label);
  timelineNodes.push({ gate, label, stop, index });
});

const railMaterial = new THREE.LineBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.58 });
const railGeometry = new THREE.BufferGeometry().setFromPoints(
  timelineNodes.map(({ gate }) => gate.position.clone())
);
rig.add(new THREE.Line(railGeometry, railMaterial));

const tunnelMaterial = new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.3 });
const tunnelGeometry = new THREE.BufferGeometry();
const tunnelPoints = [];
for (let i = 0; i < 18; i += 1) {
  const angle = (i / 18) * Math.PI * 2;
  tunnelPoints.push(new THREE.Vector3(Math.cos(angle) * 6.2, Math.sin(angle) * 3.8, maxZ + 6));
  tunnelPoints.push(new THREE.Vector3(Math.cos(angle) * 6.2, Math.sin(angle) * 3.8, minZ - 12));
}
tunnelGeometry.setFromPoints(tunnelPoints);
rig.add(new THREE.LineSegments(tunnelGeometry, tunnelMaterial));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setLabels(currentProgress) {
  const worldZ = maxZ - currentProgress * travel;
  const closest = stops.reduce((best, stop, index) => {
    const distance = Math.abs(worldZ - stop.z);
    return distance < best.distance ? { index, distance } : best;
  }, { index: 0, distance: Infinity });
  const stop = stops[closest.index];

  stepLabel.textContent = stop.step;
  headingLabel.textContent = stop.title;
  copyLabel.textContent = stop.copy;
  depthLabel.textContent = stop.year;
  fill.style.height = `${currentProgress * 100}%`;
  indexLabel.textContent = `${String(closest.index + 1).padStart(2, "0")} / ${String(stops.length).padStart(2, "0")}`;

  if (closest.index !== activeIndex) {
    activeIndex = closest.index;
  }

  if (stop.href) {
    linkLabel.hidden = false;
    linkLabel.href = stop.href;
    linkLabel.textContent = stop.linkText || "Open link";
    linkLabel.target = stop.href.startsWith("http") ? "_blank" : "";
    linkLabel.rel = stop.href.startsWith("http") ? "noopener noreferrer" : "";
  } else {
    linkLabel.hidden = true;
    linkLabel.removeAttribute("href");
    linkLabel.removeAttribute("target");
    linkLabel.removeAttribute("rel");
  }
}

function projectTimelineLabels(currentProgress) {
  const vector = new THREE.Vector3();
  const activePosition = currentProgress * (stops.length - 1);
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const labelPadX = Math.min(118, width * 0.32);
  const labelPadY = Math.min(58, height * 0.16);

  timelineNodes.forEach(({ gate, label, index }) => {
    gate.getWorldPosition(vector);
    vector.project(camera);
    const visible = vector.z > -1 && vector.z < 1;
    const closeness = Math.max(0, 1 - Math.abs(activePosition - index) / 1.55);
    const x = clamp((vector.x * 0.5 + 0.5) * width, labelPadX, width - labelPadX);
    const y = clamp((-vector.y * 0.5 + 0.5) * height, labelPadY, height - labelPadY);

    label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -135%)`;
    label.style.opacity = visible ? String(0.14 + closeness * 0.86) : "0";
    label.dataset.active = String(index === activeIndex);
  });
}

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function moveBy(delta) {
  targetProgress = clamp(targetProgress + delta, 0, 1);
}

function moveToIndex(index) {
  targetProgress = clamp(index / (stops.length - 1), 0, 1);
}

function animate(time = 0) {
  progress += (targetProgress - progress) * 0.09;
  if (Math.abs(targetProgress - progress) < 0.0004) {
    progress = targetProgress;
  }

  const z = maxZ - progress * travel;
  camera.position.z = z;
  camera.position.x = Math.sin(progress * Math.PI * 2) * 0.72;
  camera.position.y = 0.8 + Math.cos(progress * Math.PI) * 0.24;
  camera.lookAt(0, 0, z - 12);

  rig.rotation.z = Math.sin(time * 0.00025) * 0.08 + progress * 0.42;
  rig.rotation.x = Math.sin(time * 0.00018) * 0.045;
  stars.rotation.z = -time * 0.000035;

  const activePosition = progress * (stops.length - 1);
  timelineNodes.forEach(({ gate, index }) => {
    const closeness = Math.max(0, 1 - Math.abs(activePosition - index) / 1.15);
    gate.scale.setScalar(0.76 + closeness * 0.54);
  });

  setLabels(progress);
  projectTimelineLabels(progress);
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  moveBy(event.deltaY * 0.00065);
}, { passive: false });

stage.addEventListener("pointerdown", (event) => {
  pointerStartY = event.clientY;
  pointerStartProgress = targetProgress;
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener("pointermove", (event) => {
  if (!stage.hasPointerCapture(event.pointerId)) {
    return;
  }
  targetProgress = clamp(pointerStartProgress + (pointerStartY - event.clientY) / stage.clientHeight, 0, 1);
});

stage.addEventListener("pointerup", (event) => {
  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    moveToIndex(activeIndex + 1);
  }
  if (event.key === "ArrowUp" || event.key === "PageUp") {
    event.preventDefault();
    moveToIndex(activeIndex - 1);
  }
  if (event.key === "Home") {
    event.preventDefault();
    moveToIndex(0);
  }
  if (event.key === "End") {
    event.preventDefault();
    moveToIndex(stops.length - 1);
  }
});

prevButton.addEventListener("click", () => moveToIndex(activeIndex - 1));
nextButton.addEventListener("click", () => moveToIndex(activeIndex + 1));
window.addEventListener("resize", resize);

resize();
animate();
