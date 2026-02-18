/**
 * Evasive NO button logic
 * The NO button dodges the cursor/finger and shows funny denial messages if clicked.
 */
const EvasiveButton = (() => {
  let btn = null;
  let isEvading = false;
  let evadeCount = 0;
  let clickCount = 0;

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
    if (!btn) return;

    // Desktop: mouse proximity detection
    document.addEventListener('mousemove', onMouseMove);

    // Mobile: touch events
    btn.addEventListener('touchstart', onTouch, { passive: false });

    // Click handler (in case they somehow get it)
    btn.addEventListener('click', onClick);
  }

  function onMouseMove(e) {
    if (!btn || !isQuestionActive()) return;

    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);

    // Start evading when mouse is within 120px
    if (dist < 120) {
      evade(e.clientX, e.clientY);
    }
  }

  function onTouch(e) {
    if (!isQuestionActive()) return;
    e.preventDefault();
    const touch = e.touches[0];
    evade(touch.clientX, touch.clientY);
  }

  function evade(cursorX, cursorY) {
    if (!btn) return;
    evadeCount++;

    if (!isEvading) {
      isEvading = true;
      btn.classList.add('evading');
    }

    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    // Calculate escape vector (away from cursor)
    let dx = btnCenterX - cursorX;
    let dy = btnCenterY - cursorY;
    const dist = Math.hypot(dx, dy) || 1;
    dx /= dist;
    dy /= dist;

    // Movement distance increases with evade count
    const moveDistance = 80 + Math.min(evadeCount * 15, 200);

    let newX = btnCenterX + dx * moveDistance;
    let newY = btnCenterY + dy * moveDistance;

    // Keep within viewport with padding
    const pad = 60;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // If it would go offscreen, teleport to a random position
    if (newX < pad || newX > vw - pad || newY < pad || newY > vh - pad || evadeCount > 8) {
      newX = pad + Math.random() * (vw - pad * 2);
      newY = pad + Math.random() * (vh - pad * 2);

      // Don't land too close to the cursor
      const newDist = Math.hypot(newX - cursorX, newY - cursorY);
      if (newDist < 150) {
        newX = vw - newX;
        newY = vh - newY;
      }

      evadeCount = 0;
    }

    // Apply position
    btn.style.left = `${newX - rect.width / 2}px`;
    btn.style.top = `${newY - rect.height / 2}px`;

    // Shrink slightly as they persist
    const scale = Math.max(0.5, 1 - evadeCount * 0.05);
    btn.style.transform = `scale(${scale})`;
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    clickCount++;

    const msgEl = document.getElementById('denial-message');
    if (!msgEl) return;

    const msg = DENIAL_MESSAGES[clickCount % DENIAL_MESSAGES.length];
    msgEl.textContent = msg;
    msgEl.classList.add('visible');

    // Hide after 2 seconds
    setTimeout(() => {
      msgEl.classList.remove('visible');
    }, 2000);

    // Teleport away
    evadeCount = 10;
    evade(e.clientX, e.clientY);

    return false;
  }

  function reset() {
    if (!btn) return;
    isEvading = false;
    evadeCount = 0;
    btn.classList.remove('evading');
    btn.style.left = '';
    btn.style.top = '';
    btn.style.transform = '';
  }

  function isQuestionActive() {
    const questionScreen = document.getElementById('question');
    return questionScreen && questionScreen.classList.contains('active');
  }

  return { init, reset };
})();
