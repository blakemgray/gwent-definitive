# Pass 11.2 — Physical Card / Targeting Architecture
## Locked implementation contract

**Status:** architecture locked before 11.2 runtime implementation  
**Branch:** `pass-11-golden-match`  
**Parent verified runtime head:** `d2fb0c3740a7cad0924c4bae44f11fc609fd2cc8`  
**Parent verification:** run #175 / `34654254329` — full success  
**Authority:** current user instruction → repository/green CI → `CONTINUITY.md` → `FUTURE_CONTINUITY.md` → `docs/PASS11_GOLDEN_MATCH_CONTRACT.md` → this document  
**Model:** GPT-5.6 Sol · High; no Astra escalation required at architecture lock

---

# 1. Outcome

11.2 establishes the minimum physical/readability truth needed by the Golden Match without reopening or replacing the closed Pass 10.3–10.4C architecture.

The player should be able to understand a board card, know what a manipulated card will target before release, receive forgiving behavior for an unambiguous row/global destination, receive conservative behavior for an ambiguous card-specific destination, and perceive one continuous card identity through direct manipulation and settlement.

North star:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

This phase is not an advanced physics engine. It is the smallest architecture that makes the current normal match physically truthful and legible.

---

# 2. Frozen authorities

## 2.1 Engine / action authority

The engine remains the only authority for legal actions, scoring, effects, choices, and outcomes.

11.2 never invents an action. It only chooses among the engine-provided `PLAY_CARD` actions already returned for the held/selected `iid`.

Tap, drag, keyboard, opponent, and restored state remain on the existing canonical commit boundary.

## 2.2 Pass 10.3 final geometry

`src/battlefield-ux.js` continues to own final reconciled:

- six-row order;
- row territory;
- unit-rail width;
- card final `left/top/width/height` packing;
- sparse-row centering;
- dense-row compression/exposure minimums;
- special-slot / score-well relationship.

11.2 may apply temporary presentation transforms while a target is being considered. It may not rewrite final packing or store alternate final geometry.

## 2.3 Pass 10.4A interaction ownership

`src/gesture-controller.js` continues to own:

- pointer capture and drag threshold;
- selection state;
- tap/drag parity;
- source placeholder/proxy creation;
- canonical commit dispatch;
- invalid return;
- interruption cancellation/reconciliation.

11.2 may provide a better intent decision and target-exposure presentation to that controller. It does not create a parallel gesture path.

## 2.4 Pass 10.4B/C consequence and feel ownership

Existing signature choreography, presentation queue serialization, semantic feedback, reduced-motion policy, and final reconciliation remain authoritative. 11.2 may harden card continuity at the handoff boundary, but does not reauthor signature mechanic choreography or final AV identity.

---

# 3. Source findings that drive the design

Current implementation evidence:

1. `renderUnit()` renders full art but only renders `.u-score` when effective power differs from base strength. Unmodified played units therefore show no current power at all.
2. Pass 10.3 currently packs board cards to roughly row-height-derived card geometry and guarantees centered/no-cutoff behavior at row counts 1, 2, 4, 8, and 12. This final packing must remain intact.
3. Current direct manipulation marks all legal engine destinations, but `targetAt()` uses one fixed 7 px rectangular expansion for row, weather/global, special-slot, and card-specific targets, then picks the nearest normalized center. That is not ambiguity-aware.
4. Decoy/card-specific targets are already individual board-card DOM elements, so predictive target clarity can be added without changing rules or final layout.
5. The existing drag/flight proxy already preserves perceived identity through ordinary hand→destination movement: the source becomes a placeholder, the engine commits, authoritative DOM renders, the final card is temporarily hidden, and the proxy flies into its final geometry. 11.2 should harden and measure this pattern rather than replace it wholesale.
6. `GwentPresentationQueue` already serializes and cancels presentation safely; viewport/background interruptions reconcile to engine truth.
7. `GwentFlipLayout` is keyed by `iid` and already animates non-held cards between pre/post geometry. This remains the generic row-response mechanism after actual state mutation; predictive pre-release target exposure must be transient and independent.

---

# 4. Architecture layers

## Layer A — board-card readability semantics

Runtime owner: existing `app.js` renderer + presentation CSS.

Every board unit must render:

- full existing artwork;
- an always-present current effective-power badge;
- a modified/unmodified semantic class or data attribute;
- stable `data-inspect-board=<iid>` identity;
- accessible text containing card name, current power, row, and meaningful ability state.

The displayed number is always `effectiveCardPower(...)`, not base strength. Modification styling may distinguish a changed value, but the value itself is never omitted.

This slice does **not** change Pass 10.3 final card packing.

## Layer B — pure intent resolver

Add a small pure geometry module, recommended path:

`src/interaction-intent.js`

It has no engine mutation, DOM mutation, animation, or state ownership. Inputs are live geometric samples supplied by the controller:

- pointer/release point;
- optional recent trajectory/velocity;
- engine-provided legal candidate descriptors;
- live destination rectangles;
- destination kind (`row`, `weather`, `global`, `special`, `target`);
- action count / ambiguity context.

Output is observational/decision data only:

- winning candidate or `null`;
- confidence;
- ambiguity/dominance margin;
- inside / forgiveness / reject classification;
- reason code;
- whether trajectory assistance was considered.

The resolver never creates a target not present in the engine action set.

### Intent classes

**Unambiguous singular row/weather/global**

- receives geometry-relative forgiveness outside the exact rectangle;
- release must still express destination intent;
- recent trajectory may contribute only if there is one meaningful legal destination;
- merely crossing a legal region never commits.

**Multiple row/special destinations**

- require one destination to be clearly dominant at release;
- overlapping/tied/low-margin states reject.

**Card-specific target (`target`, e.g. Decoy)**

- precision-first;
- no velocity-based target choice;
- requires a direct/high-confidence candidate and a meaningful dominance margin over any neighboring candidate;
- low confidence or overlap rejects cleanly rather than selecting arbitrarily.

### Geometry-relative rule

Forgiveness derives from the target rectangle dimensions and kind, with bounded min/max caps. Do not hard-code viewport coordinates. Canonical viewport changes should not require new targeting constants.

The module must expose pure functions usable by Node tests for trajectory/ambiguity matrices.

## Layer C — predictive target exposure

Recommended owner: a presentation-only module such as:

`src/target-exposure.js`

It receives the current winning card-specific target element/`iid` from the gesture controller and may:

- lift/scale/emphasize the candidate;
- set an explicit locked-target class/state;
- compute small reversible horizontal neighbor yields using live board-card rectangles;
- preserve the candidate's full artwork and power badge;
- clear immediately when confidence falls below threshold, selection changes, commit begins, invalid return begins, queue cancels, orientation/visibility interrupts, or reconciliation completes.

It may **not** mutate `left/top/width/height`, engine state, action lists, or Pass 10.3 pack data.

Neighbor yield is transform-only using CSS variables/classes. It is local, bounded, and reversible. It must never broad-reflow a row.

Reduced motion may use emphasis/outline/brightness with minimal or zero translation while preserving exact target clarity.

## Layer D — continuous perceived card identity

Do not introduce a global rules-bearing actor registry in 11.2.

Use a presentation-only **actor lease** concept around the existing source/proxy/final-element handoff:

1. Source card with `iid` is visible in hand.
2. Drag/tap creates one visible proxy clone carrying presentation identity metadata for that same `iid`; source becomes a placeholder.
3. Engine commits through the existing canonical path.
4. Authoritative final DOM renders from engine state.
5. Final destination card for the same `iid` is hidden while the proxy remains visible.
6. Proxy settles into the final destination geometry.
7. Proxy is removed and authoritative final element becomes visible in the same completion frame/cleanup boundary.
8. Cancellation/interruption leaves exactly one authoritative rendered representation after reconciliation.

This is already substantially true for ordinary hand→board play. 11.2 hardens it with explicit metadata, measurements, and temporal tests rather than replacing the working path.

For exchanges/effects where the semantic card changes zone differently (Decoy return, Medic revival, destruction), 10.4B choreography remains responsible for the mechanic consequence. 11.2 may add continuity assertions/evidence but does not duplicate mechanic choreography.

---

# 5. Gesture-controller integration contract

`gesture-controller.js` remains the integration owner.

Replace the fixed `targetAt(x,y)` decision with:

1. refresh live rectangles for the current `runtime.targets`;
2. pass target descriptors + point/trajectory to the pure resolver;
3. store the resolver result as the current candidate decision;
4. call `activeTarget()` with the winning legal target or `null`;
5. for card-specific target winners, inform target-exposure presentation;
6. on pointer-up, commit only the resolver-approved target;
7. otherwise use existing invalid-return path with zero engine mutation.

Tap behavior remains explicit: selection marks legal destinations; tapping a specific legal target commits that exact engine action. Ambiguous card-specific actions never auto-pick a target merely because the source card was tapped.

Keyboard behavior continues to commit only the explicitly focused legal destination.

---

# 6. Readability / density contract

Pass 10.3 final compositor remains unchanged during the first 11.2 readability slice.

Required immediately:

- current effective power always visible;
- power badge remains legible under 1/2/4/8/12-card stress states;
- art is not replaced by a token glyph;
- accessible name includes current effective power and row;
- modified power is visually distinguishable without hiding the number.

If later 11.2 evidence proves that static 10.3 card dimensions cannot meet recognizable-identity acceptance, address that through a narrowly scoped **presentation exposure** decision rather than silently rewriting the frozen compositor. Any proposed change to final card dimensions is an explicit architecture checkpoint and potential escalation trigger.

---

# 7. Intent acceptance invariants

The following become permanent regression expectations:

- exact interior release commits the corresponding legal destination;
- small near miss can commit for one unambiguous row/global destination;
- equivalent near miss does **not** arbitrarily commit a card-specific Decoy target;
- overshoot/flick can assist only a singular unambiguous destination;
- crossing a legal region then releasing elsewhere does not commit by crossing history alone;
- reversal before release follows final/recent intent, not stale earlier trajectory;
- overlapping candidate targets with insufficient dominance reject;
- crowded-row Decoy selects only the visibly locked candidate;
- invalid/ambiguous rejection leaves authoritative state byte-equivalent;
- tap and drag converge on the same engine action for the same explicit target.

Reason codes should be stable enough for QA/flight-recorder use, e.g. `direct_hit`, `forgiven_singular`, `trajectory_singular`, `ambiguous`, `low_confidence`, `outside`, `no_candidate`.

---

# 8. Predictive target exposure invariants

For a card-specific action:

- at most one target is in the strong locked state;
- locked card lifts/emphasizes before release;
- neighboring cards may yield only enough to expose it;
- candidate power/identity stays visible;
- moving away clears the lock and restores neighbors;
- no permanent change to 10.3 `left/top/width/height`;
- commit/invalid return/cancel/interruption clears all exposure state;
- no visual state survives when the engine action is no longer legal.

The original broad Decoy row reflow observed in live play is specifically rejected.

---

# 9. Continuity / temporal invariants

For ordinary hand→board play:

- no frame between source pickup and settled authoritative card may contain zero visible representation of the committed `iid`, except a reduced-motion crossfade boundary shorter than one rendered frame is not relied on for correctness;
- no frame should show two equally authoritative visible identities for the same `iid`;
- proxy-to-final handoff must survive animation cancellation;
- final reconciliation produces exactly one DOM representation in the engine-authoritative zone;
- visual failure cannot roll back or repeat the engine action.

QA should record source/proxy/final visibility and rectangles through the transition.

---

# 10. Implementation slices

## 11.2A — battlefield readability semantics

- always render current effective power on board units;
- add semantic modified/unmodified state and accessible card description;
- presentation styling for readable score badge at canonical density states;
- add browser assertions/screenshots at 1/2/4/8/12 cards;
- no final geometry change.

## 11.2B — pure intent resolver

- add pure geometry/ambiguity module;
- Node matrix for direct, near-miss, boundary, overlap, reversal, overshoot, singular vs. ambiguous target classes;
- integrate with controller without changing commit API;
- retain existing invalid-return semantics.

## 11.2C — predictive card-target exposure

- add candidate lock state for Decoy/card-specific targets;
- local transform-only neighbor yield;
- reduced-motion equivalent;
- browser QA for crowded target rows and leave/re-enter behavior.

## 11.2D — continuity hardening / temporal proof

- add explicit proxy/actor presentation identity metadata;
- instrument source/proxy/final handoff;
- temporal QA for ordinary play and invalid return, plus continuity observation around Decoy/Medic without duplicating 10.4B ownership;
- verify interruption leaves one authoritative representation.

11.4 later expands the flight recorder and trajectory/temporal campaign; 11.2 creates only the telemetry needed to prove its own invariants.

---

# 11. QA / release gates for 11.2

At minimum add permanent proof for:

- always-visible current effective power;
- accessible board-card identity/current power;
- unchanged 10.3 pack/center/no-cutoff invariants;
- intent matrix with state-digest equality on rejection;
- tap/drag action parity under new resolver;
- predictive Decoy target lock and ambiguous rejection;
- target exposure cleanup on cancel/commit/interruption;
- source/proxy/final `iid` continuity for ordinary placement;
- WebKit/iPhone-targeted interaction;
- reduced-motion equivalents;
- existing 10.3–10.4C gates unchanged.

Generated screenshots/temporal evidence must be manually inspected on the latest exact candidate head before an 11.2 closure decision.

---

# 12. Explicit non-goals

11.2 does not:

- change Gwent rules;
- create a second action path;
- replace Pass 10.3 final geometry;
- build a physics engine;
- implement broad whole-row avoidance ecology;
- choose ambiguous targets from velocity alone;
- reauthor 10.4B signature consequences;
- deliver final audio/haptic assets;
- create native iPhone haptics;
- reopen closed passes absent a demonstrated regression.

---

# 13. Model routing decision

The source boundaries are separable, so **GPT-5.6 Sol · High remains sufficient**.

Escalate to **GPT-6 Astra · Medium** only if implementation evidence shows that continuous perceived identity, live geometry, target ambiguity, and interruption safety cannot coexist without changing a frozen authority or creating competing state owners.

If escalation occurs, it is for the architecture decision only; implementation returns to Sol High immediately after the contract is resolved.

---

# 14. Exact next action

Implement **11.2A — battlefield readability semantics** first: always-visible effective power, semantic/accessibility metadata, and density-state QA, while leaving Pass 10.3 final geometry unchanged. Run targeted tests, then the full exact-head workflow before proceeding to 11.2B.
