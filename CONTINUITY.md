# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** this is the permanent handoff document for the project. It exists so a new ChatGPT conversation, a new development pass, or a different implementation context can recover the project accurately without depending on chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** https://blakemgray.github.io/gwent-definitive/  
**Default branch:** `main`  
**Current production/main head at this update:** `731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`  
**Last known green main workflow:** `Verify and Deploy Gwent Definitive` run `34543353535` / run #62  
**Last updated:** 2026-09-10  
**Current completed implementation milestone:** **Pass 10.4A — Direct Manipulation**  
**Next implementation milestone:** **Pass 10.4B — Gameplay Choreography**

---

# 0. Mandatory continuity protocol

This file is authoritative for project handoff and must be read before beginning any new pass.

For future work, use this precedence when sources disagree:

1. Current explicit user instruction.
2. Current repository code and green CI behavior.
3. This `CONTINUITY.md` file.
4. Current pass contracts/specifications under `docs/` and `config/`.
5. Older archived pass artifacts.
6. Chat memory or summaries.

Do **not** silently rewrite classic Gwent rules or project doctrine based on generic assumptions. If a rule or product decision is uncertain, inspect the current engine, Arun Sundaram source, pass contracts, and tests before changing behavior.

Every pass must update this file before merge. At minimum, update:

- the current production/main head and latest green workflow;
- the current completed milestone and next milestone;
- the pass ledger entry;
- branch / PR / merge SHA information;
- implementation changes;
- QA evidence and regression status;
- newly locked decisions;
- known debt / unresolved items;
- any superseded decisions, with an explicit note rather than deleting history.

A pass is not continuity-complete until this file is updated.

---

# 1. Product mission

Build the definitive modern implementation of **classic The Witcher 3 Gwent**, using Arun Sundaram's `gwent-classic` project as the primary behavioral/reference oracle while replacing the old monolithic browser implementation with a deterministic, testable, mobile-first architecture.

The product should feel like classic TW3 Gwent, not a generic card game and not modern standalone Gwent. Modernization is welcome around presentation, usability, accessibility, AI quality, persistence, tooling, and deployment, but the baseline game identity must remain classic.

Working product name:

**Gwent Classic — Definitive Edition**

Core product modes:

- **Classic Match** — clean classic rules and legal play.
- **Custom Match** — classic base with explicit configurable modifiers.
- **Sandbox** — unrestricted experimentation / cheats / testing.

Match classifications:

- `CLASSIC`
- `ASSISTED`
- `MODIFIED`
- `SANDBOX`

Statistics must not blur those categories together.

---

# 2. Locked product doctrine

These decisions are considered durable unless explicitly superseded in a later pass.

## 2.1 Rules doctrine

- Preserve classic TW3 Gwent rules and card behavior as the baseline.
- Arun Sundaram's implementation is the behavior oracle and compatibility reference, not the runtime architecture to copy wholesale.
- Engine rules must remain deterministic and UI-independent.
- Presentation may never decide legality or game outcomes.
- AI difficulty must come from better decision quality, not hidden-information cheating.
- Any AI access to hidden information must be explicit and classified as an assist/modifier if ever enabled.

## 2.2 Interaction doctrine

- Production is **JS-first** and hosted; ChatGPT/Drive preview limitations must never constrain architecture or capability.
- Primary mobile target is iPhone landscape gameplay.
- Menus, library, deck management, and settings may be portrait-oriented; gameplay remains landscape-first.
- Battlefield interaction uses **hybrid placement**:
  - tap card → tap legal destination;
  - direct drag to legal destination.
- Both interaction methods dispatch the same canonical validated action.
- Card inspection is secondary intent; it must not steal the first play interaction.
- Invalid gestures must return visually without mutating engine state.
- Reduced-motion mode must preserve equivalent gameplay clarity.

## 2.3 Visual doctrine

Target visual language:

- The Witcher 3 atmosphere;
- premium physical tabletop;
- modern iOS legibility and interaction discipline;
- dark wood, iron, parchment, leather, aged brass/gold, ivory text;
- restrained weather/particle effects;
- no generic free-to-play / monetization visual language.

Functional geometry must be deterministic DOM/CSS/SVG logic, not image-generation output.

Generated imagery may be used for atmosphere/material only, never as the source of functional battlefield geometry.

## 2.4 Battlefield doctrine

The six combat rows are structurally non-negotiable:

Opponent:
1. Siege
2. Ranged
3. Close

Center:
4. Weather band

Player:
5. Close
6. Ranged
7. Siege

Each player has three row-special affordances. The board also requires leader, score, pass/turn, hand, and supporting information zones.

The **Pass 10.3 Battlefield Geometry Contract v2** remains the current geometry authority. Later motion/presentation passes must animate **around** its final positions, not replace its layout math.

---

# 3. Primary source/reference oracle

Primary reference repository:

https://github.com/asundr/gwent-classic

Important source files:

- `gwent.js`
- `cards.js`
- `abilities.js`
- `factions.js`
- `decks.js`
- `common.js`
- `style.css`
- `index.html`
- `img/`
- `svg/`
- `sfx/`

Use Arun as:

- rules oracle;
- card database source;
- ability behavior reference;
- faction/leader reference;
- compatibility/import reference.

Do not use Arun as justification to re-introduce monolithic UI/rules coupling.

Licensing note:

- Arun repository code is MIT + Commons Clause.
- CD PROJEKT RED game IP, card art, music, branding, and other assets are a separate licensing concern.
- Current project should be treated as a personal/noncommercial fan project unless asset/branding rights are separately addressed.

Current card/board art still depends in part on upstream raw GitHub resources from Arun. Long-term production hardening should localize permitted assets so the PWA does not depend on third-party runtime availability.

---

# 4. Canonical architecture

The target architecture is intentionally layered:

```text
Card DB / rules data
        ↓
GameState
RuleEngine
ActionEngine
EffectEngine
ScoreEngine
        ↓
AI / Cheats / Replay / Undo
        ↓
Presentation API / semantic event layer
        ↓
Battlefield UX / gestures / animation / audio / future haptics
        ↓
Hosted web app / PWA / future native-quality iOS shell
```

Key architectural rules:

- deterministic state transitions;
- stable permanent card IDs;
- stable per-match instance IDs (`iid`);
- semantic action/event logs;
- immutable-ish snapshots suitable for history / replay / undo;
- one rules path regardless of input method;
- storage abstraction rather than UI code writing arbitrary state;
- animation is disposable presentation over authoritative committed state;
- interruption or presentation failure must reconcile immediately to engine truth.

Important runtime files as of Pass 10.4A:

- `src/gwent-engine.js` — core deterministic engine.
- `src/cards-catalog.js` — full migrated card catalog.
- `src/storage.js` — persisted match state abstraction.
- `src/battlefield-ux.js` — Pass 10.3 battlefield compositor and reconciliation.
- `src/motion-tokens.js` — shared motion timing/easing/reduced-motion policy.
- `src/presentation-queue.js` — serialized, cancellable presentation transaction layer.
- `src/presentation-events.js` — semantic presentation event derivation.
- `src/flip-layout.js` — FLIP-style redistribution around authoritative final layout.
- `src/gesture-controller.js` — tap/drag direct-manipulation controller.
- `src/interaction-turn-gate.js` — prevents bot state mutation during active player presentation.
- `app.js` — product shell / match integration.
- `battlefield-ux.css` — battlefield visual/layout treatment.
- `direct-manipulation.css` — interaction-state visuals.

---

# 5. Engine and catalog baseline

The full migrated catalog contains **216 definitions / 216 stable IDs**.

Earlier parity work established:

- 216/216 migrated card definitions;
- 44/44 known ability tokens represented;
- 22/22 leaders represented;
- 5/5 factions represented;
- full engine support broader than the currently exposed product UI.

Implemented engine behavior includes, among other classic mechanics:

- ordinary unit placement;
- Spy;
- Tight Bond;
- Muster;
- Medic with pending choice;
- Decoy;
- Weather and Clear Weather;
- Commander's Horn;
- row/leader Horn lifecycle;
- Scorch and row-specific Scorch variants;
- Hero handling;
- pass / auto-pass;
- round resolution;
- faction behavior;
- leader actions represented in engine data;
- deterministic legal action generation.

Pass 9 also fixed important parity defects including:

- leader Horn occupancy of row-special territory;
- blocking incompatible Horn/Mardroeme occupancy;
- automatic pass on exhaustion;
- dangling-else legality problems around Scorch/Decoy.

Do not assume that full engine breadth means the entire 216-card catalog is already exposed through a polished unrestricted product flow. It is not yet.

---

# 6. Cheats / assists doctrine

Cheats are a first-class subsystem, not scattered debug shortcuts.

Planned/partially implemented assist/cheat concepts include:

- reveal opponent hand;
- reveal opponent deck;
- reveal next draw;
- reveal AI intent;
- draw specific card;
- select/spawn card;
- duplicate card;
- return/revive card;
- clear/apply weather;
- apply Horn;
- restore leader;
- restore lives;
- force pass;
- switch turn;
- undo / redo;
- save / load / restart;
- ignore deck restrictions;
- custom starting hand;
- custom lives;
- favorite cheats.

Clean Classic statistics must remain separate from assisted/modified/sandbox outcomes.

---

# 7. Deck builder target

Long-term deck UI target is mobile-first and segmented:

`COLLECTION | DECK | ANALYSIS`

Required eventual capabilities:

- search;
- faction/type/ability filters;
- legality feedback;
- deck composition analytics;
- saved decks;
- full 216-card access where legal;
- leader selection;
- Arun legacy JSON import;
- stable permanent IDs so imports are durable.

The full production deck builder is **not complete** as of Pass 10.4A.

---

# 8. AI doctrine and current status

Target difficulty ladder:

- Novice
- Standard
- Veteran
- Master
- Grandmaster

Formal design principle:

```text
AIKnowledgeState != GameState
```

AI should reason only from information legitimately available at its selected rules/difficulty level.

Current runtime still uses an **Integration Bot** / controlled bot behavior for product integration. It is sufficient for match-loop and interaction testing but is not the final strategic Veteran/Master/Grandmaster AI system.

---

# 9. iPhone / PWA target

Production target is hosted JS/PWA first, with native-quality iPhone behavior.

Locked mobile direction:

- landscape gameplay;
- portrait-friendly menus/decks/library/settings;
- touch-first controls;
- safe-area handling;
- offline-first PWA behavior;
- save/resume;
- future haptics through semantic presentation events;
- no mandatory drag — tap placement always remains a first-class equivalent;
- no portrait gameplay requirement for v1.

The canonical deployment URL is:

https://blakemgray.github.io/gwent-definitive/

The old ChatGPT/Drive-preview-safe no-JS vertical slice is **not** a production requirement and must not be allowed to limit the canonical runtime.

---

# 10. Deployment / repository workflow

Repository:

`blakemgray/gwent-definitive`

GitHub Pages is configured through GitHub Actions.

Canonical workflow:

`.github/workflows/deploy-pages.yml`

Current policy:

- feature work occurs on a pass branch;
- open PR to `main`;
- run engine, browser, interaction, geometry, PWA, and WebKit gates;
- inspect visual QA artifacts where applicable;
- merge only after the pass gate is green;
- main push re-runs verification;
- deploy job executes only after `verify` succeeds;
- Pages deployment becomes the canonical build;
- update this continuity file in the same pass before merge.

Current main head at this update:

`731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`

Current verified successful main workflow at this update:

- Workflow: `Verify and Deploy Gwent Definitive`
- Run ID: `34543353535`
- Run number: `62`
- Conclusion: `success`

---

# 11. Pass history / running ledger

This ledger is chronological. Do not delete prior pass entries when later work supersedes them; mark the supersession explicitly.

## Pass 5 — Initial interactive prototype

**Status:** historical / superseded.

The first interactive JS prototype exposed a critical environment problem: ChatGPT iPhone HTML preview suppressed scripts, so the prototype appeared nonfunctional even when the JS build itself was valid.

Lesson retained:

- preview environments are not production architecture requirements.

## Pass 5B — no-JS/hash preview workaround

**Status:** historical / intentionally abandoned as a production target.

A no-script/hash/native-control fallback was built so the ChatGPT iPhone preview could navigate without JS.

This was useful diagnostically but later became a constraint on progress. The project subsequently locked a JS-first hosted strategy.

## Pass 6 — art + inspector investigation

**Status:** historical.

Key issues discovered:

- remote GitHub art was blocked in some preview contexts;
- a transformed `<details>` ancestor broke `position: fixed` inspector behavior in WebKit.

## Pass 6.1 — inspector recovery / explicit assist states

**Status:** historical foundation.

Changes included:

- viewport-level inspector;
- visible actions;
- explicit cheat/assist states;
- separate deck tabs;
- remote art with fallback;
- authored Thaler/Spy demonstration path.

## Pass 7 — deterministic engine foundation

**Status:** foundational and retained.

Major architecture shift:

- deterministic engine separated from UI;
- stable instances;
- seeded RNG;
- semantic logs;
- legal action generation;
- turn/pass/round resolution;
- Spy, Bond, Muster, Medic, Decoy, Weather/Clear, Horn, Scorch, Hero, factions;
- assisted view/classification;
- cheat draw;
- history session with undo/redo.

QA at the time included:

- 30/30 targeted tests;
- 250 fuzz trials;
- 6,482 actions;
- 0 invariant failures.

## Pass 8 — full catalog migration + UI integration

**Status:** foundational and retained.

Major outcomes:

- real Drive assets integrated;
- engine connected to UI;
- full Arun catalog migrated;
- 216 definitions / 216 IDs;
- 0 semantic migration mismatches;
- weather/Horn lifecycle fixes;
- settings wired.

QA at the time included:

- 34/34 targeted tests;
- 250 fuzz / 6,482 actions;
- 216/216 catalog;
- 36/36 browser integration checks.

## Pass 9 — source-parity rules completeness

**Status:** foundational and retained.

Major outcomes:

- leader Horn occupies row special territory correctly;
- leader Horn blocks conflicting Horn/Mardroeme use;
- auto-pass on exhaustion;
- Scorch/Decoy legality fixes;
- source parity coverage expanded across ability/faction/leader surface.

QA at the time included:

- 131/131 deterministic assertions;
- 216/216 catalog;
- 44/44 ability tokens;
- 22/22 leaders;
- 5/5 factions;
- 250 core fuzz / 6,008 actions;
- 600 full-catalog fuzz / 14,550 actions + 532 chooser resolutions;
- 20,558 combined fuzz actions;
- 0 invariant failures;
- 42/42 browser integration checks.

Archived Drive pass folder:

`PASS_09_RULES_COMPLETENESS`

Drive folder ID:

`1QLL8cePMa7kko3WZtRGYQfbMOdanF7sH`

## Pass 10 — first bespoke battlefield attempt

**Status:** rejected / do not reuse functional geometry.

The first new battlefield concept attempted to replace the old board art with a bespoke visual board. It failed because the background/board artwork was not synchronized to live DOM geometry and visually appeared to omit/merge the required three player rows.

Rejected generated board concept must not be defended or reused as functional layout authority.

Critical lesson:

**HTML/DOM geometry is authoritative. Decorative imagery is subordinate.**

## Pass 10.1 — battlefield recovery

**Status:** successful recovery foundation.

The board was rebuilt around a deterministic geometry layer and live DOM row model.

Authoritative row model:

```js
[
  ['p2','siege'],
  ['p2','ranged'],
  ['p2','close'],
  ['weather',null],
  ['p1','close'],
  ['p1','ranged'],
  ['p1','siege']
]
```

Key recovery rules:

- exact frozen 852×393 baseline used for validation;
- deterministic geometry layer immediately precedes live board;
- shared layout variables drive visual and functional layers;
- CSS/image atmosphere only;
- 6 combat rows + 1 weather band + 6 special wells are structural requirements;
- geometry drift tolerance targeted at ≤2px and achieved at 0px in the final recovery gate.

QA included:

- 35/35 main page tests;
- 6 combat rows confirmed;
- opponent 3 / player 3 / weather 1;
- six live special slots;
- six geometry special wells;
- 0px measured geometry drift;
- empty/populated/Thaler/Bond/Weather/leader Horn/Medic/Decoy/cheat/assist states;
- existing engine regression retained.

Legacy Drive folder:

`PASS_10_1_BATTLEFIELD_RECOVERY`

Drive folder ID:

`1BHmrfOaW74GmCm7A9X1UtpnsENLQLzNW`

## Hosted infrastructure milestone — canonical JS/PWA

**Status:** complete and retained.

User explicitly rejected preview-friendly compromises that sacrificed capability.

Production strategy changed to:

- JS-first hosted web app / PWA;
- GitHub repository as source of truth;
- GitHub Pages as canonical runtime;
- stable URL updated continuously instead of generating isolated preview artifacts.

Canonical URL:

https://blakemgray.github.io/gwent-definitive/

The initial deployment proved:

- real JS engine-backed navigation;
- menu → Play → Quick Start → mulligan → battlefield;
- 10-card opening hand;
- six row battlefield;
- inspector;
- multi-card integration match;
- service worker / manifest / installable PWA shell.

## Pass 10.2 — continuity gap

**Status:** no dedicated standalone pass dossier currently present in the canonical repository.

There is intervening hardening/integration history between 10.1 and 10.3, but no canonical `PASS10_2_*` document is currently available in the repo. Do **not** invent a false 10.2 description.

If future repository archaeology reconstructs a real Pass 10.2 from commits/artifacts, add the verified details here.

## Pass 10.3 — Battlefield UX Architecture / Geometry Contract v2

**Status:** production visual/layout baseline; remains authoritative under 10.4 animation work.

Core changes:

- functional row territory separated from visible card rail;
- mathematically centered row packs;
- first/last card clipping protection;
- sparse rows centered naturally;
- dense rows compress only when necessary;
- ten-card hand uses an independent centered compositor;
- explicit information hierarchy for turn, pass, score, row score, cards, hand, weather, leader, tertiary counts;
- weather state reinforced on affected rows;
- narrower inspector so board context remains visible;
- six-row requirement preserved.

Primary contract:

`docs/PASS10_3_BATTLEFIELD_UX_CONTRACT.md`

Geometry config:

`config/battlefield-geometry.json`

Important rule for every later pass:

**10.3 owns final geometry. Animation may interpolate between states but may not substitute its own battlefield positioning system.**

## Pass 10.4R — Interaction & Motion Research

**Status:** complete specification pass.

Purpose:

Lock interaction and motion doctrine before implementation.

Primary artifacts:

- `docs/PASS10_4R_INTERACTION_MOTION_RESEARCH.md`
- `docs/PASS10_4R_CHOREOGRAPHY_MATRIX.md`
- `docs/PASS10_4R_IMPLEMENTATION_BLUEPRINT.md`
- `docs/PASS10_4R_SOURCE_NOTES.md`
- `config/interaction-motion-contract.json`

Locked implementation decisions:

- hybrid tap + drag;
- same canonical GameAction for both;
- Pointer Events + pointer capture;
- no native HTML drag-and-drop;
- Web Animations API for most presentation motion;
- requestAnimationFrame mainly for pointer-following;
- FLIP redistribution around 10.3 final geometry;
- engine commits before animation;
- animation is interruption-safe/disposable;
- semantic choreography defined for Scorch, Muster, Spy, Horn, Weather, Medic, Decoy, Bond, pass, and round resolution;
- audio/future haptics subscribe to semantic events rather than rules logic;
- reduced-motion substitutions retain mechanical clarity.

Implementation sequence locked by 10.4R:

1. **10.4A — Direct Manipulation**
2. **10.4B — Gameplay Choreography**
3. **10.4C — Feel / Accessibility / Performance**

## Pass 10.4A — Direct Manipulation

**Status:** complete, merged, green on main.

PR:

`#5 — Pass 10.4A — Direct Manipulation`

Merged PR head:

`cf1edb24c044c0af1ce64f2300ad59d43daa736d`

Merge commit:

`7367cd69042d93f0f895bc9150f0207df30f8f1c`

Follow-on WebKit gate stabilization merged to main:

`731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`

### Runtime implementation

10.4A added the direct-manipulation foundation without changing classic rules or 10.3 final geometry:

- tap-select → tap legal destination;
- direct Pointer Events drag;
- scoped pointer capture;
- 8px drag activation threshold;
- legal destinations generated exclusively from engine `legalActions`;
- one canonical `commitAction` path for tap and drag;
- source placeholder during drag;
- finger-following drag proxy;
- FLIP hand/row redistribution;
- invalid-drop return with zero engine mutation;
- secondary inspector behavior;
- non-color legal target cues;
- keyboard destination activation;
- Escape cancellation;
- reduced-motion equivalent path;
- native image-drag suppression;
- spatially scoped synthetic-click suppression after drag/long press;
- presentation-aware bot turn gate;
- stale completion toast dismissal on fresh interaction;
- semantic destination snapshots for effects where final board DOM may differ from the selected destination;
- disposable presentation-failure recovery;
- PWA precache/deployment graph updated for interaction runtime.

### Presentation safety doctrine proven in 10.4A

The engine commits first. Presentation runs afterward.

If presentation fails:

- committed engine state remains authoritative;
- persisted state remains committed;
- transient DOM is cleaned;
- the presentation queue releases;
- bot turn gating releases only after reconciliation;
- no animation exception may roll back a valid rules result.

### 10.4A QA gate

Coverage includes:

- engine regression;
- catalog fuzz invariants;
- PWA validation;
- 10.4R motion-contract validation;
- direct-manipulation architecture contract;
- frozen 10.3 battlefield density/centering/geometry regression;
- 14px+ exposed hit geometry for overlapped hand cards;
- tap/drag state parity;
- overlap drag;
- invalid rollback;
- interruption safety;
- reduced motion;
- real Chromium touch injection;
- 1 / 3 / 8 / 12-card animated reflow;
- 64 baseline physical parity trials;
- 10 destination-family variants:
  - own row;
  - opponent Spy row;
  - Weather;
  - global Scorch;
  - all three Horn sockets;
  - exact Decoy target;
  - both Agile destinations;
- presentation-aware bot gating beyond the old bot delay;
- cancellation/reconciliation;
- 256 additional physical parity trials = 512 committed interactions across synthetic 0–15-card row densities;
- semantic landing continuity;
- stale-feedback suppression;
- last-card auto-pass / round transition;
- visibility interruption;
- persisted Continue Match restore;
- injected presentation failure recovery;
- WebKit/iPhone-targeted touch tap;
- WebKit drag parity;
- invalid return cleanup;
- WebKit reduced-motion checks.

The final WebKit gate was stabilized by waiting on the actual requestAnimationFrame-driven active-target state transition rather than assuming a fixed wall-clock delay under CI load.

Main workflow run #62 completed successfully after that stabilization.

### 10.4A non-goals

10.4A intentionally does **not** complete signature effect choreography. It establishes the manipulation/presentation transaction substrate on which 10.4B is built.

---

# 12. Current product status after Pass 10.4A

The project now has:

- hosted canonical JS/PWA infrastructure;
- deterministic engine;
- full 216-card migrated catalog beneath the product UI;
- source-parity rules baseline;
- stable six-row battlefield geometry;
- centered/compressed hand and row compositors;
- save/Continue Match path;
- direct manipulation with tap/drag parity;
- browser interruption safety;
- reduced-motion path;
- semantic presentation event layer;
- presentation transaction queue;
- FLIP redistribution;
- iPhone/WebKit interaction coverage;
- CI-protected deployment.

The project does **not yet** have a complete production-ready unrestricted game surface.

Still incomplete / major remaining work:

- unrestricted full legal deck builder across all 216 cards;
- polished faction/leader/deck selection across the full catalog;
- canonical end-to-end mulligan UX beyond the controlled integration flow;
- complete effect-choice UX across all legal deck combinations;
- final Veteran/Master/Grandmaster AI;
- full production match victory/rematch shell across unrestricted decks;
- full signature animation/choreography language;
- final sound design / future haptics;
- final accessibility/performance pass;
- local ownership/caching strategy for permitted art instead of upstream raw-GitHub dependency;
- native-quality install/offline polish.

---

# 13. Next pass — Pass 10.4B Gameplay Choreography

**Next action after this continuity bootstrap:** begin Pass 10.4B from the approved 10.4R choreography matrix and implementation blueprint.

10.4B should build on 10.4A rather than rewrite it.

Primary objective:

Turn semantic game events into mechanic-specific, readable, interruption-safe presentation sequences while preserving deterministic engine-first state and Pass 10.3 final geometry.

Expected focus areas from the locked 10.4R plan:

- Spy choreography;
- Muster cascade/reveal language;
- Tight Bond response;
- Weather application/clear transition;
- Horn activation;
- Scorch targeting/destruction emphasis;
- Medic revive/selection continuity;
- Decoy swap choreography;
- leader action presentation;
- pass state transition;
- round-end resolution;
- life/gem loss / round winner feedback;
- score transition clarity;
- bot action readability;
- event ordering through `presentation-events.js` and `presentation-queue.js`;
- reduced-motion equivalents for every mechanic-specific sequence.

Non-negotiables for 10.4B:

- do not change classic rules merely to make animation easier;
- do not create a second action path;
- do not let animation own game state;
- do not break tap/drag parity;
- do not replace 10.3 geometry;
- do not permit bot mutation in the middle of unresolved player presentation;
- do not regress interruption/save/restore safety;
- add targeted QA for every newly choreographed semantic effect.

---

# 14. Known archive / Drive context

GitHub is now canonical, but earlier source/reference material also exists in Drive.

Reference folder:

`Gwent Classic - Arunsundaram`

Drive folder ID:

`1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`

Legacy product root:

`Gwent Definitive - blakemgray`

Drive folder ID:

`1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`

Use those archives for historical comparison only. Current development should be based on the GitHub repository unless explicitly instructed otherwise.

---

# 15. Continuity update template for every future pass

Append or update a ledger section using this structure:

```md
## Pass X — Name

**Status:** planned | active | blocked | complete | merged | superseded

**Goal:**

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

Then update the top snapshot and the `Current product status` / `Next pass` sections.

---

# 16. New-chat bootstrap instruction

When starting a new ChatGPT conversation for this project, use this request pattern:

> Read the repository's `CONTINUITY.md` first, then inspect the current main branch, active pass branch/PR if one exists, relevant pass contracts, and latest CI. Continue from the exact handoff state. Update `CONTINUITY.md` as part of the pass before merge.

That instruction plus this file should be sufficient to preserve continuity without copying large chat transcripts from one conversation to the next.

---

# 17. Current handoff

**Pass 10.4A is complete and green on main.**

The direct-manipulation substrate is now stable enough to support mechanic-specific presentation.

**Next development step: Pass 10.4B — Gameplay Choreography.**

Begin from the 10.4R choreography matrix/blueprint, preserve 10.3 geometry, preserve the 10.4A canonical commit/presentation path, and add semantic effect sequences one mechanic family at a time with regression coverage.
