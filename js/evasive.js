/**
 * Evasive NO button — physics-based RAF simulation
 * Two forces: repulsion from cursor + spring toward home position
 * Works on desktop (mousemove) and touch (touchstart/touchmove on container)
 */
const EvasiveButton = (() => {
  let btn = null;
  let container = null;
  let rafId = null;
  let active = false;
  let clickCount = 0;

  // Physics state
  let posX = 0, posY = 0;       // offset from home
  let velX = 0, velY = 0;
  let homeX = 0, homeY = 0;     // home center in viewport coords
  let cursorX = -9999, cursorY = -9999;

  // Tuning
  const REPULSION_RADIUS = 200;
  const REPULSION_STRENGTH = 2500;
  const SPRING_K = 0.02;
  const DAMPING = 0.88;
  const BOUNCE = -0.4;          // soft bounce off edges
  const IMPULSE_ON_CLICK = 600;

  const DENIAL_MESSAGES = [
    "Request denied.",
    "Nice try.",
    "Error 404: Breakup not found.",
    "Access forbidden.",
    "That button doesn't actually work.",
    "Lol no.",
    "Invalid input. Try the other one.",
    "Connection refused.",
    "Permission denied. Only YES is authorized.",
    "System error: Love cannot be uninstalled."
  ];

  function init() {
    btn = document.getElementById('btn-no');
    container = document.querySelector('.zone--question');
    if (!btn || !container) return;
    btn.addEventListener('click', onClick);
  }

  function activate() {
    if (!btn || active) return;
    active = true;
    posX = 0;
    posY = 0;
    velX = 0;
    velY = 0;
    cursorX = -9999;
    cursorY = -9999;
    recalcHome();
    gsap.set(btn, { x: 0, y: 0 });

    document.addEventListener('mousemove', onPointer);
    container.addEventListener('touchstart', onTouch, { passive: false });
    container.addEventListener('touchmove', onTouch, { passive: false });
    loop();
  }

  function deactivate() {
    active = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.removeEventListener('mousemove', onPointer);
    if (container) {
      container.removeEventListener('touchstart', onTouch);
      container.removeEventListener('touchmove', onTouch);
    }
    // Reset position
    if (btn) gsap.set(btn, { x: 0, y: 0 });
    posX = 0; posY = 0; velX = 0; velY = 0;
  }

  function recalcHome() {
    if (!btn) return;
    // Temporarily reset transform to get true home rect
    gsap.set(btn, { x: 0, y: 0 });
    const rect = btn.getBoundingClientRect();
    homeX = rect.left + rect.width / 2;
    homeY = rect.top + rect.height / 2;
  }

  // --- Input handlers ---
  function onPointer(e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }

  function onTouch(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) {
      cursorX = t.clientX;
      cursorY = t.clientY;
    }
  }

  // --- Physics loop ---
  function loop() {
    if (!active) return;

    // Current button center in viewport
    const cx = homeX + posX;
    const cy = homeY + posY;

    // 1. Repulsion from cursor
    const dx = cx - cursorX;
    const dy = cy - cursorY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist < REPULSION_RADIUS) {
      // Inverse-square-ish: stronger when closer
      const factor = REPULSION_STRENGTH / (dist * dist + 100);
      velX += (dx / dist) * factor;
      velY += (dy / dist) * factor;
    }

    // 2. Spring toward home (always active)
    velX += -SPRING_K * posX;
    velY += -SPRING_K * posY;

    // 3. Damping
    velX *= DAMPING;
    velY *= DAMPING;

    // 4. Integrate
    posX += velX;
    posY += velY;

    // 5. Viewport clamping with soft bounce
    const rect = btn.getBoundingClientRect();
    const hw = rect.width / 2;
    const hh = rect.height / 2;
    const pad = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const worldX = homeX + posX;
    const worldY = homeY + posY;

    if (worldX - hw < pad) {
      posX = pad + hw - homeX;
      velX *= BOUNCE;
    } else if (worldX + hw > vw - pad) {
      posX = vw - pad - hw - homeX;
      velX *= BOUNCE;
    }

    if (worldY - hh < pad) {
      posY = pad + hh - homeY;
      velY *= BOUNCE;
    } else if (worldY + hh > vh - pad) {
      posY = vh - pad - hh - homeY;
      velY *= BOUNCE;
    }

    // 6. Render via GSAP (GPU-accelerated transforms)
    gsap.set(btn, { x: posX, y: posY });

    rafId = requestAnimationFrame(loop);
  }

  // --- Click handler ---
  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    clickCount++;

    // Show denial message
    const msgEl = document.getElementById('denial-message');
    if (msgEl) {
      msgEl.textContent = DENIAL_MESSAGES[clickCount % DENIAL_MESSAGES.length];
      msgEl.classList.add('visible');
      setTimeout(() => msgEl.classList.remove('visible'), 2000);
    }

    // Large velocity impulse — button shoots away visibly
    const angle = Math.random() * Math.PI * 2;
    velX += Math.cos(angle) * IMPULSE_ON_CLICK;
    velY += Math.sin(angle) * IMPULSE_ON_CLICK;

    return false;
  }

  return { init, activate, deactivate };
})();
