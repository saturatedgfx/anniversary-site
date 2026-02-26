/**
 * Evasive NO button — enhanced physics-based RAF simulation
 * Direction-aware fleeing, edge awareness, escalating messages,
 * and Snake mini-game trigger after 60s / 15 clicks
 */
const EvasiveButton = (() => {
  let btn = null;
  let container = null;
  let rafId = null;
  let active = false;
  let clickCount = 0;
  let activatedAt = 0;       // timestamp when activated
  let snakeTriggered = false;

  // Physics state
  let posX = 0, posY = 0;
  let velX = 0, velY = 0;
  let homeX = 0, homeY = 0;
  let cursorX = -9999, cursorY = -9999;

  // Cursor velocity tracking
  let prevCursorX = -9999, prevCursorY = -9999;
  let cursorVelX = 0, cursorVelY = 0;

  // Tuning — enhanced for more responsiveness
  const REPULSION_RADIUS = 300;
  const REPULSION_STRENGTH = 4000;
  const SPRING_K = 0.008;
  const DAMPING = 0.92;
  const BOUNCE = -0.6;
  const IMPULSE_ON_CLICK = 900;
  const EDGE_REPULSION = 800;
  const EDGE_MARGIN = 60;
  const JUKE_STRENGTH = 500;     // perpendicular dodge when cursor approaches fast

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

  const ESCALATION_MESSAGES = [
    "You're really trying, huh?",
    "I admire the persistence.",
    "This button has a restraining order.",
    "You've been at this for a while...",
    "Okay, maybe try a different approach."
  ];

  function init() {
    btn = document.getElementById('btn-no');
    container = document.querySelector('.zone--question');
    if (!btn || !container) return;
    btn.addEventListener('click', onClick);
    SnakeGame.init();
  }

  function activate() {
    if (!btn || active) return;
    active = true;
    snakeTriggered = false;
    clickCount = 0;
    activatedAt = Date.now();
    posX = 0;
    posY = 0;
    velX = 0;
    velY = 0;
    cursorX = -9999;
    cursorY = -9999;
    prevCursorX = -9999;
    prevCursorY = -9999;
    cursorVelX = 0;
    cursorVelY = 0;
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
    if (btn) gsap.set(btn, { x: 0, y: 0 });
    posX = 0; posY = 0; velX = 0; velY = 0;
  }

  function recalcHome() {
    if (!btn) return;
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

    // Track cursor velocity
    if (prevCursorX !== -9999) {
      cursorVelX = cursorX - prevCursorX;
      cursorVelY = cursorY - prevCursorY;
    }
    prevCursorX = cursorX;
    prevCursorY = cursorY;

    // Current button center in viewport
    const cx = homeX + posX;
    const cy = homeY + posY;

    // 1. Repulsion from cursor position
    const dx = cx - cursorX;
    const dy = cy - cursorY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist < REPULSION_RADIUS) {
      const factor = REPULSION_STRENGTH / (dist * dist + 100);
      velX += (dx / dist) * factor;
      velY += (dy / dist) * factor;

      // 2. Direction-aware juke — perpendicular dodge when cursor approaches fast
      const cursorSpeed = Math.sqrt(cursorVelX * cursorVelX + cursorVelY * cursorVelY);
      if (cursorSpeed > 5) {
        // Check if cursor is moving toward button
        const dotProduct = (-dx * cursorVelX + -dy * cursorVelY) / (dist * cursorSpeed);
        if (dotProduct > 0.3) {
          // Cursor approaching — apply perpendicular impulse (juke)
          const perpX = -cursorVelY / cursorSpeed;
          const perpY = cursorVelX / cursorSpeed;
          const jukeDir = Math.random() > 0.5 ? 1 : -1;
          const jukeFactor = JUKE_STRENGTH * dotProduct / (dist + 50);
          velX += perpX * jukeDir * jukeFactor;
          velY += perpY * jukeDir * jukeFactor;
        }
      }
    }

    // 3. Spring toward home
    velX += -SPRING_K * posX;
    velY += -SPRING_K * posY;

    // 4. Edge awareness — repulsion from viewport edges
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (cx < EDGE_MARGIN) {
      velX += EDGE_REPULSION / (cx * cx + 100);
    } else if (cx > vw - EDGE_MARGIN) {
      velX -= EDGE_REPULSION / ((vw - cx) * (vw - cx) + 100);
    }

    if (cy < EDGE_MARGIN) {
      velY += EDGE_REPULSION / (cy * cy + 100);
    } else if (cy > vh - EDGE_MARGIN) {
      velY -= EDGE_REPULSION / ((vh - cy) * (vh - cy) + 100);
    }

    // 5. Damping
    velX *= DAMPING;
    velY *= DAMPING;

    // 6. Integrate
    posX += velX;
    posY += velY;

    // 7. Viewport clamping with energetic bounce
    const rect = btn.getBoundingClientRect();
    const hw = rect.width / 2;
    const hh = rect.height / 2;
    const pad = 10;

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

    // 8. Render
    gsap.set(btn, { x: posX, y: posY });

    // 9. Check snake trigger (60s elapsed or 15+ clicks)
    if (!snakeTriggered) {
      const elapsed = (Date.now() - activatedAt) / 1000;
      if (elapsed >= 60 || clickCount >= 15) {
        triggerSnake();
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  // --- Click handler ---
  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    clickCount++;

    // Show denial message — escalating after 5 clicks
    const msgEl = document.getElementById('denial-message');
    if (msgEl) {
      let msg;
      if (clickCount > 5) {
        const escIdx = (clickCount - 6) % ESCALATION_MESSAGES.length;
        msg = ESCALATION_MESSAGES[escIdx];
      } else {
        msg = DENIAL_MESSAGES[clickCount % DENIAL_MESSAGES.length];
      }
      msgEl.textContent = msg;
      msgEl.classList.add('visible');
      setTimeout(() => msgEl.classList.remove('visible'), 2000);
    }

    // Large velocity impulse
    const angle = Math.random() * Math.PI * 2;
    velX += Math.cos(angle) * IMPULSE_ON_CLICK;
    velY += Math.sin(angle) * IMPULSE_ON_CLICK;

    return false;
  }

  // --- Snake mini-game trigger ---
  function triggerSnake() {
    snakeTriggered = true;

    // Show transition message
    const msgEl = document.getElementById('denial-message');
    if (msgEl) {
      msgEl.textContent = "Fine. Try a different approach.";
      msgEl.classList.add('visible');
    }

    // Fade out buttons
    const buttonsDiv = document.querySelector('.question-buttons');
    if (buttonsDiv) {
      gsap.to(buttonsDiv, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => {
          // Deactivate evasive physics (stop moving NO button)
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
          document.removeEventListener('mousemove', onPointer);
          if (container) {
            container.removeEventListener('touchstart', onTouch);
            container.removeEventListener('touchmove', onTouch);
          }

          // Hide denial message
          if (msgEl) {
            setTimeout(() => msgEl.classList.remove('visible'), 500);
          }

          // Start snake game
          SnakeGame.start();
        }
      });
    }
  }

  return { init, activate, deactivate };
})();
