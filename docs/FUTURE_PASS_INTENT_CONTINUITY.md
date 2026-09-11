# Gwent Definitive — Future Pass Intent Continuity

**Purpose:** preserve the product intent, sequencing logic, architectural guardrails, and handoff state for future development passes so work can resume without re-litigating settled decisions or accidentally optimizing for obsolete preview constraints.

**Project:** `blakemgray/gwent-definitive`

**Canonical product:** hosted JavaScript/PWA build on GitHub Pages. ChatGPT/Drive/no-JS preview compatibility is **not** a production requirement and must never reduce capability, architecture quality, interaction fidelity, or implementation speed.

---

## 1. Product doctrine that remains locked

1. **Classic Witcher 3 Gwent is the rules foundation.** The Definitive project modernizes the experience around the classic ruleset; it does not casually redesign the game itself.
2. **The engine is authoritative.** UI, motion, presentation, AI, cheats, replay, persistence, and future native shells consume engine state/actions rather than inventing parallel rules.
3. **Higher AI difficulty means smarter play, not hidden cheating.** Hidden information access is opt-in only through explicitly classified assists/cheats.
4. **Cheats are first-class but isolated.** Classic, Assisted, Modified, and Sandbox classifications must remain distinguishable.
5. **Mobile is a primary target.** iPhone landscape gameplay, touch-first interaction, safe-area awareness, offline/PWA behavior, and eventual native-grade polish are core design constraints.
6. **The battlefield remains geometry-driven.** Functional lane/special/weather/leader/hand geometry comes from deterministic DOM/CSS contracts. Generated imagery may contribute atmosphere/material only; it never defines gameplay geometry.
7. **Arun Sundaram's `gwent-classic` remains the behavioral/card-data oracle and compatibility reference, not the final architecture.**

---

## 2. Current handoff baseline

The project has already crossed the infrastructure threshold from prototype/preview work into a real hosted JS application.

Established foundation includes:

- deterministic, UI-independent rules engine;
- migrated 216-card catalog with stable IDs;
- source-parity coverage for card abilities, leaders, factions, weather, Horn, Scorch, Decoy, Medic, Spy, Tight Bond, Muster, pass/round flow, etc.;
- canonical hosted PWA deployment through GitHub Pages;
- exact battlefield geometry recovery after the rejected independent-board experiment;
- six functional combat rows, weather band, special wells, leader/hand/score regions, and responsive field composition;
- direct-manipulation interaction foundation in **Pass 10.4A**;
- persistence/service-worker infrastructure and CI regression gates.

The application is therefore **not** a throwaway prototype. Future passes should extend the same engine/state/presentation architecture unless a measured failure proves a redesign is necessary.

---

## 3. Pass 10.4A — direct manipulation: intent and stop condition

Pass 10.4A is the interaction-foundation pass. Its purpose is to make playing a card feel like manipulating a physical object while keeping the engine fully authoritative.

Locked 10.4A behaviors:

- tap-select + tap-destination;
- direct Pointer Events drag;
- legal destinations sourced only from engine `legalActions`;
- one canonical commit path for tap and drag;
- drag proxy + source placeholder;
- FLIP hand/row redistribution;
- invalid-drop return with **zero state mutation**;
- secondary inspector intent instead of first-tap interception;
- keyboard/Escape accessibility paths;
- reduced-motion equivalent path;
- touch/native-drag conflict suppression;
- presentation-aware bot turn gating;
- durable stale-feedback suppression;
- semantic destination snapshots for Weather, Horn, Decoy, and disappearing/round-transition plays;
- disposable presentation failures: committed engine state survives presentation exceptions and transient UI is cleaned up;
- save/restore continuity through interrupted presentation.

### 10.4A is complete only when

The latest PR head is green across the full CI gate, archived QA artifacts show no interaction-state ambiguity or presentation leaks, WebKit/iPhone-targeted paths pass, and no test expectation is merely being loosened to hide a real behavioral regression.

**Do not merge 10.4A just because the interaction looks good in one happy-path match.** The merge standard is engine parity + lifecycle safety + touch reliability + cleanup reliability.

---

## 4. Immediate future pass intent

### Pass 10.4B — Signature Ability Choreography & Effect Presentation

**Provisional label, locked intent.** This is the first pass after the direct-manipulation foundation is stable.

Goal: make consequential Gwent abilities readable, satisfying, and spatially understandable **without changing their rules semantics**.

Priority effect families:

- Spy: source ownership -> opponent row -> draw response;
- Medic: card play -> graveyard-choice state -> revived-card travel/resolution;
- Decoy: exact swap relationship between Decoy and returned unit;
- Muster: initiating card -> summoned cohort -> row redistribution;
- Tight Bond: played card -> affected peers -> score amplification cue;
- Scorch / row Scorch: target discovery -> destruction ordering -> removal/reflow;
- Weather / Clear Weather: battlefield-state transition with row-level legibility;
- Commander's Horn / leader Horn: special-zone occupancy and row-strength amplification;
- leader abilities: leader source -> affected zone/cards -> resulting state;
- round cleanup: cards leaving rows should read as a coherent game-state transition rather than a sudden DOM reset.

Interaction and motion principles:

- animation must explain causality, not merely decorate;
- source, destination, affected objects, and result should remain visually traceable;
- no animation is allowed to become rules authority;
- presentation can be interrupted/cancelled while committed state remains correct;
- bot/opponent mutation must not race ahead of player-readable presentation;
- effects must degrade cleanly under `prefers-reduced-motion`;
- iPhone/WebKit behavior remains a first-class test target;
- preserve the Pass 10.3 geometry contract and Pass 10.4A canonical input path.

**Do not** use 10.4B as an excuse to build cinematic excess. The target is Witcher-tabletop tactility + modern iOS clarity.

---

## 5. Next major milestone — Pass 11: Complete Normal Match

After the interaction/effect foundation is trustworthy, the next major milestone is a **complete normal Gwent match from opening draw through final match result**, with no developer-only shortcuts required for ordinary play.

Pass 11 should deliver, end to end:

- legal deck selected through a real player-facing path;
- opening draw;
- proper mulligan;
- normal hand interaction using the 10.4A direct-manipulation system;
- all effect-choice dialogs/states required by the selected legal decks;
- complete player/bot turn loop;
- pass behavior;
- round resolution;
- best-of-three life/round progression;
- final match victory/defeat state;
- restart/rematch;
- save/resume at legitimate lifecycle points;
- no dependency on test-only or QA state injection.

The first Pass 11 success criterion is **one production-quality legal matchup that can be played start-to-finish repeatedly and reliably**. Breadth across all factions/decks follows once the normal-match spine is genuinely complete.

---

## 6. Expansion after the complete-match spine

Once Pass 11 is stable, broaden capability in this order unless new evidence justifies a change:

1. full legal deck builder and legality UI across the 216-card catalog;
2. unrestricted faction / leader / deck selection;
3. engine-native canonical mulligan across all supported decks;
4. complete effect-choice UX across the full catalog;
5. AI ladder from Novice/Standard through Veteran/Master/Grandmaster with explicit `AIKnowledgeState != GameState` discipline;
6. robust save/resume and replay/history UX;
7. assisted/modified/sandbox surface expansion and granular cheat menu;
8. full offline asset localization so production no longer depends on upstream raw GitHub art URLs;
9. final PWA/iOS polish: install experience, haptics/native shell path, accessibility, battery/performance tuning, orientation/state restoration.

The order is intentional: **finish the playable match spine before maximizing breadth.**

---

## 7. Architectural non-negotiables for every future pass

Future work must preserve these invariants unless a deliberate architecture decision explicitly replaces them:

- `GameState` is authoritative.
- `legalActions` determines what can be played and where.
- presentation never mutates rules independently.
- tap and drag resolve through the same canonical action commit path.
- persisted state represents committed engine state, not an in-progress animation frame.
- motion/presentation failures are disposable and must fail closed around the committed state.
- AI/bot turns must not race player-visible presentation when sequencing matters.
- transient interaction DOM must cleanly disappear after completion, invalid drop, cancellation, visibility interruption, orientation/page lifecycle events, or exceptions.
- battlefield functional geometry remains deterministic and testable.
- no generated image is permitted to become the source of truth for lane geometry.
- mobile/touch/WebKit regressions are release blockers, not “later polish.”
- no-JS preview compatibility is never allowed to constrain the production architecture.

---

## 8. Pass design method

Each new pass should begin with a short contract before implementation:

**Intent** — what player experience or product capability is being created.

**Authority** — which existing engine/state/geometry systems remain source of truth.

**Non-goals** — what is intentionally deferred.

**Failure modes** — what can go wrong under cancellation, density, touch, persistence, round transitions, and effect choices.

**QA gates** — tests that prove the pass works physically and semantically, not merely visually.

**Merge condition** — explicit evidence required before the branch lands on `main`.

When a pass changes interaction or presentation, include physical browser automation rather than relying only on unit tests.

---

## 9. QA philosophy

Regression evidence should remain layered:

- engine assertions;
- catalog/full-rules fuzzing;
- PWA/deployment graph validation;
- geometry contract validation;
- browser interaction tests;
- touch/WebKit tests;
- lifecycle interruption tests;
- persistence/restore checks;
- stress/density trials;
- archived visual QA for states that are difficult to assess numerically.

A test may be corrected when its expectation is demonstrably stale, but a failing test should first be treated as a possible product defect. Preserve that discipline.

---

## 10. Continuity trigger for a future session

A future development session should be able to resume with:

> Continue Gwent Definitive from `docs/FUTURE_PASS_INTENT_CONTINUITY.md`. Inspect the current `main` branch, open PRs, latest CI, and the last merged pass before changing code. Preserve the locked engine/geometry/direct-manipulation architecture. Finish any incomplete pass against its merge condition first; otherwise begin the next pass in the sequence defined here. Do not optimize for ChatGPT/no-JS preview compatibility.

If branch reality conflicts with this document, **inspect the actual merged code, PR history, QA artifacts, and newer explicit user instructions** before proceeding. This continuity piece preserves intent; it does not override later evidence or later direct instruction.
