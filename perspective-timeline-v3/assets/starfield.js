// starfield.js — background canvas module.
// Stars radiate outward from the vanishing point; scrolling speeds them up.

const STAR_COUNT = 150;
const BASE_SPEED = 0.4; // px per frame at rest (scaled by DPR later)

/**
 * @param {HTMLCanvasElement} canvasEl
 * @param {() => {x:number, y:number}} getVanishing
 * @param {() => number} getScrollVelocity
 * @returns {{ resize: () => void, stop: () => void }}
 */
export default function initStarfield(canvasEl, getVanishing, getScrollVelocity) {
  const ctx = canvasEl.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let maxRadius = Math.hypot(vw, vh);
  let stars = [];
  let rafId = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    maxRadius = Math.hypot(vw, vh);
    canvasEl.width = Math.floor(vw * dpr);
    canvasEl.height = Math.floor(vh * dpr);
    canvasEl.style.width = vw + 'px';
    canvasEl.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeStar(seedRadius) {
    return {
      angle: Math.random() * Math.PI * 2,
      radius: seedRadius !== undefined ? seedRadius : Math.random() * maxRadius * 0.4,
      speed: BASE_SPEED * (0.6 + Math.random() * 0.9),
      size: 0.5 + Math.random() * 1.1,
    };
  }

  function seed() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(makeStar());
    }
  }

  function frame() {
    ctx.clearRect(0, 0, vw, vh);

    const vp = getVanishing();
    const vel = getScrollVelocity();
    const speedMul = 1 + Math.abs(vel) * 4;
    const quietRadius = vw * 0.18;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.radius += s.speed * speedMul;

      if (s.radius > maxRadius) {
        stars[i] = makeStar(0);
        continue;
      }

      // Opacity: ramp up from 0, peak ~60% of max radius, fade to 0 at max.
      const p = s.radius / maxRadius;
      let opacity;
      const peak = 0.6;
      if (p < peak) {
        opacity = p / peak;
      } else {
        opacity = 1 - (p - peak) / (1 - peak);
      }
      opacity = Math.max(0, Math.min(1, opacity));

      const x = vp.x + Math.cos(s.angle) * s.radius;
      const y = vp.y + Math.sin(s.angle) * s.radius;

      // Quiet zone near the vanishing point stays readable.
      if (s.radius < quietRadius) {
        opacity *= 0.15;
      }

      // Stars belong to the sky: fade them out below the horizon so the floor
      // plane stays clean.
      if (y > vp.y) {
        opacity *= Math.max(0, 1 - (y - vp.y) / (vh * 0.12));
      }

      // Keep the field subtle so the timeline reads first.
      opacity *= 0.72;

      if (opacity <= 0.01) continue;

      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(232, 230, 225, ' + opacity.toFixed(3) + ')';
      ctx.fill();
    }

    rafId = requestAnimationFrame(frame);
  }

  resize();
  seed();
  rafId = requestAnimationFrame(frame);

  return {
    resize,
    stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}
