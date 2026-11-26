/**
 * Shakti Shield — Smart SOS, Trusted Contacts, Fake Call & Nearby Help (js/sos.js)
 * Uses Web Audio API (no audio files), never stores geolocation,
 * uses digits-only wa.me links and iOS/Android-aware sms: links with encodeURIComponent.
 */

(function (global) {
  'use strict';

  const CONTACTS_KEY = 'shakti_contacts';
  const SOS_COUNTDOWN_SECONDS = 5;

  let cachedHelplines = null;
  let audioCtx = null;

  // SOS state (coordinates held in memory only, never persisted)
  let sosCountdownTimer = null;
  let sosCountdownLeft = 0;
  let sosActive = false;
  let sirenOsc = null;
  let sirenGain = null;
  let sirenSweepTimer = null;
  let sessionCoords = null; // { lat, lng } | null
  let selectedContactId = null;

  // Fake call state
  let fakeCallTimeout = null;
  let fakeCallTick = null;
  let ringInterval = null;
  let callDurationTimer = null;
  let callSeconds = 0;

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

  /**
   * Ensure Web Audio API AudioContext is created/resumed inside a user click gesture.
   * @returns {AudioContext|null}
   */
  function unlockAudioContext() {
    const AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  /* ------------------------------------------------------------------------
     1. Verified Helplines (from data/helplines.json)
     ------------------------------------------------------------------------ */
  function renderEmergencyHelplines(data) {
    const container = document.getElementById('emergency-helplines-list');
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

    const verifiedEl = document.getElementById('emergency-helplines-verified');
    if (verifiedEl && data.last_verified) {
      verifiedEl.textContent = t('common.lastVerified', `Last verified: ${data.last_verified}`);
    }
  }

  async function initEmergencyHelplines() {
    const container = document.getElementById('emergency-helplines-list');
    if (!container) return;

    const fallback = global.SHAKTI_FALLBACK && global.SHAKTI_FALLBACK.data && global.SHAKTI_FALLBACK.data.helplines;
    if (window.location.protocol === 'file:' && fallback) {
      cachedHelplines = fallback;
      renderEmergencyHelplines(cachedHelplines);
      return;
    }

    try {
      const res = await fetch(`${getBasePath()}/data/helplines.json`);
      if (res.ok) {
        cachedHelplines = await res.json();
        renderEmergencyHelplines(cachedHelplines);
        return;
      }
    } catch (err) {
      console.error('Failed to load helplines.json:', err);
    }

    if (fallback) {
      cachedHelplines = fallback;
      renderEmergencyHelplines(cachedHelplines);
    }
  }

  /* ------------------------------------------------------------------------
     2. Trusted Contacts Manager (localStorage, +91 validation)
     ------------------------------------------------------------------------ */
  function loadContacts() {
    try {
      const raw = localStorage.getItem(CONTACTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveContacts(list) {
    try {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage quota errors
    }
  }

  /**
   * Validate and normalize an Indian phone number to +91XXXXXXXXXX.
   * @param {string} rawPhone
   * @returns {string|null}
   */
  function normalizeIndianPhone(rawPhone) {
    const digits = String(rawPhone || '').replace(/\D/g, '');
    let tenDigits = '';

    if (digits.length === 10) {
      tenDigits = digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      tenDigits = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      tenDigits = digits.slice(2);
    } else {
      return null;
    }

    if (!/^[6-9]\d{9}$/.test(tenDigits)) {
      return null;
    }
    return `+91${tenDigits}`;
  }

  function renderContacts() {
    const listEl = document.getElementById('contacts-list');
    const selectEl = document.getElementById('sos-contact-select');
    const emptyEl = document.getElementById('contacts-empty');
    if (!listEl || !selectEl) return;

    const contacts = loadContacts();
    if (!selectedContactId && contacts.length > 0) {
      selectedContactId = contacts[0].id;
    }
    if (selectedContactId && !contacts.some((c) => c.id === selectedContactId)) {
      selectedContactId = contacts.length > 0 ? contacts[0].id : null;
    }

    listEl.textContent = '';
    selectEl.textContent = '';

    if (contacts.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = t('emergency.sos.noContactsOption', 'No saved contacts yet — add one below');
      selectEl.appendChild(opt);
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    contacts.forEach((contact) => {
      const opt = document.createElement('option');
      opt.value = contact.id;
      opt.textContent = `${contact.name} (${contact.phone})`;
      selectEl.appendChild(opt);

      const li = document.createElement('li');
      li.className = `contact-item${contact.id === selectedContactId ? ' is-selected' : ''}`;

      const meta = document.createElement('div');
      meta.className = 'contact-item__meta';

      const nameEl = document.createElement('p');
      nameEl.className = 'contact-item__name';
      nameEl.textContent = contact.name;

      const phoneEl = document.createElement('p');
      phoneEl.className = 'contact-item__phone';
      phoneEl.textContent = contact.phone;

      meta.appendChild(nameEl);
      meta.appendChild(phoneEl);

      const actions = document.createElement('div');
      actions.className = 'btn-row';

      const selectBtn = document.createElement('button');
      selectBtn.type = 'button';
      selectBtn.className = 'btn btn-primary btn-sm';
      selectBtn.textContent = t('emergency.contacts.useForSos', 'Select');
      selectBtn.addEventListener('click', () => {
        selectedContactId = contact.id;
        renderContacts();
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-outline btn-sm';
      removeBtn.textContent = t('emergency.contacts.removeBtn', 'Remove');
      removeBtn.addEventListener('click', () => {
        const updated = loadContacts().filter((c) => c.id !== contact.id);
        saveContacts(updated);
        renderContacts();
      });

      actions.appendChild(selectBtn);
      actions.appendChild(removeBtn);

      li.appendChild(meta);
      li.appendChild(actions);
      listEl.appendChild(li);
    });

    if (selectedContactId) {
      selectEl.value = selectedContactId;
    }
  }

  function initContactsManager() {
    const form = document.getElementById('contact-form');
    const nameInput = document.getElementById('contact-name');
    const phoneInput = document.getElementById('contact-phone');
    const feedbackEl = document.getElementById('contact-form-feedback');
    const selectEl = document.getElementById('sos-contact-select');

    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        selectedContactId = e.target.value || null;
        renderContacts();
      });
    }

    if (form && nameInput && phoneInput) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (feedbackEl) {
          feedbackEl.textContent = '';
          feedbackEl.className = 'form-error';
        }

        const name = nameInput.value.trim();
        const normalizedPhone = normalizeIndianPhone(phoneInput.value);

        if (name.length < 2) {
          if (feedbackEl) {
            feedbackEl.textContent = t('emergency.contacts.errName', 'Please enter a contact name (at least 2 characters).');
          }
          nameInput.focus();
          return;
        }

        if (!normalizedPhone) {
          if (feedbackEl) {
            feedbackEl.textContent = t('emergency.contacts.errPhone', 'Enter a valid 10-digit Indian number (with or without +91).');
          }
          phoneInput.focus();
          return;
        }

        const contacts = loadContacts();
        if (contacts.some((c) => c.phone === normalizedPhone)) {
          if (feedbackEl) {
            feedbackEl.textContent = t('emergency.contacts.errDuplicate', 'This number is already in your trusted contacts.');
          }
          return;
        }

        const newContact = {
          id: `c_${Date.now()}`,
          name,
          phone: normalizedPhone
        };
        contacts.push(newContact);
        saveContacts(contacts);
        selectedContactId = newContact.id;

        nameInput.value = '';
        phoneInput.value = '';
        if (feedbackEl) {
          feedbackEl.className = 'form-success';
          feedbackEl.textContent = t('emergency.contacts.savedMsg', 'Trusted contact saved on this device.');
        }
        renderContacts();
      });
    }

    renderContacts();
  }

  /* ------------------------------------------------------------------------
     3. Smart SOS (5s Countdown, Siren, Flashing Screen, Geolocation, Sharing)
     ------------------------------------------------------------------------ */
  function buildSosMessage() {
    if (sessionCoords && typeof sessionCoords.lat === 'number' && typeof sessionCoords.lng === 'number') {
      const prefix = t('emergency.sos.messageWithLoc', 'SOS! I need urgent help. My location:');
      const mapsUrl = `https://www.google.com/maps?q=${sessionCoords.lat.toFixed(6)},${sessionCoords.lng.toFixed(6)}`;
      return `${prefix} ${mapsUrl}`;
    }
    return t('emergency.sos.messageNoLoc', 'SOS! I need urgent help. Location unavailable—please call me or 112.');
  }

  function updateSosMessagePreview() {
    const preview = document.getElementById('sos-message-preview');
    if (preview) {
      preview.value = buildSosMessage();
    }
  }

  function startSiren() {
    const ctx = unlockAudioContext();
    if (!ctx) return;

    stopSiren();
    sirenOsc = ctx.createOscillator();
    sirenGain = ctx.createGain();
    sirenOsc.type = 'sawtooth';
    sirenOsc.frequency.setValueAtTime(720, ctx.currentTime);
    sirenGain.gain.setValueAtTime(0.24, ctx.currentTime);

    sirenOsc.connect(sirenGain);
    sirenGain.connect(ctx.destination);
    sirenOsc.start();

    let high = false;
    sirenSweepTimer = setInterval(() => {
      if (!sirenOsc || !audioCtx) return;
      high = !high;
      sirenOsc.frequency.setTargetAtTime(high ? 980 : 680, audioCtx.currentTime, 0.08);
    }, 450);
  }

  function stopSiren() {
    if (sirenSweepTimer) {
      clearInterval(sirenSweepTimer);
      sirenSweepTimer = null;
    }
    if (sirenOsc) {
      try {
        sirenOsc.stop();
        sirenOsc.disconnect();
      } catch {
        // Ignore if already stopped
      }
      sirenOsc = null;
    }
    if (sirenGain) {
      try {
        sirenGain.disconnect();
      } catch {
        // Ignore
      }
      sirenGain = null;
    }
  }

  function setFlashing(active) {
    const overlay = document.getElementById('sos-flash-overlay');
    if (!overlay) return;
    overlay.classList.toggle('is-active', active);
  }

  function requestSessionGeolocation() {
    const locStatus = document.getElementById('sos-location-status');
    if (!navigator.geolocation) {
      sessionCoords = null;
      if (locStatus) {
        locStatus.textContent = t('emergency.sos.locUnavailable', 'Location is unavailable on this device/browser.');
      }
      updateSosMessagePreview();
      return;
    }

    if (locStatus) {
      locStatus.textContent = t('emergency.sos.locLoading', 'Checking browser location (never stored)...');
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sessionCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        if (locStatus) {
          locStatus.textContent = t('emergency.sos.locSuccess', 'Location ready (not stored on device or server).');
        }
        updateSosMessagePreview();
      },
      (err) => {
        sessionCoords = null;
        if (locStatus) {
          if (err && err.code === err.PERMISSION_DENIED) {
            locStatus.textContent = t('emergency.sos.locDenied', 'Location permission was denied. Your SOS message still works without a map link.');
          } else {
            locStatus.textContent = t('emergency.sos.locUnavailable', 'Location is unavailable on this device/browser.');
          }
        }
        updateSosMessagePreview();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  function setSosUIState(state, messageText) {
    const statusBox = document.getElementById('sos-status-box');
    const startBtn = document.getElementById('sos-start-btn');
    const cancelBtn = document.getElementById('sos-cancel-btn');
    const stopBtn = document.getElementById('sos-stop-btn');

    if (statusBox) {
      statusBox.setAttribute('data-state', state);
      statusBox.textContent = messageText;
    }
    if (startBtn) startBtn.hidden = state === 'countdown' || state === 'active';
    if (cancelBtn) cancelBtn.hidden = state !== 'countdown';
    if (stopBtn) stopBtn.hidden = state !== 'active';
  }

  function activateSosAlert() {
    sosActive = true;
    startSiren();
    setFlashing(true);
    setSosUIState('active', t('emergency.sos.activeStatus', 'SOS alert active. Pick a contact below to send your message.'));
    updateSosMessagePreview();
  }

  function stopSosAlert() {
    if (sosCountdownTimer) {
      clearInterval(sosCountdownTimer);
      sosCountdownTimer = null;
    }
    sosActive = false;
    stopSiren();
    setFlashing(false);
    setSosUIState('idle', t('emergency.sos.stoppedStatus', 'SOS siren and visual alert stopped.'));
  }

  function cancelSosCountdown() {
    if (sosCountdownTimer) {
      clearInterval(sosCountdownTimer);
      sosCountdownTimer = null;
    }
    sosCountdownLeft = 0;
    setSosUIState('idle', t('emergency.sos.cancelledStatus', 'SOS countdown cancelled.'));
  }

  function startSosCountdown() {
    if (sosCountdownTimer || sosActive) return;

    // Unlock Web Audio inside user click gesture before countdown finishes
    unlockAudioContext();
    requestSessionGeolocation();

    sosCountdownLeft = SOS_COUNTDOWN_SECONDS;
    const renderTick = () => {
      const msg = t('emergency.sos.countdownLabel', 'SOS activating in {sec}s...').replace('{sec}', String(sosCountdownLeft));
      setSosUIState('countdown', msg);
    };

    renderTick();
    sosCountdownTimer = setInterval(() => {
      sosCountdownLeft -= 1;
      if (sosCountdownLeft <= 0) {
        clearInterval(sosCountdownTimer);
        sosCountdownTimer = null;
        activateSosAlert();
      } else {
        renderTick();
      }
    }, 1000);
  }

  function getSelectedContact() {
    const selectEl = document.getElementById('sos-contact-select');
    const id = (selectEl && selectEl.value) || selectedContactId;
    if (!id) return null;
    return loadContacts().find((c) => c.id === id) || null;
  }

  function getMessageToSend() {
    const preview = document.getElementById('sos-message-preview');
    const text = preview && preview.value.trim() ? preview.value.trim() : buildSosMessage();
    return text;
  }

  function initSosControls() {
    const startBtn = document.getElementById('sos-start-btn');
    const cancelBtn = document.getElementById('sos-cancel-btn');
    const stopBtn = document.getElementById('sos-stop-btn');
    const waBtn = document.getElementById('sos-whatsapp-btn');
    const smsBtn = document.getElementById('sos-sms-btn');
    const shareBtn = document.getElementById('sos-webshare-btn');
    const shareFeedback = document.getElementById('sos-share-feedback');

    updateSosMessagePreview();

    if (startBtn) startBtn.addEventListener('click', startSosCountdown);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelSosCountdown);
    if (stopBtn) stopBtn.addEventListener('click', stopSosAlert);

    if (waBtn) {
      waBtn.addEventListener('click', () => {
        if (shareFeedback) shareFeedback.textContent = '';
        const contact = getSelectedContact();
        if (!contact) {
          if (shareFeedback) {
            shareFeedback.textContent = t('emergency.sos.selectContactPrompt', 'Please add or select a trusted contact first.');
          }
          return;
        }
        // wa.me requires digits only with country code
        const digitsOnly = contact.phone.replace(/\D/g, '');
        const encoded = encodeURIComponent(getMessageToSend());
        window.open(`https://wa.me/${digitsOnly}?text=${encoded}`, '_blank', 'noopener,noreferrer');
      });
    }

    if (smsBtn) {
      smsBtn.addEventListener('click', () => {
        if (shareFeedback) shareFeedback.textContent = '';
        const contact = getSelectedContact();
        if (!contact) {
          if (shareFeedback) {
            shareFeedback.textContent = t('emergency.sos.selectContactPrompt', 'Please add or select a trusted contact first.');
          }
          return;
        }
        const encoded = encodeURIComponent(getMessageToSend());
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const sep = isIOS ? '&' : '?';
        window.location.href = `sms:${contact.phone}${sep}body=${encoded}`;
      });
    }

    if (shareBtn) {
      if (!navigator.share) {
        shareBtn.addEventListener('click', () => {
          if (shareFeedback) {
            shareFeedback.textContent = t('emergency.sos.webShareUnsupported', 'Web Share is not supported in this browser; use WhatsApp or SMS.');
          }
        });
      } else {
        shareBtn.addEventListener('click', async () => {
          if (shareFeedback) shareFeedback.textContent = '';
          try {
            await navigator.share({
              title: 'Shakti Shield SOS',
              text: getMessageToSend()
            });
          } catch {
            // User cancelled native share sheet
          }
        });
      }
    }
  }

  /* ------------------------------------------------------------------------
     4. Fake Call Simulator (Web Audio API Ringtone)
     ------------------------------------------------------------------------ */
  function playRingBurst() {
    const ctx = unlockAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain.gain.setValueAtTime(0.18, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    gain.gain.setValueAtTime(0.001, now + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.58);
    gain.gain.setValueAtTime(0.18, now + 0.92);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    gain.connect(ctx.destination);

    [440, 480].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 1.02);
    });
  }

  function stopFakeRingtone() {
    if (ringInterval) {
      clearInterval(ringInterval);
      ringInterval = null;
    }
  }

  function closeFakeCallOverlay() {
    stopFakeRingtone();
    if (callDurationTimer) {
      clearInterval(callDurationTimer);
      callDurationTimer = null;
    }
    callSeconds = 0;
    const overlay = document.getElementById('fake-call-overlay');
    if (overlay) overlay.hidden = true;
  }

  function showFakeCallOverlay(callerName) {
    const overlay = document.getElementById('fake-call-overlay');
    const callerEl = document.getElementById('fake-call-caller-display');
    const stateEl = document.getElementById('fake-call-state-display');
    const avatarEl = document.getElementById('fake-call-avatar');
    const answerBtn = document.getElementById('fake-call-answer');
    const statusEl = document.getElementById('fake-call-status');
    const cancelBtn = document.getElementById('fake-call-cancel-btn');

    if (statusEl) statusEl.textContent = '';
    if (cancelBtn) cancelBtn.hidden = true;
    if (!overlay) return;

    const cleanName = callerName || t('emergency.fakeCall.defaultCaller', 'Maa (Home)');
    if (callerEl) callerEl.textContent = cleanName;
    if (avatarEl) avatarEl.textContent = cleanName.trim().charAt(0).toUpperCase() || 'M';
    if (stateEl) stateEl.textContent = t('emergency.fakeCall.incomingLabel', 'Incoming call...');
    if (answerBtn) answerBtn.hidden = false;

    overlay.hidden = false;
    playRingBurst();
    stopFakeRingtone();
    ringInterval = setInterval(playRingBurst, 2200);
  }

  function initFakeCall() {
    const callerInput = document.getElementById('fake-caller-input');
    const delaySelect = document.getElementById('fake-call-delay');
    const startBtn = document.getElementById('fake-call-start-btn');
    const cancelBtn = document.getElementById('fake-call-cancel-btn');
    const statusEl = document.getElementById('fake-call-status');
    const answerBtn = document.getElementById('fake-call-answer');
    const declineBtn = document.getElementById('fake-call-decline');
    const stateEl = document.getElementById('fake-call-state-display');

    if (callerInput && !callerInput.value.trim()) {
      callerInput.value = t('emergency.fakeCall.defaultCaller', 'Maa (Home)');
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        unlockAudioContext();
        if (fakeCallTimeout) clearTimeout(fakeCallTimeout);
        if (fakeCallTick) clearInterval(fakeCallTick);

        const delaySec = Number(delaySelect ? delaySelect.value : 5) || 0;
        const callerName = callerInput ? callerInput.value.trim() : '';

        if (delaySec <= 0) {
          showFakeCallOverlay(callerName);
          return;
        }

        let remaining = delaySec;
        if (cancelBtn) cancelBtn.hidden = false;
        const updateScheduled = () => {
          if (statusEl) {
            statusEl.textContent = t('emergency.fakeCall.scheduledStatus', 'Fake call will ring in {sec}s...').replace('{sec}', String(remaining));
          }
        };
        updateScheduled();

        fakeCallTick = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(fakeCallTick);
            fakeCallTick = null;
          } else {
            updateScheduled();
          }
        }, 1000);

        fakeCallTimeout = setTimeout(() => {
          fakeCallTimeout = null;
          showFakeCallOverlay(callerName);
        }, delaySec * 1000);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (fakeCallTimeout) clearTimeout(fakeCallTimeout);
        if (fakeCallTick) clearInterval(fakeCallTick);
        fakeCallTimeout = null;
        fakeCallTick = null;
        cancelBtn.hidden = true;
        if (statusEl) statusEl.textContent = '';
      });
    }

    if (answerBtn) {
      answerBtn.addEventListener('click', () => {
        stopFakeRingtone();
        answerBtn.hidden = true;
        callSeconds = 0;
        const renderCallTimer = () => {
          const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
          const secs = String(callSeconds % 60).padStart(2, '0');
          if (stateEl) {
            stateEl.textContent = `${t('emergency.fakeCall.activeLabel', 'Call connected')} • ${mins}:${secs}`;
          }
        };
        renderCallTimer();
        callDurationTimer = setInterval(() => {
          callSeconds += 1;
          renderCallTimer();
        }, 1000);
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', closeFakeCallOverlay);
    }
  }

  /* ------------------------------------------------------------------------
     5. Nearby Help Finder (Google Maps Searches)
     ------------------------------------------------------------------------ */
  function openNearbyMap(query) {
    const suffix = sessionCoords
      ? `&query=${encodeURIComponent(query)}&center=${sessionCoords.lat},${sessionCoords.lng}`
      : `&query=${encodeURIComponent(`${query} near me`)}`;
    window.open(`https://www.google.com/maps/search/?api=1${suffix}`, '_blank', 'noopener,noreferrer');
  }

  function initNearbyFinder() {
    const policeBtn = document.getElementById('nearby-police-btn');
    const hospitalBtn = document.getElementById('nearby-hospital-btn');
    const womenBtn = document.getElementById('nearby-women-btn');

    if (policeBtn) policeBtn.addEventListener('click', () => openNearbyMap('police station'));
    if (hospitalBtn) hospitalBtn.addEventListener('click', () => openNearbyMap('hospital'));
    if (womenBtn) womenBtn.addEventListener('click', () => openNearbyMap('women help centre'));
  }

  /* ------------------------------------------------------------------------
     Language Re-render & Lifecycle
     ------------------------------------------------------------------------ */
  document.addEventListener('shakti:langchange', () => {
    if (cachedHelplines) renderEmergencyHelplines(cachedHelplines);
    renderContacts();
    updateSosMessagePreview();

    const callerInput = document.getElementById('fake-caller-input');
    if (callerInput && !callerInput.dataset.edited) {
      callerInput.value = t('emergency.fakeCall.defaultCaller', 'Maa (Home)');
    }
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if (global.ShaktiLang && typeof global.ShaktiLang.whenReady === 'function') {
      await global.ShaktiLang.whenReady();
    }

    const callerInput = document.getElementById('fake-caller-input');
    if (callerInput) {
      callerInput.addEventListener('input', () => {
        callerInput.dataset.edited = '1';
      });
    }

    await initEmergencyHelplines();
    initContactsManager();
    initSosControls();
    initFakeCall();
    initNearbyFinder();
  });

  window.addEventListener('beforeunload', () => {
    stopSiren();
    stopFakeRingtone();
  });

  global.ShaktiSOS = {
    unlockAudioContext,
    prepareMessageFromTimer: () => {
      requestSessionGeolocation();
      updateSosMessagePreview();
      const sosCard = document.getElementById('sos-card');
      if (sosCard) sosCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
})(window);
