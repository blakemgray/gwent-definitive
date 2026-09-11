# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff for this project. A new conversation, development pass, or implementation context should be able to recover the project from this file plus the repository without depending on chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** https://blakemgray.github.io/gwent-definitive/  
**Default branch:** `main`  
**Current production runtime head / Pass 10.4B merge:** `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`  
**Last verified green production workflow:** `Verify and Deploy Gwent Definitive` run ID `34607056878` / run #112 — verify **success**, Pages deploy **success**  
**Last updated:** 2026-09-11 11:12 America/New_York  
**Current completed implementation milestone:** **Pass 10.4B — Signature Gameplay Choreography**  
**Current active implementation milestone:** **Pass 10.4C — Feel / Presentation Polish**  
**Current active branch / PR:** `pass-10-4c-feel-presentation-polish` / **PR #8**  
**Active code head before this continuity checkpoint:** `e5690f24b77653ce532d8812c696c248127273d2`  
**Estimated Pass 10.4C completion:** **~70%** — visibility estimate only; never a reason to rush scope, QA, or visual review.  
**Next planned implementation milestone:** **Pass 11 — Golden Match / Complete Normal Match**, only after 10.4C is complete, merged, green, and deployed.

This continuity refresh is the mandatory start-of-work checkpoint for the active 10.4C pass. Production remains the fully green/deployed Pass 10.4B runtime on `main`; 10.4C is still an open PR and must not be described as production until merge + main verification + Pages deployment succeed.

---

# 0. Mandatory continuity protocol

This file is authoritative for **implemented/current project state** and must be read before beginning or resuming any pass.

`FUTURE_CONTINUITY.md` is the companion forward-roadmap document. It preserves intended future direction and requirements that have not yet been implemented. Use it together with the 10.4R research/blueprint documents when planning future work.

When sources disagree, use this precedence:

1. Current explicit user instruction.
2. Current repository code and current green CI behavior.
3. This `CONTINUITY.md` implemented-state ledger.
4. `FUTURE_CONTINUITY.md` for intended future direction.
5. Current pass contracts/specifications under `docs/` and `config/`.
6. Older archived pass artifacts.
7. Chat memory or summaries.

Do **not** silently rewrite classic Gwent rules or project doctrine from generic assumptions. If a rule/product decision is uncertain, inspect the current engine, Arun Sundaram source, pass contracts, and tests.

### Start-of-task continuity rule

For every new implementation task or resumed work cycle:

1. Read the current `CONTINUITY.md` from the active branch first.
2. **Write an actual checkpoint update to this file in GitHub before doing further implementation work.** A chat-only continuity summary does not satisfy this requirement.
3. The checkpoint must state the active pass/task, branch/PR/head, latest meaningful CI evidence or blocker, exact next action, and an estimated completion percentage for the current task/pass.
4. The percentage is for user visibility only and must never be used to compress scope, rush QA, skip visual review, or weaken a gate.
5. Every user-facing progress report during implementation should include the current estimated completion percentage.
6. Every user-facing work message should end with a concrete **Next action**.
7. On completion/merge/deploy, update this file again with final SHAs, CI evidence, artifacts, visual findings, remaining debt, and handoff.

Every pass must update this file before merge. At minimum record:

- production/main head and latest green main workflow;
- completed, active, and next milestones;
- branch / PR / head / merge / deploy SHAs;
- implementation changes;
- QA evidence and regression status;
- newly locked decisions;
- known debt / unresolved items;
- exact handoff / next action;
- superseded decisions explicitly rather than erasing history.

A pass is not continuity-complete until this file is current.

---

# 1. Product mission

Build the definitive modern implementation of **classic The Witcher 3 Gwent**, using Arun Sundaram's `asundr/gwent-classic` as the primary behavior/card/rules oracle while replacing the old monolithic browser implementation with a deterministic, testable, mobile-first architecture.

The product should feel like classic TW3 Gwent, not modern standalone Gwent and not a generic collectible-card-game shell. Modernization is encouraged around presentation, usability, accessibility, AI quality, persistence, tooling, and deployment while preserving the classic rules foundation.

Working product name:

**Gwent Classic — Definitive Edition**

Core product modes:

- **Classic Match** — clean classic rules and legal play.
- **Custom Match** — classic base with explicit configurable modifiers.
- **Sandbox** — unrestricted experimentation / cheats / testing.

Match classifications remain:

- `CLASSIC`
- `ASSISTED`
- `MODIFIED`
- `SANDBOX`

Statistics must not blur those categories together.

---

# 2. Locked product doctrine

## 2.1 Rules

- Preserve classic TW3 Gwent rules/card behavior as the baseline.
- Arun Sundaram's implementation is the behavior and compatibility oracle, not the runtime architecture to copy wholesale.
- Engine state is authoritative and deterministic.
- Presentation may never decide legality or outcomes.
- Animation failure must never roll back a valid committed engine action.
- AI difficulty must come from better reasoning, not hidden-information cheating.
- Any future hidden-information access must be explicit and classified appropriately.

## 2.2 Interaction

- Production is **JS-first**, hosted, and PWA-oriented. ChatGPT/Drive/no-JS preview limitations must never constrain canonical architecture.
- Primary gameplay target is iPhone landscape.
- Menus/decks/library/settings may remain portrait-friendly.
- Battlefield interaction is hybrid:
  - tap card → tap legal destination;
  - direct drag to legal destination.
- Both methods dispatch the same canonical validated action.
- Card inspection is secondary intent.
- Invalid gestures return visually with zero engine mutation.
- Reduced motion must preserve equivalent gameplay clarity.

## 2.3 Visual language

- Witcher 3 atmosphere;
- premium physical tabletop;
- modern iOS legibility/interaction discipline;
- dark wood, iron, parchment, leather, aged brass/gold, ivory text;
- restrained environmental/effect treatment;
- no generic free-to-play/monetization visual language.

Functional geometry must be deterministic DOM/CSS/SVG logic. Generated/decorative imagery may provide atmosphere/material only and never owns functional battlefield geometry.

## 2.4 Battlefield geometry authority

**Pass 10.3 Battlefield Geometry Contract v2 is frozen authority for final battlefield positions.**

Structural order:

1. Opponent Siege
2. Opponent Ranged
3. Opponent Close
4. Weather band
5. Player Close
6. Player Ranged
7. Player Siege

Each player retains three row-special affordances plus leader, score, pass/turn, hand, and supporting information zones.

Later animation may interpolate around final slots but may not substitute independent battlefield layout math.

---

# 3. Primary reference oracle

Primary source repository:

`https://github.com/asundr/gwent-classic`

Use Arun for:

- rules behavior;
- card database/source parity;
- abilities;
- factions/leaders;
- deck/import compatibility;
- historical UI/audio reference when useful.

Do not use Arun as justification to reintroduce monolithic UI/rules coupling.

Licensing note: Arun code is MIT + Commons Clause; CD PROJEKT RED game IP, branding, card art, music, and other assets are separate rights concerns. Treat this as a personal/noncommercial fan project unless rights are separately addressed. Current art still partly depends on upstream raw GitHub resources; long-term hardening should localize permitted assets.

---

# 4. Canonical architecture

Target layering:

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
Battlefield UX / gestures / choreography / audio / future haptics
        ↓
Hosted web app / PWA / future native-quality iOS shell
```

Architectural rules:

- deterministic state transitions;
- stable permanent card IDs;
- stable per-match instance IDs (`iid`);
- semantic action/event logs;
- immutable-ish snapshots suitable for history/replay/undo;
- one rules path regardless of input method;
- storage abstraction rather than arbitrary UI state writes;
- engine commits before presentation;
- animation/presentation is disposable;
- interruption/failure immediately reconciles to engine truth;
- bot/opponent mutation must not occur inside unresolved player presentation.

Important runtime files through active Pass 10.4C:

- `src/gwent-engine.js` — deterministic classic-rules engine.
- `src/cards-catalog.js` — full migrated 216-card catalog.
- `src/storage.js` — persisted match-state abstraction.
- `src/battlefield-ux.js` — Pass 10.3 compositor/reconciliation and final geometry authority.
- `src/motion-tokens.js` — shared timing/easing/reduced-motion policy; 10.4C is tuning these presentation timings without changing rules.
- `src/presentation-queue.js` — serialized cancellable presentation transaction layer.
- `src/interaction-turn-gate.js` — 10.4A bot mutation gate.
- `src/presentation-events.js` — 10.4B semantic before/after + engine-delta presentation-event adapter; remains a semantic adapter, not a runtime bootstrapper.
- `src/gameplay-choreography.js` — 10.4B mechanic/lifecycle choreography planner and presentation runtime.
- `src/choreography-external-gate.js` — 10.4B external action / Auto Bot gate plus synchronous 10.3 geometry reconciliation before post-action visual capture.
- `src/flip-layout.js` — FLIP redistribution around 10.3 final geometry.
- `src/gesture-controller.js` — 10.4A tap/drag canonical commit controller.
- `src/presentation-feedback.js` — active 10.4C presentation-only semantic audio/optional-haptic feedback subscriber.
- `app.js` — product shell/match integration.
- `battlefield-ux.css` — battlefield treatment.
- `direct-manipulation.css` — interaction-state visuals.
- `gameplay-choreography.css` — 10.4B cues/effect-state visuals.
- `feel-polish.css` — active 10.4C tactile visual override/polish layer.

10.4B and active 10.4C runtime modules are explicitly declared in `index.html` and explicitly precached/staged by the PWA/deploy graph. Dynamic injection remains rejected because it blurs semantic/runtime boundaries.

---

# 5. Engine and catalog baseline

The migrated catalog contains **216 definitions / 216 stable IDs**.

Established parity baseline:

- 216/216 card definitions;
- 44/44 known ability tokens represented;
- 22/22 leaders;
- 5/5 factions;
- engine support broader than the currently exposed production UI.

Implemented rules include ordinary play, Spy, Tight Bond, Muster, Medic + pending choice, Decoy, Weather/Clear Weather, Horn, row/leader Horn lifecycle, Scorch and row-specific Scorch, Hero, pass/auto-pass, round resolution, faction behavior, leader actions, and deterministic legal-action generation.

Pass 9 fixed major source-parity issues including Horn occupancy conflicts, exhaustion auto-pass, and Scorch/Decoy legality defects.

Full engine breadth does **not** mean the entire catalog is yet exposed through a polished unrestricted product flow.

---

# 6. Cheats / assists doctrine

Cheats/assists are a first-class explicit subsystem, not scattered hidden debug behavior.

Long-term concepts include opponent-hand/deck/next-draw/AI-intent reveal, specific draw/spawn/duplicate/revive, weather/Horn control, leader/lives restoration, force pass, turn switching, undo/redo, save/load/restart, deck-restriction overrides, custom starting hand/lives, and favorites.

Clean Classic statistics remain separate from Assisted/Modified/Sandbox outcomes.

---

# 7. Deck builder target

Long-term mobile-first deck UI target:

`COLLECTION | DECK | ANALYSIS`

Required eventual capabilities include search, faction/type/ability filtering, legality feedback, deck analytics, saved decks, full 216-card legal access, leader selection, Arun legacy JSON import, and durable stable IDs.

The production deck builder is **not complete**.

---

# 8. AI doctrine and current status

Target difficulty ladder:

- Novice
- Standard
- Veteran
- Master
- Grandmaster

Design principle:

```text
AIKnowledgeState != GameState
```

The current product still uses an **Integration Bot** / controlled behavior suitable for match-loop and presentation integration testing. It is not the final strategic Veteran/Master/Grandmaster AI.

---

# 9. iPhone / PWA target

Production target is hosted JS/PWA first with native-quality iPhone behavior:

- landscape gameplay;
- portrait-friendly non-gameplay screens;
- touch-first controls;
- safe-area handling;
- offline-first PWA behavior;
- save/resume;
- future semantic haptic hooks;
- tap placement always first-class; drag is never mandatory;
- no portrait gameplay requirement for v1.

Canonical deployment URL:

`https://blakemgray.github.io/gwent-definitive/`

---

# 10. Deployment / repository workflow

Repository: `blakemgray/gwent-definitive`  
Workflow: `.github/workflows/deploy-pages.yml`

Policy:

- feature work on a pass branch;
- PR to `main`;
- full engine/browser/interaction/geometry/PWA/WebKit gates;
- pass-specific QA gates;
- visual artifact inspection where applicable;
- merge only after latest-head pass gate is green;
- main push reruns verification;
- Pages deploy only after verify succeeds;
- update this continuity file at the start of each work cycle and again before merge/after production verification.

### Historical production snapshot before Pass 10.4B

**Main head:** `a7026cb884b562cc809a87f38a8c5f14153f652b` (`docs: require forward continuity review`)  
**Last green main workflow before 10.4B:**
- Workflow: `Verify and Deploy Gwent Definitive`
- Run ID: `34546542961`
- Run number: `68`
- Event: `push`
- Verify: `success`
- Deploy: `success`

That was the final green 10.4A production foundation before Pass 10.4B merged.

### Current production snapshot — Pass 10.4B

**Merged PR:** `#7 — Pass 10.4B — Signature Gameplay Choreography`  
**Final PR head:** `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`  
**Merge / production runtime SHA:** `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`  
**Final PR validation:** run #111 / `34606032376` — verify **success**  
**Production verification + Pages deployment:** run #112 / `34607056878` — verify **success**, deploy **success**

Run #112 passed every required production gate:

- engine/catalog/PWA/motion/direct-manipulation/choreography static validation;
- Pass 10.3 battlefield density/centering/geometry gate;
- Pass 10.4A baseline, overlap, parity, interruption, reduced-motion, and touch gate;
- destination-family tap/drag parity;
- presentation-aware bot turn gate;
- disposable presentation-failure recovery;
- 256-trial physical interaction stress gate / 512 committed interactions;
- semantic landing continuity/durable feedback;
- last-card, visibility interruption, and save/restore lifecycle;
- WebKit/iPhone-targeted interaction;
- Pass 10.4B signature choreography, reduced-motion, and interruption gate;
- Pass 10.4B eight-scenario adversarial choreography matrix;
- all QA archives generated;
- production site staged, uploaded, and deployed successfully.

Production artifacts from Run #112:

- Pass 10.4B QA: artifact `10266123499`, digest `sha256:2462476c2659b0eb9caa6e0f57ffb0a11722360dfb15c36bfdef9791b15eec7c`
- Pass 10.4A QA: artifact `10266163575`
- Pass 10.3 QA: artifact `10266273487`
- Pages package: artifact `10266689673`

The production runtime at `a6adca26...` is therefore the authoritative **green and deployed Pass 10.4B baseline**.

### Active development snapshot — Pass 10.4C

**Branch:** `pass-10-4c-feel-presentation-polish`  
**PR:** `#8 — Pass 10.4C — Feel / Presentation Polish`  
**Base:** `main` at `f625b2347c53baa4a7b72917f2e2188ff21b432c`  
**Code head before mandatory continuity checkpoint:** `e5690f24b77653ce532d8812c696c248127273d2`  
**Latest completed PR workflow on that code head:** run #127 / `34613229746` — overall **failure**, but every inherited 10.3/10.4A/10.4B gate **passed**; only the new 10.4C browser gate failed at its first release-identity/title assertion.

Run #127 established that the active feel layer did not regress the green foundation:

- static engine/catalog/PWA/motion/direct-manipulation/choreography/feel contracts green;
- frozen 10.3 geometry green;
- full 10.4A direct-manipulation/touch suite green;
- destination-family parity green;
- presentation-aware bot gating green;
- presentation failure recovery green;
- 256-trial physical stress / 512 committed interactions green;
- semantic landing and lifecycle/save-restore green;
- WebKit/iPhone green;
- primary 10.4B choreography green;
- all eight 10.4B adversarial scenarios green.

The sole failure was `tests/feel_presentation_ui.py` line 70: expected visible `10.4C` milestone identity in `document.title`. Root cause is known: `src/choreography-external-gate.js` still owns a 10.4B-era `installVersionMarks()` path that can re-stamp title/build/profile text after 10.4C bootstrap. This is a release-identity ownership defect, not an engine, interaction, choreography, or feel regression.

The 10.4C artifact was not produced because the new gate failed before creating `qa/pass10_4c` output. Do not treat Run #127 as visual acceptance evidence for 10.4C.

### Pass 10.4B release-candidate visual evidence

The implementation code head immediately before final documentation closeout was `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`. Run #108 / `34602290077` was the first full green release-candidate run after the last visual runtime fix and produced visual artifact `10265117227` with digest `sha256:5fa408a8a25c85c25735624324e45bbb1d465f78745d0bd9f5898d8f147ac975`.

Manual visual inspection at the canonical 852×393 target was completed on that artifact. Verified frames included:

- tied multi-row Scorch pre/mid/final;
- 8+ Muster swarm;
- Spy 10→11 hand pressure;
- Horn over active Tight Bond with score following the visible cause;
- all-weather Clear Weather;
- Medic revive → nested Muster;
- Decoy-on-Spy;
- Round 2→3 hold and final Monster-retention + two-Skellige-return state;
- primary Leader/Pass/round-resolution signature frames;
- reduced-motion Scorch;
- interruption-before-cancel cleanup.

The earlier Medic→Muster artifact defect—an oversized battlefield-height transient card-art sliver—was eliminated. The root cause was post-action visual capture occurring before newly inserted external-action cards had necessarily passed through Pass 10.3's compositor. Commit `6a34c9ce1c6fe1ae43d47eb329187e70cd546535` synchronously calls the existing 10.3 `reconcile()` at the game-action queue boundary before 10.4B captures post-action visual geometry. This changes no engine rule and does not replace 10.3 layout math.

---

# 11. Pass history / running ledger

Do not delete historical pass entries. Later work may supersede details, but history remains explicit.

## Pass 5 — Initial interactive prototype

**Status:** historical / superseded.

First JS prototype exposed a preview-environment mismatch: ChatGPT iPhone HTML preview suppressed scripts. Durable lesson: preview environments are not production architecture requirements.

## Pass 5B — no-JS/hash preview workaround

**Status:** historical / intentionally abandoned as production direction.

Built a no-script/hash fallback for diagnostic preview compatibility. Later superseded by JS-first hosted architecture.

## Pass 6 — art + inspector investigation

**Status:** historical.

Found remote-art limitations in some preview contexts and a transformed-ancestor WebKit issue affecting fixed inspector positioning.

## Pass 6.1 — inspector recovery / explicit assist states

**Status:** historical foundation.

Recovered viewport inspector, explicit assist/cheat states, deck tabs, remote-art fallback, and authored Spy demonstration path.

## Pass 7 — deterministic engine foundation

**Status:** foundational and retained.

Introduced deterministic engine/UI separation, stable instances, seeded RNG, semantic logs, legal actions, core classic mechanics, classifications, cheat draw, and undo/redo history.

Historical QA: 30/30 targeted tests; 250 fuzz trials; 6,482 actions; 0 invariant failures.

## Pass 8 — full catalog migration + UI integration

**Status:** foundational and retained.

Integrated real assets, connected engine to UI, migrated full Arun catalog, and hardened Weather/Horn lifecycle.

Historical QA: 216/216 catalog; 34/34 targeted tests; 250 fuzz / 6,482 actions; 36/36 browser integration checks.

## Pass 9 — source-parity rules completeness

**Status:** foundational and retained.

Expanded rules parity across abilities/factions/leaders and fixed Horn occupancy, exhaustion, Scorch/Decoy legality, and other lifecycle issues.

Historical QA included 131/131 deterministic assertions; 216/216 cards; 44/44 abilities; 22/22 leaders; 5/5 factions; 20,558 combined fuzz actions; 0 invariant failures; 42/42 browser checks.

Legacy Drive archive: `PASS_09_RULES_COMPLETENESS` / folder ID `1QLL8cePMa7kko3WZtRGYQfbMOdanF7sH`.

## Pass 10 — first bespoke battlefield attempt

**Status:** rejected. Do not reuse functional geometry.

Generated/bespoke background geometry diverged from the live DOM and visually merged/omitted required rows.

Durable lesson: **HTML/DOM geometry is authoritative; decorative imagery is subordinate.**

## Pass 10.1 — battlefield recovery

**Status:** successful recovery foundation.

Rebuilt the board around deterministic live DOM geometry with six combat rows, weather band, six special wells, and frozen 852×393 validation. Final recovery measured 0 px geometry drift.

Legacy Drive archive: `PASS_10_1_BATTLEFIELD_RECOVERY` / folder ID `1BHmrfOaW74GmCm7A9X1UtpnsENLQLzNW`.

## Hosted infrastructure milestone — canonical JS/PWA

**Status:** complete and retained.

GitHub became source of truth; GitHub Pages became canonical runtime. Proven path: menu → Play → Quick Start → mulligan → six-row battlefield, inspector, multi-card integration match, service worker/manifest/installable shell.

## Pass 10.2 — continuity gap

**Status:** no dedicated verified standalone dossier in the canonical repository.

Do not invent a false 10.2 description. Add details only if future repository archaeology verifies them.

## Pass 10.3 — Battlefield UX Architecture / Geometry Contract v2

**Status:** production layout baseline and continuing authority.

Key results:

- functional row territory separated from visible rail;
- mathematically centered/compressed row packs;
- sparse-row natural centering;
- first/last clipping protection;
- independent centered ten-card hand compositor;
- explicit information hierarchy;
- weather reinforcement;
- narrower context-preserving inspector;
- six-row structure retained.

Primary contract: `docs/PASS10_3_BATTLEFIELD_UX_CONTRACT.md`  
Geometry config: `config/battlefield-geometry.json`

**Rule for all later passes:** 10.3 owns final geometry.

## Pass 10.4R — Interaction & Motion Research

**Status:** complete specification pass.

Primary artifacts:

- `docs/PASS10_4R_INTERACTION_MOTION_RESEARCH.md`
- `docs/PASS10_4R_CHOREOGRAPHY_MATRIX.md`
- `docs/PASS10_4R_IMPLEMENTATION_BLUEPRINT.md`
- `docs/PASS10_4R_SOURCE_NOTES.md`
- `config/interaction-motion-contract.json`

Locked sequence:

1. **10.4A — Direct Manipulation**
2. **10.4B — Gameplay Choreography**
3. **10.4C — Feel / Presentation Polish**
4. **Pass 11 — Golden Match** only after the interaction layer above is established.

## Pass 10.4A — Direct Manipulation

**Status:** complete, merged, green on main.

PR #5 merged head: `cf1edb24c044c0af1ce64f2300ad59d43daa736d`  
PR #5 merge commit: `7367cd69042d93f0f895bc9150f0207df30f8f1c`  
Follow-on WebKit gate stabilization on main: `731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`

Implemented:

- tap-select/tap-destination;
- direct Pointer Events drag;
- pointer capture + 8 px activation threshold;
- legal destinations exclusively from engine `legalActions`;
- one canonical `commitAction`;
- source placeholder + drag proxy;
- FLIP redistribution;
- invalid-drop zero mutation;
- inspector secondary intent;
- keyboard destination / Escape cancel;
- reduced-motion path;
- native drag + scoped synthetic-click suppression;
- presentation-aware bot gate;
- semantic destination snapshots;
- disposable presentation-failure recovery;
- persistence/interruption cleanup;
- semantic landing authority: final rendered card → semantic destination → precommit snapshot → board fallback.

10.4A QA covered frozen 10.3 geometry, overlap/touch targets, tap/drag parity, destination families, invalid rollback, interruption, reduced motion, real touch injection, 1/3/8/12 row reflow, 64 parity trials, 256 additional stress trials / 512 committed interactions, semantic landing, lifecycle/save-restore, injected failure recovery, and WebKit/iPhone interaction.

A WebKit CI flake was stabilized by waiting on the actual requestAnimationFrame-driven target-state transition instead of a fixed wall-clock delay. No production rules/interaction change was required.

## Pass 10.4B — Signature Gameplay Choreography

**Status:** **COMPLETE / MERGED / GREEN / DEPLOYED TO PRODUCTION.**

**Goal:** turn semantic game effects into readable, distinctive, interruption-safe presentation sequences while preserving engine-first state, 10.3 final geometry, and the 10.4A canonical input/commit path.

**Branch:** `pass-10-4b-signature-choreography`  
**PR:** `#7 — Pass 10.4B — Signature Gameplay Choreography`  
**Green implementation head:** `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`  
**Final PR/docs head:** `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`  
**Merge / production runtime SHA:** `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`  
**Final PR CI:** run #111 / `34606032376` — **success**  
**Production CI + Pages:** run #112 / `34607056878` — verify **success**, deploy **success**

### Locked 10.4B decisions

- engine still commits first;
- choreography is presentation metadata only;
- presentation can be cancelled/discarded/reconstructed;
- no second rules/action path;
- 10.3 remains final geometry authority;
- tap/drag parity remains unchanged;
- scores follow visible causes rather than lead them;
- destructive effects preserve target identity before layout collapse;
- AI/opponent actions use the same presentation language;
- reduced-motion equivalents preserve mechanical clarity;
- external player actions gate Auto Bot until their presentation transaction releases;
- `presentation-events.js` remains a semantic adapter rather than a bootstrapper;
- every game-action post-state visual snapshot is captured only after the existing 10.3 compositor has synchronously reconciled the DOM.

### 10.4B implementation

- `presentation-events.js` derives 10.4B transactions from before/after state + engine event delta.
- Authored choreography planner/runtime lives in `src/gameplay-choreography.js`.
- `src/choreography-external-gate.js` handles Pass/leader/choice/Medic/bot-facing external-action sequencing and geometry synchronization.
- Explicit 10.4B production script/style load graph is declared in `index.html`.
- PWA service-worker/deploy staging includes 10.4B runtime files.
- Signature semantic stages cover Scorch, Muster, Spy, Horn, Weather/Clear, Medic, Decoy, Tight Bond, Morale, Leader, Hero, draw, pass, round resolution, match result, and faction lifecycle effects.
- Presentation-only pre-state visual snapshots preserve source/target identity even though engine state has already committed.
- Scorch retains prior doomed-card identity long enough to read tied targets before row collapse.
- Muster / Medic / round-start arrivals use meaningful deck/grave abstractions.
- Decoy preserves the row→hand swap relationship.
- Score emphasis is ordered after the visible cause.
- Round transitions hold the previous battlefield before retention/resurrection/bonus-draw consequences.
- Monster retention is derived from authoritative before/after state / `retainedIid` without changing engine rules.
- Skellige resurrection and Northern Realms post-round draw use existing engine/log semantics.
- Choreography cues are viewport-clamped with an 8 px safe margin.
- Reduced-motion equivalents preserve mechanic information while aggressively reducing secondary interpolation.
- Interruption/cancellation cleanup reconciles to committed state.

### Important 10.4B files

- `docs/PASS10_4B_CHOREOGRAPHY_CONTRACT.md`
- `gameplay-choreography.css`
- `src/gameplay-choreography.js`
- `src/presentation-events.js`
- `src/choreography-external-gate.js`
- `tests/gameplay-choreography-contract.js`
- `tests/gameplay_choreography_ui.py`
- `tests/gameplay_choreography_stress.py`
- `.github/workflows/deploy-pages.yml`
- `sw.js`
- `index.html`

### 10.4B regressions/defects caught and resolved

1. **Playwright predicate bug:** an arrow predicate incorrectly used `arguments[0]`. Fixed in the harness; no runtime/rules change.
2. **Semantic-adapter bootstrap leakage:** 10.4B modules were initially injected dynamically by `presentation-events.js`. Rejected; explicit runtime graph moved to `index.html` and PWA validation.
3. **Leader cue clipping:** visual QA found the Leader cue partially offscreen. Added 8 px viewport clamping and browser assertion.
4. **External Pass/Auto Bot race:** external player actions could schedule the legacy bot timer before presentation began. Added explicit external gate; bot resumes only after complete/cancel/error.
5. **Causal readability gap:** simple cue/pulse treatment did not satisfy the 10.4R target. Added pre-state visual snapshots, source/target travel, destructive target holds, and score-after-cause ordering.
6. **Reduced-motion timing mismatch:** inherited 10.4A tests accidentally measured Tight Bond choreography as generic placement. Generic baselines now use ability-free units; reduced-motion secondary score/reflow interpolation was shortened while semantic cues remain readable.
7. **WebKit CI frame synchronization:** legal-hover validation now synchronizes against WebKit's own animation-frame scheduling and asserts both semantic controller phase and destination decoration.
8. **Muster stress-fixture bug:** first catalog Muster candidate was Ciri, whose family key is Roach, so eight Ciri copies correctly summoned nothing. Fixture now selects a genuine self-mustering family.
9. **Decoy-on-Spy fixture bug:** first Spy candidate was Hero Mysterious Elf, which classic rules correctly make Decoy-ineligible. Fixture now selects a non-Hero Spy.
10. **Round-3 faction fixture exhaustion:** initial synthetic state immediately auto-passed/cleared the just-revived Skellige cards. Fixture now keeps a legal Round-3 action so the authoritative revival state can be inspected without suppressing real auto-pass rules.
11. **Nested Medic→Muster oversized transient:** external action post-visual capture could occur before new cards were laid out by Pass 10.3. The queue boundary now invokes the existing 10.3 `reconcile()` synchronously before post-state visual capture. Run #108 artifact confirms the defect is gone.

### Final 10.4B QA / evidence

Release-candidate visual/runtime proof:

- Run #108 / `34602290077`, head `6a34c9ce1c6fe1ae43d47eb329187e70cd546535` — verify **success**.
- Artifact `10265117227` manually inspected at 852×393 — no visual blocker.

Latest-head PR proof:

- Run #111 / `34606032376`, head `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c` — every inherited and 10.4B gate **success**.

Production proof:

- Run #112 / `34607056878`, head `a6adca26dc2bc52be9adb8ee7e551843bf00eee2` — every inherited and 10.4B gate **success**; Pages deploy **success**.
- Production 10.4B artifact `10266123499` archived successfully.

10.4B-specific adversarial coverage includes:

1. tied multi-row Scorch;
2. 8+ Muster swarm;
3. Spy 10→11 hand pressure;
4. Horn over active Tight Bond;
5. simultaneous Frost/Fog/Rain → Clear Weather;
6. Medic → nested Muster;
7. Decoy on non-Hero Spy;
8. Round 2→3 Monster retention + two Skellige returns.

### 10.4B non-goals / remaining broader debt

10.4B does not complete the full legal deck builder, final AI, unrestricted production match shell, final audio/haptics, or final feel/accessibility/performance tuning. Those remain later work.

### 10.4B handoff

Pass 10.4B is closed. Do not reopen it unless a regression is discovered against the green production baseline. The next implementation work belongs in **Pass 10.4C — Feel / Presentation Polish**.

## Pass 10.4C — Feel / Presentation Polish

**Status:** **ACTIVE / PR #8 OPEN / NOT MERGED.**  
**Estimated completion:** **~70%** — visibility estimate only.  
**Goal:** make the already-correct 10.4A/B interaction/choreography layer feel immediate, physical, coherent, accessible, and native-quality on iPhone/WebKit without changing classic rules or 10.3 final geometry.  
**Branch:** `pass-10-4c-feel-presentation-polish`  
**PR:** `#8 — Pass 10.4C — Feel / Presentation Polish`  
**Base:** `main` at `f625b2347c53baa4a7b72917f2e2188ff21b432c`  
**Code head before this continuity checkpoint:** `e5690f24b77653ce532d8812c696c248127273d2`

### Locked 10.4C decisions

- 10.4C is presentation/feel/accessibility/performance work, not a rules pass.
- 10.3 final geometry remains frozen authority.
- 10.4A canonical tap/drag action path remains authority.
- 10.4B engine-first cause→effect choreography remains authority.
- Prefer dedicated polish layers/subscribers over invasive rewrites of proven controller/choreography code.
- Audio/haptics are semantic feedback hooks only; they never own legality/state.
- Haptics remain capability-gated and opt-in on web.
- Reduced motion must preserve mechanic information and tactile clarity rather than simply disable all motion.
- Hosted-runner frame-rate numbers are evidence, not brittle pass/fail thresholds; correctness, persistent animation leaks, input latency contracts, and cleanup remain hard gates.
- Final acceptance requires actual visual inspection of the 10.4C artifact, not CI alone.

### Current 10.4C implementation

- Motion-token timing/easing tuning for more physical, coherent interaction pacing.
- Dedicated `feel-polish.css` tactile override layer for press, selection, drag, and legal-target treatment.
- Dedicated `src/presentation-feedback.js` semantic feedback subscriber with persisted effects volume/mute settings.
- Capability-gated optional web haptic mapping hooks.
- Explicit 10.4C runtime/PWA/deploy graph in `index.html`, `sw.js`, validation, and workflow staging.
- Static `tests/feel-presentation-contract.js` contract.
- Browser `tests/feel_presentation_ui.py` gate covering feel, feedback, reduced motion, pacing, transient cleanup, duplicate-install protection, and timing evidence.
- Generic baseline fixtures normalize to an ability-free Redanian Foot Soldier where signature abilities would contaminate a generic feel measurement.

### Current QA / evidence

Run #127 / `34613229746`, code head `e5690f24b77653ce532d8812c696c248127273d2`:

- all static contracts green, including 46 10.4C feel assertions;
- frozen 10.3 geometry green;
- full 10.4A direct-manipulation/touch gate green;
- destination parity green;
- bot gating and presentation failure recovery green;
- 256 physical stress trials / 512 committed interactions green;
- semantic landing green;
- lifecycle/save-restore green;
- WebKit/iPhone green;
- primary 10.4B choreography green;
- all eight 10.4B adversarial scenarios green;
- **only 10.4C-specific browser gate failed**, at its first title assertion before producing the 10.4C visual artifact.

### Current blocker

`src/choreography-external-gate.js` still includes 10.4B-era `installVersionMarks()` behavior that can re-stamp `document.title`, buildline, and profile status after 10.4C loads. This causes the 10.4C browser gate to observe Pass 10.4B identity even though the new feel runtime is installed. Treat this as release-identity ownership cleanup, not a reason to modify engine/rules/action/choreography semantics.

### Exact next action

Make 10.4C the final owner of visible milestone/version presentation without dismantling lower-layer 10.4A/10.4B runtime responsibilities, then rerun the complete PR #8 validation matrix. If green, inspect the newly produced 10.4C visual artifact before further feel tuning or merge decisions.

---

# 12. Current product status

Production/main currently remains the fully green/deployed **Pass 10.4B** baseline. The active 10.4C branch additionally contains presentation-only feel work that is not yet production.

Production/main has:

- hosted canonical JS/PWA infrastructure;
- deterministic classic-rules engine;
- full 216-card migrated catalog beneath the product UI;
- source-parity rules baseline;
- stable six-row 10.3 geometry;
- centered/compressed hand and row compositors;
- save/Continue Match path;
- 10.4A direct manipulation with tap/drag parity;
- interruption/failure safety;
- reduced-motion path;
- semantic presentation transaction substrate;
- FLIP redistribution;
- iPhone/WebKit interaction coverage;
- 10.4B authored mechanic/lifecycle choreography runtime;
- expanded semantic before/after + engine-delta adapter;
- presentation-only pre-state visual snapshots for causal readability;
- explicit production/PWA 10.4B load graph;
- external-action / Auto Bot sequencing gate;
- synchronous 10.3 reconciliation before post-action visual capture;
- viewport-safe mechanic cues;
- score-after-cause ordering;
- round/faction lifecycle grouping;
- reduced-motion mechanic equivalents;
- adversarial signature/lifecycle QA proven green;
- CI-protected Pages deployment.

Active 10.4C branch additionally contains:

- feel-polish CSS layer;
- tuned shared motion tokens;
- semantic audio/optional-haptic feedback subscriber;
- persisted effects feedback preferences;
- pass-specific static/browser QA and artifact pipeline;
- explicit PWA/deploy staging for 10.4C runtime files.

Major remaining work:

- finish 10.4C release identity ownership, browser QA, visual tuning, continuity closeout, merge, and production verification;
- unrestricted legal deck builder across all 216 cards;
- polished faction/leader/deck selection;
- complete production mulligan/effect-choice UX across unrestricted legal combinations;
- final Veteran/Master/Grandmaster AI;
- full victory/rematch/unrestricted match shell;
- local permitted-art ownership/caching rather than raw-GitHub dependency;
- native-quality install/offline polish;
- Pass 11 Golden Match after 10.4C.

---

# 13. Current implementation pass — Pass 10.4C Feel / Presentation Polish

**Status:** **ACTIVE / approximately 70% complete by current estimate.**

Primary 10.4C focus:

- physical card weight and immediate tactile response;
- motion curves and timing coherence;
- hover/press/selection/target feedback;
- score transitions and row reactions;
- match/round pacing without ornamental delay;
- semantic audio hooks;
- future/native haptic mapping points;
- reduced-motion quality rather than simple animation removal;
- interruption/cancellation feel;
- performance/frame budget on iPhone/WebKit;
- final presentation consistency across tap, drag, player, bot, lifecycle, and effect-choice paths.

Current implementation has established the dedicated polish/feedback substrate and passed every inherited regression gate on Run #127. The immediate blocker is release-identity ownership, after which the 10.4C-specific browser gate can produce its first authoritative visual/timing artifact.

10.4C remains a polish/feel/accessibility/performance pass, not a rules pass. The strongest acceptance evidence must include real visual inspection and timing/frame-budget evidence rather than only static green tests.

**Next pass after 10.4C:** **Pass 11 — Golden Match / Complete Normal Match.**

---

# 14. Forward roadmap authority

`FUTURE_CONTINUITY.md` preserves intended future direction. The locked near-term sequence is now:

1. **Finish Pass 10.4C — Feel / Presentation Polish**;
2. **Pass 11 — Golden Match**.

Pass 10.4A and 10.4B are complete production foundations. Pass 11 must not begin until 10.4C finishes the interaction/presentation layer. Golden Match is the first full-game validation of legal decks, full round lifecycle, normal human interaction without developer shortcuts, real chained presentation, AI using the same choreography language, and strategic pacing with animation enabled.

Requirements beyond Pass 11 may be described in `FUTURE_CONTINUITY.md`; do not invent exact later pass numbers unless explicitly assigned.

---

# 15. Archive / Drive context

GitHub is canonical for active development. Earlier source/reference material also exists in Drive.

Reference folder: `Gwent Classic - Arunsundaram`  
Folder ID: `1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`

Legacy product root: `Gwent Definitive - blakemgray`  
Folder ID: `1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`

Use Drive archives for historical/reference comparison only unless explicitly instructed otherwise.

---

# 16. Continuity update template

For each future pass/task checkpoint, maintain or refresh the ledger with:

```md
## Pass X — Name

**Status:** planned | active | blocked | complete | merged | superseded
**Estimated completion:** ~N% (visibility only; never a schedule/quality pressure)
**Goal:** ...
**Branch:** `...`
**PR:** `#...`
**Head SHA:** `...`
**Merge SHA:** `...`
**Main/deploy SHA after merge:** `...`

### Locked decisions
- ...

### Implementation
- ...

### Important files
- `...`

### QA / evidence
- ...

### Regressions fixed
- ...

### Known debt / non-goals
- ...

### Handoff / exact next action
- ...
```

Then update the top snapshot and current-status/active-pass sections. During an active pass, write a GitHub continuity checkpoint **before more implementation work begins** whenever a new task/work cycle starts.

---

# 17. New-chat bootstrap instruction

For a new conversation, use:

> Read `CONTINUITY.md` first, then `FUTURE_CONTINUITY.md`, inspect current `main`, inspect any active pass branch/PR, read the relevant pass contracts, and inspect latest CI. Before making further implementation changes, write a current checkpoint back to `CONTINUITY.md` on the active branch. Continue from the exact handoff state. Every progress report should include the current estimated completion percentage and end with the exact next action.

---

# 18. Current handoff

**Production Pass 10.4B is complete, merged, verified, and deployed. Pass 10.4C is active on PR #8 and not yet production.**

Production runtime baseline:

- merge/runtime SHA: `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`;
- final 10.4B PR head: `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`;
- final 10.4B PR run: #111 / `34606032376` — success;
- production run: #112 / `34607056878` — verify success, Pages deploy success;
- production 10.4B QA artifact: `10266123499`;
- canonical hosted build: https://blakemgray.github.io/gwent-definitive/.

Active 10.4C state before this continuity checkpoint:

- branch: `pass-10-4c-feel-presentation-polish`;
- PR: #8;
- code head: `e5690f24b77653ce532d8812c696c248127273d2`;
- estimated completion: ~70%;
- latest completed workflow: run #127 / `34613229746`;
- all inherited 10.3/10.4A/10.4B gates green on that run;
- only the new 10.4C browser gate failed, at the release-identity/title assertion;
- no authoritative 10.4C visual artifact exists yet because the gate stopped before artifact generation.

**Exact next implementation action:** make 10.4C the final owner of visible milestone/version presentation without changing engine rules, 10.3 geometry, 10.4A commit semantics, or 10.4B choreography; then rerun the complete PR #8 matrix. If that is green, inspect the new 10.4C artifact and continue visual/timing tuning as needed before merge.

Do not begin Pass 11 until 10.4C is complete, merged, verified on `main`, and deployed.