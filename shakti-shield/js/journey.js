/**
 * Shakti Shield — Safe Journey Timer (js/journey.js)
 * Supports 10-second demo mode, regular journey presets, Reached Safely button,
 * and overdue alert. Works only while the page stays open.
 */

(function (global) {
  'use strict';

  let journeyInterval = null;
  let remainingSeconds = 0;
  let journeyState = 'idle'; // 'idle' | 'running' | 'safe' | 'overdue'

  function t(key, fallback = '') {
    if (global.ShaktiLang && typeof global.ShaktiLang.t === 'function') {
      return global.ShaktiLang.t(key, fallback);
    }
    return fallback;
  }

  function formatDuration(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function playOverdueChime() {
    const ctx = global.ShaktiSOS && typeof global.ShaktiSOS.unlockAudioContext === 'function'
      ? global.ShaktiSOS.unlockAudioContext()
      : null;
    if (!ctx) return;

    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);
      gain.gain.setValueAtTime(0.001, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.22 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.22);
      osc.stop(now + idx * 0.22 + 0.22);
    });
  }

  function renderJourneyUI() {
    const statusBox = document.getElementById('journey-status-box');
    const startBtn = document.getElementById('journey-start-btn');
    const demoBtn = document.getElementById('journey-demo-btn');
    const reachedBtn = document.getElementById('journey-reached-btn');
    const overdueActions = document.getElementById('journey-overdue-actions');

    if (!statusBox) return;
    statusBox.setAttribute('data-state', journeyState);

    if (journeyState === 'idle') {
      statusBox.textContent = t('emergency.journey.statusIdle', 'Timer not running.');
    } else if (journeyState === 'running') {
      statusBox.textContent = t(
        'emergency.journey.statusRunning',
        'Time remaining: {time}. Stay on this page until arrival.'
      ).replace('{time}', formatDuration(remainingSeconds));
    } else if (journeyState === 'safe') {
      statusBox.textContent = t('emergency.journey.statusSafe', 'Marked as reached safely. Take care!');
    } else if (journeyState === 'overdue') {
      statusBox.textContent = t(
        'emergency.journey.statusOverdue',
        'Journey timer ended! If you need help, call 112 or send an SOS alert now.'
      );
    }

    const isRunning = journeyState === 'running';
    if (startBtn) startBtn.disabled = isRunning;
    if (demoBtn) demoBtn.disabled = isRunning;
    if (reachedBtn) reachedBtn.hidden = !isRunning && journeyState !== 'overdue';
    if (overdueActions) overdueActions.hidden = journeyState !== 'overdue';
  }

  function stopJourneyInterval() {
    if (journeyInterval) {
      clearInterval(journeyInterval);
      journeyInterval = null;
    }
  }

  function startJourney(seconds) {
    if (global.ShaktiSOS && typeof global.ShaktiSOS.unlockAudioContext === 'function') {
      global.ShaktiSOS.unlockAudioContext();
    }

    stopJourneyInterval();
    remainingSeconds = Math.max(1, Number(seconds) || 10);
    journeyState = 'running';
    renderJourneyUI();

    journeyInterval = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        stopJourneyInterval();
        remainingSeconds = 0;
        journeyState = 'overdue';
        playOverdueChime();
        renderJourneyUI();
      } else {
        renderJourneyUI();
      }
    }, 1000);
  }

  function markReachedSafely() {
    stopJourneyInterval();
    remainingSeconds = 0;
    journeyState = 'safe';
    renderJourneyUI();
  }

  function initJourneyTimer() {
    const durationSelect = document.getElementById('journey-duration-select');
    const startBtn = document.getElementById('journey-start-btn');
    const demoBtn = document.getElementById('journey-demo-btn');
    const reachedBtn = document.getElementById('journey-reached-btn');
    const overdueSosBtn = document.getElementById('journey-overdue-sos-btn');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const seconds = Number(durationSelect ? durationSelect.value : 900) || 900;
        startJourney(seconds);
      });
    }

    if (demoBtn) {
      demoBtn.addEventListener('click', () => startJourney(10));
    }

    if (reachedBtn) {
      reachedBtn.addEventListener('click', markReachedSafely);
    }

    if (overdueSosBtn) {
      overdueSosBtn.addEventListener('click', () => {
        if (global.ShaktiSOS && typeof global.ShaktiSOS.prepareMessageFromTimer === 'function') {
          global.ShaktiSOS.prepareMessageFromTimer();
        }
      });
    }

    renderJourneyUI();
  }

  document.addEventListener('shakti:langchange', renderJourneyUI);
  document.addEventListener('DOMContentLoaded', initJourneyTimer);
  window.addEventListener('beforeunload', stopJourneyInterval);
})(window);
