# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff for this project. Recover the project from this file plus the repository, not chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Current production runtime:** Pass 10.4B merge `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`  
**Last verified production workflow:** run #112 / `34607056878` — verify **success**, Pages deploy **success**  
**Current completed production milestone:** **Pass 10.4B — Signature Gameplay Choreography**  
**Current active milestone:** **Pass 10.4C — Feel / Presentation Polish**  
**Active branch / PR:** `pass-10-4c-feel-presentation-polish` / **PR #8**  
**Active branch head before this checkpoint:** `e6d71343dc02ddb283ba0789703f523d5b3827fe`  
**Latest green implementation head:** `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`  
**Latest full CI:** run #133 / `34617300625` — **all gates success**  
**Latest 10.4C QA artifact:** `10270749326`, digest `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`  
**Estimated Pass 10.4C completion:** **~98%** — visibility only; never a reason to rush or weaken QA  
**Next milestone:** **Pass 11 — Golden Match / Complete Normal Match**, only after 10.4C is merged, green on `main`, and deployed.  
**Last updated:** 2026-09-11 America/New_York

Production remains Pass 10.4B until PR #8 merges and post-merge `main` verification + Pages deployment succeed.

---

# 0. Mandatory continuity protocol

This file is authoritative for implemented/current state. `FUTURE_CONTINUITY.md` is the forward-roadmap companion.

Source precedence:

1. Current explicit user instruction.
2. Current repository code + green CI behavior.
3. This file.
4. `FUTURE_CONTINUITY.md`.
5. Current pass contracts/config.
6. Older archives.
7. Chat memory.

### Start-of-task rule

For every new implementation task or resumed work cycle:

1. Read the active branch's `CONTINUITY.md` first.
2. **Write an actual checkpoint update to this file in GitHub before doing further implementation work.** Chat-only continuity does not count.
3. Record active pass/task, branch/PR/head, latest meaningful CI evidence or blocker, exact next action, and estimated completion percentage.
4. Percentage is for visibility only; never compress scope, rush QA, skip visual review, or weaken a gate.
5. Every user-facing progress report should include the current percentage.
6. Every user-facing work message should end with a concrete **Next action**.
7. On merge/deploy, update this file again with final SHAs, CI, artifacts, visual findings, remaining debt, and handoff.

---

# 1. Locked product doctrine

## Mission

Build the definitive modern implementation of **classic The Witcher 3 Gwent**, using Arun Sundaram's `asundr/gwent-classic` as the behavior/card/rules oracle while keeping the new runtime deterministic, testable, mobile-first, and engine/presentation separated.

Match classifications remain `CLASSIC`, `ASSISTED`, `MODIFIED`, `SANDBOX`; statistics must not blur them together.

## Rules

- Preserve classic TW3 Gwent rules/card behavior.
- Engine state is authoritative and deterministic.
- Presentation never decides legality/outcomes.
- Animation failure never rolls back a valid committed action.
- AI difficulty comes from better reasoning, never hidden-information cheating.

## Interaction

- JS-first hosted PWA; iPhone landscape is the primary gameplay target.
- Hybrid tap-select→tap-destination and direct Pointer Events drag.
- Both dispatch the same canonical validated action.
- Invalid gestures return visually with zero mutation.
- Reduced motion preserves equivalent gameplay clarity.

## Visual language

Witcher 3 atmosphere + premium physical tabletop + modern iOS discipline: dark wood, iron, parchment, leather, aged brass/gold, ivory; restrained effects; no generic free-to-play visual language.

## Battlefield geometry authority

**Pass 10.3 Battlefield Geometry Contract v2 is frozen authority.** Final structural order is Opponent Siege / Ranged / Close / Weather / Player Close / Ranged / Siege. Later motion may interpolate around final slots but may not replace geometry math.

---

# 2. Canonical architecture

```text
Card DB / rules data
        ↓
GameState
RuleEngine / ActionEngine / EffectEngine / ScoreEngine
        ↓
AI / Cheats / Replay / Undo
        ↓
Presentation API / semantic event adapter
        ↓
Battlefield UX / gestures / choreography / audio / haptic hooks
        ↓
Hosted web app / PWA / future native-quality iOS shell
```

Locked architecture:

- stable card IDs + per-match `iid`s;
- semantic event/action logs;
- one rules path regardless of input method;
- engine commits before presentation;
- presentation is disposable;
- interruption/failure reconciles to engine truth;
- bot/opponent mutation cannot occur inside unresolved player presentation.

Key runtime files:

- `src/gwent-engine.js` — deterministic rules engine.
- `src/cards-catalog.js` — 216-card catalog.
- `src/battlefield-ux.js` — frozen 10.3 geometry/reconciliation authority.
- `src/motion-tokens.js` — shared motion/reduced-motion policy, tuned by 10.4C.
- `src/presentation-queue.js` — serialized cancellable presentation transactions.
- `src/interaction-turn-gate.js` — 10.4A bot gate.
- `src/presentation-events.js` — 10.4B semantic before/after + engine-delta adapter.
- `src/gameplay-choreography.js` — 10.4B choreography runtime.
- `src/choreography-external-gate.js` — 10.4B external-action/Auto-Bot gate + synchronous 10.3 geometry sync; no visible milestone ownership.
- `src/gesture-controller.js` — 10.4A canonical direct-manipulation controller.
- `src/presentation-feedback.js` — 10.4C semantic audio/optional-haptic subscriber + player-facing copy normalization.
- `feel-polish.css` — 10.4C tactile polish layer.

All active runtime modules are explicit in `index.html` and the PWA/deploy graph. Dynamic loading from semantic adapters remains rejected.

---

# 3. Engine/catalog baseline

Established parity:

- 216/216 card definitions;
- 44/44 known ability tokens;
- 22/22 leaders;
- 5/5 factions.

Engine supports ordinary play, Spy, Tight Bond, Muster, Medic + pending choice, Decoy, Weather/Clear, Horn, row/leader Horn, Scorch/row Scorch, Hero, passing/auto-pass, round resolution, factions, leaders, and deterministic legal actions.

---

# 4. Deployment workflow

Workflow: `.github/workflows/deploy-pages.yml`

Policy: branch → PR → full static/browser/geometry/interaction/WebKit/pass-specific gates → visual inspection → latest-head green → merge → full `main` verification → Pages deploy → final continuity update.

### Current production snapshot — Pass 10.4B

- PR #7 merged.
- Final PR head `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`.
- Merge/runtime `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`.
- Final PR run #111 / `34606032376`: success.
- Production run #112 / `34607056878`: verify + Pages success.
- Production 10.4B artifact `10266123499`.

---

# 5. Pass history

Historical entries remain explicit; do not invent missing history.

- **Pass 5:** initial interactive prototype; preview limitations are not production requirements.
- **Pass 5B:** no-JS/hash workaround; intentionally abandoned as production direction.
- **Pass 6:** art/inspector investigation; identified preview and WebKit positioning issues.
- **Pass 6.1:** inspector recovery + explicit assist states.
- **Pass 7:** deterministic engine foundation, seeded RNG, stable instances, legal actions, semantic logs, classifications, history.
- **Pass 8:** complete 216-card catalog migration + UI integration.
- **Pass 9:** source-parity rules completeness; fixed Horn occupancy, exhaustion, Scorch/Decoy legality, lifecycle defects.
- **Pass 10:** rejected bespoke battlefield attempt; live DOM geometry is authoritative.
- **Pass 10.1:** deterministic six-row battlefield recovery.
- **Pass 10.2:** continuity gap; no verified standalone dossier—do not invent one.
- **Pass 10.3:** frozen Battlefield Geometry Contract v2 and centered/compressed row/hand compositor.
- **Pass 10.4R:** complete interaction/motion research; locked sequence 10.4A → 10.4B → 10.4C → Pass 11.

## Pass 10.4A — Direct Manipulation

**Status:** complete / merged / green.  
PR #5 merge `7367cd69042d93f0f895bc9150f0207df30f8f1c`; WebKit stabilization `731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`.

Locked foundation: tap/drag parity; Pointer Events; 8 px threshold; pointer capture; engine `legalActions`; one `commitAction()`; zero-mutation invalid return; placeholders/proxies; FLIP; inspector secondary intent; keyboard/Escape; reduced motion; bot gate; semantic landing; disposable presentation failure; persistence/interruption cleanup.

## Pass 10.4B — Signature Gameplay Choreography

**Status:** **COMPLETE / MERGED / GREEN / DEPLOYED.**

PR #7; implementation head `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`; final PR head `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`; merge/runtime `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`.

Locked behavior: engine-first; choreography owns no rules state; cause before consequence; destructive identity before collapse; score after visible cause; same language for opponent actions; reduced-motion equivalents; external Auto-Bot gate; post-action snapshot only after synchronous 10.3 reconciliation.

Coverage: Scorch, Muster, Spy, Horn, Weather/Clear, Medic, Decoy, Bond, Morale, Leader, Hero, draw/discard, Pass, rounds, match result, Monster retention, Skellige resurrection, Northern Realms draw. Adversarial QA covers tied Scorch, 8+ Muster, Spy 10→11, Horn+Bond, all-weather Clear, Medic→Muster, Decoy-on-Spy, Round 2→3 retention + two Skellige returns.

## Pass 10.4C — Feel / Presentation Polish

**Status:** **ACTIVE / IMPLEMENTATION GREEN / VISUALLY APPROVED RELEASE CANDIDATE.**

Branch: `pass-10-4c-feel-presentation-polish`  
PR: #8  
Latest green implementation head: `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`  
Run #133 / `34617300625`: **all verification gates success**  
Artifact `10270749326`, digest `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`  
Estimated completion: **~98%**

### Implemented

- 10.4C motion/easing/feel vocabulary in `motion-tokens.js`.
- `feel-polish.css`: tactile press, lifted selection, cleaner legal/active target treatment, reduced-motion equivalent; no geometry ownership.
- `presentation-feedback.js`: presentation-only semantic feedback hooks for selection, valid destination, row-specific commit, draws, Spy, Horn, Bond, Muster, Medic, Decoy, Scorch, Weather/Clear, Pass, turns, round result, game result.
- Persisted effects volume + mute.
- Optional web haptics are capability-detected, opt-in, and off by default.
- Final audio assets remain decoupled from rules; only semantic hooks are provided.
- 10.4C explicit load/PWA/deploy graph.
- Lower-layer 10.4B code no longer overwrites visible 10.4C milestone/build identity; static regression guard locks ownership.
- Presentation-only normalization removes development-era `ENGINE RESOLVED` / `ENGINE CHOICE` language from ordinary player-facing feedback while preserving semantic logs/developer tooling/engine behavior.
- Browser QA rejects engine jargon in ordinary landing and Medic presentation.

### CI evidence

Run #133 on `ee600e8...` passed:

- static engine/catalog/PWA/motion/direct-manipulation/choreography/feel validation;
- frozen 10.3 geometry;
- full 10.4A baseline/overlap/parity/interruption/reduced-motion/touch;
- destination-family parity;
- bot gate + failure recovery;
- 256-trial stress / 512 committed interactions;
- semantic landing;
- lifecycle/save-restore;
- WebKit/iPhone;
- primary 10.4B choreography;
- eight-scenario 10.4B adversarial matrix;
- 10.4C feel/feedback/reduced-motion/pacing;
- all QA archives.

Measured feel evidence: pointer press ~25.7 ms; invalid return ~237.7 ms; haptic attempts 0 with default opt-out; ordinary toast `REDANIAN FOOT SOLDIER`.

### Manual visual approval — Run #133

Artifact `10270749326` was manually inspected at the canonical 852×393 target and is **approved for final closeout**.

Verified:

- selection reads as physical lift/weight without the old debug-style `SELECTED` pill;
- active legal target has clear structural/gold alignment feedback;
- ordinary landing is centered/clean and now reads only `REDANIAN FOOT SOLDIER` — no `ENGINE RESOLVED` jargon;
- invalid drag remains an intentionally off-board proxy before returning cleanly with no persistent transient;
- reduced-motion selection preserves the same legal-destination information hierarchy;
- feedback settings are integrated into the normal scrollable Settings surface;
- Medic signature presents `REVIVE`; nested Medic→Muster shows `MEDIC · UNIT REVIVED` and maintains correct card-scale geometry;
- representative Scorch, Muster, Spy, Horn, Weather/Clear, Decoy, Leader, round-resolution, reduced-motion, interruption, Monster-retention, and Skellige-return frames show no visual regression from established 10.4B choreography.

No visual release blocker remains on the implementation candidate.

### Exact closeout handoff

The next task is **final PR/documentation closeout**:

1. update README/current-status language to mark 10.4C as a green, visually approved release candidate and Pass 11 as next;
2. ensure final continuity/contract language reflects the release candidate without falsely calling it production before merge;
3. run the resulting exact latest documentation head through the full CI matrix;
4. merge PR #8 only if that latest head is green;
5. verify post-merge `main` through the same matrix and Pages deployment;
6. update this file with final merge/main/deploy SHAs and formally close 10.4C;
7. only then begin Pass 11.

---

# 6. Current product status / broader debt

Production currently has hosted PWA infrastructure, deterministic classic engine, 216-card catalog, frozen 10.3 geometry, 10.4A direct manipulation, iPhone/WebKit coverage, 10.4B choreography, adversarial QA, and CI-protected Pages deployment.

PR #8 adds tuned feel/motion, semantic audio hooks, optional haptics, persisted effects settings, player-facing copy cleanup, and dedicated 10.4C QA.

Broader work after 10.4C includes Pass 11 Golden Match, unrestricted legal deck builder, polished faction/leader selection, complete unrestricted mulligan/effect choices, final AI ladder through Grandmaster, mature save/resume/replay, modular assists/cheats/sandbox, full victory/rematch shell, local permitted-art ownership/caching, and final offline/install/native-quality polish.

---

# 7. Forward roadmap

`FUTURE_CONTINUITY.md` remains forward authority. Near-term sequence is:

1. **close Pass 10.4C**;
2. **Pass 11 — Golden Match / Complete Normal Match**.

Do not invent later pass numbers unless explicitly assigned.

Pass 11 must validate one complete normal match with legal deck initialization, opening draw/mulligan, direct manipulation hand, all required choice dialogs, player/opponent turns, passing/exhaustion, scoring, rounds, factions/lives, best-of-three result, restart/rematch, and save integrity without developer shortcuts.

---

# 8. Archive context

GitHub is canonical for active development.

Reference Drive folder: `Gwent Classic - Arunsundaram` — `1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`  
Legacy product root: `Gwent Definitive - blakemgray` — `1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`

---

# 9. Current handoff

**Pass 10.4C is approximately 98% complete and its implementation candidate is green + visually approved.**

Current evidence:

- PR #8 open;
- implementation head `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`;
- Run #133 / `34617300625` fully green;
- artifact `10270749326` manually approved;
- no known runtime, accessibility, interaction, WebKit, choreography, copy, or visual blocker.

**Exact next action:** prepare the final documentation/status head, run it through the full matrix, then merge PR #8 only if that exact head is green. After merge, verify `main` + Pages and write the final continuity closeout before beginning Pass 11.
