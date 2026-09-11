# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff for this project. A new conversation, development pass, or implementation context should be able to recover the project from this file plus the repository without depending on chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** https://blakemgray.github.io/gwent-definitive/  
**Default branch:** `main`  
**Current production/main head:** `a7026cb884b562cc809a87f38a8c5f14153f652b`  
**Last verified green main workflow:** `Verify and Deploy Gwent Definitive` run ID `34546542961` / run #68 — verify **success**, deploy **success**  
**Last updated:** 2026-09-10 America/Indiana/Indianapolis (GitHub activity after 00:00 UTC appears as 2026-09-11)  
**Current completed implementation milestone:** **Pass 10.4A — Direct Manipulation**  
**Current active implementation milestone:** **Pass 10.4B — Gameplay Choreography**  
**Next planned milestone after the active pass:** **Pass 10.4C — Feel / Accessibility / Performance**  
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

Important runtime files on the current 10.4B branch:

- `src/gwent-engine.js` — deterministic classic-rules engine.
- `src/cards-catalog.js` — full migrated 216-card catalog.
- `src/storage.js` — persisted match-state abstraction.
- `src/battlefield-ux.js` — Pass 10.3 compositor/reconciliation.
- `src/motion-tokens.js` — shared timing/easing/reduced-motion policy.
- `src/presentation-queue.js` — serialized cancellable presentation transaction layer.
- `src/interaction-turn-gate.js` — 10.4A bot mutation gate.
- `src/presentation-events.js` — **10.4B semantic before/after + engine-delta presentation-event adapter; remains a semantic adapter, not a runtime bootstrapper.**
- `src/gameplay-choreography.js` — **10.4B mechanic/lifecycle choreography planner and presentation runtime.**
- `src/choreography-external-gate.js` — **10.4B external action / Auto Bot gate for pass, leader, choice/Medic, bot-facing flows.**
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

### Production/main snapshot

**Main head:** `a7026cb884b562cc809a87f38a8c5f14153f652b` (`docs: require forward continuity review`)  
**Last green main workflow:**
- Workflow: `Verify and Deploy Gwent Definitive`
- Run ID: `34546542961`
- Run number: `68`
- Event: `push`
- Verify: `success`
- Deploy: `success`

Main therefore remains the green **10.4A production foundation plus continuity/roadmap documentation**. Pass 10.4B is not yet deployed to production.

### Active Pass 10.4B snapshot

**Branch:** `pass-10-4b-signature-choreography`  
**PR:** `#7 — Pass 10.4B — Signature Gameplay Choreography`  
**Current head before this continuity update:** `ce57aa7f9780aa4fe1eac435ecec78c7f72c16f8`  
**Merge SHA:** none — not merged  
**Main/deploy SHA after merge:** none

Latest completed workflow at that code head:

- Run ID: `34550507415`
- Run number: `91`
- Conclusion: `failure`
- Static engine/catalog/PWA/motion/direct-manipulation/choreography contract suite: **green**
- Pass 10.3 battlefield geometry browser gate: **green**
- Inherited Pass 10.4A direct-manipulation browser gate: **failed on timing assertion**
- Later inherited gates: skipped after failure
- Pass 10.4B browser/adversarial gates: skipped after failure
- Deploy: skipped

Exact current blocker:

`tests/direct_manipulation_ui_v4.py` still asserts that the **entire completed presentation transaction** for a tested play is `<350 ms`. With 10.4B active, playing `realms_blue_stripes` triggers authored Tight Bond choreography and the complete serialized transaction measured approximately **436.7 ms**. The engine result, semantic transaction, static contract suite, and 10.3 geometry gate were valid; however, 10.4B may not be declared green until this inherited timing contract is deliberately reconciled and the entire downstream suite executes.

Do **not** simply delete/loosen the timing protection. Preserve the 10.4A guarantee that ordinary manipulation remains responsive; distinguish ordinary placement/settlement timing from intentionally longer authored ability choreography if that is the correct contract.

Run #91 artifacts created before the failure:

- Pass 10.3 visual QA artifact `10180649533`
- Pass 10.4A interaction QA artifact `10180650179`
- No Pass 10.4B artifact from run #91 because the 10.4B browser gate never ran.

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
3. **10.4C — Feel / Accessibility / Performance**
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

A WebKit CI flake was stabilized by waiting on the actual requestAnimationFrame-driven target-state transition instead of a fixed 45 ms wall-clock delay. No production rules/interaction change was required.

## Pass 10.4B — Gameplay Choreography

**Status:** **ACTIVE / NOT MERGED / currently blocked on inherited timing-gate compatibility.**

**Goal:** turn semantic game effects into readable, distinctive, interruption-safe presentation sequences while preserving engine-first state, 10.3 final geometry, and the 10.4A canonical input/commit path.

**Branch:** `pass-10-4b-signature-choreography`  
**PR:** `#7 — Pass 10.4B — Signature Gameplay Choreography`  
**Code head before this continuity update:** `ce57aa7f9780aa4fe1eac435ecec78c7f72c16f8`  
**Merge SHA:** none  
**Main/deploy SHA after merge:** none

### Locked 10.4B decisions

- engine still commits first;
- choreography is presentation metadata only;
- presentation can be cancelled/discarded/reconstructed;
- no second rules/action path;
- 10.3 remains final geometry authority;
- tap/drag parity remains unchanged;
- scores should follow visible causes rather than lead them;
- destructive effects must preserve target identity before layout collapse;
- AI/opponent actions use the same presentation language;
- reduced-motion equivalents preserve mechanical clarity;
- external player actions must gate Auto Bot until their presentation transaction releases;
- `presentation-events.js` remains a semantic adapter rather than a bootstrapper.

### 10.4B implementation on the active branch

- `presentation-events.js` expanded to derive 10.4B transactions from before/after state + engine event delta.
- Authored choreography planner/runtime added in `src/gameplay-choreography.js`.
- `src/choreography-external-gate.js` added for Pass/leader/choice/Medic/bot-facing external-action sequencing.
- Explicit 10.4B production script/style load graph added to `index.html`.
- PWA service-worker/deploy staging updated for 10.4B runtime.
- Signature treatment implemented/planned through semantic stages for Scorch, Muster, Spy, Horn, Weather/Clear, Medic, Decoy, Tight Bond, Morale, Leader, Hero, draw, pass, round resolution, match result, and faction lifecycle effects.
- Presentation-only **pre-state visual snapshots** introduced so already-committed state does not erase causal readability.
- Scorch can retain prior doomed-card identity long enough to read tied targets before the row collapses.
- Muster / Medic / round-start arrivals can use meaningful deck/grave abstractions rather than arbitrary origins.
- Decoy presentation can preserve the swap relationship between row and hand.
- Score emphasis is ordered after the visible cause.
- Round transition planning can hold the previous battlefield before retention/resurrection/bonus-draw consequences.
- Monster retention can be derived from before/after board state / `retainedIid` without changing engine rules.
- Skellige resurrection and Northern Realms post-round draw already provide engine/log hooks usable by the presentation adapter.
- Choreography cues are viewport-clamped with an 8 px safe margin after artifact review found the Leader cue clipped off the left edge.
- Reduced-motion and interruption cleanup are part of the authored presentation path.

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

### 10.4B issues/regressions caught during development

1. A Playwright predicate incorrectly used `arguments[0]` inside an arrow function. Fixed as a test-harness defect; no runtime/rules change.
2. 10.4B modules were initially injected dynamically by `presentation-events.js`. Rejected as an architectural boundary violation; runtime graph is now explicit in `index.html`, and PWA validation enforces it.
3. Visual QA found the Leader cue partially clipped at the viewport edge. Added safe clamping + browser viewport-safety assertion.
4. External Pass + Auto Bot sequencing received an explicit gate so bot mutation cannot occur while player Pass choreography remains unresolved; the test distinguishes that gate from legitimate subsequent bot choreography.
5. A deeper audit against the 10.4R choreography matrix found simple cue/pulse treatment insufficient for causal requirements. Presentation-only pre-state visual snapshots were added to preserve source/target identity and cause-before-consequence ordering without delaying or changing engine state.
6. The static choreography contract was updated so Skellige resurrection can be grouped causally inside the round-transition stage instead of being forced into an artificial standalone stage.

### QA evidence at current active head

Run #91 (`34550507415`) established:

- engine regression: **19 assertions passed**;
- catalog fuzz: **75 games / 1,803 actions / 0 invariant failures**;
- PWA validation: **25 precache paths valid with explicit 10.4B runtime**;
- 10.4R interaction/motion contract: **valid**;
- direct-manipulation static contract: **52 assertions passed**;
- gameplay choreography static contract: **causal planning, visual snapshots, score ordering, lifecycle grouping, engine isolation, adapter purity passed**;
- Pass 10.3 browser geometry gate: **passed**.

Run #91 then failed in the inherited 10.4A direct-manipulation browser suite on the whole-transaction `<350 ms` timing assertion because authored Tight Bond choreography extended the serialized transaction to about **436.7 ms**.

Because GitHub Actions stops subsequent dependent steps after that failure, the following were **not yet revalidated at current head**:

- destination-family parity;
- presentation-aware bot gate;
- injected presentation failure recovery;
- 256-trial interaction stress;
- semantic landing continuity;
- last-card/visibility/save-restore lifecycle;
- WebKit/iPhone gate;
- main 10.4B signature browser suite;
- expanded 10.4B adversarial choreography stress matrix.

The newly added `tests/gameplay_choreography_stress.py` is intended to cover the locked adversarial cases including tied multi-row Scorch, dense Muster, Spy hand pressure, Horn + Bond, all-weather Clear, nested Medic→Muster, Decoy-on-Spy, and round-transition faction effects. It has **not yet run successfully in the full CI chain at this head** because the inherited timing gate stops the workflow earlier.

### Current blocker — exact interpretation

The current failure does **not** show an engine/geometry/rules regression. It shows an unresolved contract question between:

- the 10.4A responsiveness requirement for ordinary direct manipulation; and
- deliberately longer, authored 10.4B ability choreography inside the same serialized presentation transaction.

Exact next engineering action:

1. Inspect the inherited `<350 ms` assertion's original intent.
2. Preserve a strict responsiveness budget for ordinary card manipulation/settlement.
3. If appropriate, separate that ordinary-interaction measurement from the duration of intentional mechanic choreography instead of globally relaxing the gate.
4. Run the complete inherited 10.3/10.4A regression matrix plus all 10.4B UI/adversarial tests on the latest head.
5. Inspect the resulting 10.4B visual artifact at 852×393 / iPhone-landscape target.
6. Fix any remaining causal, viewport, interruption, reduced-motion, or lifecycle defects.
7. Update this continuity entry with the final green run, QA artifact, PR head, merge SHA, main deploy SHA.
8. Merge PR #7 only after all of the above are green/inspected.

### 10.4B non-goals / remaining broader debt

10.4B does not complete the full legal deck builder, final AI, unrestricted production match shell, final audio/haptics, or final accessibility/performance tuning. Those remain later work.

---

# 12. Current product status during Pass 10.4B

## Production/main currently has

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

## Active 10.4B branch additionally has, but is not yet production

- authored mechanic/lifecycle choreography runtime;
- expanded semantic before/after + engine-delta adapter;
- presentation-only pre-state visual snapshots for causal readability;
- explicit production/PWA 10.4B load graph;
- external-action / Auto Bot sequencing gate;
- viewport-safe effect cues;
- score-after-cause ordering;
- round/faction lifecycle grouping;
- expanded signature/adversarial QA coverage awaiting a full clean CI run.

## Major remaining work

- finish 10.4B regression/adversarial/visual validation and merge it;
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

# 13. Active pass — Pass 10.4B Gameplay Choreography

**Do not begin 10.4C yet. Finish 10.4B first.**

Current branch: `pass-10-4b-signature-choreography`  
PR: `#7`  
Code head before this continuity update: `ce57aa7f9780aa4fe1eac435ecec78c7f72c16f8`  
Latest completed code-head CI: run #91 / `34550507415` — failure at inherited 10.4A whole-transaction timing assertion after static + geometry gates passed.

Completion gate for 10.4B:

- preserve 10.4A ordinary interaction responsiveness rather than blindly loosening tests;
- all inherited 10.3/10.4A browser, stress, lifecycle, and WebKit gates green;
- 10.4B semantic/causal contract green;
- 10.4B signature UI suite green;
- expanded adversarial choreography suite green;
- reduced-motion equivalents verified;
- interruption/cancellation reconciles to committed engine state;
- final 10.4B QA artifact visually inspected at the native landscape target;
- `CONTINUITY.md` finalized with green evidence + merge/deploy SHAs;
- PR #7 merged;
- main verification + Pages deploy green.

**Next planned pass after this gate:** **Pass 10.4C — Feel / Accessibility / Performance.**

10.4C will tune real-device timing/tactile coherence, performance/frame budget, semantic audio hooks, future/native haptic mapping, reduced-motion quality, accessibility, and cleanup. It must not change classic rules or replace 10.3 geometry.

---

# 14. Forward roadmap authority

`FUTURE_CONTINUITY.md` preserves intended future direction. The locked near-term sequence is:

1. finish **10.4B — Gameplay Choreography**;
2. **10.4C — Feel / Accessibility / Performance**;
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

**Production/main is green on the 10.4A interaction foundation at `a7026cb884b562cc809a87f38a8c5f14153f652b`; main workflow run #68 (`34546542961`) verified and deployed successfully.**

**Pass 10.4B is active on PR #7, branch `pass-10-4b-signature-choreography`. The code head before this continuity-only commit was `ce57aa7f9780aa4fe1eac435ecec78c7f72c16f8`.**

At that head, run #91 showed:

- static engine/catalog/PWA/motion/direct-manipulation/choreography contracts green;
- 10.3 battlefield geometry browser gate green;
- inherited 10.4A direct-manipulation browser gate blocked by an old `<350 ms` **whole presentation transaction** assertion on a Tight Bond play now taking ~436.7 ms because 10.4B intentionally adds authored Bond choreography;
- all later inherited and new 10.4B browser gates skipped;
- no 10.4B visual artifact from run #91.

**Exact next action:** preserve the 10.4A ordinary-manipulation responsiveness contract while making the timing gate distinguish ordinary placement/settlement from deliberate ability choreography; then run the complete inherited + 10.4B matrix, inspect the final artifact, fix remaining defects, finalize continuity with green/merge/deploy SHAs, merge PR #7, and verify main Pages deployment.

Do **not** mark Pass 10.4B complete and do **not** begin Pass 10.4C until that gate is satisfied.
