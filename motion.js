/* ================================================
   MOTION.JS — GSAP + LENIS SCROLL ENGINE
   Opt-in replacement for the vanilla Revealer /
   ParallaxManager / SmoothScroll / SvgPathManager
   stack in shared.js. Only runs on pages that set
   window.__useGsapMotion = true BEFORE shared.js
   loads, and only after this file loads after that.
   Leaves every other page's behavior untouched.
================================================ */

(function () {
  function start() {
    if (!window.gsap || !window.ScrollTrigger || !window.Lenis) {
      console.warn('[motion.js] GSAP/Lenis not found — falling back to vanilla engine.');
      if (typeof Revealer !== 'undefined') Revealer.init();
      if (typeof ParallaxManager !== 'undefined') ParallaxManager.init();
      if (typeof SmoothScroll !== 'undefined') SmoothScroll.init();
      if (typeof SvgPathManager !== 'undefined') SvgPathManager.init();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth <= 900;

    /* ── LENIS SMOOTH SCROLL ─────────────────── */
    let lenis = null;
    if (!isMobile && !reduceMotion) {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    /* ── SCROLL REVEALS (replaces Revealer) ──── */
    // Keeps the exact same [data-reveal] / [data-reveal-delay] authoring
    // model already used across every section of the page, so no HTML
    // changed to get this upgrade — only the engine driving it.
    //
    // Respects prefers-reduced-motion by skipping the animated path
    // entirely and just making everything visible immediately, matching
    // what a person with that OS setting expects site-wide.
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (reduceMotion) {
      revealEls.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
    } else {
      revealEls.forEach((el) => {
        const type = el.dataset.reveal;
        const delayAttr = parseInt(el.dataset.revealDelay || '0', 10);
        const delay = delayAttr * 0.1;

        let fromVars = { opacity: 0 };
        if (type === 'up') fromVars.y = 60;
        else if (type === 'down') fromVars.y = -60;
        else if (type === 'left') fromVars.x = -60;
        else if (type === 'right') fromVars.x = 60;
        else if (type === 'scale') fromVars.scale = 0.85;
        else if (type === 'rotate') { fromVars.rotate = -6; fromVars.y = 40; }
        else if (type === 'blur') fromVars.filter = 'blur(10px)';

        gsap.set(el, fromVars);
        gsap.to(el, {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          rotate: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });
      });
    }

    /* ── PARALLAX (replaces ParallaxManager) ─── */
    // Same speed semantics as the original ParallaxManager (speed * scrollY),
    // just driven by ScrollTrigger's scrub instead of a standalone RAF loop.
    // Uses a plain proxy object + onUpdate rather than animating the element's
    // transform directly, since elements here combine a static base transform
    // (e.g. translate(-50%,-50%) for centering) with the parallax offset —
    // GSAP would otherwise overwrite that base transform on every tick.
    document.querySelectorAll('[data-parallax], [data-parallax-x]').forEach((el) => {
      const speedY = parseFloat(el.dataset.parallax) || 0;
      const speedX = parseFloat(el.dataset.parallaxX) || 0;
      const base = el.dataset.parallaxBase || '';
      if (!speedY && !speedX) return;

      const proxy = { x: 0, y: 0 };
      gsap.to(proxy, {
        x: () => speedX * (document.documentElement.scrollHeight - window.innerHeight),
        y: () => speedY * (document.documentElement.scrollHeight - window.innerHeight),
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
        onUpdate: () => {
          el.style.transform = `${base} translate3d(${proxy.x}px, ${proxy.y}px, 0)`;
        },
      });
    });

    /* ── SVG SCROLL PATH (replaces SvgPathManager) ── */
    // Same path, same visual draw-on direction — now scrubbed off the
    // GSAP/ScrollTrigger timeline instead of a standalone RAF poll that
    // ran unconditionally even off-screen.
    const path = document.getElementById('scrollPath');
    if (path) {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    }

    /* ── HERO NAME — CHARACTER STAGGER ───────── */
    // Extends the existing name-slide keyframe intent (the markup already
    // wraps each letter in spans) into a real stagger instead of one block
    // sliding in as a single unit.
    const heroNameInner = document.querySelector('.hero-name-inner');
    if (heroNameInner && !reduceMotion) {
      const letters = heroNameInner.textContent.split('');
      heroNameInner.innerHTML = letters
        .map((ch) => `<span class="hn-char" style="display:inline-block">${ch}</span>`)
        .join('');
      // Re-apply the accent color to the "V" — it was a nested <span> before
      // the split; find it by character match to keep the same accent rule.
      const chars = heroNameInner.querySelectorAll('.hn-char');
      chars.forEach((c) => {
        if (c.textContent === 'V') c.style.color = 'var(--accent)';
      });
      gsap.set(chars, { y: 110, skewY: 6, opacity: 0 });
      gsap.to(chars, {
        y: 0,
        skewY: 0,
        opacity: 1,
        duration: 0.95,
        ease: 'power4.out',
        stagger: 0.045,
        delay: 0.35,
      });
    }

    /* ── HERO PORTRAIT — CURSOR TILT ─────────── */
    // Uses the page's existing data-tilt utility convention (initTilt() in
    // shared.js already exists for this but nothing used it) — wired here
    // with GSAP quickTo for a smoother settle than the raw style.transform
    // version, matching the smoothing already used on magnetic buttons.
    const portrait = document.querySelector('.hero-portrait');
    if (portrait && !isMobile && !reduceMotion) {
      const xTo = gsap.quickTo(portrait, 'rotateY', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(portrait, 'rotateX', { duration: 0.5, ease: 'power3' });
      gsap.set(portrait, { transformPerspective: 800, transformStyle: 'preserve-3d' });
      portrait.parentElement.addEventListener('mousemove', (e) => {
        const rect = portrait.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        xTo(px * 14);
        yTo(py * -14);
      });
      portrait.parentElement.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
      });
    }

    /* ── WORK ROWS — NUMBER COUNT-IN ─────────── */
    // The rows themselves already carry data-reveal="up" in the markup, so
    // the loop above already animates them with the upgraded GSAP easing —
    // adding a second independent animation (e.g. a clip-path wipe) on the
    // same element would just fight that first one. Instead, give the
    // row numbers (01/02/03/04) a quick count-up tied to the same trigger,
    // since those are plain text nodes the reveal loop doesn't touch.
    document.querySelectorAll('.work-row-num').forEach((numEl) => {
      const target = parseInt(numEl.textContent, 10);
      if (isNaN(target)) return;
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: numEl,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: target,
            duration: 0.6,
            delay: 0.2,
            ease: 'power2.out',
            onUpdate: () => {
              numEl.textContent = String(Math.round(obj.val)).padStart(2, '0');
            },
          });
        },
      });
    });

    /* ── MARQUEE — SCRUB-ACCELERATE ON SCROLL ── */
    // Keeps the existing CSS @keyframes marquee-scroll running at its
    // normal idle pace; layers a brief speed-up tied to scroll velocity so
    // the strip visibly reacts when the person is actively scrolling,
    // rather than running at one constant rate forever.
    const track = document.querySelector('.marquee-track');
    if (track && !reduceMotion) {
      ScrollTrigger.create({
        trigger: track,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = Math.min(Math.abs(self.getVelocity()) / 1500, 1);
          track.style.animationDuration = `${25 - v * 14}s`;
        },
      });
    }

    /* ── REFRESH AFTER INTRO VIDEO/LOADER ────── */
    // IntroManager calls Revealer.refresh() when the intro finishes; give
    // it an equivalent so layout settles correctly once the intro overlay
    // is gone and real heights are known.
    window.addEventListener('load', () => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 1600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();