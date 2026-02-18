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

  // Accent icons per year (themed unicode)
  const YEAR_ACCENTS = {
    1: ['\u2728', '\u2764'],           // sparkle, heart
    2: ['\u221E', '\u266B'],           // infinity, music note
    3: ['\u2605', '\u2661'],           // star, heart outline
    4: ['\u2708', '\u2302'],           // plane, house
    5: ['\u265B', '\u2726', '\u2728']  // crown, star, sparkle
  };

  // Carousel state per year
  const carousels = {};

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
    initCarousels();
    initAccentIcons();
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

  // ===== PHOTO CAROUSELS =====
  function initCarousels() {
    document.querySelectorAll('.screen--year').forEach((screen) => {
      const yearNum = screen.dataset.year;
      const frame = screen.querySelector('.photo-frame');
      const carousel = screen.querySelector('.photo-carousel');
      if (!carousel) return;

      const imgs = carousel.querySelectorAll('.photo-img');
      const dotsContainer = frame.querySelector('.photo-dots');

      // Filter to only images that actually loaded
      const state = {
        imgs: Array.from(imgs),
        loaded: [],
        currentIdx: 0,
        dotsContainer: dotsContainer,
        autoTimer: null,
        pauseTimer: null,
        frame: frame,
        screen: screen
      };

      // Track loaded images
      state.imgs.forEach((img, i) => {
        if (img.complete && img.naturalWidth > 0) {
          state.loaded.push(i);
        } else {
          img.addEventListener('load', () => {
            if (!state.loaded.includes(i)) state.loaded.push(i);
            state.loaded.sort((a, b) => a - b);
            buildDots(state);
          });
        }
      });

      // Build initial loaded list for already-loaded images
      setTimeout(() => {
        state.loaded = [];
        state.imgs.forEach((img, i) => {
          if (img.naturalWidth > 0 && img.style.display !== 'none') {
            state.loaded.push(i);
          }
        });
        buildDots(state);

        // If no images loaded, show placeholder
        if (state.loaded.length === 0) {
          frame.classList.add('placeholder');
        }
      }, 100);

      // Swipe within photo frame
      let swipeStartX = 0;
      frame.addEventListener('touchstart', (e) => {
        swipeStartX = e.touches[0].clientX;
      }, { passive: true });

      frame.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - swipeStartX;
        if (Math.abs(dx) > 40) {
          e.stopPropagation(); // prevent screen swipe
          if (dx < 0) advanceCarousel(state, 1);
          else advanceCarousel(state, -1);
          pauseAutoAdvance(state);
        }
      }, { passive: true });

      carousels[yearNum] = state;
    });
  }

  function buildDots(state) {
    const container = state.dotsContainer;
    if (!container) return;
    container.innerHTML = '';
    if (state.loaded.length <= 1) return;

    state.loaded.forEach((imgIdx, dotIdx) => {
      const dot = document.createElement('div');
      dot.className = 'photo-dot' + (imgIdx === state.loaded[state.currentIdx] ? ' active' : '');
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        showSlide(state, dotIdx);
        pauseAutoAdvance(state);
      });
      container.appendChild(dot);
    });
  }

  function showSlide(state, loadedIdx) {
    if (state.loaded.length <= 1) return;
    loadedIdx = ((loadedIdx % state.loaded.length) + state.loaded.length) % state.loaded.length;

    // Deactivate all
    state.imgs.forEach((img) => img.classList.remove('active'));

    // Activate target
    const targetImgIdx = state.loaded[loadedIdx];
    state.imgs[targetImgIdx].classList.add('active');
    state.currentIdx = loadedIdx;

    // Update dots
    const dots = state.dotsContainer.querySelectorAll('.photo-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === loadedIdx));

    // Ken Burns on active photo (only if photo is actually loaded)
    applyKenBurns(state.imgs[targetImgIdx]);
  }

  function advanceCarousel(state, dir) {
    showSlide(state, state.currentIdx + dir);
  }

  function startAutoAdvance(state) {
    stopAutoAdvance(state);
    if (state.loaded.length <= 1) return;
    state.autoTimer = setInterval(() => {
      advanceCarousel(state, 1);
    }, 5000);
  }

  function stopAutoAdvance(state) {
    if (state.autoTimer) { clearInterval(state.autoTimer); state.autoTimer = null; }
    if (state.pauseTimer) { clearTimeout(state.pauseTimer); state.pauseTimer = null; }
  }

  function pauseAutoAdvance(state) {
    stopAutoAdvance(state);
    state.pauseTimer = setTimeout(() => {
      startAutoAdvance(state);
    }, 8000);
  }

  // ===== KEN BURNS =====
  function applyKenBurns(img) {
    if (!img || img.style.display === 'none') return;
    // Pick a random Ken Burns variation
    const variations = ['ken-burns-1', 'ken-burns-2', 'ken-burns-3'];
    const pick = variations[Math.floor(Math.random() * variations.length)];
    // Reset then apply
    img.style.animation = 'none';
    img.offsetHeight; // force reflow
    img.style.animation = `${pick} 8s ease-in-out forwards`;
  }

  // ===== ACCENT ICONS =====
  function initAccentIcons() {
    document.querySelectorAll('.screen--year').forEach((screen) => {
      const yearNum = parseInt(screen.dataset.year);
      const container = screen.querySelector('.year-accent');
      if (!container || !YEAR_ACCENTS[yearNum]) return;

      YEAR_ACCENTS[yearNum].forEach((icon) => {
        const el = document.createElement('span');
        el.className = 'year-accent-icon';
        el.textContent = icon;
        // Random positioning
        el.style.top = (10 + Math.random() * 70) + '%';
        el.style.left = (5 + Math.random() * 85) + '%';
        el.style.fontSize = (1 + Math.random() * 0.8) + 'rem';
        container.appendChild(el);
      });
    });
  }

  function animateAccents(screen) {
    const icons = screen.querySelectorAll('.year-accent-icon');
    icons.forEach((icon, i) => {
      gsap.set(icon, { opacity: 0, y: 10 });
      gsap.to(icon, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.6 + i * 0.15,
        ease: 'power2.out'
      });
      // Gentle bob
      gsap.to(icon, {
        y: '-=6',
        duration: 2 + Math.random(),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1 + i * 0.2
      });
    });
  }

  // ===== TYPEWRITER FOR YEAR LABEL =====
  function typewriterLabel(screen) {
    const label = screen.querySelector('.year-label');
    if (!label) return;
    const text = label.textContent;
    label.textContent = '';
    label.style.visibility = 'visible';

    let idx = 0;
    const interval = setInterval(() => {
      label.textContent += text[idx];
      idx++;
      if (idx >= text.length) clearInterval(interval);
    }, 60);
  }

  // ===== PARALLAX ENTRANCE =====
  function parallaxEntrance(screen, inTl) {
    const photo = screen.querySelector('.year-photo');
    const text = screen.querySelector('.year-text');
    const detail = screen.querySelector('.year-detail');

    if (photo) {
      gsap.set(photo, { opacity: 0, x: -60 });
      inTl.to(photo, { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3');
    }

    if (text) {
      gsap.set(text, { opacity: 0, x: 40 });
      inTl.to(text, { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '-=0.55');
    }

    if (detail) {
      gsap.set(detail, { opacity: 0, y: 15 });
      inTl.to(detail, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
    }
  }

  // ===== NAVIGATION =====
  function goTo(index) {
    if (transitioning || index === currentIndex) return;
    if (index < 0 || index >= SCREENS.length) return;
    // Block going past question without answering YES
    if (SCREENS[index] === 'rsvp' && !celebrationDone) return;

    transitioning = true;
    const fromId = SCREENS[currentIndex];
    const toId = SCREENS[index];
    const fromScreen = document.getElementById(fromId);
    const toScreen = document.getElementById(toId);

    // Deactivate evasive button when leaving question screen
    if (fromId === 'question') {
      EvasiveButton.deactivate();
    }

    // Stop carousel on screen we're leaving
    const fromYear = fromScreen.dataset && fromScreen.dataset.year;
    if (fromYear && carousels[fromYear]) {
      stopAutoAdvance(carousels[fromYear]);
    }

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

          // Activate evasive button on question screen
          if (toId === 'question') {
            EvasiveButton.activate();
          }

          // Start carousel on year screen
          const toYear = toScreen.dataset && toScreen.dataset.year;
          if (toYear && carousels[toYear]) {
            startAutoAdvance(carousels[toYear]);
            // Ken Burns on current active image
            const state = carousels[toYear];
            if (state.loaded.length > 0) {
              const activeImg = state.imgs[state.loaded[state.currentIdx]];
              applyKenBurns(activeImg);
            }
          }
        }
      });

      inTl.to(toScreen, { opacity: 1, duration: 0.5, ease: 'power2.out' });

      // Year screens get parallax entrance + typewriter + accents
      if (toId.startsWith('year-')) {
        parallaxEntrance(toScreen, inTl);
        typewriterLabel(toScreen);
        animateAccents(toScreen);
      } else {
        // Stagger-animate children for non-year screens
        const children = toScreen.querySelectorAll('.question-content > *, .rsvp-card > *');
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

      // Special animation for year 5
      if (toId === 'year-5') {
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

    // Deactivate evasive button
    EvasiveButton.deactivate();

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

    // Touch swipe (screen-level navigation)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTarget = null;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTarget = e.target;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      // Don't trigger screen swipe if the swipe started inside a photo-frame
      if (touchStartTarget && touchStartTarget.closest('.photo-frame')) return;

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
