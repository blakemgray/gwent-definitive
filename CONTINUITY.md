# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff. Git history preserves older detail; this file records the current authoritative state needed to resume safely.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Pass 11 production merge:** `aa8b6043d68c42ae2dc5310b57106a5a5808a150`  
**Merged PR:** #11 — `pass-11-golden-match`  
**Production Verify + Deploy:** Run #300 / `34701697634` — **FULL SUCCESS**; verify **SUCCESS**; Pages deploy **SUCCESS**  
**Latest exact green functional Pass 11 head:** `20183a10f68b4fff7084936e5aa3194c5a55a7c2`  
**Exact functional Main Verify:** Run #297 / `34700148543` — **FULL SUCCESS**  
**Exact functional Storage Resilience:** Run #14 / `34700148554` — **FULL SUCCESS**  
**Final docs-inclusive PR head:** `2e45b401238f7b4363684a8eca6027035b60a32f`  
**Docs-inclusive Main Verify:** Run #299 / `34700876842` — **FULL SUCCESS**  
**Docs-inclusive Storage Resilience:** Run #16 / `34700876857` — **FULL SUCCESS**  
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match — DEPLOYED**  
**Current phase:** **PRODUCTION DEPLOYED / AUTOMATED RELEASE VERIFICATION COMPLETE / REAL-IPHONE SENSORY SIGNOFF PENDING**  
**Current task:** **perform real installed-iPhone acceptance, capture genuine regressions if any, then plan the next product pass from the deployed Pass 11 baseline**  
**Pass 11 planning:** 100%  
**Pass 11 functional implementation:** 100% candidate-complete  
**Automated verification:** 100% green  
**Default model:** GPT-5.6 Sol · High  
**Last updated:** 2026-09-12 America/New_York

---

# 0. Required start-here protocol

Before substantive resumed work:

1. Read this file in full.
2. Read `FUTURE_CONTINUITY.md` in full.
3. Read `MODEL_ROUTING.md` in full.
4. Reconcile current `main`, current open PRs, and latest workflow state against this file.
5. Treat GitHub as authoritative over chat memory or assumptions.
6. Before implementation changes, write a fresh continuity checkpoint if repository state has moved materially.

Precedence: current user instruction → current repository / exact-head green CI → this file → `FUTURE_CONTINUITY.md` → current contracts/config → `MODEL_ROUTING.md` → older archives/chat.

Never weaken, delete, or bypass CI/QA merely to make a candidate green. Playwright/CI owns deterministic machine and temporal-browser proof. TinyFish is useful for independent live-product QA where reliable, but not as the primary interface for precise GitHub operations or microinteraction proof. Real-device iPhone review remains required for final physical touch/audio/haptic/platform observations.

Every user-facing progress update should include **Implementation %**, **Verified %**, a concise **Layman’s terms** explanation, and the exact **Next** action.

---

# 1. Locked product doctrine

Build the definitive modern implementation of classic *The Witcher 3* Gwent while preserving the classic rules foundation by default and modernizing the experience around it.

Locked invariants:

- Engine state is authoritative; presentation never decides legality, scoring, effects, or outcome.
- Engine commits before presentation; presentation is disposable, cancellable, and interruption-safe.
- Stable card IDs plus per-match `iid`s remain authoritative identity.
- Tap, drag, keyboard, opponent, and restored-session actions converge on one canonical validated action path.
- Invalid or ambiguous intent produces zero authoritative mutation.
- Opponent mutation cannot occur during unresolved presentation or player choice.
- AI difficulty means better legal reasoning, never hidden-information cheating.
- Match classes remain `CLASSIC`, `ASSISTED`, `MODIFIED`, `SANDBOX`.
- Instrumentation is observation-only.

Interaction north star:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

Primary gameplay target: installed iPhone landscape PWA.

**Pass 10.3 Battlefield Geometry Contract v2 remains frozen authority.** Final order: Opponent Siege / Ranged / Close / Weather / Player Close / Ranged / Siege. Motion may interpolate above final slots, but final/rest geometry remains 10.3-owned.

---

# 2. Pass 11 production contract

Pass 11 is deployed and supplies one genuine normal Instant Match from menu to fresh rematch without developer-state injection:

- legal full-size Northern Realms and Monsters presets;
- deterministic shuffle, opening draw, and real two-card mulligan;
- complete normal turn loop, pass/exhaustion, scoring, rounds, faction/life effects, and best-of-three terminal result;
- production pending-choice handling for the locked decks;
- Restart, Resume, Rematch, Main Menu, durable terminal result, and exact Continue restore;
- Standard opponent behavior on the public legal-action surface;
- always-readable effective power and card identity;
- ambiguity-aware input forgiveness, predictive target exposure, and continuous perceived card identity;
- concrete Web Audio output, persisted effects settings, and honest capability-gated haptic semantics;
- truthful save-failure behavior and safe recovery;
- malformed/incompatible save rejection with bounded legacy support;
- serialized opponent scheduling behind unresolved presentation;
- coherent installed-PWA core generations across partial/healthy updates;
- Pass 11 runtime release identity that remains authoritative after closed lower interaction/presentation layers install.

Closed foundation remains: Pass 10.3 geometry, Pass 10.4A direct manipulation, Pass 10.4B signature choreography, and Pass 10.4C feel/presentation.

---

# 3. Current runtime boundaries

Key files:

- `src/gwent-engine.js` — deterministic classic rules engine.
- `src/cards-catalog.js` — 216-card catalog.
- `app.js` — production shell, Golden Match setup/lifecycle, bounded opponent.
- `src/storage.js` — validated prepared/active/result persistence plus save-failure reporting.
- `src/battlefield-ux.js` — frozen final geometry/reconciliation.
- `src/gesture-controller.js` — canonical direct manipulation and intent consumption.
- `src/interaction-intent.js` — pure forgiveness/ambiguity/trajectory resolver.
- `src/battlefield-readability.js`, `physical-card.css` — always-visible current power/readable identity.
- `src/target-exposure.js` — presentation-only predictive target exposure/local yield.
- `src/card-continuity.js` — observation-only `iid` continuity/final-visibility guard.
- `src/presentation-queue.js` — serialized cancellable presentation.
- `src/interaction-turn-gate.js` — opponent mutation serialization behind presentation.
- `src/presentation-events.js` — semantic before/after adapter.
- `src/gameplay-choreography.js` — signature consequence choreography.
- `src/choreography-external-gate.js` — external/bot presentation gate.
- `src/presentation-feedback.js` — semantic audio/haptic cue routing, settings, copy cleanup.
- `src/platform-feedback.js` — concrete Web Audio output, lifecycle recovery, diagnostics, and authoritative Pass 11 runtime release-identity guard.
- `src/motion-tokens.js`, `feel-polish.css` — motion/tactile vocabulary.
- `sw.js` — coherent versioned installed-PWA shell/runtime caching.

Engine/catalog baseline remains 216/216 cards, 44/44 ability tokens, 22/22 leaders, 5/5 factions with ordinary play, Spy, Bond, Muster, Medic choices, Decoy, Weather/Clear, Horn, Scorch, Hero, pass/auto-pass, rounds, factions, leaders, legal deck validation, deterministic shuffle, mulligan, and persisted normal-match state.

---

# 4. Pass 11 slices — closed

## 11.1A — legal setup / mulligan

Legal full-size presets, deterministic production shuffle/QA fixtures, engine-owned two-card mulligan, prepared/active persistence, exact restore, and setup browser/contract gates are closed.

## 11.1B — lifecycle / choice broker

Typed pending-choice routing, deterministic opponent choice, safe unsupported-choice state, choice save/restore, durable result, Restart/Resume/Rematch/Main Menu lifecycle are closed.

## 11.2A — battlefield readability

Always-visible effective power and semantic/accessibility identity are closed without changing frozen resting geometry.

## 11.2B — pure intent resolver

Direct hit, bounded singular forgiveness, fresh bounded trajectory assistance, ambiguity rejection, precision-first card targeting, and zero-mutation invalid return are closed. Node intent contract retains 5,178 assertions across deterministic matrix + 2,500 randomized trials.

## 11.2C — predictive target exposure

Presentation-only target actor/local-neighbor yield is closed; target choice and commit ownership remain canonical; frozen 10.3 resting geometry remains authoritative.

## 11.2D — card identity continuity

Drag/tap identity continuity, interruption cleanup, reduced-motion identity, and final visibility are closed without acquiring rules/geometry authority.

## Platform / sensory browser layer

Concrete Web Audio, real user-activation unlock, lifecycle resume/recovery, persistent effects settings, capability-gated haptic semantics, and platform diagnostics are automated-browser closed. Physical-device sensory observations remain external.

## Golden Match E2E

A normal menu → mulligan → ordinary play → natural best-of-three terminal result → Rematch path is closed in browser QA, including live reload/Continue restore.

---

# 5. Adversarial integration review — F1 through F4 closed

The bounded GPT-6 Astra adversarial review found four integration risks. All are closed in automated evidence.

### F1 — consecutive opponent actions through unresolved presentation — CLOSED

`interaction-turn-gate.js` cancels/re-arms opponent scheduling around presentation activity so a second bot mutation cannot commit while prior presentation is unresolved. Exactly one eligible action re-arms after idle, including interruption cleanup.

### F2 — mixed installed-PWA shell generations during partial deployment — CLOSED

Service worker uses coherent versioned core caching and safe activation with no aggressive `skipWaiting`. A broken partial release remains all-old; a complete healthy release crosses the client boundary and becomes all-new; offline relaunch remains coherent.

### F3 — committed action appearing rejected after persistence failure — CLOSED

Save failure no longer throws back through the gameplay commit. Engine state remains authoritative, render/scheduling continues, and the UI truthfully reports `MATCH UPDATED · NOT SAVED` / equivalent prepared-state status.

### F4 — malformed same-schema/incompatible saves accepted too loosely — CLOSED

Current-format state validation covers zones, players, card IDs, unique `iid`s, pending-choice shape, format/build compatibility, and bounded legacy support. Compatible legacy builds are `11.1A` and `11.1B`; malformed/future/incompatible states are rejected.

---

# 6. Release identity / versioning contract

Current installed-PWA shell generation: **`11.golden.4`**.

Current save format remains independently versioned:

- format: `pass11-normal-v1`
- save build: `11.golden.1`
- bounded legacy builds: `11.1A`, `11.1B`

Do not bump the save build merely because shell/release labels change; save semantics are independent.

The current Pass 11 `src/platform-feedback.js` loads after closed lower layers and applies the authoritative current release identity:

- title: `Gwent Classic — Definitive Edition · Pass 11`
- buildline: `PASS 11 · GOLDEN MATCH · CI-GATED`
- profile heading: Pass 11 Golden Match status

The repair is observable through `releaseIdentityRepairs`; exact-head platform evidence recorded one startup repair, proving the guard corrected the lower-layer overwrite. Static contracts lock this behavior and load order. Because the precached runtime changed, SW generation advanced to `11.golden.4`.

---

# 7. Verified QA and release evidence

## Exact functional head

**Head:** `20183a10f68b4fff7084936e5aa3194c5a55a7c2`

**Main Verify:** Run #297 / `34700148543` — **FULL SUCCESS**.

**Storage Resilience:** Run #14 / `34700148554` — **FULL SUCCESS** on the same functional head.

The full functional/browser matrix passed, including engine/catalog/PWA contracts, geometry, setup/mulligan, lifecycle, 11.2A-D, platform truth, installed-PWA coherent upgrade, Golden Match E2E, direct manipulation, destination parity, F1 turn gating, presentation-failure recovery, **256-trial physical interaction stress = 512 committed tap/drag interactions with zero mismatch**, semantic landing, save/visibility lifecycle, WebKit/iPhone-targeted interaction, 10.4B choreography/adversarial coverage, and 10.4C feel/pacing.

## Final docs-inclusive PR head

**Head:** `2e45b401238f7b4363684a8eca6027035b60a32f`

- Main Verify Run #299 / `34700876842` — **FULL SUCCESS**.
- Storage Resilience Run #16 / `34700876857` — **FULL SUCCESS**.
- Delta after the functional head was documentation-only: `README.md` then `CONTINUITY.md`.

## Production merge and deployment

PR #11 merged to `main` as:

`aa8b6043d68c42ae2dc5310b57106a5a5808a150`

Production Run #300 / `34701697634` then repeated the entire Verify matrix on the merge commit and completed the GitHub Pages deploy successfully.

The public hosted build was independently fetched after deployment and served the expected title:

`Gwent Classic — Definitive Edition · Pass 11`

## Manually reviewed exact-head artifacts

- Installed-PWA upgrade — artifact `10300122584`, digest `sha256:fe9486c219425a067f474bbb70b01c24c835dfe558741ace3e5750b8e20cd1fa`.
- Golden Match E2E — artifact `10300476646`, digest `sha256:aede148bd4b0b75de2f6655275822618c15437aece5a16d435532dcacc23d054`.
- Platform feedback / runtime identity — artifact `10299838071`, digest `sha256:c135ed49daca80178dcc2e62490c1d9666b68eb71c56706025415fbc7c4ff943`.
- Storage resilience — artifact `10300161882`, digest `sha256:cd5890b8459c7d34166e10fec6080186a1dc60e93aa137a3ca83fd5e3ee5c324`.
- Feel / presentation — artifact `10299878072`, digest `sha256:4604e6d191213e1c7a65e9b58027911bdddece68f20e8b4b1a71fe9b52348cf5`.

No release-blocking defect was found in manual review.

---

# 8. Remaining physical-device acceptance

Pass 11 is deployed. Remaining acceptance is **real installed-iPhone sensory/platform observation**, specifically:

- audible output quality/level on physical device;
- background → foreground audio recovery;
- installed-PWA relaunch behavior;
- tactile capability/quality where the actual device/browser permits it;
- final physical touch/drag/animation feel at real-device frame pacing.

Browser/WebKit automation is strong evidence but does not substitute for these physical-device observations. Any defect found here should be treated as a post-deploy regression and reproduced before architecture is changed.

---

# 9. Exact next action

1. Install/open the production PWA on a real iPhone and perform sensory/platform acceptance.
2. Record only reproducible defects or friction; do not reopen closed architecture from subjective speculation alone.
3. If a genuine regression is found, create a narrowly scoped hotfix branch from current `main`, preserve Pass 10.3/10.4/Pass 11 contracts, and run the full relevant gates before merge.
4. If real-device acceptance is clean, treat Pass 11 as fully signed off and begin the next planned product pass from the deployed baseline.

Do not reopen closed gameplay architecture without new evidence of a genuine regression.