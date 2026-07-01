import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const stage = document.getElementById("tsd-stage");
const canvas = document.getElementById("tsd-scene");
const hyperspaceCanvas = document.getElementById("tsd-hyperspace");
const overlay = document.getElementById("tsd-overlays");
const depthLabel = document.getElementById("tsd-depth");
const fill = document.getElementById("tsd-fill");
const indexLabel = document.getElementById("tsd-index");
const prevButton = document.getElementById("tsd-prev");
const nextButton = document.getElementById("tsd-next");

const items = [
  {
    date: "Current | University",
    year: "2026",
    title: "University of Nottingham",
    type: "University",
    copy: "BSc Computer Science: compilers, language runtimes, mathematics, competitive programming, and low-level systems.",
    href: "../about.html",
    linkText: "Open about",
  },
  {
    date: "Active | Project",
    year: "2026",
    title: "Interpreter",
    type: "Project",
    copy: "Pascal interpreter and custom bytecode VM with interactive browser shell, lexer, parser, AST evaluator, and stack runtime.",
    href: "../interpreter.html",
    linkText: "Try live demo",
  },
  {
    date: "Mar 2026 | Hackathon",
    year: "2026",
    title: "BSA EPFL Stablecoin",
    type: "Hackathon",
    copy: "Built ENS Pay, a Telegram-based crypto payments MVP resolving ENS names to wallet-ready TON payment flows.",
    href: "https://hackathon.bsaepfl.com/",
    linkText: "Open event",
  },
  {
    date: "Mar 2026 | Hackathon",
    year: "2026",
    title: "START Hack 2026",
    type: "Hackathon",
    copy: "Built CHAINIQ, an audit-ready procurement agent for structured, policy-aware supplier recommendations.",
    href: "https://www.startglobal.org/start-hack",
    linkText: "Open event",
  },
  {
    date: "Feb 2026 | Hackathon",
    year: "2026",
    title: "HackLondon 2026",
    type: "Hackathon",
    copy: "Built Use-Change Hunter, a real-estate opportunity analysis platform. Placed 1st in the Society Track.",
  },
  {
    date: "Nov 2025 | Hackathon",
    year: "2025",
    title: "Rubber Duck Agent",
    type: "Hackathon",
    copy: "DurHack X local AI coding companion using FastAPI, WebSockets, Gemini, Ollama, Python, and JavaScript.",
    href: "https://devpost.com/software/rubber-duck-agent",
    linkText: "Open project",
  },
  {
    date: "Oct 2025 | Hackathon",
    year: "2025",
    title: "Paladins of Pi",
    type: "Hackathon",
    copy: "HackNotts '25 LLM-powered medieval fantasy story generator with frontend UI and backend prompt pipeline.",
    href: "https://github.com/UoN-HackNotts/Paladins-Of-Pi",
    linkText: "Open repo",
  },
  {
    date: "18 Oct 2025 | Contest",
    year: "2025",
    title: "UKIEPC 2025",
    type: "Contest",
    copy: "Represented the University of Nottingham at the ICPC UK and Ireland Programming Contest as team LockedIn.",
    href: "https://ukiepc.info/2025/",
    linkText: "Open contest",
  },
  {
    date: "Sep 2025 | GitHub",
    year: "2025",
    title: "Neural Network",
    type: "Project",
    copy: "MNIST digit classifier from scratch with manual forward pass, matrix backpropagation, and SGD.",
    href: "https://github.com/akurkar07/Neural-Network",
    linkText: "Open repo",
  },
  {
    date: "Nov 2024 | Archive",
    year: "2024",
    title: "Discord Bots",
    type: "Archive",
    copy: "Admin and trading bots built during COVID: moderation, market simulation, and user economy.",
    href: "https://github.com/akurkar07/Trading-Bots",
    linkText: "Open repo",
  },
  {
    date: "Aug-Sept 2024 | Internship",
    year: "2024",
    title: "Code Computerlove",
    type: "Internship",
    copy: "Product Development Intern in Manchester, prototyping across Figma, full-stack implementation, agile planning, and user feedback.",
  },
  {
    date: "Aug-Sept 2023 | Internship",
    year: "2023",
    title: "Cheshire Datasystems",
    type: "Internship",
    copy: "Software Engineering Intern, shadowing hardware and software teams and learning architecture, QA, testing, and deployment.",
  },
];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
const lineGroup = new THREE.Group();
const rayMaterial = new THREE.LineBasicMaterial({ color: 0xf5ead7, transparent: true, opacity: 0.94 });
const tickMaterial = new THREE.LineBasicMaterial({ color: 0xd8c6f5, transparent: true, opacity: 0.7 });
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xd8c6f5 });
const activeMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xf3e4c8 });
const markerGeometry = new THREE.CircleGeometry(5, 24);
const hyperspaceContext = hyperspaceCanvas.getContext("2d");

const bearingDegrees = 195;
const angle = (bearingDegrees * Math.PI) / 180;
const rayDirection = { x: Math.sin(angle), y: -Math.cos(angle) };
const cardNormal = { x: -rayDirection.y, y: rayDirection.x };
const yearEntries = [];
const compactCards = [];
const expandedCards = [];
const markerMeshes = [];
const markerEls = [];
const yearEls = [];
const hyperspace = [];

let width = 1;
let height = 1;
let rayLength = 1;
let progress = 0;
let targetProgress = 0;
let previousProgress = 0;
let scrollVelocity = 0;
let activeIndex = 0;
let selectedIndex = null;
let pointerStartY = 0;
let pointerStartProgress = 0;
let rayLine = null;
let tickLines = [];

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x0d0b14, 0);
scene.add(lineGroup);

for (let index = 0; index < 240; index += 1) {
  hyperspace.push({
    angle: Math.random() * Math.PI * 2,
    distance: Math.random(),
    speed: 0.0028 + Math.random() * 0.007,
    length: 0.04 + Math.random() * 0.12,
    alpha: 0.18 + Math.random() * 0.48,
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function screenToWorld(point) {
  return new THREE.Vector3(point.x - width / 2, height / 2 - point.y, 0);
}

function rayPoint(distance) {
  return {
    x: width / 2 + rayDirection.x * distance,
    y: height / 2 + rayDirection.y * distance,
  };
}

function displayDistanceFor(index) {
  const activePosition = progress * (items.length - 1);
  const baseDistance = rayLength * 0.47;
  const spacing = clamp(rayLength * 0.105, 72, 135);
  return baseDistance + (index - activePosition) * spacing;
}

function visibleAlongRay(distance) {
  return distance > 34 && distance < rayLength - 18;
}

function createCompactCard(item, index) {
  const card = document.createElement("article");
  card.className = "tsd-card tsd-card-compact";
  card.tabIndex = 0;
  card.innerHTML = `
    <span class="tsd-date-marker" aria-hidden="true"></span>
    <span class="tsd-card-meta"><b>${item.date}</b><b>${item.type}</b></span>
    <h2>${item.title}</h2>
  `;
  const select = () => {
    selectedIndex = index;
    moveToIndex(index);
  };
  card.addEventListener("click", select);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    select();
  });
  overlay.appendChild(card);
  return card;
}

function createExpandedCard(item) {
  const card = document.createElement("article");
  card.className = "tsd-expanded";
  card.innerHTML = `
    <span class="tsd-expanded-date">${item.year} / ${item.type}</span>
    <h2>${item.title}</h2>
    <p>${item.copy}</p>
    <a ${item.href ? `href="${item.href}"` : "hidden"} ${item.href && item.href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${item.linkText || "Open link"}</a>
  `;
  overlay.appendChild(card);
  return card;
}

function createMarkerElement() {
  const marker = document.createElement("span");
  marker.className = "tsd-marker";
  overlay.appendChild(marker);
  return marker;
}

function createYearElement(year) {
  const marker = document.createElement("span");
  marker.className = "tsd-year";
  marker.textContent = year;
  overlay.appendChild(marker);
  return marker;
}

items.forEach((item, index) => {
  compactCards.push(createCompactCard(item, index));
  expandedCards.push(createExpandedCard(item));
  markerEls.push(createMarkerElement());
  const mesh = new THREE.Mesh(markerGeometry, markerMaterial);
  lineGroup.add(mesh);
  markerMeshes.push(mesh);

  if (!items[index - 1] || items[index - 1].year !== item.year) {
    yearEntries.push({ year: item.year, index });
    yearEls.push(createYearElement(item.year));
  }
});

function makeLine(start, end, material) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints([screenToWorld(start), screenToWorld(end)]), material);
}

function rebuildLines() {
  if (rayLine) {
    lineGroup.remove(rayLine);
    rayLine.geometry.dispose();
  }
  tickLines.forEach((line) => {
    lineGroup.remove(line);
    line.geometry.dispose();
  });
  tickLines = [];

  const start = rayPoint(0);
  const end = rayPoint(rayLength);
  rayLine = makeLine(start, end, rayMaterial);
  lineGroup.add(rayLine);

  yearEntries.forEach((entry) => {
    const point = rayPoint(displayDistanceFor(entry.index));
    const tickHalf = 46;
    const startTick = {
      x: point.x + cardNormal.x * tickHalf,
      y: point.y + cardNormal.y * tickHalf,
    };
    const endTick = {
      x: point.x - cardNormal.x * tickHalf,
      y: point.y - cardNormal.y * tickHalf,
    };
    const line = makeLine(startTick, endTick, tickMaterial);
    tickLines.push(line);
    lineGroup.add(line);
  });
}

function resize() {
  width = stage.clientWidth;
  height = stage.clientHeight;
  rayLength = Math.min(
    rayDirection.x < 0 ? (width / 2) / Math.abs(rayDirection.x) : Infinity,
    rayDirection.x > 0 ? (width / 2) / rayDirection.x : Infinity,
    rayDirection.y > 0 ? (height / 2) / rayDirection.y : Infinity,
    rayDirection.y < 0 ? (height / 2) / Math.abs(rayDirection.y) : Infinity
  );
  rayLength *= 0.97;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setSize(width, height, false);
  hyperspaceCanvas.width = Math.round(width * dpr);
  hyperspaceCanvas.height = Math.round(height * dpr);
  hyperspaceCanvas.style.width = `${width}px`;
  hyperspaceCanvas.style.height = `${height}px`;
  hyperspaceContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  rebuildLines();
}

function moveBy(delta) {
  targetProgress = clamp(targetProgress + delta, 0, 1);
}

function moveToIndex(index) {
  targetProgress = clamp(index / (items.length - 1), 0, 1);
}

function drawHyperspace() {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.hypot(width, height) * 0.74;
  const quietRadius = Math.min(width, height) * 0.14;
  const intensity = clamp(Math.abs(scrollVelocity) * 54, 0.45, 2.2);
  const direction = scrollVelocity >= 0 ? 1 : -1;

  hyperspaceContext.clearRect(0, 0, width, height);
  hyperspaceContext.lineCap = "round";

  hyperspace.forEach((star) => {
    star.distance += star.speed * (0.5 + intensity) * direction;
    if (star.distance > 1.08) {
      star.distance = 0.04;
      star.angle = Math.random() * Math.PI * 2;
    }
    if (star.distance < 0.03) {
      star.distance = 1.02;
      star.angle = Math.random() * Math.PI * 2;
    }

    const distance = star.distance * maxDistance;
    if (distance < quietRadius) {
      return;
    }

    const tailDistance = Math.max(quietRadius, (star.distance - star.length * intensity) * maxDistance);
    const x = centerX + Math.cos(star.angle) * distance;
    const y = centerY + Math.sin(star.angle) * distance;
    const tailX = centerX + Math.cos(star.angle) * tailDistance;
    const tailY = centerY + Math.sin(star.angle) * tailDistance;
    const fade = clamp((distance - quietRadius) / quietRadius, 0, 1);

    hyperspaceContext.strokeStyle = `rgba(196, 181, 253, ${star.alpha * fade})`;
    hyperspaceContext.lineWidth = 0.8 + intensity * 0.85;
    hyperspaceContext.beginPath();
    hyperspaceContext.moveTo(tailX, tailY);
    hyperspaceContext.lineTo(x, y);
    hyperspaceContext.stroke();
  });
}

function updateLayout() {
  const activePosition = progress * (items.length - 1);
  activeIndex = clamp(Math.round(activePosition), 0, items.length - 1);
  if (selectedIndex !== null && Math.abs(activePosition - selectedIndex) > 2.25) {
    selectedIndex = null;
  }

  const compactWidth = clamp(width * 0.18, 152, 232);
  const expandedWidth = clamp(width * 0.3, 260, 410);
  const itemCardOffset = clamp(width * 0.19, 140, 285);
  const itemUpOffset = clamp(height * 0.115, 70, 140);
  const expandedGap = clamp(width * 0.035, 24, 52);

  items.forEach((item, index) => {
    const distance = displayDistanceFor(index);
    const point = rayPoint(distance);
    const visible = visibleAlongRay(distance);
    const closeness = Math.max(0, 1 - Math.abs(activePosition - index) / 2.2);
    const opacity = visible ? clamp(closeness, 0, 1) : 0;
    const cardAnchor = {
      x: point.x + cardNormal.x * itemCardOffset - rayDirection.x * itemUpOffset,
      y: point.y + cardNormal.y * itemCardOffset - rayDirection.y * itemUpOffset,
    };
    const x = clamp(cardAnchor.x, 14, width - compactWidth - 14);
    const y = clamp(cardAnchor.y, 62, height - 104);

    compactCards[index].style.left = `${x}px`;
    compactCards[index].style.top = `${y}px`;
    compactCards[index].style.width = `${compactWidth}px`;
    compactCards[index].style.opacity = String(opacity);
    compactCards[index].style.pointerEvents = opacity > 0.2 ? "auto" : "none";
    compactCards[index].style.zIndex = String(20 + Math.round(closeness * 20));
    compactCards[index].dataset.active = String(index === selectedIndex);

    const detailX = clamp(x + compactWidth + expandedGap, 14, width - expandedWidth - 14);
    const detailY = clamp(y + 10, 78, height - 206);
    const detailVisible = index === selectedIndex && visible && opacity > 0.24;
    expandedCards[index].style.left = `${detailX}px`;
    expandedCards[index].style.top = `${detailY}px`;
    expandedCards[index].style.width = `${expandedWidth}px`;
    expandedCards[index].style.opacity = String(detailVisible ? 1 : 0);
    expandedCards[index].style.pointerEvents = detailVisible ? "auto" : "none";
    expandedCards[index].style.zIndex = String(detailVisible ? 70 : 0);

    markerMeshes[index].position.copy(screenToWorld(point));
    markerMeshes[index].material = index === selectedIndex || index === activeIndex ? activeMarkerMaterial : markerMaterial;
    markerMeshes[index].scale.setScalar(visible ? 0.8 + closeness * 0.75 : 0.01);

    markerEls[index].style.left = `${point.x}px`;
    markerEls[index].style.top = `${point.y}px`;
    markerEls[index].style.opacity = visible ? String(0.35 + closeness * 0.65) : "0";
    markerEls[index].dataset.active = String(index === activeIndex);
  });

  yearEntries.forEach((entry, index) => {
    const distance = displayDistanceFor(entry.index);
    const point = rayPoint(distance);
    const activeDistance = Math.abs(activePosition - entry.index);
    yearEls[index].style.left = `${clamp(point.x - cardNormal.x * 54, 58, width - 58)}px`;
    yearEls[index].style.top = `${clamp(point.y - cardNormal.y * 54, 44, height - 44)}px`;
    yearEls[index].style.opacity = visibleAlongRay(distance) ? String(clamp(1 - activeDistance * 0.7, 0.22, 1)) : "0";
  });

  depthLabel.textContent = items[activeIndex].year;
  indexLabel.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
  fill.style.height = `${progress * 100}%`;
  rebuildLines();
}

function animate() {
  progress += (targetProgress - progress) * 0.1;
  if (Math.abs(targetProgress - progress) < 0.0005) {
    progress = targetProgress;
  }
  scrollVelocity += (progress - previousProgress - scrollVelocity) * 0.22;
  previousProgress = progress;

  updateLayout();
  drawHyperspace();
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
  targetProgress = clamp(pointerStartProgress + (pointerStartY - event.clientY) / height, 0, 1);
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
    moveToIndex(items.length - 1);
  }
});

prevButton.addEventListener("click", () => moveToIndex(activeIndex - 1));
nextButton.addEventListener("click", () => moveToIndex(activeIndex + 1));
window.addEventListener("resize", resize);

resize();
animate();
