/**
 * Main zone controller — replaces old screen carousel system
 * Zones: landing → story (scroll) → question → rsvp → postcredits
 */
(() => {
  let currentZone = 'landing';
  let celebrationDone = false;

  // ===== DOM REFS =====
  const zones = {
    landing: document.getElementById('landing'),
    story: document.getElementById('story'),
    question: document.getElementById('question'),
    rsvp: document.getElementById('rsvp'),
    postcredits: document.getElementById('postcredits')
  };

  const scrollProgress = document.getElementById('scroll-progress');

  // ===== INIT =====
  function init() {
    createParticles();
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
    gsap.set('.landing-subtitle', { y: 20 });
    gsap.set('.landing-title', { y: 30 });
    gsap.set('.btn-begin', { y: 15 });

    const tl = gsap.timeline({ delay: 0.3 });
    tl.to('.landing-subtitle', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
      .to('.landing-title', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '-=0.4')
      .to('.btn-begin', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4');
  }

  // ===== ZONE CONTROLLER =====
  function enterZone(zone) {
    if (zone === currentZone) return;

    const fromEl = zones[currentZone];
    const toEl = zones[zone];
    if (!toEl) return;

    // Block rsvp without celebration
    if (zone === 'rsvp' && !celebrationDone) return;

    // Deactivate evasive button when leaving question
    if (currentZone === 'question') {
      EvasiveButton.deactivate();
    }

    // Pause story videos when leaving story
    if (currentZone === 'story') {
      Story.pauseAllVideos();
    }

    // --- Transition out ---
    if (currentZone === 'story') {
      // Story zone: just hide it
      fromEl.classList.remove('active');
      scrollProgress.classList.remove('visible');
    } else if (fromEl) {
      gsap.to(fromEl, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          fromEl.classList.remove('active');
        }
      });
    }

    // --- Update body class ---
    const isScrollZone = (zone === 'story');
    document.body.className = isScrollZone ? 'zone-b' : 'zone-c';
    if (zone === 'landing') document.body.className = 'zone-a';

    // --- Transition in ---
    const delay = currentZone === 'story' ? 0 : 350;
    setTimeout(() => {
      toEl.classList.add('active');

      if (zone === 'story') {
        // Scroll to top
        window.scrollTo(0, 0);
        scrollProgress.classList.add('visible');
        // Init story scroll observers
        Story.init(onStoryEnd);
      } else {
        // Fixed zones: GSAP entrance
        gsap.set(toEl, { opacity: 0 });
        const inTl = gsap.timeline({
          onComplete: () => {
            if (zone === 'question') {
              EvasiveButton.activate();
            }
          }
        });

        inTl.to(toEl, { opacity: 1, duration: 0.5, ease: 'power2.out' });

        // Stagger-animate children
        const contentSelector = {
          question: '.question-title, .question-text, .question-buttons',
          rsvp: '.rsvp-card > *, .postcredits-hint',
          postcredits: '.postcredits-content > *'
        };

        const selector = contentSelector[zone];
        if (selector) {
          const children = toEl.querySelectorAll(selector);
          if (children.length) {
            gsap.set(children, { opacity: 0, y: 25 });
            inTl.to(children, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: 'power2.out'
            }, '-=0.2');
          }
        }

        // Post-credits special: auto-play video after entrance
        if (zone === 'postcredits') {
          setTimeout(() => {
            const video = document.getElementById('postcredits-video');
            if (video) {
              video.play().catch(() => {});
            }
          }, 1500);
        }

        // RSVP: show "one more thing" hint after 8s
        if (zone === 'rsvp') {
          setTimeout(() => {
            const hint = document.getElementById('postcredits-hint');
            if (hint) hint.classList.add('visible');
          }, 8000);
        }
      }

      currentZone = zone;
    }, delay);
  }

  // ===== STORY END → QUESTION =====
  function onStoryEnd() {
    enterZone('question');
  }

  // ===== YES BUTTON =====
  function onYesClick() {
    if (celebrationDone) return;
    celebrationDone = true;

    EvasiveButton.deactivate();

    const questionScreen = zones.question;
    questionScreen.classList.add('celebration-active');
    Confetti.celebrate();

    gsap.to('.question-buttons', { opacity: 0, y: -20, duration: 0.5 });
    gsap.to('.denial-message', { opacity: 0, duration: 0.3 });

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

    // Auto-advance to RSVP
    setTimeout(() => {
      enterZone('rsvp');
    }, 4000);
  }

  // ===== EVENT BINDING =====
  function bindEvents() {
    // Begin button → enter story
    document.getElementById('btn-begin').addEventListener('click', () => {
      enterZone('story');
    });

    // YES button
    document.getElementById('btn-yes').addEventListener('click', onYesClick);

    // Post-credits hint
    const hintBtn = document.getElementById('postcredits-hint');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        enterZone('postcredits');
      });
    }

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (currentZone === 'landing') {
          enterZone('story');
        }
      }
    });
  }

  // ===== FOG REVEAL (RSVP surprise items) =====
  function initFogReveal() {
    document.addEventListener('pointerdown', (e) => {
      const fog = e.target.closest('.rsvp-fogged .rsvp-fog-content');
      if (!fog) return;
      fog.classList.add('revealing');
      fog.setPointerCapture(e.pointerId);
    });

    document.addEventListener('pointerup', (e) => {
      const fog = e.target.closest('.rsvp-fogged .rsvp-fog-content');
      if (fog) fog.classList.remove('revealing');
    });

    document.addEventListener('pointercancel', (e) => {
      const fog = e.target.closest('.rsvp-fogged .rsvp-fog-content');
      if (fog) fog.classList.remove('revealing');
    });

    document.addEventListener('pointerleave', (e) => {
      const fog = e.target.closest('.rsvp-fogged .rsvp-fog-content');
      if (fog) fog.classList.remove('revealing');
    }, true);
  }

  // ===== GO =====
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initFogReveal();
  });
})();
