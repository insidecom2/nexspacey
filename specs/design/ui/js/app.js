/* Shared behaviors: mobile nav, toasts, modal helpers, demo role switch. */

function renderIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const cls = el.getAttribute('data-icon-class') || 'icon';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = icon(el.dataset.icon, cls);
    const svg = wrapper.firstElementChild;
    if (el.getAttribute('style')) svg.setAttribute('style', el.getAttribute('style'));
    el.replaceWith(svg);
  });
}

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

function initRoleSwitch() {
  const wrap = document.querySelector('.demo-role-switch');
  if (!wrap) return;
  const buttons = wrap.querySelectorAll('button[data-role]');
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.role === Store.role);
    btn.setAttribute('aria-pressed', String(btn.dataset.role === Store.role));
    btn.addEventListener('click', () => {
      Store.setRole(btn.dataset.role);
      const dest = { candidate: 'index.html', employer: 'employer-dashboard.html', admin: 'admin-moderation.html' }[btn.dataset.role];
      window.location.href = dest;
    });
  });
}

const Toast = {
  region() {
    let el = document.querySelector('.toast-region');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-region';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    return el;
  },
  show(message, type = 'default') {
    const el = document.createElement('div');
    el.className = `toast${type !== 'default' ? ' toast-' + type : ''}`;
    const iconName = type === 'success' ? 'checkCircle' : type === 'danger' ? 'alertCircle' : 'info';
    el.innerHTML = `${icon(iconName, 'icon-sm')}<span>${message}</span>`;
    this.region().appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 200ms ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 220);
    }, 3800);
  },
};

const ModalCtl = {
  open(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('is-open');
    overlay._returnFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    const focusable = overlay.querySelector('[data-autofocus]') || overlay.querySelector('button, input, select, textarea, a');
    if (focusable) setTimeout(() => focusable.focus(), 50);
    const keyHandler = (e) => {
      if (e.key === 'Escape') { ModalCtl.close(id); return; }
      if (e.key !== 'Tab') return;
      const focusables = [...overlay.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])')];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    overlay._keyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);
  },
  close(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    if (overlay._returnFocus && typeof overlay._returnFocus.focus === 'function') overlay._returnFocus.focus();
  },
};
document.addEventListener('click', (e) => {
  const overlay = e.target.closest('.modal-overlay');
  if (overlay && e.target === overlay) ModalCtl.close(overlay.id);
  const closeBtn = e.target.closest('[data-modal-close]');
  if (closeBtn) ModalCtl.close(closeBtn.closest('.modal-overlay').id);
});

function showFieldError(group, show) {
  if (!group) return;
  group.classList.toggle('has-error', show);
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.classList.toggle('is-loading', loading);
  btn.disabled = loading;
}

document.addEventListener('DOMContentLoaded', () => {
  renderIcons();
  initNav();
  initRoleSwitch();
});
