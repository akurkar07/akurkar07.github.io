import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const shell = document.getElementById("tsd-shell");
const canvas = document.getElementById("tsd-scene");
const stepLabel = document.getElementById("tsd-step");
const headingLabel = document.getElementById("tsd-heading");
const copyLabel = document.getElementById("tsd-copy");
const depthLabel = document.getElementById("tsd-depth");
const fill = document.getElementById("tsd-fill");

const stops = [
  {
    z: 38,
    step: "Gate 01",
    title: "Entrance Plane",
    copy: "Scroll forward to push the camera into the scene. Scroll back to pull out.",
  },
  {
    z: 24,
    step: "Gate 02",
    title: "Signal Corridor",
    copy: "The camera is moving on the z-axis while the rings stay fixed in world space.",
  },
  {
    z: 10,
    step: "Gate 03",
    title: "Near Field",
    copy: "Objects pass around the viewport, creating the feeling of diving into the screen.",
  },
  {
    z: -6,
    step: "Gate 04",
    title: "Through The Plane",
    copy: "Past zero, the scene opens behind the starting surface instead of ending at it.",
  },
  {
    z: -24,
    step: "Gate 05",
    title: "Return Vector",
    copy: "Reverse the scroll direction to travel back out along the same depth path.",
  },
];

const maxZ = stops[0].z;
const minZ = stops[stops.length - 1].z;
const travel = maxZ - minZ;
let progress = 0;
let targetProgress = 0;
let pointerStartY = 0;
let pointerStartProgress = 0;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x070809, 0);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070809, 0.025);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 180);
camera.position.set(0, 0.8, maxZ);

const rig = new THREE.Group();
scene.add(rig);

const ambient = new THREE.AmbientLight(0xffffff, 0.28);
scene.add(ambient);

const key = new THREE.PointLight(0x41f0a7, 950, 70);
key.position.set(-8, 7, 18);
scene.add(key);

const warm = new THREE.PointLight(0xf15a48, 550, 60);
warm.position.set(10, -6, -14);
scene.add(warm);

const gateMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x41f0a7, emissive: 0x0a4c34, metalness: 0.45, roughness: 0.22 }),
  new THREE.MeshStandardMaterial({ color: 0xd8bf6a, emissive: 0x4a3908, metalness: 0.52, roughness: 0.28 }),
  new THREE.MeshStandardMaterial({ color: 0xf15a48, emissive: 0x4a100b, metalness: 0.42, roughness: 0.25 }),
];

const ringGeometry = new THREE.TorusGeometry(4.9, 0.035, 10, 120);
const knotGeometry = new THREE.TorusKnotGeometry(0.72, 0.065, 100, 8);
const barGeometry = new THREE.BoxGeometry(0.07, 1.2, 0.07);
const starGeometry = new THREE.IcosahedronGeometry(0.08, 0);
const starsMaterial = new THREE.MeshBasicMaterial({ color: 0xd9fff0 });
const stars = new THREE.InstancedMesh(starGeometry, starsMaterial, 180);
const matrix = new THREE.Matrix4();

for (let i = 0; i < 180; i += 1) {
  const z = THREE.MathUtils.randFloat(minZ - 18, maxZ + 18);
  const radius = THREE.MathUtils.randFloat(7, 19);
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
  gate.position.z = stop.z;
  gate.rotation.z = index * 0.22;

  const ring = new THREE.Mesh(ringGeometry, gateMaterials[index % gateMaterials.length]);
  ring.rotation.x = Math.PI / 2;
  gate.add(ring);

  const crossBars = index % 2 === 0 ? 10 : 7;
  for (let i = 0; i < crossBars; i += 1) {
    const bar = new THREE.Mesh(barGeometry, gateMaterials[(index + 1) % gateMaterials.length]);
    const angle = (i / crossBars) * Math.PI * 2;
    bar.position.set(Math.cos(angle) * 4.9, Math.sin(angle) * 4.9, 0);
    bar.rotation.z = angle;
    gate.add(bar);
  }

  const knot = new THREE.Mesh(knotGeometry, gateMaterials[(index + 2) % gateMaterials.length]);
  knot.position.set(index % 2 === 0 ? -2.3 : 2.4, index % 2 === 0 ? 1.4 : -1.2, 0.35);
  knot.scale.setScalar(0.72 + index * 0.08);
  gate.add(knot);

  rig.add(gate);
});

const tunnelMaterial = new THREE.LineBasicMaterial({ color: 0x56606f, transparent: true, opacity: 0.32 });
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
  depthLabel.textContent = `z ${worldZ.toFixed(1)}`;
  fill.style.height = `${currentProgress * 100}%`;
}

function resize() {
  const width = shell.clientWidth;
  const height = shell.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function moveBy(delta) {
  targetProgress = clamp(targetProgress + delta, 0, 1);
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

  setLabels(progress);
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

shell.addEventListener("wheel", (event) => {
  event.preventDefault();
  moveBy(event.deltaY * 0.00065);
}, { passive: false });

shell.addEventListener("pointerdown", (event) => {
  pointerStartY = event.clientY;
  pointerStartProgress = targetProgress;
  shell.setPointerCapture(event.pointerId);
});

shell.addEventListener("pointermove", (event) => {
  if (!shell.hasPointerCapture(event.pointerId)) {
    return;
  }
  targetProgress = clamp(pointerStartProgress + (pointerStartY - event.clientY) / shell.clientHeight, 0, 1);
});

shell.addEventListener("pointerup", (event) => {
  if (shell.hasPointerCapture(event.pointerId)) {
    shell.releasePointerCapture(event.pointerId);
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    moveBy(0.12);
  }
  if (event.key === "ArrowUp" || event.key === "PageUp") {
    event.preventDefault();
    moveBy(-0.12);
  }
});

window.addEventListener("resize", resize);

resize();
animate();
