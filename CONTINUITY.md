# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff. A new conversation or implementation context should be able to recover the project from this file plus the repository without depending on chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Current production runtime:** Pass 10.4B merge `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`  
**Last verified production workflow:** run #112 / `34607056878` — verify **success**, Pages deploy **success**  
**Current completed production milestone:** **Pass 10.4B — Signature Gameplay Choreography**  
**Current active milestone:** **Pass 10.4C — Feel / Presentation Polish**  
**Active branch / PR:** `pass-10-4c-feel-presentation-polish` / **PR #8**  
**Active head before this continuity checkpoint:** `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`  
**Latest active-branch CI:** run #133 / `34617300625` — **all verification gates success**  
**Latest 10.4C QA artifact:** `10270749326`, digest `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`  
**Estimated Pass 10.4C completion:** **~96%** — visibility estimate only; never a reason to rush scope or weaken QA  
**Next planned milestone:** **Pass 11 — Golden Match / Complete Normal Match**, only after 10.4C is merged, green, visually approved, and deployed.  
**Last updated:** 2026-09-11 America/New_York

Production remains the fully green/deployed Pass 10.4B runtime until PR #8 merges and `main` passes verification + Pages deployment.

---

# 0. Mandatory continuity protocol

This file is authoritative for implemented/current project state. `FUTURE_CONTINUITY.md` is the companion forward-roadmap authority.

When sources disagree, use this precedence:

1. Current explicit user instruction.
2. Current repository code and current green CI behavior.
3. This `CONTINUITY.md` implemented-state ledger.
4. `FUTURE_CONTINUITY.md` for intended future direction.
5. Current pass contracts/specifications under `docs/` and `config/`.
6. Older archived pass artifacts.
7. Chat memory or summaries.

### Start-of-task continuity rule

For every new implementation task or resumed work cycle:

1. Read the active branch's current `CONTINUITY.md` first.
2. **Write an actual checkpoint update to this file in GitHub before doing further implementation work.** A chat-only continuity summary does not satisfy this requirement.
3. Record active pass/task, branch/PR/head, latest meaningful CI evidence or blocker, exact next action, and an estimated completion percentage.
4. The percentage is for visibility only and must never compress scope, rush QA, skip visual review, or weaken a gate.
5. Every user-facing progress report should include the current estimated completion percentage.
6. Every user-facing work message should end with a concrete **Next action**.
7. On completion/merge/deploy, update this file again with final SHAs, CI evidence, artifacts, visual findings, remaining debt, and handoff.

A pass is not continuity-complete until this file is current.

---

# 1. Product mission

Build the definitive modern implementation of **classic The Witcher 3 Gwent**, using Arun Sundaram's `asundr/gwent-classic` as the primary behavior/card/rules oracle while replacing the old monolithic browser implementation with a deterministic, testable, mobile-first architecture.

Core product modes remain:

- `CLASSIC`
- `ASSISTED`
- `MODIFIED`
- `SANDBOX`

Classic statistics must remain separate from assisted/modified/sandbox outcomes.

---

# 2. Locked doctrine

## Rules

- Preserve classic TW3 Gwent rules/card behavior as the baseline.
- Arun Sundaram is the behavior/card-data/rules oracle, not the runtime architecture.
- Engine state is authoritative and deterministic.
- Presentation may never decide legality or outcomes.
- Animation failure may never roll back a valid committed engine action.
- AI difficulty must come from better reasoning, never hidden-information cheating.

## Interaction

- Production is JS-first, hosted, and PWA-oriented.
- Primary gameplay target is iPhone landscape.
- Hybrid interaction is locked:
  - tap card → tap legal destination;
  - direct drag to legal destination.
- Both dispatch the same canonical validated action.
- Card inspection is secondary intent.
- Invalid gestures return visually with zero engine mutation.
- Reduced motion must preserve equivalent gameplay clarity.

## Visual language

- Witcher 3 atmosphere;
- premium physical tabletop;
- modern iOS interaction discipline;
- dark wood, iron, parchment, leather, aged brass/gold, ivory text;
- restrained effect treatment;
- no generic free-to-play visual language.

## Battlefield geometry authority

**Pass 10.3 Battlefield Geometry Contract v2 is frozen authority for final battlefield positions.**

Order:

1. Opponent Siege
2. Opponent Ranged
3. Opponent Close
4. Weather band
5. Player Close
6. Player Ranged
7. Player Siege

Later animation may interpolate around final slots but may not replace geometry math.

---

# 3. Canonical architecture

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

Architectural rules:

- deterministic state transitions;
- stable permanent card IDs and per-match `iid`s;
- semantic action/event logs;
- one rules path regardless of input method;
- engine commits before presentation;
- presentation is disposable;
- interruption/failure reconciles to engine truth;
- bot/opponent mutation cannot occur inside unresolved player presentation.

Important runtime files through active Pass 10.4C:

- `src/gwent-engine.js` — deterministic classic-rules engine.
- `src/cards-catalog.js` — migrated 216-card catalog.
- `src/storage.js` — persisted state abstraction.
- `src/battlefield-ux.js` — frozen 10.3 final geometry/reconciliation authority.
- `src/motion-tokens.js` — shared timing/easing/reduced-motion policy, now tuned by 10.4C.
- `src/presentation-queue.js` — serialized cancellable presentation transactions.
- `src/interaction-turn-gate.js` — 10.4A bot mutation gate.
- `src/presentation-events.js` — 10.4B semantic before/after + engine-delta adapter.
- `src/gameplay-choreography.js` — 10.4B mechanic/lifecycle choreography runtime.
- `src/choreography-external-gate.js` — 10.4B external action / Auto Bot gate and post-action 10.3 geometry sync; no longer owns visible milestone stamping.
- `src/flip-layout.js` — FLIP redistribution around 10.3 final geometry.
- `src/gesture-controller.js` — 10.4A canonical tap/drag controller.
- `src/presentation-feedback.js` — 10.4C semantic audio/optional-haptic feedback subscriber plus player-facing copy normalization.
- `feel-polish.css` — 10.4C tactile visual override layer.
- `app.js` — product shell/match integration.

All active presentation modules are explicitly declared in `index.html` and explicitly staged/pre-cached by the PWA graph. Dynamic loader shortcuts remain rejected.

---

# 4. Engine/catalog baseline

Established parity baseline:

- 216/216 card definitions;
- 44/44 known ability tokens represented;
- 22/22 leaders;
- 5/5 factions.

Implemented rules include ordinary play, Spy, Tight Bond, Muster, Medic + pending choice, Decoy, Weather/Clear Weather, Horn, row/leader Horn lifecycle, Scorch and row-specific Scorch, Hero, pass/auto-pass, round resolution, faction behavior, leader actions, and deterministic legal-action generation.

Full engine breadth does not mean the entire catalog is yet exposed through a polished unrestricted production match flow.

---

# 5. Deployment workflow

Repository: `blakemgray/gwent-definitive`  
Workflow: `.github/workflows/deploy-pages.yml`

Policy:

- feature work on a pass branch;
- PR to `main`;
- full static + browser + geometry + interaction + WebKit + pass-specific gates;
- visual artifact inspection where applicable;
- merge only after latest-head gates and visual review are green;
- main push reruns verification;
- Pages deploy only after verify succeeds;
- continuity updated at the start of each work cycle and again before merge/after production verification.

### Current production snapshot — Pass 10.4B

- PR #7 merged.
- Final PR head: `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`.
- Merge/runtime SHA: `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`.
- Final PR run #111 / `34606032376`: success.
- Production run #112 / `34607056878`: verify success, Pages deploy success.
- Production 10.4B artifact: `10266123499`.

Run #112 passed static validation, frozen 10.3 geometry, full 10.4A interaction/parity/touch, 256-trial stress / 512 committed interactions, lifecycle/save-restore, WebKit/iPhone, primary 10.4B choreography, and the eight-scenario 10.4B adversarial matrix.

---

# 6. Pass history / running ledger

Do not erase historical pass milestones. Later work may supersede details, but history remains explicit.

## Pass 5 — Initial interactive prototype

**Status:** historical / superseded.  
Durable lesson: preview-environment limitations are not production architecture requirements.

## Pass 5B — no-JS/hash preview workaround

**Status:** historical / intentionally abandoned as production direction.

## Pass 6 — art + inspector investigation

**Status:** historical.  
Identified remote-art preview limitations and a transformed-ancestor WebKit/fixed-position issue.

## Pass 6.1 — inspector recovery / explicit assist states

**Status:** historical foundation.  
Recovered viewport inspector, explicit assist/cheat states, deck tabs, remote-art fallback, and authored Spy demonstration path.

## Pass 7 — deterministic engine foundation

**Status:** foundational and retained.  
Introduced deterministic engine/UI separation, stable instances, seeded RNG, semantic logs, legal actions, classifications, cheat draw, and undo/redo history.

## Pass 8 — full catalog migration + UI integration

**Status:** foundational and retained.  
Migrated all 216 Arun cards and integrated real assets/UI.

## Pass 9 — source-parity rules completeness

**Status:** foundational and retained.  
Expanded abilities/factions/leaders and fixed Horn occupancy, exhaustion, Scorch/Decoy legality, and lifecycle issues.

## Pass 10 — first bespoke battlefield attempt

**Status:** rejected.  
Durable lesson: live DOM geometry is authoritative; decorative imagery is subordinate.

## Pass 10.1 — battlefield recovery

**Status:** successful recovery foundation.  
Rebuilt deterministic six-row DOM battlefield and recovered 0 px geometry drift at target QA viewport.

## Pass 10.2 — continuity gap

**Status:** no dedicated verified standalone dossier.  
Do not invent a false 10.2 description.

## Pass 10.3 — Battlefield UX Architecture / Geometry Contract v2

**Status:** production layout authority.  
Locked functional row territory, centered/compressed row packs, independent ten-card hand compositor, six-row structure, and target geometry.

Primary contract: `docs/PASS10_3_BATTLEFIELD_UX_CONTRACT.md`.

## Pass 10.4R — Interaction & Motion Research

**Status:** complete specification pass.  
Locked sequence:

1. 10.4A Direct Manipulation
2. 10.4B Gameplay Choreography
3. 10.4C Feel / Presentation Polish
4. Pass 11 Golden Match

Primary references:

- `docs/PASS10_4R_INTERACTION_MOTION_RESEARCH.md`
- `docs/PASS10_4R_CHOREOGRAPHY_MATRIX.md`
- `docs/PASS10_4R_IMPLEMENTATION_BLUEPRINT.md`
- `config/interaction-motion-contract.json`

## Pass 10.4A — Direct Manipulation

**Status:** complete / merged / green.  
PR #5 merge: `7367cd69042d93f0f895bc9150f0207df30f8f1c`  
WebKit stabilization: `731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`

Locked foundation:

- tap-select/tap-destination;
- Pointer Events drag;
- 8 px threshold + pointer capture;
- legal destinations exclusively from engine `legalActions`;
- one canonical `commitAction()`;
- invalid-drop zero mutation;
- source placeholder / finger proxy;
- FLIP redistribution;
- inspector secondary intent;
- keyboard destination / Escape;
- reduced motion;
- presentation-aware bot gate;
- semantic landing authority;
- disposable presentation failure recovery;
- save/restore/interruption cleanup.

## Pass 10.4B — Signature Gameplay Choreography

**Status:** **COMPLETE / MERGED / GREEN / DEPLOYED.**

Branch: `pass-10-4b-signature-choreography`  
PR: #7  
Implementation head: `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`  
Final PR/docs head: `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`  
Merge/runtime SHA: `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`

Locked 10.4B behavior:

- engine commits first;
- choreography owns no rules state;
- source event before consequence;
- target identity before destructive collapse;
- score follows visible cause;
- opponent actions use same presentation language;
- reduced-motion equivalents preserve mechanic clarity;
- external player actions gate Auto Bot until presentation release;
- every post-action visual snapshot occurs after synchronous 10.3 reconciliation.

Signature coverage includes Scorch, Muster, Spy, Horn, Weather/Clear, Medic, Decoy, Tight Bond, Morale, Leader, Hero, draw/discard, Pass, round resolution, match result, Monster retention, Skellige resurrection, and Northern Realms post-round draw.

Adversarial matrix includes tied multi-row Scorch, 8+ Muster, Spy 10→11, Horn+Bond, all-weather Clear, Medic→Muster, Decoy-on-non-Hero-Spy, and Round 2→3 Monster retention + two Skellige returns.

## Pass 10.4C — Feel / Presentation Polish

**Status:** **ACTIVE / IMPLEMENTATION GREEN / VISUAL CLOSEOUT IN PROGRESS.**

**Goal:** improve physical card feel, timing coherence, feedback, accessibility, semantic audio/haptic hooks, interruption feel, and iPhone/WebKit performance without changing classic rules, 10.3 geometry, the 10.4A canonical action path, or 10.4B choreography causality.

**Branch:** `pass-10-4c-feel-presentation-polish`  
**PR:** `#8 — Pass 10.4C — Feel / Presentation Polish`  
**Current implementation head before this continuity checkpoint:** `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`  
**Latest full CI:** run #133 / `34617300625` — **success across every gate**  
**Latest QA artifact:** `10270749326` / `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`  
**Estimated completion:** **~96%**

### Locked 10.4C implementation so far

- `src/motion-tokens.js` advanced to 10.4C timing/easing/feel vocabulary while preserving reduced-motion equivalence.
- `feel-polish.css` adds tactile press, lifted selection, cleaner legal/active target treatment, and reduced-motion presentation without replacing battlefield geometry.
- `src/presentation-feedback.js` subscribes to established queue/stage/interaction signals and emits semantic feedback hooks.
- Semantic hook set includes selection, valid destination, row-specific card commit, draw/discard, Spy, Horn, Bond, Muster, Medic, Decoy, Scorch, weather/clear, Pass, turn, round result, and game result.
- Effects volume + mute persist independently of engine state.
- Web haptics are conservative opt-in, capability-detected, and off by default.
- Final audio assets remain decoupled; 10.4C provides semantic dispatch hooks rather than binding game rules to media.
- `index.html`, service worker, PWA validation, and deploy staging explicitly load/cache/stage 10.4C files.
- 10.4B external gate no longer owns visible milestone/build stamping; 10.4C is the final visible release-identity owner.
- A static regression guard prevents lower 10.4B code from reclaiming visible 10.4C release identity.
- Player-facing presentation normalizes development-era strings such as `ENGINE RESOLVED` and `ENGINE CHOICE` while leaving semantic logs/developer tooling/engine behavior untouched.
- Browser QA now rejects engine jargon in ordinary player-facing landing feedback and Medic choice presentation.

### 10.4C QA evidence

Run #130 / `34615805038`, head `227fd8b14faec69c359eef8d8f787e41f998c9d0`, was the first fully green 10.4C feel run after release-identity ownership was corrected. Manual inspection of its artifact found remaining player-facing integration jargon (`ENGINE RESOLVED`, `MEDIC · ENGINE CHOICE`), so that otherwise-green head was correctly **not** treated as release-final.

Current head `ee600e8b856b9743ad4a58501b7a84b11f40dbb2` adds presentation-only copy normalization plus static/browser regression assertions. Run #133 / `34617300625` passed:

- engine/catalog/PWA/motion/direct-manipulation/choreography/feel static validation;
- frozen 10.3 battlefield density/centering/geometry;
- full 10.4A baseline, overlap, parity, interruption, reduced-motion, and touch;
- destination-family tap/drag parity;
- presentation-aware bot turn gating;
- disposable presentation-failure recovery;
- 256-trial physical interaction stress / 512 committed interactions;
- semantic landing continuity/durable feedback;
- last-card, visibility interruption, and save/restore lifecycle;
- WebKit/iPhone-targeted interaction;
- primary 10.4B signature choreography / reduced motion / interruption;
- eight-scenario 10.4B adversarial choreography matrix;
- 10.4C feel / semantic feedback / reduced-motion / pacing gate;
- all 10.3/10.4A/10.4B/10.4C QA archives.

Measured 10.4C evidence from the prior inspected green artifact showed pointer press response around 26 ms and invalid-return completion around 237 ms, both inside the pass budgets. These metrics are evidence, not a reason to weaken visual review.

### Current blocker / exact handoff

No automated regression is currently known. The only remaining release-candidate gate is **manual visual inspection of Run #133 artifact `10270749326`**, specifically:

1. ordinary landing frame — confirm `ENGINE RESOLVED` is gone and replacement wording feels player-facing;
2. Medic / Medic→Muster frames — confirm `ENGINE CHOICE` / `ENGINE RESOLVED` jargon is gone;
3. selection, active-target, invalid-return, reduced-motion, and settings frames — confirm no clipping, accidental debug treatment, or accessibility regression;
4. representative copied 10.4B mechanic/lifecycle frames — confirm 10.4C overrides did not visually degrade established choreography.

If visual review is clean, update this continuity section with final visual evidence, prepare the final PR/docs head, rerun that exact head, merge PR #8 only after green latest-head verification, then verify `main` + Pages before declaring 10.4C production-complete.

---

# 7. Current product status

Production currently has:

- hosted canonical JS/PWA infrastructure;
- deterministic classic-rules engine;
- 216-card catalog;
- source-parity rules baseline;
- frozen six-row 10.3 geometry;
- centered/compressed hand/row compositors;
- save/Continue Match;
- 10.4A tap/drag direct manipulation;
- interruption/failure safety;
- semantic presentation transactions;
- iPhone/WebKit interaction coverage;
- 10.4B authored mechanic/lifecycle choreography;
- adversarial choreography QA;
- CI-protected Pages deployment.

Active PR #8 adds but has not yet deployed:

- tuned 10.4C motion/feel tokens;
- tactile selection/press/target treatment;
- semantic audio hooks;
- optional capability-gated haptic hooks;
- persisted effects-volume/mute settings;
- player-facing copy normalization;
- dedicated 10.4C feel/performance/accessibility QA.

Major remaining broader work after 10.4C:

- Pass 11 Golden Match / complete normal match validation;
- unrestricted legal deck builder across all 216 cards;
- polished faction/leader/deck selection;
- complete production mulligan/effect-choice UX across unrestricted legal combinations;
- final strategic AI ladder through Grandmaster;
- mature save/resume/replay;
- modular cheats/assists/sandbox classifications;
- full victory/rematch/unrestricted match shell;
- local permitted-art ownership/caching;
- final offline/install/native-quality product polish.

---

# 8. Forward roadmap authority

`FUTURE_CONTINUITY.md` preserves intended future direction.

Locked near-term sequence:

1. **Finish Pass 10.4C — Feel / Presentation Polish**.
2. **Pass 11 — Golden Match / Complete Normal Match**.

Do not invent later exact pass numbers unless explicitly assigned.

Pass 11 must validate a complete normal match with legal deck initialization/opening draw/mulligan, direct manipulation hand, all required choice dialogs, player/opponent turns, passing/exhaustion, scoring, rounds, faction/life lifecycle, best-of-three result, restart/rematch, and save integrity without developer shortcuts.

---

# 9. Archive / Drive context

GitHub is canonical for active development.

Reference folder: `Gwent Classic - Arunsundaram`  
Folder ID: `1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`

Legacy product root: `Gwent Definitive - blakemgray`  
Folder ID: `1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`

Drive archives are historical/reference material unless explicitly instructed otherwise.

---

# 10. New-chat bootstrap

For a new conversation:

> Read `CONTINUITY.md` first, then `FUTURE_CONTINUITY.md`, inspect current `main`, inspect any active pass branch/PR, read the relevant pass contracts, and inspect latest CI. Continue from the exact handoff state. Update `CONTINUITY.md` in GitHub at the start of the work cycle before more implementation work.

---

# 11. Current handoff

**Pass 10.4C is active and approximately 96% complete.**

Current branch/PR/head:

- branch: `pass-10-4c-feel-presentation-polish`;
- PR: #8;
- implementation head before this continuity checkpoint: `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`;
- latest full-green CI: run #133 / `34617300625`;
- current 10.4C artifact: `10270749326`.

There is no known automated blocker. The exact next action is manual visual inspection of the #133 artifact, with special attention to ordinary landing and Medic/Muster player-facing wording after copy normalization. If clean, record visual approval here, create the final documentation/closeout head, run that exact head through the full matrix, merge PR #8, then verify `main` and Pages before declaring 10.4C complete.

Do not begin Pass 11 until those closeout gates are complete.
