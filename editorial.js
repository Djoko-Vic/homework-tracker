/* Continuous Monoline Illustrations & Core Editorial UX */
'use strict';

const MONOLINE_SVGS = {
  dashboard: `<svg class="monoline-art" viewBox="0 0 240 160" fill="none" stroke="#1B1B1B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 140 H220"/>
    <path d="M45 130 C65 115 95 110 120 125 C145 110 175 115 195 130 V65 C175 50 145 45 120 60 C95 45 65 50 45 65 Z"/>
    <path d="M120 60 V125"/>
    <path d="M120 60 C125 50 135 48 138 58 C140 68 128 75 132 85 L136 90 L130 88 L124 90 L128 82"/>
    <path d="M60 80 C75 75 95 75 105 80 M60 95 C75 90 95 90 105 95 M60 110 C75 105 95 105 105 110"/>
    <path d="M135 80 C145 75 165 75 180 80 M140 95 C155 90 165 90 180 95 M140 110 C155 105 165 105 180 110"/>
    <path d="M100 42 C105 32 112 28 120 28 C128 28 135 32 140 42"/>
    <path d="M120 15 V22 M95 24 L101 29 M145 24 L139 29 M82 38 L88 41 M158 38 L152 41"/>
    <g fill="#F4561D" stroke="none">
      <circle cx="120" cy="28" r="4"/>
      <circle cx="50" cy="50" r="3"/>
      <circle cx="190" cy="45" r="3.5"/>
      <circle cx="205" cy="120" r="3"/>
    </g>
  </svg>`,

  students: `<svg class="monoline-art" viewBox="0 0 240 160" fill="none" stroke="#1B1B1B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="75" cy="55" r="18"/>
    <path d="M45 125 C45 95 60 85 75 85 C90 85 105 95 105 125"/>
    <circle cx="125" cy="45" r="18"/>
    <path d="M98 125 C98 90 110 75 125 75 C140 75 152 90 152 125"/>
    <circle cx="170" cy="60" r="16"/>
    <path d="M148 125 C148 98 158 90 170 90 C182 90 195 98 195 125"/>
    <path d="M105 28 L125 20 L145 28 L125 36 Z"/>
    <path d="M145 28 V38 C145 42 148 45 150 45"/>
    <path d="M30 135 H210"/>
    <g fill="#F4561D" stroke="none">
      <circle cx="150" cy="45" r="3"/>
      <circle cx="125" cy="20" r="3.5"/>
      <circle cx="40" cy="80" r="3"/>
      <circle cx="200" cy="70" r="3.5"/>
    </g>
  </svg>`,

  tasks: `<svg class="monoline-art" viewBox="0 0 240 160" fill="none" stroke="#1B1B1B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="55" y="25" width="115" height="125" rx="2"/>
    <path d="M85 25 V18 C85 15 90 12 95 12 H130 C135 12 140 15 140 18 V25 Z"/>
    <circle cx="112" cy="18" r="3"/>
    <path d="M72 50 L77 55 L87 45"/>
    <path d="M96 50 H150"/>
    <path d="M72 75 L77 80 L87 70"/>
    <path d="M96 75 H150"/>
    <path d="M72 100 L77 105 L87 95"/>
    <path d="M96 100 H140"/>
    <path d="M72 125 H84 M96 125 H130"/>
    <path d="M192 45 L175 110 L165 125 L162 112 L178 48 Z"/>
    <path d="M178 48 L185 40 L198 43 L192 45"/>
    <path d="M165 125 L160 130"/>
    <g fill="#F4561D" stroke="none">
      <circle cx="160" cy="130" r="3.5"/>
      <circle cx="198" cy="40" r="3"/>
      <circle cx="45" cy="40" r="3"/>
      <circle cx="48" cy="115" r="3.5"/>
    </g>
  </svg>`,

  streaks: `<svg class="monoline-art" viewBox="0 0 240 160" fill="none" stroke="#1B1B1B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M25 135 H215"/>
    <path d="M120 18 C135 45 160 65 160 95 C160 125 140 135 120 135 C100 135 80 125 80 95 C80 75 95 55 105 45 C105 60 115 70 125 65 C115 50 115 32 120 18 Z"/>
    <path d="M120 58 C130 75 142 85 142 105 C142 120 132 128 120 128 C108 128 98 120 98 105 C98 92 108 80 112 72 C114 80 120 84 124 80 C120 70 118 64 120 58 Z"/>
    <path d="M55 70 L60 65 L65 70 L60 75 Z"/>
    <path d="M185 60 L190 55 L195 60 L190 65 Z"/>
    <path d="M175 105 L178 101 L182 105 L178 108 Z"/>
    <g fill="#F4561D" stroke="none">
      <circle cx="120" cy="18" r="4.5"/>
      <circle cx="120" cy="98" r="3.5"/>
      <circle cx="60" cy="65" r="3"/>
      <circle cx="190" cy="55" r="3.5"/>
      <circle cx="45" cy="115" r="3"/>
    </g>
  </svg>`,

  tuition: `<svg class="monoline-art" viewBox="0 0 240 160" fill="none" stroke="#1B1B1B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M85 140 H155 M120 140 V40"/>
    <path d="M60 48 L120 40 L180 52"/>
    <circle cx="120" cy="40" r="4"/>
    <path d="M60 48 L45 88 M60 48 L75 88"/>
    <path d="M40 88 C40 100 80 100 80 88 Z"/>
    <path d="M180 52 L165 92 M180 52 L195 92"/>
    <path d="M160 92 C160 104 200 104 200 92 Z"/>
    <ellipse cx="60" cy="84" rx="10" ry="4"/>
    <ellipse cx="180" cy="88" rx="10" ry="4"/>
    <g fill="#F4561D" stroke="none">
      <circle cx="120" cy="30" r="3.5"/>
      <circle cx="60" cy="84" r="3"/>
      <circle cx="180" cy="88" r="3"/>
      <circle cx="210" cy="45" r="3.5"/>
      <circle cx="35" cy="55" r="3"/>
    </g>
  </svg>`,

  settings: `<svg class="monoline-art" viewBox="0 0 240 160" fill="none" stroke="#1B1B1B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="120" cy="85" r="36"/>
    <circle cx="120" cy="85" r="18"/>
    <path d="M120 44 V49 M120 121 V126 M79 85 H84 M156 85 H161"/>
    <path d="M91 56 L95 60 M145 110 L149 114 M91 114 L95 110 M145 60 L149 56"/>
    <path d="M50 135 H190"/>
    <path d="M80 130 V140 M120 130 V140 M160 130 V140"/>
    <path d="M120 20 L95 75 M120 20 L145 75"/>
    <circle cx="120" cy="20" r="3.5"/>
    <path d="M102 52 C112 50 128 50 138 52"/>
    <g fill="#F4561D" stroke="none">
      <circle cx="120" cy="85" r="4"/>
      <circle cx="120" cy="14" r="3"/>
      <circle cx="45" cy="65" r="3"/>
      <circle cx="195" cy="70" r="3.5"/>
    </g>
  </svg>`,

  login: `<svg class="monoline-art" viewBox="0 0 240 140" fill="none" stroke="#1B1B1B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M25 125 H215"/>
    <path d="M60 125 H95 M78 125 V45 C78 28 105 25 120 35"/>
    <path d="M105 38 L135 38 L145 54 L95 54 Z"/>
    <path d="M100 58 L82 115 M140 58 L162 115" stroke-dasharray="4 4"/>
    <path d="M95 115 C110 105 125 105 135 110 C145 105 160 105 175 115 V122 C160 112 145 112 135 117 C125 112 110 112 95 122 Z"/>
    <path d="M135 110 V117"/>
    <g fill="#F4561D" stroke="none">
      <circle cx="120" cy="46" r="4"/>
      <circle cx="195" cy="40" r="3.5"/>
      <circle cx="45" cy="65" r="3"/>
    </g>
  </svg>`
};

document.addEventListener('DOMContentLoaded', () => {
  // Inject Purposeful Monoline SVGs into their designated header slots
  const artMap = {
    'art-dashboard': 'dashboard',
    'art-students': 'students',
    'art-tasks': 'tasks',
    'art-streaks': 'streaks',
    'art-tuition': 'tuition',
    'art-settings': 'settings'
  };

  for (const [elId, artKey] of Object.entries(artMap)) {
    const el = document.getElementById(elId);
    if (el && MONOLINE_SVGS[artKey]) {
      el.innerHTML = MONOLINE_SVGS[artKey];
    }
  }

  // Inject Login Monoline SVG into Login Modal if not already present
  const loginBody = document.querySelector('#modal-login .modal-body');
  if (loginBody && !document.getElementById('login-monoline-wrap')) {
    loginBody.insertAdjacentHTML('afterbegin', `
      <div id="login-monoline-wrap" class="login-monoline-banner">
        ${MONOLINE_SVGS.login}
        <div class="login-monoline-text">
          <strong>HỌC HÔM NAY · TIẾN XA NGÀY MAI</strong>
          <span>Đăng nhập hệ thống quản lý học tập HomeworkHub</span>
        </div>
      </div>
    `);
  }

  // Accessible Modal Dialog Attributes
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    const heading = overlay.querySelector('h3');
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

  // Scroll to Top Button (Accent Orange)
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

    window.addEventListener('scroll', () => {
      const y = window.scrollY || document.documentElement.scrollTop || document.getElementById('view-tasks')?.scrollTop || 0;
      scrollBtn.classList.toggle('visible', y > 200);
    }, { passive: true });
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
    } catch (_) {}
  }

  try {
    const saved = JSON.parse(localStorage.getItem('homeworkhub_display') || '{}');
    if (motionCheck) motionCheck.checked = !!saved.motion;
    if (textCheck) textCheck.checked = !!saved.text;
  } catch (_) {}

  applyPreferences();
  motionCheck?.addEventListener('change', applyPreferences);
  textCheck?.addEventListener('change', applyPreferences);
});
