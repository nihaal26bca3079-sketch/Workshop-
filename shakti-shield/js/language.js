/**
 * Shakti Shield — Multilingual Engine (js/language.js)
 * Loads en.json first, fetches the selected language on demand,
 * falls back to English for missing keys, updates DOM without reload,
 * switches <html lang>, document.title, meta description, and active font.
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'shakti_lang';

  const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', label: 'English' },
    { code: 'hi', name: 'Hindi', label: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', label: 'বাংলা' },
    { code: 'ta', name: 'Tamil', label: 'தமிழ்' },
    { code: 'kn', name: 'Kannada', label: 'ಕನ್ನಡ' },
    { code: 'te', name: 'Telugu', label: 'తెలుగు' }
  ];

  const FONT_URLS = {
    en: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap',
    hi: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap',
    bn: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap',
    ta: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap',
    kn: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap',
    te: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap'
  };

  const VALID_CODES = new Set(SUPPORTED_LANGUAGES.map((item) => item.code));

  const cache = new Map();
  let activeLang = 'en';
  let initialized = false;
  let initPromise = null;

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
   * Determine default language: localStorage > browser language > 'en'.
   * @returns {string}
   */
  function detectInitialLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_CODES.has(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors (e.g., restricted privacy settings)
    }

    const browserLangs = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || 'en'];

    for (const raw of browserLangs) {
      if (!raw) continue;
      const primary = String(raw).toLowerCase().split(/[-_]/)[0];
      if (VALID_CODES.has(primary)) {
        return primary;
      }
    }

    return 'en';
  }

  /**
   * Fetch and cache a language JSON file, with automatic fallback for file:// or offline.
   * @param {string} code
   * @returns {Promise<Record<string, unknown>>}
   */
  async function loadLanguageFile(code) {
    if (cache.has(code)) {
      return cache.get(code);
    }

    const fallbackDict =
      global.SHAKTI_FALLBACK &&
      global.SHAKTI_FALLBACK.lang &&
      global.SHAKTI_FALLBACK.lang[code];

    if (window.location.protocol === 'file:' && fallbackDict) {
      cache.set(code, fallbackDict);
      return fallbackDict;
    }

    const url = `${getBasePath()}/data/lang/${code}.json`;
    try {
      const response = await fetch(url, { cache: 'default' });
      if (!response.ok) {
        throw new Error(`Failed to load language file: ${url} (${response.status})`);
      }
      const data = await response.json();
      cache.set(code, data);
      return data;
    } catch (err) {
      if (fallbackDict) {
        cache.set(code, fallbackDict);
        return fallbackDict;
      }
      throw err;
    }
  }

  /**
   * Look up a dot-separated key inside a nested dictionary.
   * @param {Record<string, unknown>|undefined} dict
   * @param {string} key
   * @returns {string|undefined}
   */
  function lookupKey(dict, key) {
    if (!dict || !key) return undefined;
    const parts = key.split('.');
    let current = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Get translated string for key in active language, falling back to English.
   * @param {string} key
   * @param {string} [fallbackText]
   * @returns {string}
   */
  function t(key, fallbackText = '') {
    const activeDict = cache.get(activeLang);
    const enDict = cache.get('en');
    const value = lookupKey(activeDict, key);
    if (value !== undefined) return value;
    const enValue = lookupKey(enDict, key);
    if (enValue !== undefined) return enValue;
    return fallbackText || key;
  }

  /**
   * Get raw value (object/array/string) for structured keys (e.g. quiz questions).
   * @param {string} key
   * @param {string} [langCode]
   * @returns {unknown}
   */
  function getRaw(key, langCode = activeLang) {
    const dict = cache.get(langCode);
    const parts = key.split('.');
    let current = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined) return current;
    if (langCode !== 'en') return getRaw(key, 'en');
    return undefined;
  }

  /**
   * Load only the Google Font for the active language (always falls back to system-ui).
   * @param {string} code
   */
  function switchFont(code) {
    const href = FONT_URLS[code] || FONT_URLS.en;
    let link = document.getElementById('lang-font-link');
    if (!link) {
      link = document.createElement('link');
      link.id = 'lang-font-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) {
      link.setAttribute('href', href);
    }
  }

  /**
   * Apply translations to all DOM elements with data-i18n attributes.
   */
  function applyTranslationsToDOM() {
    document.documentElement.setAttribute('lang', activeLang);

    const pageTitleKey = document.body.getAttribute('data-page-title-key') || 'meta.title';
    const pageDescKey = document.body.getAttribute('data-page-desc-key') || 'meta.description';

    const titleText = t(pageTitleKey, document.title);
    if (titleText) {
      document.title = titleText;
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    const descText = t(pageDescKey, '');
    if (metaDesc && descText) {
      metaDesc.setAttribute('content', descText);
    }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key, el.textContent.trim());
      if (translated) {
        el.textContent = translated;
      }
    });

    const attrMappings = [
      ['data-i18n-aria', 'aria-label'],
      ['data-i18n-placeholder', 'placeholder'],
      ['data-i18n-title', 'title'],
      ['data-i18n-alt', 'alt']
    ];

    attrMappings.forEach(([dataAttr, targetAttr]) => {
      document.querySelectorAll(`[${dataAttr}]`).forEach((el) => {
        const key = el.getAttribute(dataAttr);
        const translated = t(key, el.getAttribute(targetAttr) || '');
        if (translated) {
          el.setAttribute(targetAttr, translated);
        }
      });
    });

    const selector = document.getElementById('language-select');
    if (selector && selector.value !== activeLang) {
      selector.value = activeLang;
    }
  }

  /**
   * Populate the language <select> dropdown in the navbar.
   */
  function setupSelector() {
    const selector = document.getElementById('language-select');
    if (!selector) return;

    if (selector.options.length === 0) {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.label;
        option.setAttribute('lang', lang.code);
        selector.appendChild(option);
      });
    }

    selector.value = activeLang;
    if (!selector.dataset.bound) {
      selector.dataset.bound = '1';
      selector.addEventListener('change', (event) => {
        setLanguage(event.target.value, { persist: true });
      });
    }
  }

  /**
   * Switch active language without reloading the page.
   * @param {string} code
   * @param {{ persist?: boolean }} [options]
   * @returns {Promise<string>}
   */
  async function setLanguage(code, options = { persist: true }) {
    const targetCode = VALID_CODES.has(code) ? code : 'en';

    // Always ensure English fallback dictionary is loaded first
    if (!cache.has('en')) {
      try {
        await loadLanguageFile('en');
      } catch (err) {
        console.error(err);
      }
    }

    if (targetCode !== 'en' && !cache.has(targetCode)) {
      try {
        await loadLanguageFile(targetCode);
      } catch (err) {
        console.error(err);
      }
    }

    activeLang = cache.has(targetCode) ? targetCode : 'en';

    if (options && options.persist) {
      try {
        localStorage.setItem(STORAGE_KEY, activeLang);
      } catch {
        // Ignore storage write errors
      }
    }

    switchFont(activeLang);
    applyTranslationsToDOM();

    document.dispatchEvent(
      new CustomEvent('shakti:langchange', {
        detail: {
          lang: activeLang,
          current: cache.get(activeLang) || {},
          english: cache.get('en') || {}
        }
      })
    );

    return activeLang;
  }

  /**
   * Initialize the multilingual system.
   * @returns {Promise<string>}
   */
  function init() {
    if (initPromise) return initPromise;
    initialized = true;

    const initialCode = detectInitialLanguage();
    setupSelector();
    initPromise = setLanguage(initialCode, { persist: false });
    return initPromise;
  }

  /**
   * Wait until initial language dictionary is loaded.
   * @returns {Promise<string>}
   */
  function whenReady() {
    return initPromise || init();
  }

  global.ShaktiLang = {
    init,
    whenReady,
    setLanguage,
    t,
    getRaw,
    getCurrentLanguage: () => activeLang,
    getSupportedLanguages: () => SUPPORTED_LANGUAGES.slice(),
    getCache: (code) => cache.get(code),
    isInitialized: () => initialized
  };
})(window);
