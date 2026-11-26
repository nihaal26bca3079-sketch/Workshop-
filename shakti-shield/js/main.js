/**
 * Shakti Shield — Core UI & Safety Utilities (js/main.js)
 * Handles theme toggle, responsive navbar, privacy banner, Quick Exit,
 * dynamic helpline rendering from data/helplines.json, and language init.
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'shakti_theme';
  const PRIVACY_SESSION_KEY = 'shakti_privacy_dismissed';
  const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather';

  let cachedHelplinesData = null;
  let lastEscapeTime = 0;

  /**
   * Resolve base relative path ('.' for root, '..' for pages/).
   * @returns {string}
   */
  function getBasePath() {
    const meta = document.querySelector('meta[name="shakti-base"]');
    if (meta && meta.content) {
      return meta.content.replace(/\/+$/, '');
    }
    return window.location.pathname.includes('/pages/') ? '..' : '.';
  }

  /**
   * Translate helper using ShaktiLang if ready.
   * @param {string} key
   * @param {string} fallback
   * @returns {string}
   */
  function t(key, fallback) {
    if (window.ShaktiLang && typeof window.ShaktiLang.t === 'function') {
      return window.ShaktiLang.t(key, fallback);
    }
    return fallback;
  }

  /* ------------------------------------------------------------------------
     Theme (Light / Dark Mode)
     ------------------------------------------------------------------------ */
  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function updateThemeButtonUI(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute(
      'aria-label',
      isDark ? t('nav.themeToLight', 'Switch to light mode') : t('nav.themeToDark', 'Switch to dark mode')
    );

    const labelEl = btn.querySelector('[data-theme-label]');
    const iconEl = btn.querySelector('[data-theme-icon]');
    if (labelEl) {
      labelEl.textContent = isDark
        ? t('nav.lightModeLabel', 'Light')
        : t('nav.darkModeLabel', 'Dark');
    }
    if (iconEl) {
      iconEl.textContent = isDark ? '☀' : '☾';
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#1A1022' : '#5B2A86');
    }
  }

  function applyTheme(theme, persist = false) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore storage errors
      }
    }
    updateThemeButtonUI(theme);
  }

  function initTheme() {
    const current = getPreferredTheme();
    applyTheme(current, false);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const active = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        applyTheme(active === 'dark' ? 'light' : 'dark', true);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Responsive Navigation & Active Link
     ------------------------------------------------------------------------ */
  function initNavigation() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');

    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // Highlight active nav item
    const currentPath = window.location.pathname.replace(/\/+$/, '');
    document.querySelectorAll('.nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      try {
        const linkPath = new URL(href, window.location.href).pathname.replace(/\/+$/, '');
        if (
          linkPath === currentPath ||
          (currentPath === '' && linkPath.endsWith('/index.html'))
        ) {
          link.setAttribute('aria-current', 'page');
        }
      } catch {
        // Ignore malformed URLs
      }
    });
  }

  /* ------------------------------------------------------------------------
     Privacy Banner
     ------------------------------------------------------------------------ */
  function initPrivacyBanner() {
    const banner = document.getElementById('privacy-banner');
    const closeBtn = document.getElementById('privacy-dismiss');
    if (!banner) return;

    try {
      if (sessionStorage.getItem(PRIVACY_SESSION_KEY) === '1') {
        banner.hidden = true;
      }
    } catch {
      // Ignore storage errors
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.hidden = true;
        try {
          sessionStorage.setItem(PRIVACY_SESSION_KEY, '1');
        } catch {
          // Ignore storage errors
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     Quick Exit (Button + Double Escape Key)
     ------------------------------------------------------------------------ */
  function triggerQuickExit() {
    window.location.replace(QUICK_EXIT_URL);
  }

  function initQuickExit() {
    document.querySelectorAll('[data-quick-exit]').forEach((btn) => {
      btn.addEventListener('click', triggerQuickExit);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const now = Date.now();
      if (now - lastEscapeTime <= 700) {
        event.preventDefault();
        triggerQuickExit();
        return;
      }
      lastEscapeTime = now;

      // Single Escape closes mobile navigation menu if open
      const menu = document.getElementById('nav-menu');
      const toggle = document.getElementById('nav-toggle');
      if (menu && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------------------------------
     Home Page Verified Helplines Rendering (from data/helplines.json)
     ------------------------------------------------------------------------ */
  function renderHomeHelplines(data) {
    const container = document.getElementById('home-helplines-list');
    if (!container || !data || !Array.isArray(data.helplines)) return;

    container.textContent = '';

    data.helplines.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'helpline-card';

      const info = document.createElement('div');
      info.className = 'helpline-card__info';

      const num = document.createElement('div');
      num.className = 'helpline-card__number';
      num.textContent = item.number;

      const name = document.createElement('p');
      name.className = 'helpline-card__name';
      name.textContent = t(`home.helplines.${item.id}`, item.id);

      if (item.verify) {
        const badge = document.createElement('span');
        badge.className = 'badge-verify';
        badge.textContent = t('common.verifyBadge', 'verify');
        name.appendChild(badge);
      }

      info.appendChild(num);
      info.appendChild(name);

      const callLink = document.createElement('a');
      callLink.href = `tel:${item.number}`;
      callLink.className = item.priority ? 'btn btn-emergency' : 'btn btn-primary';
      const callPrefix = t('common.callPrefix', 'Call');
      callLink.textContent = `${callPrefix} ${item.number}`;
      callLink.setAttribute('aria-label', `${callPrefix} ${item.number} - ${name.textContent}`);

      card.appendChild(info);
      card.appendChild(callLink);
      container.appendChild(card);
    });

    const verifiedEl = document.getElementById('home-helplines-verified');
    if (verifiedEl && data.last_verified) {
      verifiedEl.textContent = t('common.lastVerified', `Last verified: ${data.last_verified}`);
    }
  }

  async function loadHelplinesData() {
    if (cachedHelplinesData) return cachedHelplinesData;
    const fallback = window.SHAKTI_FALLBACK && window.SHAKTI_FALLBACK.data && window.SHAKTI_FALLBACK.data.helplines;
    if (window.location.protocol === 'file:' && fallback) {
      cachedHelplinesData = fallback;
      return cachedHelplinesData;
    }
    try {
      const response = await fetch(`${getBasePath()}/data/helplines.json`);
      if (response.ok) {
        cachedHelplinesData = await response.json();
        return cachedHelplinesData;
      }
    } catch (err) {
      console.error('Unable to load helplines.json:', err);
    }
    if (fallback) {
      cachedHelplinesData = fallback;
    }
    return cachedHelplinesData;
  }

  async function initHomeHelplines() {
    const container = document.getElementById('home-helplines-list');
    if (!container) return;
    const data = await loadHelplinesData();
    if (data) renderHomeHelplines(data);
  }

  /* ------------------------------------------------------------------------
     Incident Guide Wizard (active on pages/incident-guide.html)
     ------------------------------------------------------------------------ */
  let activeIncidentKey = 'stalking';

  function renderIncidentWizard() {
    const wizard = document.getElementById('incident-wizard');
    if (!wizard || !window.ShaktiLang) return;

    const getRaw = window.ShaktiLang.getRaw;
    const detail = getRaw(`incidentGuide.details.${activeIncidentKey}`);
    if (!detail) return;

    const lawEl = document.getElementById('incident-law-ref');
    if (lawEl) {
      lawEl.textContent = detail.lawRef || '';
    }

    const fillList = (id, items) => {
      const ul = document.getElementById(id);
      if (!ul) return;
      ul.textContent = '';
      if (!Array.isArray(items)) return;
      items.forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
      });
    };

    fillList('incident-steps-list', detail.steps);
    fillList('incident-evidence-list', detail.evidence);
    fillList('incident-report-list', detail.report);

    const helplineBox = document.getElementById('incident-helplines-list');
    if (helplineBox && cachedHelplinesData && Array.isArray(cachedHelplinesData.helplines)) {
      helplineBox.textContent = '';
      const ids = Array.isArray(detail.helplineIds) ? detail.helplineIds : [];
      ids.forEach((hid) => {
        const item = cachedHelplinesData.helplines.find((h) => h.id === hid);
        if (!item) return;

        const card = document.createElement('article');
        card.className = 'helpline-card';

        const info = document.createElement('div');
        info.className = 'helpline-card__info';

        const num = document.createElement('div');
        num.className = 'helpline-card__number';
        num.textContent = item.number;

        const name = document.createElement('p');
        name.className = 'helpline-card__name';
        name.textContent = t(`home.helplines.${item.id}`, item.id);

        if (item.verify) {
          const badge = document.createElement('span');
          badge.className = 'badge-verify';
          badge.textContent = t('common.verifyBadge', 'verify');
          name.appendChild(badge);
        }

        info.appendChild(num);
        info.appendChild(name);

        const callLink = document.createElement('a');
        callLink.href = `tel:${item.number}`;
        callLink.className = item.priority ? 'btn btn-emergency' : 'btn btn-primary';
        const callPrefix = t('common.callPrefix', 'Call');
        callLink.textContent = `${callPrefix} ${item.number}`;
        callLink.setAttribute('aria-label', `${callPrefix} ${item.number} - ${name.textContent}`);

        card.appendChild(info);
        card.appendChild(callLink);
        helplineBox.appendChild(card);
      });
    }
  }

  async function initIncidentWizard() {
    const wizard = document.getElementById('incident-wizard');
    if (!wizard) return;

    await loadHelplinesData();

    const tabs = Array.from(wizard.querySelectorAll('[data-incident]'));
    const selectScenario = (key, moveFocus = false) => {
      activeIncidentKey = key;
      tabs.forEach((btn) => {
        const selected = btn.getAttribute('data-incident') === key;
        btn.setAttribute('aria-selected', String(selected));
        btn.setAttribute('tabindex', selected ? '0' : '-1');
        if (selected && moveFocus) btn.focus();
      });
      renderIncidentWizard();
    };

    tabs.forEach((btn, idx) => {
      btn.addEventListener('click', () => selectScenario(btn.getAttribute('data-incident'), false));
      btn.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
        if (next !== null) {
          e.preventDefault();
          selectScenario(tabs[next].getAttribute('data-incident'), true);
        }
      });
    });

    selectScenario(activeIncidentKey, false);
  }

  /* ------------------------------------------------------------------------
     Cyber Safety Centre (active on pages/cyber.html)
     ------------------------------------------------------------------------ */
  const cyberPrivacyChecked = new Set();

  function renderCyberPage() {
    const root = document.getElementById('cyber-page-root');
    if (!root || !window.ShaktiLang) return;

    const getRaw = window.ShaktiLang.getRaw;

    const fillList = (id, key) => {
      const ul = document.getElementById(id);
      if (!ul) return;
      const items = getRaw(key);
      ul.textContent = '';
      if (!Array.isArray(items)) return;
      items.forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
      });
    };

    fillList('cyber-sextortion-steps', 'cyber.threats.sextortion.steps');
    fillList('cyber-fake-steps', 'cyber.threats.fakeProfiles.steps');
    fillList('cyber-deepfake-steps', 'cyber.threats.deepfakes.steps');
    fillList('cyber-reporting-steps', 'cyber.reporting.steps');

    const privacyList = document.getElementById('cyber-privacy-list');
    const progressEl = document.getElementById('cyber-privacy-progress');
    if (privacyList) {
      const items = getRaw('cyber.privacy.items');
      privacyList.textContent = '';
      if (Array.isArray(items)) {
        const updateProgress = () => {
          if (!progressEl) return;
          progressEl.textContent = t('cyber.privacy.progressLabel', '{done} of {total} reviewed')
            .replace('{done}', String(cyberPrivacyChecked.size))
            .replace('{total}', String(items.length));
        };

        items.forEach((text, index) => {
          const li = document.createElement('li');
          const isChecked = cyberPrivacyChecked.has(index);
          li.className = `checklist-item${isChecked ? ' is-checked' : ''}`;

          const inputId = `cyber-priv-${index}`;
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = inputId;
          cb.checked = isChecked;
          cb.addEventListener('change', () => {
            if (cb.checked) {
              cyberPrivacyChecked.add(index);
              li.classList.add('is-checked');
            } else {
              cyberPrivacyChecked.delete(index);
              li.classList.remove('is-checked');
            }
            updateProgress();
          });

          const label = document.createElement('label');
          label.setAttribute('for', inputId);
          label.textContent = text;

          li.appendChild(cb);
          li.appendChild(label);
          privacyList.appendChild(li);
        });

        updateProgress();
      }
    }
  }

  /* ------------------------------------------------------------------------
     Self-Defence Page (active on pages/defence.html)
     ------------------------------------------------------------------------ */
  function renderDefencePage() {
    const root = document.getElementById('defence-page-root');
    if (!root || !window.ShaktiLang) return;

    const getRaw = window.ShaktiLang.getRaw;
    ['stance', 'wrist', 'palm', 'barrier'].forEach((key) => {
      const ul = document.getElementById(`defence-${key}-steps`);
      if (!ul) return;
      const steps = getRaw(`defence.techniques.${key}.steps`);
      ul.textContent = '';
      if (!Array.isArray(steps)) return;
      steps.forEach((step) => {
        const li = document.createElement('li');
        li.textContent = step;
        ul.appendChild(li);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Contact & Feedback Form (Local Validation Only — No Backend)
     ------------------------------------------------------------------------ */
  let lastContactSubmitName = '';

  function initContactForm() {
    const form = document.getElementById('contact-form-page');
    if (!form) return;

    const nameEl = document.getElementById('feedback-name');
    const emailEl = document.getElementById('feedback-email');
    const msgEl = document.getElementById('feedback-message');
    const statusEl = document.getElementById('feedback-status');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!statusEl) return;

      const name = nameEl ? nameEl.value.trim() : '';
      const email = emailEl ? emailEl.value.trim() : '';
      const message = msgEl ? msgEl.value.trim() : '';

      statusEl.className = 'form-error';
      lastContactSubmitName = '';

      if (name.length < 2) {
        statusEl.textContent = t('contact.errName', 'Please enter your name (at least 2 characters).');
        if (nameEl) nameEl.focus();
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        statusEl.textContent = t('contact.errEmail', 'Please enter a valid email address or leave this field blank.');
        if (emailEl) emailEl.focus();
        return;
      }

      if (message.length < 10) {
        statusEl.textContent = t('contact.errMessage', 'Please enter at least 10 characters in your feedback message.');
        if (msgEl) msgEl.focus();
        return;
      }

      lastContactSubmitName = name;
      statusEl.className = 'form-success';
      statusEl.textContent = t(
        'contact.successMsg',
        'Thank you, {name}! Your feedback passed local validation. No data was sent or uploaded.'
      ).replace('{name}', name);
    });

    form.addEventListener('reset', () => {
      lastContactSubmitName = '';
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-error';
      }
    });
  }

  function refreshContactSuccessLanguage() {
    const statusEl = document.getElementById('feedback-status');
    if (statusEl && lastContactSubmitName) {
      statusEl.className = 'form-success';
      statusEl.textContent = t(
        'contact.successMsg',
        'Thank you, {name}! Your feedback passed local validation. No data was sent or uploaded.'
      ).replace('{name}', lastContactSubmitName);
    }
  }

  /* ------------------------------------------------------------------------
     Safe Service Worker Registration (when service-worker.js exists)
     ------------------------------------------------------------------------ */
  async function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!window.location.protocol.startsWith('http')) return;

    const swUrl = `${getBasePath()}/service-worker.js`;
    try {
      const check = await fetch(swUrl, { method: 'HEAD' });
      if (!check.ok) return;
      await navigator.serviceWorker.register(swUrl, { scope: `${getBasePath()}/` });
    } catch {
      // Service worker not yet created or registration unavailable
    }
  }

  /* ------------------------------------------------------------------------
     Bootstrap
     ------------------------------------------------------------------------ */
  document.addEventListener('shakti:langchange', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    updateThemeButtonUI(activeTheme);
    if (cachedHelplinesData) {
      renderHomeHelplines(cachedHelplinesData);
    }
    renderIncidentWizard();
    renderCyberPage();
    renderDefencePage();
    refreshContactSuccessLanguage();
  });

  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initNavigation();
    initPrivacyBanner();
    initQuickExit();

    if (window.ShaktiLang) {
      await window.ShaktiLang.init();
    }

    await initHomeHelplines();
    await initIncidentWizard();
    renderCyberPage();
    renderDefencePage();
    initContactForm();
    initServiceWorker();
  });
})();
