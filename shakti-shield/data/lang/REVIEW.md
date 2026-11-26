# Shakti Shield — Translation Review Guide (`data/lang/REVIEW.md`)

> **Important Notice:** All non-English translation files (`hi.json`, `bn.json`, `ta.json`, `kn.json`, `te.json`) are **machine-assisted drafts**. Before deploying Shakti Shield to the public, a fluent native speaker must review each language file—especially **emergency instructions, SOS messages, self-defence steps, and legal terminology**.

## Language Files & Review Status

| Code | Language | Native Label | File | Status | Reviewer / Date |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `en` | English | English | `en.json` | Source baseline | — |
| `hi` | Hindi | हिन्दी | `hi.json` | Machine-assisted draft — needs native review | Pending |
| `bn` | Bengali | বাংলা | `bn.json` | Machine-assisted draft — needs native review | Pending |
| `ta` | Tamil | தமிழ் | `ta.json` | Machine-assisted draft — needs native review | Pending |
| `kn` | Kannada | ಕನ್ನಡ | `kn.json` | Machine-assisted draft — needs native review | Pending |
| `te` | Telugu | తెలుగు | `te.json` | Machine-assisted draft — needs native review | Pending |

## Mandatory Review Checklist (Per Language)

1. **Emergency & Safety Accuracy (Highest Priority)**
   - Verify emergency instructions (`call 112 first`, SOS countdown, Quick Exit, Safe Journey Timer, self-defence escape-first warnings) preserve the **exact safety meaning** without softening or altering urgency.
   - Check that SOS SMS/WhatsApp templates are short, clear, and fit comfortably within single/compact SMS character limits.

2. **Legal Terms & Unchanged Identifiers**
   - Confirm Latin digits (`0-9`) are used for all numbers, dates, and helplines (`112`, `1091`, `181`, `7827170170`, `1930`, `2024`, `2026`, `173`, `175(3)`).
   - Confirm law abbreviations and section numbers are **never** altered or translated: `BNS`, `BNSS`, `BSA`, `POSH Act 2013`, `Protection of Women from Domestic Violence Act 2005`, `IPC`, `CrPC`, `FIR`, `Zero FIR`, `e-FIR`, `NCW`, `SHe-Box`.
   - Confirm translated legal terms include the English term in brackets right after them (e.g., `(FIR)`, `(Zero FIR)`, `(Magistrate)`).
   - Confirm URLs (`cybercrime.gov.in`, `scholarships.gov.in`) and the brand name `Shakti Shield` remain intact (transliteration in brackets is permitted).

3. **Tone, Clarity & Sensitivity**
   - Ensure sentences are short, plain, calm, and supportive—never victim-blaming, judgmental, or frightening.
   - Confirm every `"verify from official sources"` and `"general information only, not legal advice"` notice is clear and natural.

4. **UI & 360px Mobile Layout Check**
   - Open every page on a `360px` wide viewport in the target language.
   - Verify no buttons, navbar items, or cards overflow horizontally, clip text, or apply uppercase/extra letter-spacing to Indian scripts.
