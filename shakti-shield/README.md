# Shakti Shield — Women Safety & Empowerment

> **Prevent, Protect, Empower**  
> *Strength that protects. Power that uplifts.*

**Shakti Shield** is a responsive, offline-capable, six-language web application built using **only HTML5, CSS3, and vanilla JavaScript (ES6+)**—with no frameworks, no backend server, no external libraries, and no analytics or tracking.

Last updated: **November 2026** (verified data as of `2026-11-25`).

## Live Website & GitHub Links

- **Permanent Live Website URL:** [https://nihaal26bca3079-sketch.github.io/Workshop-/shakti-shield/](https://nihaal26bca3079-sketch.github.io/Workshop-/shakti-shield/)
- **GitHub Repository:** [https://github.com/nihaal26bca3079-sketch/Workshop-/tree/main/shakti-shield](https://github.com/nihaal26bca3079-sketch/Workshop-/tree/main/shakti-shield)
- **GitHub Username / Profile:** [https://github.com/nihaalbelim655](https://github.com/nihaalbelim655) (`@nihaalbelim655`)
- **GitHub Email ID:** `nihaalbelim655@gmail.com`

---

## 1. Setup & Running Locally

> **Important:** Do **not** open `index.html` directly via `file://`. Browser `fetch()` requests for JSON translation/data files, browser geolocation, and Service Workers require `http://` or `https://`.

### Option A: VS Code Live Server (Recommended)
1. Open the `shakti-shield/` folder in Visual Studio Code.
2. Install/open the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Your browser will open `http://127.0.0.1:5500/index.html` (or similar local port).

### Option B: Built-in Local HTTP Server
From inside the `shakti-shield/` directory:
- Using Python:
  ```bash
  python -m http.server 8080
  ```
  Then open `http://localhost:8080/`.
- Or using Node:
  ```bash
  npx serve .
  ```

---

## 2. Features Across All 10 Pages

- **Global Features**
  - Six-language dropdown in the sticky navbar: **English (`en`)**, **Hindi (`hi` — हिन्दी)**, **Bengali (`bn` — বাংলা)**, **Tamil (`ta` — தமிழ்)**, **Kannada (`kn` — ಕನ್ನಡ)**, and **Telugu (`te` — తెలుగు)**.
  - Instant UI, `<html lang>`, font, `document.title`, and `<meta name="description">` switching without reloading the page (`localStorage` persists user choice, overriding browser default).
  - Light & Dark mode toggle saved in `localStorage`.
  - **Quick Exit** button (and double `Escape` key shortcut) redirecting via `location.replace()` to a neutral search page.
  - Privacy banner (`"Your data stays on your device"`), footer disclaimer, and `prefers-reduced-motion` support.
  - PWA support (`manifest.json`, versioned `service-worker.js`, `offline.html`, `icons/icon-192.png`, `icons/icon-512.png`).
- **Home (`index.html`)**: Hero with tagline, large red Emergency Help button, verified helplines strip, quick links to all 9 sections, and verified legal awareness facts (no invented statistics).
- **Emergency (`pages/emergency.html`)**: One-tap `tel:` helplines, `"call 112 first"` banner, Smart SOS (5-second countdown with cancel, Web Audio API siren, <= 2 flashes/sec screen alert with steady color for `prefers-reduced-motion`, non-stored geolocation link, short SOS message in selected language, single-contact WhatsApp `wa.me` / iOS+Android `sms:` / Web Share), Safe Journey Timer with 10-second demo mode & `"Reached safely"` button, Fake Call simulator with Web Audio API ringtone, `+91` Trusted Contacts manager (`localStorage`), and Nearby Help Finder (Google Maps).
- **Safety Toolkit (`pages/toolkit.html`)**: Keyboard-accessible tabs (`Travel`, `Night Commute`, `Online Safety`, `Workplace`, `Home`), Do's and Don'ts cards, and a personalised safety checklist generator.
- **Incident Guide (`pages/incident-guide.html`)**: 4-scenario interactive wizard (`Stalking`, `Online Harassment`, `Workplace Harassment`, `Domestic Violence`), evidence tips, reporting guidance, relevant verified helplines, Zero FIR / free copy / police refusal guide, and browsing history safety note.
- **Cyber Safety Centre (`pages/cyber.html`)**: Guidance on sextortion, fake profiles, deepfakes, interactive privacy settings checkup, and reporting steps for `cybercrime.gov.in` and `1930` (`verify`).
- **Know Your Rights (`pages/rights.html`)**: Searchable (Unicode `NFC`, bilingual current language + English) and filterable accordion built from `data/rights.json` (`BNS Section 74–79`, `BNSS Section 173`, `BNSS Section 175(3)`, `POSH Act 2013`, `Protection of Women from Domestic Violence Act 2005`), plus FIR filing steps.
- **Self-Defence (`pages/defence.html`)**: Escape-first basic techniques with inline SVG diagrams and a note to seek certified professional training.
- **Safety Quiz (`pages/quiz.html`)**: 6 scenario-based questions in identical order/answer key across all 6 languages, SVG score ring, personalised tips, and SVG progress chart backed by `localStorage`.
- **Empowerment Corner (`pages/empowerment.html`)**: Scholarship cards built from `data/scholarships.json` with `Open`/`Closed`/`Verify` badges, bilingual search/filtering, `scholarships.gov.in` links, factual success stories, and career tips.
- **Contact (`pages/contact.html`)**: Local validation feedback form with translated success message (clearly marked as local demo with no backend transmission).

---

## 3. Tech Used

- **Markup & Styling**: HTML5 (semantic landmarks, ARIA attributes), CSS3 (Flexbox, CSS Grid, custom properties, `prefers-reduced-motion`)
- **Logic**: Vanilla JavaScript (ES6+)
- **Data & i18n**: JSON (`data/*.json` language-neutral datasets + `data/lang/*.json` translation dictionaries)
- **Browser APIs**: Web Audio API (synthesized siren/ringtone), Geolocation API, Web Share API, `localStorage` / `sessionStorage`, Service Worker & Cache Storage API, Web App Manifest

---

## 4. How to Add a New Language

1. Copy `data/lang/en.json` to `data/lang/<code >.json` (e.g., `mr.json` for Marathi).
2. Translate descriptive strings while keeping:
   - Latin digits (`0-9`) everywhere
   - Brand name `Shakti Shield` (optional transliteration in brackets), URLs, phone numbers (`112`, `1091`, `181`, `7827170170`, `1930`), law abbreviations (`BNS`, `BNSS`, `BSA`, `POSH`, `FIR`, `Zero FIR`, `e-FIR`, `NCW`, `SHe-Box`), and section numbers (`74–79`, `173`, `175(3)`, `2013`, `2005`) untranslated
   - English legal terms in brackets after translated legal terms, e.g., `... (FIR)`
   - Exact same question order and option order in `quiz.questions`
3. Register the language in `js/language.js`:
   - Add `{ code, name, label }` to `SUPPORTED_LANGUAGES`
   - Add its Noto Sans font URL to `FONT_URLS`
4. Add `<option value="<code>" lang="<code>">Native Name</option>` to `#language-select` in `index.html` and `pages/*.html`.
5. Add CSS `html:lang(<code>)` font & `1.72` line-height / no-uppercase / no-letter-spacing rules in `css/style.css`.
6. Update `service-worker.js` regex `/\/data\/lang\/(hi|bn|ta|kn|te|<code>)\.json$/` and bump `CACHE_VERSION`.
7. Complete native-speaker review per `data/lang/REVIEW.md`.

---

## 5. How to Update the Data Files

1. Edit the language-neutral files in `data/`:
   - `data/helplines.json`
   - `data/rights.json`
   - `data/scholarships.json`
2. Update `last_verified` (e.g., `"2026-11-25"`) in the edited `data/*.json` file and update matching entries in all `data/lang/*.json` files (`common.lastUpdated`, `common.lastVerified`, and item descriptions).
3. **Important:** Open `service-worker.js` and increment `CACHE_VERSION` (e.g., from `shakti-shield-v1.0.0` to `shakti-shield-v1.0.1`) so returning users receive the updated data and translations.

---

## 6. Translation Review Checklist (`data/lang/REVIEW.md`)

- [ ] Native speaker reviewed `hi.json`, `bn.json`, `ta.json`, `kn.json`, and `te.json` (see `data/lang/REVIEW.md`).
- [ ] All emergency warnings (`call 112 first`, SOS countdown, Safe Journey Timer, self-defence escape-first note) preserve exact urgency and meaning.
- [ ] SOS SMS/WhatsApp templates are short and fit Indian-script SMS limits.
- [ ] Latin digits (`0-9`) are used everywhere; no law section numbers, abbreviations, URLs, or phone numbers were altered.
- [ ] Translated legal terms include the English term in brackets, e.g. `(FIR)` / `(Zero FIR)`.
- [ ] Every page verified across all 6 languages on a `360px` wide mobile viewport with no clipping or horizontal scroll.

---

## 7. Known Limitations

1. **SOS alerts are alert assistance**: the user must pick one contact at a time and tap send in WhatsApp or SMS.
2. **Browser-only storage**: contacts, theme, language, and quiz history are stored only in `localStorage` on the current device/browser.
3. **Quick Exit** immediately replaces the current page with a neutral search page, **but does not clear earlier browser history**.
4. **Machine-assisted translation drafts**: all non-English translations are machine-assisted drafts pending native-speaker review (`data/lang/REVIEW.md`).
5. **Subject to change**: laws, helplines, and scholarship details change; always verify from official sources.
6. **General information only**: not legal advice and not a substitute for emergency services (`112`).

---

## 8. Future Scope

- Optional user login and encrypted accounts
- Secure backend and verified live database
- Automated server-side SMS/WhatsApp alert delivery
- Interactive live help-centre map
- Moderated anonymous community support space
- AI-assisted contextual guidance
- Additional regional languages such as Marathi, Gujarati, Malayalam, and Punjabi

---

## 9. 3-Minute Demo Script (Multilingual Walkthrough)

1. **0:00 – 0:35 | Home Page & Language Switching (`index.html`)**
   - Show the calm purple/white interface, privacy banner (`Your data stays on your device`), and large red **Emergency Help & SOS** button.
   - Open the navbar language dropdown and switch from **English** to **Hindi (`हिन्दी`)** and **Tamil (`தமிழ்`)**—point out instant DOM updates without reload, active-language font switching, Latin `0-9` helpline numbers, and `Last updated: November 2026`.
   - Toggle **Dark Mode** on and off.

2. **0:35 – 1:25 | Emergency Page (`pages/emergency.html`)**
   - Click **Emergency Help & SOS**. Add a sample `+91` trusted contact to show validation and `localStorage` persistence.
   - Start the **Safe Journey Timer** using **10 sec (Demo Mode)**, then tap **Reached Safely** (note that it works while the page stays open).
   - Start **Smart SOS** (5-second countdown -> **Cancel** or let it activate Web Audio siren + screen alert, show the SOS message built in the active language, and pick a contact for WhatsApp/SMS).
   - Switch to **Bengali (`বাংলা`)** or **Telugu (`తెలుగు`)** and show the prepared SOS message updates immediately in that script.

3. **1:25 – 2:10 | Know Your Rights & Bilingual NFC Search (`pages/rights.html`)**
   - Open **Know Your Rights**. Switch to **Kannada (`ಕನ್ನಡ`)** or **Hindi (`हिन्दी`)**.
   - Search `"FIR"` (English) and then an Indian-script word like `"पीछा"` (Hindi) to demonstrate Unicode `NFC` bilingual search across both current language and English.
   - Expand an accordion item to show `BNS` / `BNSS` details, `Last verified: 2026-11-25`, and `Verify from official sources.`

4. **2:10 – 2:45 | Safety Quiz & Empowerment (`pages/quiz.html`, `pages/empowerment.html`)**
   - Complete the 6-question **Safety Quiz** to show the SVG Score Ring, personalised tips, and the SVG Progress Chart updating in `localStorage`.
   - Open **Empowerment Corner**, filter scholarships by **Open** / **Closed**, and point out status badges (`Open`, `Closed`, `Verify`) and the `scholarships.gov.in` link.

5. **2:45 – 3:00 | Quick Exit & Offline Safety (`Quick Exit`)**
   - Press **`Escape` twice** (or click **Quick Exit**) to demonstrate instant exit to a neutral page via `location.replace()`.
