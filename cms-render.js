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
    const grid = document.querySelector('.projects-bento');
    if (!grid || !cms.projects || cms.projects.length === 0) return;

    grid.innerHTML = cms.projects.map((proj, i) => {
      const num = String(i + 1).padStart(2, '0');
      const hasUrl = !!proj.url;
      const outerTag = hasUrl ? 'a' : 'div';
      const outerAttr = hasUrl ? `href="${proj.url}" target="_blank"` : '';
      return `
        <${outerTag} ${outerAttr} class="proj-card medium" data-reveal="scale" style="text-decoration:none;color:inherit;display:flex">
          <div class="proj-top">
            <span class="proj-emoji">${proj.emoji || '🚀'}</span>
            <span class="proj-category">${proj.desc ? proj.desc.substring(0, 30) : 'Project'}</span>
          </div>
          <div class="proj-num">${num}</div>
          <div class="proj-name">${proj.name}</div>
          ${proj.features && proj.features.length ? `
          <div class="proj-features">
            ${proj.features.map(f => `<div class="proj-feature">${f}</div>`).join('')}
          </div>` : ''}
          ${proj.tech && proj.tech.length ? `
          <div class="proj-stack">
            ${proj.tech.map(t => `<span class="chip">${t}</span>`).join('')}
          </div>` : ''}
          <div class="proj-footer">
            <span class="proj-problem">${(proj.tech || []).length} technologies</span>
            ${hasUrl ? '<span class="proj-link">View <i class="fa-solid fa-arrow-right"></i></span>' : ''}
          </div>
        </${outerTag}>
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
      const filterBar = document.querySelector('.filter-bar');
      if (filterBar) filterBar.style.display = 'none';
    }
    if (typeof Revealer !== 'undefined') {
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
