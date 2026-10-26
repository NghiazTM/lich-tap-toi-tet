(() => {
  'use strict';
  const names = { workout: 'Buổi tập', schedule: 'Lịch tuần', progress: 'Tiến độ', music: 'Âm nhạc' };
  const aliases = { main: 'workout', exercises: 'workout', 'timer-card': 'workout', nutrition: 'progress', 'training-tools': 'music' };
  let current = '';
  function show(hash, { scroll = true, focus = false } = {}) {
    const target = String(hash || 'workout').replace(/^#/, '');
    const view = names[target] ? target : aliases[target] || 'workout';
    const changed = current !== view;
    current = view;
    document.querySelectorAll('[data-view]').forEach(panel => {
      const active = panel.dataset.view === view;
      panel.hidden = !active;
      panel.inert = !active;
      if (active && changed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        panel.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'ease-out' });
      }
    });
    document.querySelectorAll('[data-view-link]').forEach(link => {
      const active = link.dataset.viewLink === view;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.getElementById('view-breadcrumb').textContent = names[view];
    document.body.dataset.currentView = view;
    if (scroll) {
      const element = document.getElementById(target);
      if (aliases[target] && element) element.scrollIntoView({ block: 'start', behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (focus) {
      const heading = document.querySelector(`[data-view="${view}"] h1`);
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    document.dispatchEvent(new CustomEvent('nhipview:change', { detail: { view } }));
  }
  function open(target, options) {
    const hash = '#' + target.replace(/^#/, '');
    if (location.hash !== hash) history.pushState(null, '', hash);
    show(hash, options);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = link.getAttribute('href').slice(1);
    if (!names[target] && !aliases[target]) return;
    event.preventDefault();
    open(target, { focus: !!link.dataset.viewLink });
  });
  window.addEventListener('hashchange', () => show(location.hash));
  window.addEventListener('popstate', () => show(location.hash));
  window.NhipView = { open, getState: () => current };
  show(location.hash, { scroll: false });
  document.addEventListener('DOMContentLoaded', () => {
    if (aliases[location.hash.slice(1)]) requestAnimationFrame(() => show(location.hash));
  }, { once: true });
})();
