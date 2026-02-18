/**
 * Main navigation and animation controller
 */
(() => {
  // ===== CONFIG =====
  const SCREENS = [
    'landing',
    'year-1', 'year-2', 'year-3', 'year-4', 'year-5',
    'question',
    'rsvp'
  ];
  let currentIndex = 0;
  let transitioning = false;
  let celebrationDone = false;

  // ===== DOM REFS =====
  const navArrows = document.getElementById('nav-arrows');
  const navPrev = document.getElementById('nav-prev');
  const navNext = document.getElementById('nav-next');
  const navDots = document.getElementById('nav-dots');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');

  // ===== INIT =====
  function init() {
    createParticles();
    createNavDots();
    animateLanding();
    bindEvents();
    Confetti.init();
    EvasiveButton.init();
  }

  // ===== PARTICLES (Landing) =====
  function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count = window.innerWidth < 768 ? 30 : 60;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = '-5%';
      p.style.animationDuration = (5 + Math.random() * 10) + 's';
      p.style.animationDelay = (Math.random() * 8) + 's';
      p.style.width = p.style.height = (1 + Math.random() * 2.5) + 'px';
      container.appendChild(p);
    }
  }

  // ===== LANDING ANIMATION =====
  function animateLanding() {
    const tl = gsap.timeline({ delay: 0.3 });
    tl.to('.landing-subtitle', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
      .to('.landing-title', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '-=0.4')
      .to('.btn-begin', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4');

    // Set initial positions
    gsap.set('.landing-subtitle', { y: 20 });
    gsap.set('.landing-title', { y: 30 });
    gsap.set('.btn-begin', { y: 15 });
  }

  // ===== NAV DOTS =====
  function createNavDots() {
    SCREENS.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      navDots.appendChild(dot);
    });
  }

  function updateNav() {
    // Show/hide nav
    if (currentIndex === 0) {
      navArrows.classList.remove('visible');
      progressBar.classList.remove('visible');
    } else {
      navArrows.classList.add('visible');
      progressBar.classList.add('visible');
    }

    // Disable arrows at bounds
    navPrev.disabled = currentIndex <= 1; // Can't go back to landing via arrow
    navNext.disabled = currentIndex >= SCREENS.length - 1;

    // Hide next arrow on question screen (must use YES)
    if (SCREENS[currentIndex] === 'question' && !celebrationDone) {
      navNext.disabled = true;
    }

    // Update dots
    const dots = navDots.querySelectorAll('.nav-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

    // Update progress
    const progress = ((currentIndex) / (SCREENS.length - 1)) * 100;
    progressFill.style.width = progress + '%';
  }

  // ===== NAVIGATION =====
  function goTo(index) {
    if (transitioning || index === currentIndex) return;
    if (index < 0 || index >= SCREENS.length) return;
    // Block going past question without answering YES
    if (SCREENS[index] === 'rsvp' && !celebrationDone) return;

    transitioning = true;
    const fromScreen = document.getElementById(SCREENS[currentIndex]);
    const toScreen = document.getElementById(SCREENS[index]);
    const direction = index > currentIndex ? 1 : -1;

    // Animate out
    const outTl = gsap.timeline();
    outTl.to(fromScreen, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        fromScreen.classList.remove('active');
      }
    });

    // Animate in
    setTimeout(() => {
      toScreen.classList.add('active');
      gsap.set(toScreen, { opacity: 0 });

      const inTl = gsap.timeline({
        onComplete: () => {
          transitioning = false;
          currentIndex = index;
          updateNav();
          // Reset evasive button when arriving at question screen
          if (SCREENS[index] === 'question') {
            EvasiveButton.reset();
          }
        }
      });

      inTl.to(toScreen, { opacity: 1, duration: 0.5, ease: 'power2.out' });

      // Stagger-animate children
      const children = toScreen.querySelectorAll('.year-content > *, .question-content > *, .rsvp-card > *');
      if (children.length) {
        gsap.set(children, { opacity: 0, y: 25 * direction });
        inTl.to(children, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out'
        }, '-=0.2');
      }

      // Special animation for year 5
      if (SCREENS[index] === 'year-5') {
        animateYear5(inTl);
      }
    }, 350);
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function prev() {
    if (currentIndex <= 1) return; // Don't go back to landing
    goTo(currentIndex - 1);
  }

  // ===== YEAR 5 SPECIAL =====
  function animateYear5(tl) {
    // Golden glow pulse
    const bg = document.querySelector('#year-5 .year-bg');
    tl.to(bg, {
      background: 'radial-gradient(ellipse at center, rgba(212, 167, 69, 0.12) 0%, transparent 60%)',
      duration: 1.5,
      ease: 'power2.inOut'
    }, '-=0.3');

    // Small confetti burst
    setTimeout(() => Confetti.burst(40), 600);
  }

  // ===== YES BUTTON =====
  function onYesClick() {
    if (celebrationDone) return;
    celebrationDone = true;

    // Celebration!
    const questionScreen = document.getElementById('question');
    questionScreen.classList.add('celebration-active');
    Confetti.celebrate();

    // Hide the buttons, show transition
    gsap.to('.question-buttons', { opacity: 0, y: -20, duration: 0.5 });
    gsap.to('.denial-message', { opacity: 0, duration: 0.3 });

    // Change question text
    setTimeout(() => {
      const title = document.querySelector('.question-title');
      const text = document.querySelector('.question-text');
      gsap.to([title, text], {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          title.textContent = "I knew it.";
          text.textContent = "Now let me show you what I have planned...";
          gsap.to([title, text], { opacity: 1, duration: 0.5 });
        }
      });
    }, 1500);

    // Auto-advance to RSVP after celebration
    setTimeout(() => {
      goTo(SCREENS.indexOf('rsvp'));
    }, 4000);
  }

  // ===== EVENT BINDING =====
  function bindEvents() {
    // Begin button
    document.getElementById('btn-begin').addEventListener('click', () => goTo(1));

    // Nav arrows
    navPrev.addEventListener('click', prev);
    navNext.addEventListener('click', next);

    // YES button
    document.getElementById('btn-yes').addEventListener('click', onYesClick);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex === 0) goTo(1);
        else next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    });

    // Touch swipe
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      // Only horizontal swipes (ignore vertical scrolling)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) {
          // Swipe left = next
          if (currentIndex === 0) goTo(1);
          else next();
        } else {
          // Swipe right = prev
          prev();
        }
      }
    }, { passive: true });
  }

  // ===== GO =====
  document.addEventListener('DOMContentLoaded', init);
})();
