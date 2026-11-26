/**
 * Shakti Shield — Safety Quiz, Score Ring, Personalised Tips & SVG Progress Chart (js/quiz.js)
 * Same question order and correct answers across all six languages.
 * Stores quiz score history only in browser localStorage.
 */

(function (global) {
  'use strict';

  const HISTORY_KEY = 'shakti_quiz_history';
  const MAX_HISTORY = 10;
  // Fixed answer key matching the exact question order in every language file
  const CORRECT_ANSWERS = [1, 0, 2, 1, 0, 2];

  let currentIndex = 0;
  let userAnswers = new Array(CORRECT_ANSWERS.length).fill(null);
  let quizCompleted = false;

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

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistoryAttempt(score, total, percent) {
    const history = loadHistory();
    history.push({
      ts: Date.now(),
      score,
      total,
      percent
    });
    const trimmed = history.slice(-MAX_HISTORY);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage quota errors
    }
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore storage errors
    }
    renderProgressChart();
  }

  /* ------------------------------------------------------------------------
     Question View
     ------------------------------------------------------------------------ */
  function renderQuestion() {
    const stageEl = document.getElementById('quiz-stage');
    const resultsEl = document.getElementById('quiz-results');
    const progressEl = document.getElementById('quiz-question-progress');
    const questionTextEl = document.getElementById('quiz-question-text');
    const optionsListEl = document.getElementById('quiz-options-list');
    const errorEl = document.getElementById('quiz-error');
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');
    const submitBtn = document.getElementById('quiz-submit-btn');

    if (!stageEl || !resultsEl) return;

    if (quizCompleted) {
      stageEl.hidden = true;
      resultsEl.hidden = false;
      renderResults();
      return;
    }

    stageEl.hidden = false;
    resultsEl.hidden = true;

    const questions = getRaw('quiz.questions');
    if (!Array.isArray(questions) || questions.length === 0) return;

    const total = Math.min(questions.length, CORRECT_ANSWERS.length);
    if (currentIndex >= total) currentIndex = 0;
    const item = questions[currentIndex];

    if (progressEl) {
      progressEl.textContent = t('quiz.questionProgress', 'Question {current} of {total}')
        .replace('{current}', String(currentIndex + 1))
        .replace('{total}', String(total));
    }

    if (questionTextEl) {
      questionTextEl.textContent = item.q || '';
    }

    if (optionsListEl) {
      optionsListEl.textContent = '';
      (item.options || []).forEach((optText, optIndex) => {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        const inputId = `quiz-q${currentIndex}-opt${optIndex}`;
        label.setAttribute('for', inputId);

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'quiz-option';
        radio.id = inputId;
        radio.value = String(optIndex);
        radio.checked = userAnswers[currentIndex] === optIndex;

        radio.addEventListener('change', () => {
          userAnswers[currentIndex] = optIndex;
          if (errorEl) errorEl.textContent = '';
          optionsListEl.querySelectorAll('.quiz-option').forEach((el) => el.classList.remove('is-selected'));
          label.classList.add('is-selected');
        });

        if (radio.checked) {
          label.classList.add('is-selected');
        }

        const span = document.createElement('span');
        span.textContent = optText;

        label.appendChild(radio);
        label.appendChild(span);
        optionsListEl.appendChild(label);
      });
    }

    if (errorEl) errorEl.textContent = '';
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.hidden = currentIndex >= total - 1;
    if (submitBtn) submitBtn.hidden = currentIndex < total - 1;
  }

  /* ------------------------------------------------------------------------
     Score Ring, Personalised Tips & Answer Review
     ------------------------------------------------------------------------ */
  function renderResults() {
    const questions = getRaw('quiz.questions');
    if (!Array.isArray(questions) || questions.length === 0) return;

    const total = Math.min(questions.length, CORRECT_ANSWERS.length);
    let score = 0;
    const missedIndices = [];

    for (let i = 0; i < total; i += 1) {
      if (userAnswers[i] === CORRECT_ANSWERS[i]) {
        score += 1;
      } else {
        missedIndices.push(i);
      }
    }

    const percent = Math.round((score / total) * 100);

    // Update SVG Score Ring (r = 52 -> circumference ≈ 326.73)
    const ringCircle = document.getElementById('quiz-ring-progress');
    const ringText = document.getElementById('quiz-ring-percent');
    const summaryEl = document.getElementById('quiz-score-summary');
    if (ringCircle) {
      const r = 52;
      const circumference = 2 * Math.PI * r;
      ringCircle.style.strokeDasharray = `${circumference.toFixed(2)}`;
      ringCircle.style.strokeDashoffset = `${(circumference * (1 - percent / 100)).toFixed(2)}`;
    }
    if (ringText) {
      ringText.textContent = `${percent}%`;
    }
    if (summaryEl) {
      summaryEl.textContent = t('quiz.scoreSummary', 'You answered {score} out of {total} scenarios correctly ({percent}%).')
        .replace('{score}', String(score))
        .replace('{total}', String(total))
        .replace('{percent}', String(percent));
    }

    // Personalised Tips
    const tierEl = document.getElementById('quiz-tier-tip');
    const linksEl = document.getElementById('quiz-tip-links');
    if (tierEl) {
      let tierKey = 'low';
      if (percent >= 80) tierKey = 'high';
      else if (percent >= 50) tierKey = 'medium';
      tierEl.textContent = t(`quiz.tipsTier.${tierKey}`, '');
    }

    if (linksEl) {
      linksEl.textContent = '';
      const seenHrefs = new Set();
      const targetIndices = missedIndices.length > 0 ? missedIndices : [0, 1, 2];

      targetIndices.forEach((idx) => {
        const qItem = questions[idx];
        if (!qItem || !qItem.topicHref || seenHrefs.has(qItem.topicHref)) return;
        seenHrefs.add(qItem.topicHref);

        const a = document.createElement('a');
        a.href = qItem.topicHref;
        a.className = 'btn btn-outline btn-sm';
        a.textContent = qItem.topicLinkText || qItem.topicHref;
        linksEl.appendChild(a);
      });
    }

    // Answer Review
    const reviewEl = document.getElementById('quiz-review-list');
    if (reviewEl) {
      reviewEl.textContent = '';
      questions.slice(0, total).forEach((qItem, idx) => {
        const isRight = userAnswers[idx] === CORRECT_ANSWERS[idx];
        const card = document.createElement('article');
        card.className = `quiz-review-item ${isRight ? 'is-correct' : 'is-review'}`;

        const qTitle = document.createElement('h3');
        qTitle.textContent = `${idx + 1}. ${qItem.q}`;

        const badge = document.createElement('p');
        badge.className = 'quiz-review-badge';
        badge.textContent = isRight
          ? `✓ ${t('quiz.feedbackCorrect', 'Correct!')}`
          : `• ${t('quiz.feedbackReview', 'Review tip:')}`;

        const exp = document.createElement('p');
        exp.className = 'card__desc';
        exp.textContent = qItem.explanation || '';

        card.appendChild(qTitle);
        card.appendChild(badge);
        card.appendChild(exp);
        reviewEl.appendChild(card);
      });
    }
  }

  /* ------------------------------------------------------------------------
     SVG Progress Chart (from localStorage history)
     ------------------------------------------------------------------------ */
  function createSvgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  function renderProgressChart() {
    const container = document.getElementById('quiz-chart-container');
    const emptyEl = document.getElementById('quiz-history-empty');
    const clearBtn = document.getElementById('quiz-clear-history-btn');
    if (!container) return;

    const history = loadHistory();
    container.textContent = '';

    if (history.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      if (clearBtn) clearBtn.hidden = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (clearBtn) clearBtn.hidden = false;

    const width = 440;
    const height = 190;
    const padLeft = 42;
    const padRight = 22;
    const padTop = 22;
    const padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const svg = createSvgEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'quiz-progress-svg',
      role: 'img',
      'aria-label': t('quiz.chartAlt', 'SVG progress chart showing your quiz percentage scores across attempts')
    });

    // Horizontal reference gridlines (0%, 50%, 100%)
    [0, 50, 100].forEach((val) => {
      const y = padTop + plotH - (val / 100) * plotH;
      svg.appendChild(createSvgEl('line', {
        x1: padLeft,
        y1: y,
        x2: width - padRight,
        y2: y,
        class: 'chart-grid-line'
      }));
      const lbl = createSvgEl('text', {
        x: padLeft - 8,
        y: y + 4,
        'text-anchor': 'end',
        class: 'chart-axis-text'
      });
      lbl.textContent = `${val}%`;
      svg.appendChild(lbl);
    });

    const points = history.map((entry, idx) => {
      const x = history.length === 1
        ? padLeft + plotW / 2
        : padLeft + (idx / (history.length - 1)) * plotW;
      const pct = Math.max(0, Math.min(100, Number(entry.percent) || 0));
      const y = padTop + plotH - (pct / 100) * plotH;
      return { x, y, pct, idx };
    });

    if (points.length > 1) {
      const ptsAttr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      svg.appendChild(createSvgEl('polyline', {
        points: ptsAttr,
        fill: 'none',
        class: 'chart-line'
      }));
    }

    const tryWord = t('quiz.attemptLabel', 'Try');
    points.forEach((p) => {
      svg.appendChild(createSvgEl('circle', {
        cx: p.x.toFixed(1),
        cy: p.y.toFixed(1),
        r: 6,
        class: 'chart-dot'
      }));

      const valText = createSvgEl('text', {
        x: p.x.toFixed(1),
        y: Math.max(14, p.y - 10).toFixed(1),
        'text-anchor': 'middle',
        class: 'chart-value-text'
      });
      valText.textContent = `${p.pct}%`;
      svg.appendChild(valText);

      const xText = createSvgEl('text', {
        x: p.x.toFixed(1),
        y: height - 10,
        'text-anchor': 'middle',
        class: 'chart-axis-text'
      });
      xText.textContent = `${tryWord} ${p.idx + 1}`;
      svg.appendChild(xText);
    });

    container.appendChild(svg);
  }

  /* ------------------------------------------------------------------------
     Controls Initialization
     ------------------------------------------------------------------------ */
  function initQuiz() {
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');
    const submitBtn = document.getElementById('quiz-submit-btn');
    const retakeBtn = document.getElementById('quiz-retake-btn');
    const clearBtn = document.getElementById('quiz-clear-history-btn');
    const errorEl = document.getElementById('quiz-error');

    if (!document.getElementById('quiz-stage')) return;

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex -= 1;
          renderQuestion();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (userAnswers[currentIndex] === null) {
          if (errorEl) errorEl.textContent = t('quiz.selectOptionPrompt', 'Please choose an answer before continuing.');
          return;
        }
        if (currentIndex < CORRECT_ANSWERS.length - 1) {
          currentIndex += 1;
          renderQuestion();
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (userAnswers[currentIndex] === null) {
          if (errorEl) errorEl.textContent = t('quiz.selectOptionPrompt', 'Please choose an answer before continuing.');
          return;
        }
        const total = CORRECT_ANSWERS.length;
        let score = 0;
        for (let i = 0; i < total; i += 1) {
          if (userAnswers[i] === CORRECT_ANSWERS[i]) score += 1;
        }
        const percent = Math.round((score / total) * 100);
        saveHistoryAttempt(score, total, percent);
        quizCompleted = true;
        renderQuestion();
        renderProgressChart();
      });
    }

    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        currentIndex = 0;
        userAnswers = new Array(CORRECT_ANSWERS.length).fill(null);
        quizCompleted = false;
        renderQuestion();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', clearHistory);
    }

    renderQuestion();
    renderProgressChart();
  }

  document.addEventListener('shakti:langchange', () => {
    if (document.getElementById('quiz-stage')) {
      renderQuestion();
      renderProgressChart();
    }
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if (global.ShaktiLang && typeof global.ShaktiLang.whenReady === 'function') {
      await global.ShaktiLang.whenReady();
    }
    initQuiz();
  });
})(window);
