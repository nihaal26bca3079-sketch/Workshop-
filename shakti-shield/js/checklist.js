/**
 * Shakti Shield — Safety Toolkit Tabs & Personalised Checklist (js/checklist.js)
 * Pure vanilla JS; renders Do's/Don'ts and custom checklists dynamically
 * from active language translations.
 */

(function (global) {
  'use strict';

  const TAB_KEYS = ['travel', 'night', 'online', 'workplace', 'home'];
  const GENERATOR_KEYS = ['student', 'working', 'nightCommute', 'soloTravel', 'livingAlone'];

  let activeTab = 'travel';
  const checkedItems = new Set(); // In-memory item ids like "student:0"

  function t(key, fallback = '') {
    if (global.ShaktiLang && typeof global.ShaktiLang.t === 'function') {
      return global.ShaktiLang.t(key, fallback);
    }
    return fallback;
  }

  function getRaw(key) {
    if (global.ShaktiLang && typeof global.ShaktiLang.getRaw === 'function') {
      return global.ShaktiLang.getRaw(key);
    }
    return undefined;
  }

  /* ------------------------------------------------------------------------
     1. Accessible Category Tabs + Do's / Don'ts Cards
     ------------------------------------------------------------------------ */
  function renderTabPanel() {
    const dosList = document.getElementById('toolkit-dos-list');
    const dontsList = document.getElementById('toolkit-donts-list');
    const panel = document.getElementById('toolkit-tabpanel');
    if (!dosList || !dontsList || !panel) return;

    panel.setAttribute('aria-labelledby', `tab-${activeTab}`);

    const dos = getRaw(`toolkit.tabContent.${activeTab}.dos`);
    const donts = getRaw(`toolkit.tabContent.${activeTab}.donts`);

    dosList.textContent = '';
    dontsList.textContent = '';

    if (Array.isArray(dos)) {
      dos.forEach((text) => {
        const li = document.createElement('li');
        const marker = document.createElement('span');
        marker.className = 'guide-marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = '✓';

        const span = document.createElement('span');
        span.textContent = text;

        li.appendChild(marker);
        li.appendChild(span);
        dosList.appendChild(li);
      });
    }

    if (Array.isArray(donts)) {
      donts.forEach((text) => {
        const li = document.createElement('li');
        const marker = document.createElement('span');
        marker.className = 'guide-marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = '✕';

        const span = document.createElement('span');
        span.textContent = text;

        li.appendChild(marker);
        li.appendChild(span);
        dontsList.appendChild(li);
      });
    }
  }

  function setActiveTab(tabKey, moveFocus = false) {
    if (!TAB_KEYS.includes(tabKey)) return;
    activeTab = tabKey;

    document.querySelectorAll('#toolkit-tablist [role="tab"]').forEach((btn) => {
      const isSelected = btn.getAttribute('data-tab') === activeTab;
      btn.setAttribute('aria-selected', String(isSelected));
      btn.setAttribute('tabindex', isSelected ? '0' : '-1');
      if (isSelected && moveFocus) {
        btn.focus();
      }
    });

    renderTabPanel();
  }

  function initTabs() {
    const tablist = document.getElementById('toolkit-tablist');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => {
        setActiveTab(tab.getAttribute('data-tab'), false);
      });

      tab.addEventListener('keydown', (e) => {
        let nextIdx = null;
        if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = tabs.length - 1;

        if (nextIdx !== null) {
          e.preventDefault();
          setActiveTab(tabs[nextIdx].getAttribute('data-tab'), true);
        }
      });
    });

    setActiveTab(activeTab, false);
  }

  /* ------------------------------------------------------------------------
     2. Personalised Safety Checklist Generator
     ------------------------------------------------------------------------ */
  function getSelectedSituations() {
    const selected = [];
    GENERATOR_KEYS.forEach((key) => {
      const checkbox = document.getElementById(`opt-${key}`);
      if (checkbox && checkbox.checked) {
        selected.push(key);
      }
    });
    return selected;
  }

  function updateChecklistProgress(totalCount) {
    const progressEl = document.getElementById('checklist-progress');
    if (!progressEl) return;

    if (totalCount === 0) {
      progressEl.hidden = true;
      return;
    }

    const checkboxes = document.querySelectorAll('#generated-checklist input[type="checkbox"]');
    let doneCount = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) doneCount += 1;
    });

    progressEl.hidden = false;
    progressEl.textContent = t('toolkit.generator.progressLabel', '{done} of {total} completed')
      .replace('{done}', String(doneCount))
      .replace('{total}', String(totalCount));
  }

  function renderChecklist() {
    const listEl = document.getElementById('generated-checklist');
    const emptyEl = document.getElementById('checklist-empty');
    const actionsRow = document.getElementById('checklist-actions-row');
    if (!listEl) return;

    const selected = getSelectedSituations();
    listEl.textContent = '';

    if (selected.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      if (actionsRow) actionsRow.hidden = true;
      updateChecklistProgress(0);
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (actionsRow) actionsRow.hidden = false;

    const groupsToInclude = ['core', ...selected];
    const items = [];

    groupsToInclude.forEach((groupKey) => {
      const groupItems = getRaw(`toolkit.generator.items.${groupKey}`);
      if (Array.isArray(groupItems)) {
        groupItems.forEach((text, index) => {
          items.push({
            id: `${groupKey}:${index}`,
            text
          });
        });
      }
    });

    items.forEach((item) => {
      const li = document.createElement('li');
      const isChecked = checkedItems.has(item.id);
      li.className = `checklist-item${isChecked ? ' is-checked' : ''}`;

      const inputId = `chk-${item.id.replace(':', '-')}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = inputId;
      checkbox.checked = isChecked;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          checkedItems.add(item.id);
          li.classList.add('is-checked');
        } else {
          checkedItems.delete(item.id);
          li.classList.remove('is-checked');
        }
        updateChecklistProgress(items.length);
      });

      const label = document.createElement('label');
      label.setAttribute('for', inputId);
      label.textContent = item.text;

      li.appendChild(checkbox);
      li.appendChild(label);
      listEl.appendChild(li);
    });

    updateChecklistProgress(items.length);
  }

  function initGenerator() {
    const generateBtn = document.getElementById('checklist-generate-btn');
    const resetBtn = document.getElementById('checklist-reset-btn');
    const printBtn = document.getElementById('checklist-print-btn');

    GENERATOR_KEYS.forEach((key) => {
      const checkbox = document.getElementById(`opt-${key}`);
      if (checkbox) {
        checkbox.addEventListener('change', renderChecklist);
      }
    });

    if (generateBtn) {
      generateBtn.addEventListener('click', renderChecklist);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        checkedItems.clear();
        renderChecklist();
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    renderChecklist();
  }

  document.addEventListener('shakti:langchange', () => {
    renderTabPanel();
    renderChecklist();
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if (global.ShaktiLang && typeof global.ShaktiLang.whenReady === 'function') {
      await global.ShaktiLang.whenReady();
    }
    initTabs();
    initGenerator();
  });
})(window);
