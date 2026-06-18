/* ================================================
   SHARED JS — SHIVA PORTFOLIO
================================================ */

// ── THEME ──────────────────────────────────────
const ThemeManager = (() => {
  const KEY = 'shiva-theme';
  let current = localStorage.getItem(KEY) || 'dark';

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    current = theme;
    localStorage.setItem(KEY, theme);
    document.querySelectorAll('.theme-icon').forEach(el => {
      el.className = theme === 'dark' ? 'fa-solid fa-sun theme-icon' : 'fa-solid fa-moon theme-icon';
    });
  }

  function toggle() {
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(current);
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { init, toggle, get: () => current };
})();

// ── CURSOR ─────────────────────────────────────
const CursorManager = (() => {
  let mx = -100, my = -100, rx = -100, ry = -100;
  let cursor, trail;

  function init() {
    if (window.innerWidth <= 900) return;
    cursor = document.getElementById('cursor');
    trail = document.getElementById('cursor-trail');
    if (!cursor) return;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    document.addEventListener('mouseenter', () => { if(cursor) cursor.style.opacity = '1'; });
    document.addEventListener('mouseleave', () => { if(cursor) cursor.style.opacity = '0'; });

    document.querySelectorAll('a, button, .btn, .card, .nav-link, .proj-card, .work-item').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    tick();
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    if (cursor) cursor.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    rx = lerp(rx, mx, 0.1); ry = lerp(ry, my, 0.1);
    if (trail) trail.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  }

  return { init };
})();

// ── LOADER ─────────────────────────────────────
const Loader = (() => {
  function init() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    
    // Check if intro is playing; if so, loader should be hidden
    const isRefresh = performance.getEntriesByType('navigation')[0]?.type === 'reload';
    const hasPlayedThisSession = sessionStorage.getItem('shiva-intro-session-played');

    // If it's the first time landing (no session flag) OR it's a refresh, 
    // the IntroManager will handle it, so we hide the loader.
    if (!hasPlayedThisSession || isRefresh) {
      loader.style.display = 'none';
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hide');
        loader.addEventListener('animationend', () => {
          loader.style.display = 'none';
          document.body.style.overflow = '';
        }, { once: true });
      }, 1800);
    });
    document.body.style.overflow = 'hidden';
  }
  return { init };
})();

// ── INTRO MANAGER ──────────────────────────────
const IntroManager = (() => {
  const KEY = 'shiva-intro-session-played';
  
  function init() {
    const intro = document.getElementById('intro-overlay');
    const video = document.getElementById('intro-video');
    const skipBtn = document.getElementById('skip-intro');
    if (!intro || !video) return;

    // Check if it's a refresh or first time in session
    const isRefresh = performance.getEntriesByType('navigation')[0]?.type === 'reload';
    const hasPlayedThisSession = sessionStorage.getItem(KEY);

    if (hasPlayedThisSession && !isRefresh) {
      intro.style.display = 'none';
      return;
    }

    // Prepare for intro
    document.body.style.overflow = 'hidden';
    
    const finishIntro = () => {
      if (intro.classList.contains('hide')) return;
      intro.classList.add('hide');
      sessionStorage.setItem(KEY, 'true');
      
      setTimeout(() => {
        intro.style.display = 'none';
        document.body.style.overflow = '';
        if (typeof Revealer !== 'undefined') Revealer.refresh();
      }, 1200); // match CSS transition
    };

    // Play video
    video.play().catch(err => {
      console.warn("Autoplay blocked or video error:", err);
      finishIntro(); // Fallback if video fails
    });

    video.addEventListener('ended', finishIntro);
    if (skipBtn) skipBtn.addEventListener('click', finishIntro);

    // Safety timeout
    setTimeout(() => {
      if (!intro.classList.contains('hide')) finishIntro();
    }, 15000); // 15s max fallback
  }

  return { init };
})();

// ── SCROLL REVEAL ──────────────────────────────
const Revealer = (() => {
  let obs;
  function init() {
    const els = document.querySelectorAll('[data-reveal]');
    obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
  }
  function refresh() {
    const els = document.querySelectorAll('[data-reveal]:not(.revealed)');
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('revealed');
      }
    });
  }
  return { init, refresh };
})();

// ── PARALLAX MANAGER ───────────────────────────
const ParallaxManager = (() => {
  function init() {
    const els = document.querySelectorAll('[data-parallax], [data-parallax-x]');
    if (els.length === 0) return;

    const tick = () => {
      const scrolled = window.scrollY;
      els.forEach(el => {
        const speedY = parseFloat(el.dataset.parallax) || 0;
        const speedX = parseFloat(el.dataset.parallaxX) || 0;
        const y = scrolled * speedY;
        const x = scrolled * speedX;
        const base = el.dataset.parallaxBase || '';
        
        // Combine transforms if needed, but primarily handle parallax
        // Use translate3d for hardware acceleration
        el.style.transform = `${base} translate3d(${x}px, ${y}px, 0)`;
      });
      requestAnimationFrame(tick);
    };
    tick();
  }
  return { init };
})();

// ── PROGRESS BAR ───────────────────────────────
const ProgressBar = (() => {
  function init() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      bar.style.width = pct + '%';
    });
  }
  return { init };
})();

// ── NAV HIDE ON SCROLL + CURSOR PILL ────────────
const NavManager = (() => {
  let last = 0;

  function initCursor(nav) {
    const cursor = nav.querySelector('.nav-cursor');
    const links = nav.querySelectorAll('.nav-link');
    const list = nav.querySelector('.nav-links');
    if (!cursor || !list) return;

    function moveCursor(el) {
      const rect = el.getBoundingClientRect();
      const parentRect = list.getBoundingClientRect();
      cursor.style.left = (rect.left - parentRect.left) + 'px';
      cursor.style.width = rect.width + 'px';
      cursor.classList.add('show');
    }

    function hideCursor() {
      cursor.classList.remove('show');
    }

    links.forEach(link => {
      link.addEventListener('mouseenter', () => moveCursor(link));
      link.addEventListener('mouseleave', () => {
        const active = list.querySelector('.nav-link.active');
        if (active) {
          moveCursor(active);
        } else {
          hideCursor();
        }
      });
    });

    // Set initial cursor position on the active link
    const active = list.querySelector('.nav-link.active');
    if (active) {
      requestAnimationFrame(() => {
        moveCursor(active);
        cursor.classList.add('show');
      });
    }
  }

  function init() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    initCursor(nav);

    window.addEventListener('scroll', () => {
      const cur = window.scrollY;
      if (cur > last && cur > 80) nav.classList.add('hide');
      else nav.classList.remove('hide');
      last = cur;
    });
  }
  return { init };
})();

// ── PAGE TRANSITIONS ───────────────────────────
const PageTransition = (() => {
  function init() {
    const overlay = document.getElementById('page-overlay');
    if (!overlay) return;

    // Trigger exit animation
    document.querySelectorAll('a[data-transition]').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.href;
        if (!href || href === window.location.href) return;
        e.preventDefault();
        overlay.classList.remove('exit');
        overlay.classList.add('enter');
        overlay.addEventListener('animationend', () => {
          window.location.href = href;
        }, { once: true });
      });
    });

    // Entry animation
    overlay.classList.add('exit');
  }
  return { init };
})();

// ── TEXT SCRAMBLE ───────────────────────────────
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#░▒▓';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise(resolve => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) { complete++; output += to; }
      else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span style="color:var(--accent);opacity:0.6">${char}</span>`;
      } else { output += from; }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) { this.resolve(); }
    else { this.frameRequest = requestAnimationFrame(this.update); this.frame++; }
  }
}

// ── MAGNETIC BUTTONS ───────────────────────────
function initMagnetic() {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

// ── MOBILE MENU ────────────────────────────────
function initMobileMenu() {
  const btn = document.querySelector('.menu-btn');
  const menu = document.querySelector('.mobile-menu');
  if (!btn || !menu) return;
  let open = false;
  btn.addEventListener('click', () => {
    open = !open;
    menu.classList.toggle('open', open);
    const spans = btn.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// ── COUNTER ANIMATION ──────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  if (isNaN(target)) return;
  let start = 0;
  const duration = 1400;
  const step = timestamp => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
}

// ── TILT CARDS ─────────────────────────────────
function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

// ── SMOOTH SCROLL (MOMENTUM) ────────────────────
const SmoothScroll = (() => {
  let target = 0;
  let current = 0;
  let ease = 0.08;
  let wrapper, content;

  function init() {
    if (window.innerWidth <= 900) return; 
    
    wrapper = document.getElementById('smooth-wrapper');
    content = document.getElementById('smooth-content');
    if (!wrapper || !content) return;

    document.body.classList.add('is-smooth-scroll');
    
    // Set initial height
    setTimeout(updateHeight, 500); // Small delay to let images/layouts settle
    window.addEventListener('resize', updateHeight);
    
    // Sync with native scroll
    window.addEventListener('scroll', () => {
      target = window.scrollY;
    }, { passive: true });
    
    tick();
  }

  function updateHeight() {
    if (!content) return;
    document.body.style.height = content.getBoundingClientRect().height + 'px';
  }

  function tick() {
    current = current + (target - current) * ease;
    if (Math.abs(current - target) < 0.01) current = target;
    
    if (content) {
      content.style.transform = `translate3d(0, ${-current}px, 0)`;
    }
    
    requestAnimationFrame(tick);
  }

  return { init, updateHeight: () => setTimeout(updateHeight, 100) };
})();

// ── SVG SCROLL PATH ────────────────────────────
const SvgPathManager = (() => {
  function init() {
    const path = document.getElementById('scrollPath');
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    function update() {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? Math.min(1, scrollY / docH) : 0;
      path.style.strokeDashoffset = length * (1 - progress);
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }
  return { init };
})();

// ── CMS EASTER EGG (triple-click logo) ──────────
const CmsEasterEgg = (() => {
  let clicks = 0;
  let timer = null;

  function init() {
    const logo = document.querySelector('.nav-logo');
    if (!logo) return;
    logo.addEventListener('click', () => {
      clicks++;
      if (clicks === 3) {
        clicks = 0;
        window.location.href = 'shiva-login';
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 600);
    });
  }

  return { init };
})();

// ── INIT ALL ──
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  CursorManager.init();
  CmsEasterEgg.init();
  IntroManager.init();
  Loader.init();
  Revealer.init();
  ParallaxManager.init();
  ProgressBar.init();
  NavManager.init();
  PageTransition.init();
  SmoothScroll.init();
  initMagnetic();
  initMobileMenu();
  initCounters();
  initTilt();
  SmoothScroll.init();
  SvgPathManager.init();
});
