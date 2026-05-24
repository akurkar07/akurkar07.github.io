(() => {
  function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    const label = document.getElementById("theme-label");
    if (label) {
      label.textContent = theme === "dark" ? "light mode" : "dark mode";
    }
  }

  function drawTimelineBackgrounds() {
    document.querySelectorAll(".timeline-bg").forEach((canvas, index) => {
      drawChip(canvas, index * 17 + 1);
    });
  }

  function toggleTheme() {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
    drawHero();
    drawTimelineBackgrounds();
  }

  function themeColors() {
    const styles = getComputedStyle(document.body);
    return {
      bg: styles.getPropertyValue("--bg-color").trim() || "#0d0b14",
      bgVar: styles.getPropertyValue("--bg-variant").trim() || "#1a1525",
      primary: styles.getPropertyValue("--primary").trim() || "#a78bfa",
      secondary: styles.getPropertyValue("--secondary").trim() || "#8a3ffc",
    };
  }

  function showSteamPuff(x, y) {
    const puff = document.createElement("img");
    const driftX = Math.round((Math.random() - 0.5) * 48);
    const rise = Math.round(24 + Math.random() * 28);
    const rotation = Math.round((Math.random() - 0.5) * 18);

    puff.src = "image.png";
    puff.alt = "";
    puff.className = "steam-puff";
    puff.setAttribute("aria-hidden", "true");
    puff.style.setProperty("--steam-x", `${x}px`);
    puff.style.setProperty("--steam-y", `${y}px`);
    puff.style.setProperty("--steam-drift-x", `${driftX}px`);
    puff.style.setProperty("--steam-rise", `${rise}px`);
    puff.style.setProperty("--steam-rotate", `${rotation}deg`);

    document.body.appendChild(puff);
    puff.addEventListener("animationend", () => puff.remove(), { once: true });
  }

  function bindSteamTrigger() {
    const trigger = document.querySelector(".steam-trigger");
    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", (event) => {
      showSteamPuff(event.clientX, event.clientY);
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      const rect = trigger.getBoundingClientRect();
      showSteamPuff(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  }

  function prng(seed) {
    return function random() {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 0xffffffff;
    };
  }

  function drawChip(canvas, seed) {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth || canvas.parentElement.offsetWidth || 200;
    const height = canvas.offsetHeight || canvas.parentElement.offsetHeight || 80;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const random = prng(seed ^ 0xdead);
    const colors = themeColors();

    ctx.fillStyle = colors.bgVar;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = colors.bgVar;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.secondary;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(2.5, 2.5, width - 5, height - 5);
    ctx.strokeRect(4.5, 4.5, width - 9, height - 9);
    ctx.globalAlpha = 1;

    const minSize = Math.max(12, Math.min(width, height) * 0.18);
    const blocks = [];

    function split(x, y, blockWidth, blockHeight, depth) {
      if (depth <= 0 || blockWidth < minSize * 2 || blockHeight < minSize * 2) {
        if (blockWidth >= minSize && blockHeight >= minSize) {
          blocks.push({ x, y, w: blockWidth, h: blockHeight });
        }
        return;
      }

      if (random() < 0.45) {
        const cut = Math.round(blockWidth * (0.3 + random() * 0.4));
        split(x, y, cut, blockHeight, depth - 1);
        split(x + cut, y, blockWidth - cut, blockHeight, depth - 1);
        return;
      }

      const cut = Math.round(blockHeight * (0.3 + random() * 0.4));
      split(x, y, blockWidth, cut, depth - 1);
      split(x, y + cut, blockWidth, blockHeight - cut, depth - 1);
    }

    const padding = 6;
    split(padding, padding, width - padding * 2, height - padding * 2, 4);

    blocks.forEach((block) => {
      ctx.fillStyle = colors.bgVar;
      ctx.globalAlpha = 0.2 + random() * 0.2;
      ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = colors.secondary;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(block.x + 0.5, block.y + 0.5, block.w - 1, block.h - 1);
      ctx.globalAlpha = 1;

      const kind = random();
      if (kind < 0.3 && block.w > 20 && block.h > 20) {
        ctx.strokeStyle = colors.secondary;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 0.5;
        for (let lineY = block.y + 3; lineY < block.y + block.h - 2; lineY += 2) {
          ctx.beginPath();
          ctx.moveTo(block.x + 2, lineY + 0.5);
          ctx.lineTo(block.x + block.w - 2, lineY + 0.5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (kind < 0.55 && block.w > 16 && block.h > 16) {
        ctx.fillStyle = colors.primary;
        ctx.globalAlpha = 0.4;
        const step = 3 + Math.floor(random() * 2);
        for (let y = block.y + 4; y < block.y + block.h - 3; y += step) {
          for (let x = block.x + 4; x < block.x + block.w - 3; x += step) {
            ctx.fillRect(x, y, 1.2, 1.2);
          }
        }
        ctx.globalAlpha = 1;
      } else if (kind < 0.75) {
        ctx.globalAlpha = 0.25;
        for (let offset = 3; offset < Math.min(block.w, block.h) / 2 - 2; offset += 4) {
          ctx.strokeStyle = colors.secondary;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(
            block.x + offset + 0.5,
            block.y + offset + 0.5,
            block.w - offset * 2 - 1,
            block.h - offset * 2 - 1
          );
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = 0.5;
      [
        [block.x + 2, block.y + 2],
        [block.x + block.w - 4, block.y + 2],
        [block.x + 2, block.y + block.h - 4],
        [block.x + block.w - 4, block.y + block.h - 4],
      ].forEach(([x, y]) => {
        ctx.fillRect(x, y, 1.5, 1.5);
      });
      ctx.globalAlpha = 1;
    });

    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 0.7;
    for (let index = 0; index < blocks.length; index += 1) {
      const current = blocks[index];
      const next = blocks[(index + 1 + Math.floor(random() * 2)) % blocks.length];
      const currentX = current.x + current.w / 2;
      const currentY = current.y + current.h;
      const nextX = next.x + next.w / 2;
      const nextY = next.y;
      ctx.strokeStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX, (currentY + nextY) / 2);
      ctx.lineTo(nextX, (currentY + nextY) / 2);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();
      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(currentX - 1, currentY - 1, 2, 2);
      ctx.fillRect(nextX - 1, nextY - 1, 2, 2);
      ctx.globalAlpha = 0.18;
    }
    ctx.globalAlpha = 1;
  }

  function drawHero() {
    const canvas = document.getElementById("page-hero");
    if (!canvas) {
      return;
    }

    drawChip(canvas, 0xc0ffee);
  }

  function sizePcie() {
    const pcie = document.querySelector(".page-hero-pcie");
    const wrap = document.querySelector(".page-hero-wrap");
    const nav = document.querySelector(".breadcrumb");
    if (!pcie || !wrap || !nav) {
      return;
    }

    const wrapRect = wrap.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const gap = wrapRect.top - navRect.bottom;
    if (navRect.width === 0 || gap < 6) {
      pcie.style.display = "none";
      return;
    }

    pcie.style.display = "";
    pcie.style.left = "0";
    pcie.style.width = `${wrapRect.width}px`;
    pcie.style.top = `${navRect.bottom - wrapRect.top + 5}px`;
    pcie.style.height = `${gap - 5}px`;
    pcie.style.setProperty("--menu-offset-x", `${navRect.left - wrapRect.left}px`);
    pcie.style.setProperty("--menu-width", `${navRect.width}px`);
  }

  function init() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }
    bindSteamTrigger();

    drawHero();
    drawTimelineBackgrounds();
    sizePcie();

    window.addEventListener("resize", () => {
      drawHero();
      sizePcie();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sizePcie);
    }

    new MutationObserver(() => {
      drawHero();
      drawTimelineBackgrounds();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  applyTheme(localStorage.getItem("theme") || "dark");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
