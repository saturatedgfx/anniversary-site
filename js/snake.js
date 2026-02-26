/**
 * Snake mini-game — gold snake eats "no" pellets on dark background
 * Canvas-based, arrow keys + swipe for mobile
 * After eating 5 pellets, shows message and reveals YES button
 */
const SnakeGame = (() => {
  let canvas, ctx;
  let running = false;
  let gameOver = false;
  let intervalId = null;

  const GRID = 15;       // grid cells per side
  const SPEED = 140;     // ms per tick
  const WIN_COUNT = 5;

  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let pellet = null;
  let eaten = 0;
  let cellSize = 0;

  // Touch tracking
  let touchStartX = 0, touchStartY = 0;

  function init() {
    canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
  }

  function start() {
    if (!canvas || running) return;
    running = true;
    gameOver = false;
    eaten = 0;

    // Size canvas
    const size = Math.min(300, window.innerWidth - 60);
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    cellSize = size / GRID;

    canvas.classList.add('active');

    // Init snake in center
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };

    spawnPellet();
    bindInput();
    intervalId = setInterval(tick, SPEED);
  }

  function stop() {
    running = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    unbindInput();
    if (canvas) canvas.classList.remove('active');
  }

  function spawnPellet() {
    let attempts = 0;
    do {
      pellet = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID)
      };
      attempts++;
    } while (snake.some(s => s.x === pellet.x && s.y === pellet.y) && attempts < 100);
  }

  function tick() {
    if (!running || gameOver) return;

    dir = { ...nextDir };

    // Move head
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wrap around edges
    if (head.x < 0) head.x = GRID - 1;
    if (head.x >= GRID) head.x = 0;
    if (head.y < 0) head.y = GRID - 1;
    if (head.y >= GRID) head.y = 0;

    // Self-collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      // Reset snake, don't end game
      const mid = Math.floor(GRID / 2);
      snake = [
        { x: mid, y: mid },
        { x: mid - 1, y: mid },
        { x: mid - 2, y: mid }
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      draw();
      return;
    }

    snake.unshift(head);

    // Check pellet
    if (pellet && head.x === pellet.x && head.y === pellet.y) {
      eaten++;
      if (eaten >= WIN_COUNT) {
        gameOver = true;
        stop();
        onWin();
        return;
      }
      spawnPellet();
      // Don't remove tail — snake grows
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(212, 167, 69, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      const p = i * cellSize;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }

    // Pellet — "no" text
    if (pellet) {
      ctx.fillStyle = 'rgba(112, 104, 88, 0.6)';
      ctx.font = `${cellSize * 0.55}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('no', (pellet.x + 0.5) * cellSize, (pellet.y + 0.5) * cellSize);
    }

    // Snake
    snake.forEach((seg, i) => {
      const alpha = 1 - (i / snake.length) * 0.5;
      ctx.fillStyle = i === 0
        ? '#d4a745'
        : `rgba(212, 167, 69, ${alpha})`;
      const pad = 1;
      ctx.fillRect(
        seg.x * cellSize + pad,
        seg.y * cellSize + pad,
        cellSize - pad * 2,
        cellSize - pad * 2
      );
    });

    // Score
    ctx.fillStyle = 'rgba(212, 167, 69, 0.4)';
    ctx.font = `${cellSize * 0.6}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${eaten}/${WIN_COUNT}`, 6, 4);
  }

  function onWin() {
    // Draw final frame
    draw();

    // Show message
    const msgEl = document.getElementById('snake-message');
    if (msgEl) {
      msgEl.textContent = "See? Even the no's disappear.";
      msgEl.classList.add('visible');
    }

    // Hide canvas after a beat
    setTimeout(() => {
      if (canvas) canvas.classList.remove('active');

      // Reveal YES button — large, centered, pulsing
      const yesBtn = document.getElementById('btn-yes');
      const noBtn = document.getElementById('btn-no');
      const buttonsDiv = document.querySelector('.question-buttons');
      if (yesBtn && buttonsDiv) {
        if (noBtn) noBtn.style.display = 'none';
        buttonsDiv.style.opacity = '1';
        yesBtn.classList.add('snake-reveal');
        yesBtn.style.display = '';
        gsap.fromTo(yesBtn,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' }
        );
      }
    }, 2000);
  }

  // ===== INPUT =====
  function onKeyDown(e) {
    switch (e.key) {
      case 'ArrowUp': case 'w':
        if (dir.y !== 1) nextDir = { x: 0, y: -1 };
        e.preventDefault(); break;
      case 'ArrowDown': case 's':
        if (dir.y !== -1) nextDir = { x: 0, y: 1 };
        e.preventDefault(); break;
      case 'ArrowLeft': case 'a':
        if (dir.x !== 1) nextDir = { x: -1, y: 0 };
        e.preventDefault(); break;
      case 'ArrowRight': case 'd':
        if (dir.x !== -1) nextDir = { x: 1, y: 0 };
        e.preventDefault(); break;
    }
  }

  function onTouchStart(e) {
    const t = e.touches[0];
    if (t) { touchStartX = t.clientX; touchStartY = t.clientY; }
  }

  function onTouchEnd(e) {
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) return; // too small

    if (absDx > absDy) {
      // Horizontal swipe
      if (dx > 0 && dir.x !== -1) nextDir = { x: 1, y: 0 };
      else if (dx < 0 && dir.x !== 1) nextDir = { x: -1, y: 0 };
    } else {
      // Vertical swipe
      if (dy > 0 && dir.y !== -1) nextDir = { x: 0, y: 1 };
      else if (dy < 0 && dir.y !== 1) nextDir = { x: 0, y: -1 };
    }
  }

  function bindInput() {
    document.addEventListener('keydown', onKeyDown);
    if (canvas) {
      canvas.addEventListener('touchstart', onTouchStart, { passive: true });
      canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    }
  }

  function unbindInput() {
    document.removeEventListener('keydown', onKeyDown);
    if (canvas) {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    }
  }

  return { init, start, stop };
})();
