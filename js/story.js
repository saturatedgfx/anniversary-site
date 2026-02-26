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
    initVideoTapToPause();
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

          // ArtSci reveal effect
          if (el.classList.contains('moment--reveal')) {
            el.classList.add('in-view');
            gsap.fromTo(el,
              { scale: 0.3, opacity: 0, filter: 'blur(8px)' },
              {
                scale: 1,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.8,
                ease: 'back.out(1.4)'
              }
            );
            momentObserver.unobserve(el);
            return;
          }

          // Jumpscare effect
          if (el.classList.contains('moment--jumpscare')) {
            el.classList.add('jumpscare-active');
            // After 1.5s hold, vanish
            setTimeout(() => {
              el.classList.remove('jumpscare-active');
              el.classList.add('jumpscare-gone');
              // Collapse after vanish animation
              setTimeout(() => {
                el.style.height = '0';
                el.style.margin = '0';
                el.style.overflow = 'hidden';
              }, 300);
            }, 1500);
            momentObserver.unobserve(el);
            return;
          }

          // Default fade-in
          el.classList.add('in-view');
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

  // ===== TAP-TO-PAUSE ON VIDEOS =====
  function initVideoTapToPause() {
    document.querySelectorAll('.zone--story video').forEach((video) => {
      video.addEventListener('click', () => {
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
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
