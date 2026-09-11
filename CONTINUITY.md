# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff for this project. A new conversation, development pass, or implementation context should be able to recover the project from this file plus the repository without depending on chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** https://blakemgray.github.io/gwent-definitive/  
**Default branch:** `main`  
**Current production/main head before Pass 10.4B merge:** `a7026cb884b562cc809a87f38a8c5f14153f652b`  
**Last verified green production/main workflow before Pass 10.4B merge:** `Verify and Deploy Gwent Definitive` run ID `34546542961` / run #68 — verify **success**, deploy **success**  
**Last updated:** 2026-09-11 America/Indiana/Indianapolis  
**Latest implementation-complete release candidate:** **Pass 10.4B — Signature Gameplay Choreography**  
**Current active repository action:** **Pass 10.4B closeout — final docs-head CI, PR #7 merge, main verification/Pages deploy**  
**Next implementation milestone after 10.4B is merged/deployed:** **Pass 10.4C — Feel / Presentation Polish**  
**Pass 11:** **Golden Match**, only after 10.4A/B/C establish the interaction layer.

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

Important runtime files after Pass 10.4B:

- `src/gwent-engine.js` — deterministic classic-rules engine.
- `src/cards-catalog.js` — full migrated 216-card catalog.
- `src/storage.js` — persisted match-state abstraction.
- `src/battlefield-ux.js` — Pass 10.3 compositor/reconciliation and final geometry authority.
- `src/motion-tokens.js` — shared timing/easing/reduced-motion policy.
- `src/presentation-queue.js` — serialized cancellable presentation transaction layer.
- `src/interaction-turn-gate.js` — 10.4A bot mutation gate.
- `src/presentation-events.js` — 10.4B semantic before/after + engine-delta presentation-event adapter; remains a semantic adapter, not a runtime bootstrapper.
- `src/gameplay-choreography.js` — 10.4B mechanic/lifecycle choreography planner and presentation runtime.
- `src/choreography-external-gate.js` — 10.4B external action / Auto Bot gate plus synchronous 10.3 geometry reconciliation before post-action visual capture.
- `src/flip-layout.js` — FLIP redistribution around 10.3 final geometry.
- `src/gesture-controller.js` — 10.4A tap/drag canonical commit controller.
- `app.js` — product shell/match integration.
- `battlefield-ux.css` — battlefield treatment.
- `direct-manipulation.css` — interaction-state visuals.
- `gameplay-choreography.css` — 10.4B cues/effect-state visuals.

10.4B runtime modules are explicitly declared in `index.html` and explicitly precached/staged by the PWA/deploy graph. An earlier dynamic-loader shortcut inside `presentation-events.js` was rejected and removed because it blurred semantic-adapter and bootstrapping responsibilities.

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
- update this continuity file in the pass before merge.

### Production/main snapshot before Pass 10.4B merge

**Main head:** `a7026cb884b562cc809a87f38a8c5f14153f652b` (`docs: require forward continuity review`)  
**Last green main workflow:**
- Workflow: `Verify and Deploy Gwent Definitive`
- Run ID: `34546542961`
- Run number: `68`
- Event: `push`
- Verify: `success`
- Deploy: `success`

Main therefore remains the green **10.4A production foundation plus continuity/roadmap documentation** until PR #7 is merged. Pass 10.4B is implementation-complete on its branch but is not yet production at the time of this continuity write.

### Pass 10.4B release-candidate snapshot

**Branch:** `pass-10-4b-signature-choreography`  
**PR:** `#7 — Pass 10.4B — Signature Gameplay Choreography`  
**Green code head:** `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`  
**README closeout head:** `8effbafed28c2580a90bc7b7f2cfdf0b71996a96`  
**This continuity update:** creates the subsequent docs-only branch head  
**Merge SHA:** none yet — merge pending final docs-head CI  
**Main/deploy SHA after merge:** none yet

Authoritative green release-candidate workflow:

- Workflow: `Verify and Deploy Gwent Definitive`
- Run ID: `34602290077`
- Run number: `108`
- Event: `pull_request`
- Head: `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`
- Verify job: **success**
- Deploy job: **skipped as expected for PR validation**

Run #108 passed every required gate:

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
- all visual QA archives generated successfully.

Pass 10.4B visual artifact:

- Artifact name: `pass10-4b-signature-choreography-qa`
- Artifact ID: `10265117227`
- Run: #108 / `34602290077`
- Digest: `sha256:5fa408a8a25c85c25735624324e45bbb1d465f78745d0bd9f5898d8f147ac975`

Manual visual inspection at the canonical 852×393 target was completed after Run #108. Verified frames include:

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

**No implementation blocker remains at the Run #108 code head.** Remaining closeout actions are administrative/repository gates only: final docs-head CI, PR #7 merge, main verification/Pages deployment, and one post-merge continuity refresh with final production SHAs.

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
Follow-on WebKit gate stabilization on main: `731f5fc3c93eb7bd445b52edaad59d43daa736d`

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

**Status:** **IMPLEMENTATION COMPLETE / RELEASE-GREEN / PR #7 MERGE PENDING.**

**Goal:** turn semantic game effects into readable, distinctive, interruption-safe presentation sequences while preserving engine-first state, 10.3 final geometry, and the 10.4A canonical input/commit path.

**Branch:** `pass-10-4b-signature-choreography`  
**PR:** `#7 — Pass 10.4B — Signature Gameplay Choreography`  
**Green code head:** `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`  
**README closeout head:** `8effbafed28c2580a90bc7b7f2cfdf0b71996a96`  
**Merge SHA:** none yet  
**Main/deploy SHA after merge:** none yet

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

**Authoritative release-candidate run:** #108 / `34602290077`, head `6a34c9ce1c6fe1ae43d47eb329187e70cd546535` — **verify success**.

Static and inherited coverage remained green, including:

- engine regression and catalog fuzz;
- PWA validation and explicit runtime precache/load order;
- 10.4R motion contract;
- 10.4A static contract;
- 10.3 geometry browser gate;
- complete direct-manipulation baseline/overlap/parity/interruption/reduced-motion/touch gate;
- destination-family parity;
- presentation-aware bot gate;
- disposable presentation failure recovery;
- 256 physical stress trials / 512 committed interactions;
- semantic landing continuity;
- last-card/visibility/save-restore lifecycle;
- WebKit/iPhone interaction.

10.4B-specific coverage green:

- signature choreography browser gate;
- reduced-motion equivalents;
- interruption/cancellation state reconciliation;
- viewport-safe cues;
- eight-scenario adversarial matrix:
  1. tied multi-row Scorch;
  2. 8+ Muster swarm;
  3. Spy 10→11 hand pressure;
  4. Horn over active Tight Bond;
  5. simultaneous Frost/Fog/Rain → Clear Weather;
  6. Medic → nested Muster;
  7. Decoy on non-Hero Spy;
  8. Round 2→3 Monster retention + two Skellige returns.

Visual artifact `10265117227` from Run #108 was manually inspected at 852×393. No visual blocker remains. The previously defective Medic→Muster transient is now card-bounded; the Round 2→3 hold/final sequence visibly preserves causal continuity and lands in the correct authoritative Round-3 state.

### 10.4B non-goals / remaining broader debt

10.4B does not complete the full legal deck builder, final AI, unrestricted production match shell, final audio/haptics, or final feel/accessibility/performance tuning. Those remain later work.

### 10.4B exact closeout action

1. Run the final README + `CONTINUITY.md` docs-only branch head through the full required CI graph.
2. If green, merge PR #7 with expected-head protection.
3. Verify `main` through the full verification + Pages deployment workflow.
4. Refresh this continuity file on `main` with the final merge SHA, production head, and main deploy evidence.
5. Only then begin **Pass 10.4C — Feel / Presentation Polish**.

---

# 12. Current product status at the Pass 10.4B closeout

## Production/main currently has until PR #7 merges

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
- CI-protected deployment.

## Pass 10.4B release candidate additionally has

- authored mechanic/lifecycle choreography runtime;
- expanded semantic before/after + engine-delta adapter;
- presentation-only pre-state visual snapshots for causal readability;
- explicit production/PWA 10.4B load graph;
- external-action / Auto Bot sequencing gate;
- synchronous 10.3 reconciliation before post-action visual capture;
- viewport-safe mechanic cues;
- score-after-cause ordering;
- round/faction lifecycle grouping;
- reduced-motion mechanic equivalents;
- adversarial signature/lifecycle QA proven green.

## Major remaining work after 10.4B closeout

- Pass 10.4C timing/feel/audio hooks/future haptics/accessibility/performance;
- unrestricted legal deck builder across all 216 cards;
- polished faction/leader/deck selection;
- complete production mulligan/effect-choice UX across unrestricted legal combinations;
- final Veteran/Master/Grandmaster AI;
- full victory/rematch/unrestricted match shell;
- local permitted-art ownership/caching rather than raw-GitHub dependency;
- native-quality install/offline polish;
- Pass 11 Golden Match after 10.4A/B/C.

---

# 13. Active repository action — Pass 10.4B closeout

**Do not begin 10.4C until PR #7 is merged and production verification/deployment is green.**

Branch: `pass-10-4b-signature-choreography`  
PR: `#7`  
Green implementation head: `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`  
Green implementation CI: run #108 / `34602290077` — all inherited + WebKit + signature + adversarial gates green.  
Visual artifact: `10265117227` — manually inspected, no blocker.

10.4B's implementation completion gate is satisfied at the code head. The only remaining requirements are:

- final docs-head CI green;
- PR #7 merge;
- main verification + Pages deploy green;
- post-merge continuity refresh with final production evidence.

**Next planned implementation pass:** **Pass 10.4C — Feel / Presentation Polish.**

10.4C should tune physical card weight, timing curves, pacing, target/score/row feedback, semantic audio hooks, future/native haptic mapping, reduced-motion quality, interruption feel, performance/frame budget, and iPhone-native responsiveness. It must not change classic rules or replace 10.3 geometry.

---

# 14. Forward roadmap authority

`FUTURE_CONTINUITY.md` preserves intended future direction. The locked near-term sequence is:

1. close/merge/deploy **10.4B — Signature Gameplay Choreography**;
2. **10.4C — Feel / Presentation Polish**;
3. **Pass 11 — Golden Match**.

Pass 11 must not begin until 10.4A/B/C establish the interaction layer. Golden Match is the first full-game validation of legal decks, full round lifecycle, normal human interaction without developer shortcuts, real chained presentation, AI using the same choreography language, and strategic pacing with animation enabled.

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

For each future pass, maintain a ledger section with:

```md
## Pass X — Name

**Status:** planned | active | blocked | complete | merged | superseded
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

Then update the top snapshot and current-status/active-pass sections.

---

# 17. New-chat bootstrap instruction

For a new conversation, use:

> Read `CONTINUITY.md` first, then `FUTURE_CONTINUITY.md`, inspect current `main`, inspect any active pass branch/PR, read the relevant pass contracts, and inspect latest CI. Continue from the exact handoff state. Update `CONTINUITY.md` as part of the pass before merge.

---

# 18. Current handoff

**Production/main remains green on the 10.4A interaction foundation at `a7026cb884b562cc809a87f38a8c5f14153f652b`; main workflow run #68 (`34546542961`) verified and deployed successfully.**

**Pass 10.4B is implementation-complete and release-green on PR #7.** The authoritative code head is `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`; Run #108 (`34602290077`) passed the complete inherited 10.3/10.4A regression matrix, WebKit/iPhone gate, primary 10.4B signature/reduced-motion/interruption suite, and all eight adversarial choreography scenarios. Artifact `10265117227` was manually inspected at 852×393 and has no remaining visual blocker.

The last significant visual defect—an oversized transient during external Medic→Muster presentation—was resolved by synchronously reconciling through the existing Pass 10.3 compositor before 10.4B post-action visual capture. The final Round 2→3 evidence also confirms one retained Monster and exactly two Skellige returns while the new round remains active.

**Exact next action:** let the final README + continuity docs-only branch head pass CI; merge PR #7 only if that latest head is green; verify the resulting `main` workflow and Pages deployment; refresh this ledger on `main` with the merge/production/deploy SHAs; then begin **Pass 10.4C — Feel / Presentation Polish**.

Do **not** reopen 10.4B implementation unless the final docs-head or post-merge verification exposes a real regression.
