/**
 * Story zone: scroll animations, lazy loading, video control, progress bar
 */
const Story = (() => {
  let momentObserver = null;
  let videoObserver = null;
  let storyEndObserver = null;
  let scrollRAF = null;
  let onStoryEndCallback = null;
  let storyEndFired = false;

  function init(onStoryEnd) {
    onStoryEndCallback = onStoryEnd;
    storyEndFired = false;
    detectPortraitImages();
    initMomentObserver();
    initVideoObserver();
    initStoryEndObserver();
    initVideoPlayButtons();
    initScrollProgress();
  }

  // ===== PORTRAIT DETECTION =====
  // Adds .portrait class to single-image .moment-media containers
  // when the image is taller than wide, so CSS can render them narrower.
  function detectPortraitImages() {
    document.querySelectorAll('.moment-media:not(.moment-gallery)').forEach((container) => {
      const img = container.querySelector('img');
      if (!img) return;

      function check() {
        if (img.naturalHeight > img.naturalWidth) {
          container.classList.add('portrait');
        }
      }

      if (img.complete && img.naturalWidth > 0) {
        check();
      } else {
        img.addEventListener('load', check, { once: true });
      }
    });
  }

  function destroy() {
    if (momentObserver) momentObserver.disconnect();
    if (videoObserver) videoObserver.disconnect();
    if (storyEndObserver) storyEndObserver.disconnect();
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    window.removeEventListener('scroll', onScroll);
    pauseAllVideos();
  }

  // ===== MOMENT FADE-IN =====
  function initMomentObserver() {
    const moments = document.querySelectorAll('.moment');
    momentObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('in-view');
          // Stagger children with GSAP
          const children = el.querySelectorAll('.moment-media, .moment-label, .moment-caption, .moment-story-card');
          gsap.fromTo(children,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: 'power2.out',
              delay: 0.1
            }
          );
          momentObserver.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    moments.forEach((m) => momentObserver.observe(m));
  }

  // ===== VIDEO LAZY-LOAD & AUTOPLAY =====
  function initVideoObserver() {
    const videos = document.querySelectorAll('.zone--story video[data-src]');
    videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          // Lazy-load source
          if (video.dataset.src && !video.src) {
            video.src = video.dataset.src;
            video.load();
          }
          // Autoplay muted
          video.muted = true;
          video.play().catch(() => {});
        } else {
          // Pause when scrolled away
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, {
      threshold: 0.5
    });

    videos.forEach((v) => videoObserver.observe(v));
  }

  // ===== STORY END SENTINEL =====
  function initStoryEndObserver() {
    const sentinel = document.getElementById('story-end');
    if (!sentinel) return;

    storyEndObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !storyEndFired) {
          storyEndFired = true;
          if (onStoryEndCallback) {
            // Small delay so user feels the story ending
            setTimeout(() => onStoryEndCallback(), 800);
          }
        }
      });
    }, {
      threshold: 0.1
    });

    storyEndObserver.observe(sentinel);
  }

  // ===== VIDEO PLAY BUTTONS =====
  function initVideoPlayButtons() {
    document.querySelectorAll('.video-play-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = btn.closest('.moment-media--video') || btn.closest('.moment-media');
        const video = container.querySelector('video');
        if (!video) return;

        // Lazy-load if needed
        if (video.dataset.src && !video.src) {
          video.src = video.dataset.src;
          video.load();
        }

        if (video.paused) {
          video.muted = false;
          video.play().catch(() => {});
          btn.classList.add('hidden');
        } else {
          video.pause();
          video.muted = true;
          btn.classList.remove('hidden');
        }

        // Re-show play button when video ends or is paused
        video.addEventListener('pause', () => {
          btn.classList.remove('hidden');
        }, { once: true });

        video.addEventListener('ended', () => {
          btn.classList.remove('hidden');
          video.muted = true;
        }, { once: true });
      });
    });
  }

  // ===== SCROLL PROGRESS =====
  let scrollListenerBound = false;

  function initScrollProgress() {
    if (!scrollListenerBound) {
      window.addEventListener('scroll', onScroll, { passive: true });
      scrollListenerBound = true;
    }
  }

  function onScroll() {
    if (scrollRAF) return;
    scrollRAF = requestAnimationFrame(() => {
      updateScrollProgress();
      scrollRAF = null;
    });
  }

  function updateScrollProgress() {
    const fill = document.getElementById('scroll-progress-fill');
    if (!fill) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    const progress = Math.min(scrollTop / docHeight, 1) * 100;
    fill.style.width = progress + '%';
  }

  // ===== UTILS =====
  function pauseAllVideos() {
    document.querySelectorAll('.zone--story video').forEach((v) => {
      if (!v.paused) v.pause();
    });
  }

  function resetStoryEnd() {
    storyEndFired = false;
  }

  return { init, destroy, pauseAllVideos, resetStoryEnd };
})();
