/* Functional Editorial UX — Clean, Minimal, Non-decorative */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Accessible Modal Dialog Attributes
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    const heading = overlay.querySelector('h2, h3');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    if (heading) {
      heading.id = heading.id || overlay.id + '-title';
      overlay.setAttribute('aria-labelledby', heading.id);
    }
  });

  // Mobile Menu Dialog Controls
  const menu = document.getElementById('editorial-menu');
  const trigger = document.getElementById('editorial-menu-toggle');
  let previousFocus;

  function closeMenu() {
    if (menu) {
      menu.close();
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      previousFocus?.focus();
    }
  }

  if (trigger && menu) {
    trigger.addEventListener('click', () => {
      previousFocus = document.activeElement;
      menu.showModal();
      trigger.setAttribute('aria-expanded', 'true');
    });
    document.getElementById('editorial-menu-close')?.addEventListener('click', closeMenu);
    menu.addEventListener('cancel', () => trigger.setAttribute('aria-expanded', 'false'));
    menu.addEventListener('click', e => {
      const nav = e.target.closest('[data-go]');
      if (nav) {
        closeMenu();
        if (typeof navigateTo === 'function') navigateTo(nav.dataset.go);
      }
      if (e.target === menu) closeMenu();
    });
  }

  // Scroll to Top Button — ONLY visible/active on Bài tập (tasks) view
  const scrollBtn = document.getElementById('scroll-top');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      const isSmooth = !(document.body.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      window.scrollTo({ top: 0, behavior: isSmooth ? 'smooth' : 'instant' });
      const main = document.getElementById('main');
      if (main) main.scrollTo({ top: 0, behavior: isSmooth ? 'smooth' : 'instant' });
      const tasksList = document.getElementById('view-tasks');
      if (tasksList) tasksList.scrollTo({ top: 0, behavior: isSmooth ? 'smooth' : 'instant' });
    });

    const updateScrollTop = () => {
      if (document.body.dataset.view !== 'tasks') {
        scrollBtn.classList.remove('visible');
        return;
      }
      const y = window.scrollY || document.documentElement.scrollTop || document.getElementById('view-tasks')?.scrollTop || 0;
      scrollBtn.classList.toggle('visible', y > 200);
    };

    window.addEventListener('scroll', updateScrollTop, { passive: true });
    document.getElementById('view-tasks')?.addEventListener('scroll', updateScrollTop, { passive: true });
  }

  // Display Preferences (Reduced Motion & Large Text)
  const motionCheck = document.getElementById('setting-motion');
  const textCheck = document.getElementById('setting-text');

  function applyPreferences() {
    if (motionCheck) document.body.classList.toggle('reduce-motion', motionCheck.checked);
    if (textCheck) document.body.classList.toggle('large-text', textCheck.checked);
    try {
      localStorage.setItem('homeworkhub_display', JSON.stringify({
        motion: motionCheck ? motionCheck.checked : false,
        text: textCheck ? textCheck.checked : false
      }));
    } catch (_) { }
  }

  try {
    const saved = JSON.parse(localStorage.getItem('homeworkhub_display') || '{}');
    if (motionCheck) motionCheck.checked = !!saved.motion;
    if (textCheck) textCheck.checked = !!saved.text;
  } catch (_) { }

  applyPreferences();
  motionCheck?.addEventListener('change', applyPreferences);
  textCheck?.addEventListener('change', applyPreferences);
});
