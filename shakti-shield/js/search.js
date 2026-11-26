/**
 * Shakti Shield — Bilingual NFC Search & Know Your Rights Accordion (js/search.js)
 * Normalises queries and text with Unicode NFC, ignores case, and searches across
 * both the active language and English fallback simultaneously.
 */

(function (global) {
  'use strict';

  let cachedRightsData = null;
  let activeCategory = 'all';
  const expandedIds = new Set(['bns_74']);

  function getBasePath() {
    const meta = document.querySelector('meta[name="shakti-base"]');
    if (meta && meta.content) return meta.content.replace(/\/+$/, '');
    return window.location.pathname.includes('/pages/') ? '..' : '.';
  }

  function t(key, fallback = '') {
    if (global.ShaktiLang && typeof global.ShaktiLang.t === 'function') {
      return global.ShaktiLang.t(key, fallback);
    }
    return fallback;
  }

  function getRaw(key, langCode) {
    if (global.ShaktiLang && typeof global.ShaktiLang.getRaw === 'function') {
      return global.ShaktiLang.getRaw(key, langCode);
    }
    return undefined;
  }

  /**
   * Normalise text using Unicode NFC and case folding for Indian & Latin scripts.
   * @param {string} value
   * @returns {string}
   */
  function normalizeText(value) {
    return String(value || '')
      .normalize('NFC')
      .toLowerCase()
      .trim();
  }

  /**
   * Check whether a query matches any string in the provided bilingual targets.
   * @param {string} rawQuery
   * @param {Array<string>} targets
   * @returns {boolean}
   */
  function matchesQuery(rawQuery, targets) {
    const q = normalizeText(rawQuery);
    if (!q) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    const haystack = targets.map(normalizeText).join(' ');
    return tokens.every((tok) => haystack.includes(tok));
  }

  /* ------------------------------------------------------------------------
     Know Your Rights Rendering & Searchable/Filterable Accordion
     ------------------------------------------------------------------------ */
  function renderLawNotes() {
    const listEl = document.getElementById('rights-law-notes');
    if (!listEl) return;
    const notes = getRaw('rights.lawNotes');
    listEl.textContent = '';
    if (!Array.isArray(notes)) return;

    notes.forEach((note) => {
      const li = document.createElement('li');
      li.textContent = note;
      listEl.appendChild(li);
    });
  }

  function renderFirSteps() {
    const grid = document.getElementById('rights-fir-steps');
    if (!grid) return;
    const steps = getRaw('rights.firGuide.steps');
    grid.textContent = '';
    if (!Array.isArray(steps)) return;

    steps.forEach((step) => {
      const card = document.createElement('article');
      card.className = 'fact-card';

      const title = document.createElement('h3');
      title.textContent = step.title || '';

      const body = document.createElement('p');
      body.className = 'fact-card__body';
      body.textContent = step.body || '';

      card.appendChild(title);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function renderRightsAccordion() {
    const container = document.getElementById('rights-accordion');
    const countEl = document.getElementById('rights-count');
    const emptyEl = document.getElementById('rights-no-results');
    const searchInput = document.getElementById('rights-search-input');
    if (!container || !cachedRightsData || !Array.isArray(cachedRightsData.laws)) return;

    const query = searchInput ? searchInput.value : '';
    const laws = cachedRightsData.laws;
    const activeLang = global.ShaktiLang ? global.ShaktiLang.getCurrentLanguage() : 'en';

    const filtered = laws.filter((law) => {
      if (activeCategory !== 'all' && law.category !== activeCategory) {
        return false;
      }

      const activeItem = getRaw(`rights.items.${law.id}`, activeLang) || {};
      const enItem = getRaw(`rights.items.${law.id}`, 'en') || {};

      return matchesQuery(query, [
        law.ref,
        activeItem.title || '',
        activeItem.summary || '',
        ...(Array.isArray(activeItem.examples) ? activeItem.examples : []),
        ...(Array.isArray(activeItem.whatToDo) ? activeItem.whatToDo : []),
        activeItem.keyNote || '',
        enItem.title || '',
        enItem.summary || '',
        ...(Array.isArray(enItem.examples) ? enItem.examples : []),
        ...(Array.isArray(enItem.whatToDo) ? enItem.whatToDo : []),
        enItem.keyNote || ''
      ]);
    });

    container.textContent = '';

    if (countEl) {
      countEl.textContent = t('rights.countLabel', 'Showing {count} of {total} entries')
        .replace('{count}', String(filtered.length))
        .replace('{total}', String(laws.length));
    }

    if (emptyEl) {
      emptyEl.hidden = filtered.length > 0;
    }

    const verifyNoteText = t(
      'rights.entryVerifyNote',
      `Last verified: ${cachedRightsData.last_verified || '2026-11-25'} • Verify from official sources.`
    );

    filtered.forEach((law) => {
      const itemText = getRaw(`rights.items.${law.id}`, activeLang) || {};
      const isExpanded = expandedIds.has(law.id);
      const panelId = `rights-panel-${law.id}`;
      const btnId = `rights-btn-${law.id}`;

      const itemEl = document.createElement('article');
      itemEl.className = 'accordion-item';

      const header = document.createElement('h3');
      header.className = 'accordion-header';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = btnId;
      btn.className = 'accordion-trigger';
      btn.setAttribute('aria-expanded', String(isExpanded));
      btn.setAttribute('aria-controls', panelId);

      const titleWrap = document.createElement('span');
      titleWrap.className = 'accordion-title-wrap';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'accordion-title';
      titleSpan.textContent = itemText.title || law.ref;

      const refBadge = document.createElement('span');
      refBadge.className = 'law-ref-badge';
      refBadge.textContent = law.ref;

      titleWrap.appendChild(titleSpan);
      titleWrap.appendChild(refBadge);

      if (law.verify) {
        const verifyBadge = document.createElement('span');
        verifyBadge.className = 'badge-verify';
        verifyBadge.textContent = t('common.verifyBadge', 'verify');
        titleWrap.appendChild(verifyBadge);
      }

      const iconSpan = document.createElement('span');
      iconSpan.className = 'accordion-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = isExpanded ? '−' : '+';

      btn.appendChild(titleWrap);
      btn.appendChild(iconSpan);

      const panel = document.createElement('div');
      panel.id = panelId;
      panel.className = 'accordion-panel';
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', btnId);
      panel.hidden = !isExpanded;

      const meaningH = document.createElement('h4');
      meaningH.className = 'accordion-subheading';
      meaningH.textContent = t('rights.detailHeadings.meaning', 'What This Law Means');
      panel.appendChild(meaningH);

      const summaryP = document.createElement('p');
      summaryP.className = 'accordion-summary';
      summaryP.textContent = itemText.summary || '';
      panel.appendChild(summaryP);

      if (Array.isArray(itemText.examples) && itemText.examples.length > 0) {
        const exH = document.createElement('h4');
        exH.className = 'accordion-subheading';
        exH.textContent = t('rights.detailHeadings.examples', 'Common Situations Covered');
        panel.appendChild(exH);

        const exList = document.createElement('ul');
        exList.className = 'accordion-detail-list';
        itemText.examples.forEach((exText) => {
          const li = document.createElement('li');
          li.textContent = exText;
          exList.appendChild(li);
        });
        panel.appendChild(exList);
      }

      if (Array.isArray(itemText.whatToDo) && itemText.whatToDo.length > 0) {
        const doH = document.createElement('h4');
        doH.className = 'accordion-subheading';
        doH.textContent = t('rights.detailHeadings.whatToDo', 'Practical Steps & Reporting');
        panel.appendChild(doH);

        const doList = document.createElement('ul');
        doList.className = 'accordion-detail-list';
        itemText.whatToDo.forEach((stepText) => {
          const li = document.createElement('li');
          li.textContent = stepText;
          doList.appendChild(li);
        });
        panel.appendChild(doList);
      }

      if (itemText.keyNote) {
        const noteBox = document.createElement('div');
        noteBox.className = 'accordion-key-note';
        const noteLabel = document.createElement('strong');
        noteLabel.textContent = `${t('rights.detailHeadings.keyNote', 'Important Note')}: `;
        const noteText = document.createTextNode(itemText.keyNote);
        noteBox.appendChild(noteLabel);
        noteBox.appendChild(noteText);
        panel.appendChild(noteBox);
      }

      const metaP = document.createElement('p');
      metaP.className = 'accordion-meta';
      metaP.textContent = verifyNoteText;
      panel.appendChild(metaP);

      btn.addEventListener('click', () => {
        const nextExpanded = !expandedIds.has(law.id);
        if (nextExpanded) expandedIds.add(law.id);
        else expandedIds.delete(law.id);
        btn.setAttribute('aria-expanded', String(nextExpanded));
        panel.hidden = !nextExpanded;
        iconSpan.textContent = nextExpanded ? '−' : '+';
      });

      header.appendChild(btn);
      itemEl.appendChild(header);
      itemEl.appendChild(panel);
      container.appendChild(itemEl);
    });
  }

  async function loadJsonWithFallback(pathSuffix, fallbackKey) {
    const fallback = global.SHAKTI_FALLBACK && global.SHAKTI_FALLBACK.data && global.SHAKTI_FALLBACK.data[fallbackKey];
    if (window.location.protocol === 'file:' && fallback) {
      return fallback;
    }
    try {
      const res = await fetch(`${getBasePath()}/${pathSuffix}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(`Failed to load ${pathSuffix}:`, err);
    }
    return fallback || null;
  }

  async function initRightsPage() {
    const accordion = document.getElementById('rights-accordion');
    if (!accordion) return;

    cachedRightsData = await loadJsonWithFallback('data/rights.json', 'rights');
    if (!cachedRightsData) return;

    const searchInput = document.getElementById('rights-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', renderRightsAccordion);
    }

    const filterBtns = Array.from(document.querySelectorAll('#rights-filters [data-category]'));
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-category') || 'all';
        filterBtns.forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        renderRightsAccordion();
      });
    });

    const expandAllBtn = document.getElementById('rights-expand-all');
    const collapseAllBtn = document.getElementById('rights-collapse-all');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        if (cachedRightsData && Array.isArray(cachedRightsData.laws)) {
          cachedRightsData.laws.forEach((law) => expandedIds.add(law.id));
          renderRightsAccordion();
        }
      });
    }
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        expandedIds.clear();
        renderRightsAccordion();
      });
    }

    renderLawNotes();
    renderFirSteps();
    renderRightsAccordion();
  }

  document.addEventListener('shakti:langchange', () => {
    if (document.getElementById('rights-accordion')) {
      renderLawNotes();
      renderFirSteps();
      renderRightsAccordion();
    }
    if (document.getElementById('scholarships-grid')) {
      renderScholarships();
      renderStoriesAndCareer();
    }
  });

  /* ------------------------------------------------------------------------
     Empowerment Corner (Scholarships Search/Filter + Stories + Career Tips)
     ------------------------------------------------------------------------ */
  let cachedScholarshipsData = null;
  let activeScholarshipFilter = 'all';

  function renderScholarships() {
    const grid = document.getElementById('scholarships-grid');
    const emptyEl = document.getElementById('scholarships-no-results');
    const searchInput = document.getElementById('scholarships-search-input');
    if (!grid || !cachedScholarshipsData || !Array.isArray(cachedScholarshipsData.scholarships)) return;

    const query = searchInput ? searchInput.value : '';
    const activeLang = global.ShaktiLang ? global.ShaktiLang.getCurrentLanguage() : 'en';

    const items = cachedScholarshipsData.scholarships.filter((s) => {
      if (activeScholarshipFilter !== 'all' && s.status !== activeScholarshipFilter) {
        return false;
      }
      const curText = getRaw(`empowerment.scholarships.${s.id}`, activeLang) || {};
      const enText = getRaw(`empowerment.scholarships.${s.id}`, 'en') || {};
      return matchesQuery(query, [
        curText.name || '',
        curText.amount || '',
        curText.apply || '',
        curText.statusNote || '',
        enText.name || '',
        enText.amount || '',
        enText.apply || '',
        enText.statusNote || ''
      ]);
    });

    grid.textContent = '';
    if (emptyEl) emptyEl.hidden = items.length > 0;

    items.forEach((s) => {
      const info = getRaw(`empowerment.scholarships.${s.id}`, activeLang) || {};
      const card = document.createElement('article');
      card.className = 'tool-card tool-card--primary';

      const badgesRow = document.createElement('div');
      badgesRow.className = 'btn-row';

      const statusBadge = document.createElement('span');
      statusBadge.className = `status-badge status-badge--${s.status}`;
      statusBadge.textContent = t(`empowerment.badges.${s.status}`, s.status);
      badgesRow.appendChild(statusBadge);

      if (s.verify) {
        const verifyBadge = document.createElement('span');
        verifyBadge.className = 'badge-verify';
        verifyBadge.textContent = t('empowerment.badges.verify', 'Verify');
        badgesRow.appendChild(verifyBadge);
      }

      const title = document.createElement('h3');
      title.textContent = info.name || s.id;

      const detailsList = document.createElement('dl');
      detailsList.className = 'scholarship-meta';

      const addMetaRow = (labelKey, fallbackLabel, valText) => {
        const dt = document.createElement('dt');
        dt.textContent = t(labelKey, fallbackLabel);
        const dd = document.createElement('dd');
        dd.textContent = valText || '';
        detailsList.appendChild(dt);
        detailsList.appendChild(dd);
      };

      addMetaRow('empowerment.labels.amount', 'Amount:', info.amount);
      addMetaRow('empowerment.labels.apply', 'Where to apply:', info.apply);
      addMetaRow('empowerment.labels.status', 'Status:', info.statusNote);

      const portalBtn = document.createElement('a');
      portalBtn.href = s.portal_url || 'https://scholarships.gov.in';
      portalBtn.target = '_blank';
      portalBtn.rel = 'noopener noreferrer';
      portalBtn.className = 'btn btn-primary';
      portalBtn.style.alignSelf = 'flex-start';
      portalBtn.textContent = t('empowerment.labels.visitPortal', 'Visit scholarships.gov.in');

      const verifiedNote = document.createElement('p');
      verifiedNote.className = 'accordion-meta';
      verifiedNote.textContent = `${t('common.lastVerified', `Last verified: ${cachedScholarshipsData.last_verified || '2026-11-25'}`)} • ${t('empowerment.verifyFooterNote', 'Verify deadlines on the official portal (scholarships.gov.in).')}`;

      card.appendChild(badgesRow);
      card.appendChild(title);
      card.appendChild(detailsList);
      card.appendChild(portalBtn);
      card.appendChild(verifiedNote);
      grid.appendChild(card);
    });
  }

  function renderStoriesAndCareer() {
    const storiesGrid = document.getElementById('empowerment-stories-grid');
    const careerGrid = document.getElementById('empowerment-career-grid');
    const activeLang = global.ShaktiLang ? global.ShaktiLang.getCurrentLanguage() : 'en';

    if (storiesGrid) {
      const stories = getRaw('empowerment.stories', activeLang);
      storiesGrid.textContent = '';
      if (Array.isArray(stories)) {
        stories.forEach((story) => {
          const card = document.createElement('article');
          card.className = 'card';

          const wrap = document.createElement('div');
          const name = document.createElement('h3');
          name.textContent = story.name || '';
          const field = document.createElement('p');
          field.className = 'defence-goal';
          field.textContent = story.field || '';
          const summary = document.createElement('p');
          summary.className = 'card__desc';
          summary.textContent = story.summary || '';

          wrap.appendChild(name);
          wrap.appendChild(field);
          wrap.appendChild(summary);
          card.appendChild(wrap);
          storiesGrid.appendChild(card);
        });
      }
    }

    if (careerGrid) {
      const tips = getRaw('empowerment.careerTips', activeLang);
      careerGrid.textContent = '';
      if (Array.isArray(tips)) {
        tips.forEach((tip) => {
          const card = document.createElement('article');
          card.className = 'fact-card';
          const h3 = document.createElement('h3');
          h3.textContent = tip.title || '';
          const p = document.createElement('p');
          p.className = 'fact-card__body';
          p.textContent = tip.body || '';
          card.appendChild(h3);
          card.appendChild(p);
          careerGrid.appendChild(card);
        });
      }
    }
  }

  async function initEmpowermentPage() {
    const grid = document.getElementById('scholarships-grid');
    if (!grid) return;

    cachedScholarshipsData = await loadJsonWithFallback('data/scholarships.json', 'scholarships');

    const searchInput = document.getElementById('scholarships-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', renderScholarships);
    }

    const filterBtns = Array.from(document.querySelectorAll('#scholarships-filters [data-status]'));
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeScholarshipFilter = btn.getAttribute('data-status') || 'all';
        filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        renderScholarships();
      });
    });

    renderScholarships();
    renderStoriesAndCareer();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (global.ShaktiLang && typeof global.ShaktiLang.whenReady === 'function') {
      await global.ShaktiLang.whenReady();
    }
    await initRightsPage();
    await initEmpowermentPage();
  });

  global.ShaktiSearch = {
    normalizeText,
    matchesQuery
  };
})(window);
