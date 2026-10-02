/*
 * Lightweight canvas confetti. Each call adds a full-screen canvas that
 * removes itself once every particle has landed or faded.
 */

const GRAVITY = 820;
// Strong air drag gives the slow, fluttering fall of paper rather than a hail of rocks.
const DRAG = 3.6;
const MAX_DURATION_MS = 4200;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

function createParticle(burst, colors) {
  const angle = toRadians(burst.angle + (Math.random() - 0.5) * 2 * burst.spread);
  const speed = burst.power * (0.62 + Math.random() * 0.5);
  return {
    x: burst.x + (Math.random() - 0.5) * 24,
    y: burst.y + (Math.random() - 0.5) * 12,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 7 + Math.random() * 6,
    ratio: 0.42 + Math.random() * 0.5,
    round: Math.random() < 0.25,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 10,
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 5 + Math.random() * 7,
    sway: Math.random() * Math.PI * 2,
    life: 2.2 + Math.random() * 1.1,
    age: -(burst.delay ?? 0),
  };
}

export function launchConfetti({ bursts, colors }) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  canvas.className = "confetti";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  };
  resize();
  window.addEventListener("resize", resize);

  const particles = bursts.flatMap((burst) =>
    Array.from({ length: burst.count }, () => createParticle(burst, colors)),
  );

  const started = performance.now();
  let last = started;
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    canvas.remove();
  };

  const tick = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const drag = Math.exp(-DRAG * dt);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    let alive = 0;
    for (const p of particles) {
      p.age += dt;
      if (p.age < 0) {
        alive += 1;
        continue;
      }
      if (p.age > p.life || p.y > height + 40) continue;
      alive += 1;
      p.vx *= drag;
      p.vy = (p.vy + GRAVITY * dt) * drag;
      p.x += (p.vx + Math.sin(p.age * 3 + p.sway) * 36) * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
      p.flip += p.flipSpeed * dt;

      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.life - p.age) / 0.6);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, Math.cos(p.flip));
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.38, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, (-p.size * p.ratio) / 2, p.size, p.size * p.ratio);
      }
      ctx.restore();
    }

    if (alive === 0 || now - started > MAX_DURATION_MS) stop();
    else frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
  return stop;
}

/** Confetti bursts that frame a board: a fountain from the top, cannons from the sides. */
export function celebrate(element, colors) {
  const rect = element.getBoundingClientRect();
  const power = Math.min(1900, Math.max(1200, window.innerHeight * 1.9));
  return launchConfetti({
    colors,
    bursts: [
      { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.35, angle: -90, spread: 55, power, count: 90 },
      { x: rect.left, y: rect.top + rect.height * 0.7, angle: -62, spread: 22, power: power * 0.9, count: 34, delay: 0.14 },
      { x: rect.right, y: rect.top + rect.height * 0.7, angle: -118, spread: 22, power: power * 0.9, count: 34, delay: 0.14 },
    ],
  });
}
