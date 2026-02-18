/**
 * Confetti / celebration effect for the YES moment
 */
const Confetti = (() => {
  let canvas, ctx;
  let particles = [];
  let animationId = null;
  let running = false;

  const COLORS = [
    '#d4a745', '#f0d078', '#a07830', // golds
    '#f5f0e8', '#ffffff',             // whites
    '#e8c870', '#c89830'              // warm ambers
  ];

  function init() {
    canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    return {
      x: x || canvas.width / 2,
      y: y || canvas.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.12 + Math.random() * 0.08,
      drag: 0.97 + Math.random() * 0.02,
      opacity: 1,
      fadeSpeed: 0.003 + Math.random() * 0.005,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    };
  }

  function burst(count = 150) {
    if (!canvas) init();
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.4;
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(cx, cy));
    }
    if (!running) {
      running = true;
      animate();
    }
  }

  function rain(duration = 4000) {
    if (!canvas) init();
    const interval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        const p = createParticle(
          Math.random() * canvas.width,
          -10
        );
        p.vy = 2 + Math.random() * 3;
        p.vx = (Math.random() - 0.5) * 2;
        p.gravity = 0.05;
        particles.push(p);
      }
    }, 50);

    setTimeout(() => clearInterval(interval), duration);

    if (!running) {
      running = true;
      animate();
    }
  }

  function celebrate() {
    burst(200);
    setTimeout(() => burst(100), 400);
    setTimeout(() => burst(80), 800);
    rain(3000);
  }

  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.fadeSpeed;

      if (p.opacity <= 0 || p.y > canvas.height + 20) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (particles.length > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      running = false;
    }
  }

  return { init, burst, rain, celebrate };
})();
