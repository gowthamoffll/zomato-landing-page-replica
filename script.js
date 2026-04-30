/* ============================================================
   ZOMATO — OPTIMIZED script.js
   Integrates cleanly with the new HTML & CSS structure.
   ============================================================ */

'use strict';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

let toastTimer = null;
function showToast(msg, duration = 2800) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────

const modal = {
  backdrop: null,
  currentTab: 'login',

  init() {
    this.backdrop = $('#modal-backdrop');
    if (!this.backdrop) return;

    // Open triggers
    ['#login-btn', '#signup-btn', '#sticky-login-btn', '#sticky-signup-btn'].forEach(sel => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('click', () => {
        const tab = sel.includes('signup') ? 'signup' : 'login';
        this.open(tab);
      });
    });

    // Close
    $('#modal-close-btn')?.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', e => {
      if (e.target === this.backdrop) this.close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close();
    });

    // Tab switching
    $$('.modal-tab').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.id === 'tab-login' ? 'login' : 'signup'));
    });

    // In-modal links
    $$('.modal-link').forEach(link => {
      link.addEventListener('click', () => this.switchTab(link.dataset.tab));
    });

    // Form submissions
    $('#login-submit-btn')?.addEventListener('click', () => this.handleLogin());
    $('#signup-submit-btn')?.addEventListener('click', () => this.handleSignup());

    // Clear errors on input
    $$('.modal-panel input').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('error');
      });
    });
  },

  open(tab = 'login') {
    this.backdrop.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.backdrop.classList.add('open'));
    });
    this.switchTab(tab);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      $(`#panel-${tab} input`)?.focus();
    }, 300);
  },

  close() {
    this.backdrop.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { this.backdrop.hidden = true; }, 250);
    this.clearAllErrors();
  },

  switchTab(tab) {
    this.currentTab = tab;
    $$('.modal-tab').forEach(btn => {
      btn.classList.toggle('active', btn.id === `tab-${tab}`);
      btn.setAttribute('aria-selected', btn.id === `tab-${tab}`);
    });
    $$('.modal-panel').forEach(panel => {
      panel.classList.toggle('hidden', panel.id !== `panel-${tab}`);
    });
    this.clearAllErrors();
  },

  setError(fieldId, errId, message) {
    const field = $(`#${fieldId}`);
    const errEl = $(`#${errId}`);
    if (field) field.classList.add('error');
    if (errEl) errEl.textContent = message;
    field?.focus();
    return false;
  },

  clearAllErrors() {
    $$('.field-error').forEach(el => (el.textContent = ''));
    $$('.field-group input').forEach(el => el.classList.remove('error'));
  },

  handleLogin() {
    const email = $('#login-email')?.value.trim();
    const pass  = $('#login-password')?.value.trim();
    this.clearAllErrors();

    if (!email)               return this.setError('login-email',    'login-email-err', 'Email is required.');
    if (!isValidEmail(email)) return this.setError('login-email',    'login-email-err', 'Enter a valid email address.');
    if (!pass)                return this.setError('login-password', 'login-pass-err',  'Password is required.');

    this.close();
    showToast(`Welcome back! Logged in as ${email} 👋`);
  },

  handleSignup() {
    const name  = $('#signup-name')?.value.trim();
    const email = $('#signup-email')?.value.trim();
    const pass  = $('#signup-password')?.value.trim();
    this.clearAllErrors();

    if (!name)                return this.setError('signup-name',     'signup-name-err',  'Full name is required.');
    if (!email)               return this.setError('signup-email',    'signup-email-err', 'Email is required.');
    if (!isValidEmail(email)) return this.setError('signup-email',    'signup-email-err', 'Enter a valid email address.');
    if (!pass)                return this.setError('signup-password', 'signup-pass-err',  'Password is required.');
    if (pass.length < 6)      return this.setError('signup-password', 'signup-pass-err',  'Minimum 6 characters.');

    this.close();
    showToast(`Welcome to Zomato, ${name}! 🎉`);
  },
};

// ─────────────────────────────────────────
// STICKY NAV
// ─────────────────────────────────────────

function setupStickyNav() {
  const nav  = $('#sticky-nav');
  const hero = $('.hero');
  if (!nav || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => nav.classList.toggle('visible', !entry.isIntersecting),
    { threshold: 0.1 }
  );
  observer.observe(hero);
}

// ─────────────────────────────────────────
// SEARCH — filter localities in real-time
// ─────────────────────────────────────────

function setupSearch() {
  const input     = $('#main-search');
  const clearBtn  = $('#search-clear');
  const localBtns = $$('.locality-btn');
  if (!input) return;

  function filter(q) {
    const query = q.toLowerCase();
    localBtns.forEach(btn => {
      const match = btn.textContent.toLowerCase().includes(query);
      btn.classList.toggle('dimmed',      query !== '' && !match);
      btn.classList.toggle('highlighted', query !== '' && match);
    });
    clearBtn?.classList.toggle('visible', q.length > 0);
  }

  input.addEventListener('input', () => filter(input.value.trim()));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) showToast(`Searching for "${q}" near your location…`);
    }
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    filter('');
    input.focus();
  });
}

// ─────────────────────────────────────────
// LOCALITY BUTTONS
// ─────────────────────────────────────────

function setupLocalityButtons() {
  $$('.locality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const location = btn.textContent.trim();
      const input = $('#main-search');
      if (input) {
        input.value = location;
        input.dispatchEvent(new Event('input'));
      }
      showToast(`Showing restaurants in ${location}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ─────────────────────────────────────────
// CATEGORY & COLLECTION CARDS
// ─────────────────────────────────────────

function setupCards() {
  $$('.cat-card').forEach(card => {
    const activate = () => showToast(`Opening: ${card.dataset.label}`);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  $$('.col-card').forEach(card => {
    const activate = () => showToast(`Browsing: ${card.dataset.label}`);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  $('#all-collections-btn')?.addEventListener('click', () => {
    showToast('Loading all collections in Chennai…');
  });
}

// ─────────────────────────────────────────
// FOOTER LINKS
// ─────────────────────────────────────────

function setupFooter() {
  $$('.footer-col a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showToast(`"${link.textContent}" page coming soon!`);
    });
  });

  $('#country-btn')?.addEventListener('click', () => showToast('Region selector coming soon!'));
  $('#lang-btn')?.addEventListener('click', () => showToast('Language selector coming soon!'));
}

// ─────────────────────────────────────────
// SCROLL REVEAL (IntersectionObserver)
// ─────────────────────────────────────────

function setupScrollReveal() {
  const targets = [
    ...$$('.cat-card'),
    ...$$('.col-card'),
    ...$$('.locality-btn'),
    $('.collections-header'),
    $('.localities-title'),
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    if (el.classList.contains('cat-card') || el.classList.contains('col-card')) {
      el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    }
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  modal.init();
  setupStickyNav();
  setupSearch();
  setupLocalityButtons();
  setupCards();
  setupFooter();
  setupScrollReveal();
});
