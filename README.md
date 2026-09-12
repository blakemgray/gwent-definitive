# Gwent Classic — Definitive Edition

Canonical JS-first hosted build of classic *The Witcher 3* Gwent.

> **Project handoff / continuity:** read [`CONTINUITY.md`](CONTINUITY.md) and [`FUTURE_CONTINUITY.md`](FUTURE_CONTINUITY.md) before starting or resuming implementation. GitHub is authoritative for source, commits, pull requests, CI, artifacts, merge verification, and deployment state.

## Current implementation status

**Pass 11 — Golden Match / Complete Normal Match is implemented on PR #11 (`pass-11-golden-match`) and has completed automated release verification.** The production `main` branch remains the pre-Pass-11 baseline until an explicit merge/deploy is authorized. Installed-iPhone sensory/platform signoff remains external release acceptance.

Pass 11 preserves the closed interaction stack beneath it:

- **Pass 10.3** — authoritative battlefield geometry and six-row layout.
- **Pass 10.4A** — one canonical tap/drag/action path with interruption-safe direct manipulation.
- **Pass 10.4B** — serialized cause→effect gameplay choreography.
- **Pass 10.4C** — physical feel, semantic feedback, accessibility, and reduced-motion polish.

The current candidate adds the complete normal-match product loop around that foundation rather than replacing it.

## Product doctrine

The default rules foundation is classic Witcher 3 Gwent. Modernization belongs around the rules: clearer interaction, stronger presentation, smarter non-cheating AI, quality-of-life improvements, modular assists/cheats, and eventual native-quality iPhone delivery.

Runtime invariants:

- the deterministic engine owns legality, scoring, effects, choices, rounds, and match outcome;
- presentation never decides rules truth;
- engine state commits before presentation and presentation is disposable/cancellable;
- stable card IDs plus per-match `iid`s preserve card identity;
- tap, drag, keyboard, opponent, and restored-session actions converge on one validated action path;
- invalid or ambiguous intent produces zero authoritative mutation;
- opponent actions cannot advance through unresolved presentation or player choice;
- AI difficulty means better reasoning, never hidden-information cheating.

Interaction north star:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

Primary gameplay target is an installed iPhone landscape PWA. Pass 10.3 final geometry remains frozen authority.

## Pass 11 — Golden Match

The Pass 11 candidate now provides one genuine normal Instant Match from menu to rematch:

- legal full-size Northern Realms and Monsters presets;
- deterministic shuffle plus a real opening draw and two-card mulligan;
- complete ordinary turn loop, passing/exhaustion, scoring, rounds, faction/life effects, and best-of-three terminal result;
- production handling for the locked decks' normal choices and signature mechanics;
- Restart, Resume, Rematch, Main Menu, durable terminal result, and mid-match Continue restore;
- Standard opponent behavior on the same public legal-action surface as the player;
- always-readable effective power and card identity;
- ambiguity-aware input forgiveness, predictive target exposure, and continuous perceived card identity;
- concrete Web Audio feedback with persisted effects settings and honest capability-gated haptic semantics;
- truthful save-failure behavior: committed gameplay remains authoritative even when persistence fails, recovery saves exactly that state, and malformed/incompatible saves are rejected safely;
- serialized opponent scheduling so consecutive bot actions cannot commit through unresolved presentation;
- coherent installed-PWA core generations so a partial deployment cannot mix new shell files with old cached modules;
- a final Pass 11 runtime identity guard so closed lower interaction/presentation layers cannot leave the app mislabeled as an earlier milestone.

The service-worker shell generation is `11.golden.4`. The save-format build identifier remains independently versioned because release-label/cache-generation cleanup does not change save semantics.

## QA and acceptance

CI runs the real browser product at the iPhone-landscape target geometry and preserves the earlier regression matrix while adding Pass 11-specific proof. Current gates cover:

- engine/fuzz/catalog and PWA contracts;
- legal setup/mulligan and lifecycle/choice/rematch;
- 11.2A readability, 11.2B intent, 11.2C target exposure, and 11.2D card continuity;
- concrete audio/haptic/PWA platform truth;
- adversarial old-install → partial-new → healthy-new → offline PWA upgrade behavior;
- a no-state-injection Golden Match from normal menu to natural best-of-three result, live reload/Continue, and fresh Rematch;
- direct-manipulation baseline, destination parity, interruption recovery, semantic landing, save/visibility restore, and WebKit/iPhone-targeted behavior;
- consecutive-bot presentation serialization;
- **256-trial physical interaction stress**;
- preserved 10.4B signature/adversarial choreography and 10.4C feel/pacing;
- dedicated storage-resilience coverage for failed writes, recovery, malformed saves, and bounded legacy compatibility.

The latest exact functional candidate passed the full main verification and dedicated storage-resilience suites, and its Golden Match, PWA-upgrade, platform-feedback, storage, and feel artifacts were manually reviewed without a release blocker.

Automated proof does **not** substitute for human real-device sensory acceptance. Installed-iPhone audible output, background/relaunch behavior, tactile capability/quality, and final physical feel remain external signoff items before Pass 11 is treated as fully released.

## Key runtime files

- `src/gwent-engine.js` — deterministic classic rules engine.
- `src/cards-catalog.js` — 216-card catalog.
- `app.js` — production shell, Golden Match setup/lifecycle, bounded opponent.
- `src/storage.js` — validated prepared/active/result persistence and save-failure reporting.
- `src/battlefield-ux.js` — frozen final geometry/reconciliation.
- `src/gesture-controller.js` + `src/interaction-intent.js` — canonical direct manipulation and intent resolution.
- `src/target-exposure.js` + `src/card-continuity.js` — presentation-only targeting and identity continuity.
- `src/presentation-queue.js` + `src/interaction-turn-gate.js` — serialized presentation and opponent mutation gating.
- `src/presentation-events.js` + `src/gameplay-choreography.js` — semantic cause→effect presentation.
- `src/presentation-feedback.js` + `src/platform-feedback.js` — semantic feedback routing, concrete browser audio/platform behavior, and current release-identity guard.
- `sw.js` — coherent versioned installed-PWA shell/runtime caching.

## Local checks

```bash
npm test
python -m http.server 4173
GWENT_TEST_URL=http://127.0.0.1:4173 python tests/ui_smoke.py
```

Production deployment occurs only after verification succeeds on `main`; pull-request verification does not deploy.
