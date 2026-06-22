/* ================================================
   CMS RENDER — Reads localStorage CMS → Portfolio
   ================================================ */

const CmsRenderer = (() => {
  const STORAGE_KEY = 'shiva-portfolio-cms';

  function loadCMS() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.skills && data.projects) return data;
      }
    } catch (_) {}
    return null;
  }

  function renderSkills(cms) {
    const grid = document.querySelector('.skills-grid');
    if (!grid || !cms.skills || cms.skills.length === 0) return;

    grid.innerHTML = cms.skills.map((skill, i) => `
      <div class="skill-profile-card" data-reveal="scale">
        <div class="spc-glow"></div>
        <div class="spc-top">
          <div class="spc-avatar" style="color:${skill.color || 'var(--accent)'}"><i class="${skill.icon || 'fa-solid fa-code'}"></i></div>
          <div class="spc-status active">
            <div class="spc-status-ping"></div>
            <div class="spc-status-dot"></div>
          </div>
        </div>
        <div class="spc-badge"><i class="fa-solid fa-star"></i></div>
        <div class="spc-name">${skill.category}</div>
        <div class="spc-role">${skill.desc || ''}</div>
        <div class="spc-followers">${(skill.skills || []).length}+ skills mastered</div>
        <div class="spc-tags">
          <span class="spc-tag highlight">Active</span>
        </div>
        <div class="spc-skills">
          ${(skill.skills || []).map(s => `<span class="spc-skill">${s}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  function renderProjects(cms) {
    const grid = document.querySelector('.story-chapters');
    if (!grid || !cms.projects || cms.projects.length === 0) return;

    const colors = ['var(--accent)', 'var(--accent2)', 'var(--accent3)', '#f472b6', '#4ade80', '#fbbf24'];

    grid.innerHTML = cms.projects.map((proj, i) => {
      const num = String(i + 1).padStart(2, '0');
      const hasUrl = !!proj.url;
      const color = colors[i % colors.length];
      const isFaIcon = proj.emoji && proj.emoji.startsWith('fa-');
      const sceneIcon = isFaIcon ? `<i class="fa-solid ${proj.emoji}"></i>` : `<span style="font-size:84px">${proj.emoji || '🚀'}</span>`;
      // Use desc as body text if it's long enough to be a paragraph (>40 chars),
      // otherwise fall back to features array joined into sentences.
      const bodyDesc = proj.desc && proj.desc.length > 40
        ? proj.desc
        : (proj.features || []).join('. ');
      return `
        <article class="story-chapter ${i === 0 ? 'featured' : ''}" data-cat="all" style="--chap-color: ${color}">
          <div class="chapter-scene">${sceneIcon}</div>
          <div class="chapter-content">
            <div class="chapter-eyebrow">
              <span class="chapter-num">Chapter ${num}</span>
              <span class="chapter-tag">${proj.desc ? proj.desc.substring(0, 30) : 'Project'}</span>
              ${i === 0 ? '<span class="chapter-featured-badge"><i class="fa-solid fa-star"></i> Featured</span>' : ''}
            </div>
            <h2 class="chapter-title">${proj.name}</h2>
            ${proj.hook ? `<p class="chapter-lead">${proj.hook}</p>` : ''}
            <p class="chapter-body">${bodyDesc || 'No description available.'}</p>
            ${proj.tech && proj.tech.length ? `
            <div class="chapter-stack">
              ${proj.tech.map(t => `<span class="chip">${t}</span>`).join('')}
            </div>` : ''}
            <div class="chapter-footer">
              <span class="chapter-problem">${(proj.tech || []).length} technologies</span>
              ${hasUrl ? `<a href="${proj.url}" target="_blank" class="chapter-cta">View project <i class="fa-solid fa-arrow-right"></i></a>` : '<span class="chapter-status">Not yet deployed</span>'}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderImage(cms) {
    if (!cms.profileImage) return;
    const heroImg = document.querySelector('.hero-portrait');
    const aboutImg = document.querySelector('.profile-avatar img');
    if (heroImg) heroImg.src = cms.profileImage;
    if (aboutImg) aboutImg.src = cms.profileImage;
  }

  function renderResume(cms) {
    if (!cms.resumeUrl) return;
    document.querySelectorAll('a[href*="drive.google.com"], a.mobile-resume, a.resume-nav-btn').forEach(link => {
      link.href = cms.resumeUrl;
    });
  }

  function init() {
    const page = document.body.dataset.page;
    const cms = loadCMS();
    if (!cms) return;

    renderImage(cms);
    renderResume(cms);
    if (page === 'skills') renderSkills(cms);
    if (page === 'projects') {
      renderProjects(cms);
      const storyIndex = document.querySelector('.story-index');
      if (storyIndex) storyIndex.style.display = 'none';
      if (typeof initStoryChapters === 'function') {
        initStoryChapters(true);
      }
    }
    // Only run the vanilla revealer on pages that aren't using the GSAP motion engine
    // to avoid fighting with ScrollTrigger over the same [data-reveal] elements.
    if (typeof Revealer !== 'undefined' && !window.__useGsapMotion) {
      setTimeout(() => {
        Revealer.init();
        Revealer.refresh();
      }, 100);
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  CmsRenderer.init();
});
