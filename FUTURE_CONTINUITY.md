# Gwent Classic — Definitive Edition
## Forward Roadmap Continuity

**Purpose:** preserve the intended future development sequence and established post-Pass-11 requirements across ChatGPT conversation limits and implementation handoffs.

This file is the **forward-roadmap companion** to [`CONTINUITY.md`](CONTINUITY.md).

- `CONTINUITY.md` is canonical for **implemented/current project state and pass history**.
- This file preserves **future direction and scope**.
- `MODEL_ROUTING.md` governs model/effort recommendations only; it never overrides product or repository authority.
- When files differ because implementation has advanced, precedence is: current explicit user instruction → current repository/green CI → `CONTINUITY.md` → this file → current pass contracts/config → older archives/chat memory.
- Exact pass numbering is locked only where explicitly stated. Requirements after Pass 11 are established but intentionally remain unnumbered until dependencies are clearer.

---

# Current roadmap state

Completed and closed unless current evidence proves a regression:

- **Pass 10.3 — Battlefield Geometry Contract v2**
- **Pass 10.4A — Direct Manipulation**
- **Pass 10.4B — Signature Gameplay Choreography**
- **Pass 10.4C — Feel / Presentation Polish**

Current verified production baseline is the green/deployed Pass-10.4C closeout recorded in `CONTINUITY.md`.

**Next implementation milestone: Pass 11 — Golden Match / Complete Normal Match.**

Do not reopen completed 10.3/10.4 work merely because Pass 11 raises the product-quality bar. Reopen a completed pass only when current evidence proves a genuine regression in that pass's locked responsibility.

---

# Pass 11 — Golden Match / Complete Normal Match

Pass 11 is the major functional milestone after the Pass 10.4 interaction series.

Build one genuinely complete, production-quality normal Gwent match from beginning to end with no developer shortcuts or disguised integration fixtures.

The Golden Match must be something a player can start, play normally, finish, and immediately recognize as a real game of classic Witcher 3 Gwent rather than an integration demonstration.

## A. Complete normal-match lifecycle

Required functional scope:

- real legal full-size deck initialization;
- opening draw;
- proper mulligan;
- playable hand through the canonical direct-manipulation/tap system;
- all required choice dialogs for the decks involved;
- normal player/opponent turn loop;
- passing;
- automatic hand-exhaustion behavior;
- complete scoring;
- round resolution;
- faction effects;
- life loss;
- best-of-three progression;
- final match victory/defeat;
- end-state presentation;
- restart/rematch;
- save integrity throughout.

Ordinary Instant Match must no longer initialize a miniature integration-sized state while presenting itself as a normal match.

## B. Minimum viable physical-card truthfulness

Live play after Pass 10.4C established that a technically complete match is not sufficient. Pass 11 must also establish a minimum physical/readability standard.

### Persistent embodiment

Cards should feel like persistent objects rather than UI elements that disappear and respawn:

- preserve visual identity through hand → manipulation → committed destination/effect → board/graveyard/returned hand;
- avoid perceptible disappear/reappear or teleport transitions;
- engine state remains authoritative; persistent visual actors, if introduced, remain presentation-only and may be keyed by stable match `iid`;
- animation failure must still reconcile to authoritative engine truth.

### Battlefield readability

- played unit cards must visibly expose current power;
- played cards must retain recognizable card identity/art rather than collapsing into unreadable battlefield tokens;
- sparse rows should use available space;
- dense rows may progressively scale/compress/overlap, but essential identity and current power remain readable;
- interaction with a crowded row should be able to expose relevant cards without destroying deterministic final geometry.

### Predictive targeting

Before a target-specific action commits, the player must know exactly what will receive it.

For Decoy and similar specific-target interactions:

- candidate card becomes unmistakable before release;
- lift/scale/emphasis/glow and localized neighbor movement may expose it;
- broad disruptive row reflow is not the desired default;
- ambiguity must not cause arbitrary target selection.

### Forgiveness and throw intent

Use an intent model rather than raw rectangular hit-testing:

- unambiguous ordinary placement receives reasonable forgiveness territory;
- near misses may commit when player intent is clear;
- overshoot/flick trajectory may contribute to intent where destination meaning is singular and unambiguous;
- crossing legal territory alone does not force a placement;
- ambiguous actions such as Decoy require greater precision;
- unclear releases return cleanly to origin with zero rules mutation;
- tap remains a first-class equivalent and causes the card to move itself into the same canonical final destination.

The implementation should remain hyper-intuitive: direct manipulation should be understandable through physical expectation, not learned interface conventions.

### Geometry independence

Interaction physics must consume live semantic geometry, not hard-coded viewport pixels:

- row bounds;
- card bounds;
- legal destination geometry;
- candidate target positions;
- neighbor positions;
- pointer position/velocity;
- current board density.

At rest/final reconciliation, Pass 10.3 geometry remains authoritative.

## C. Pacing and signature audiovisual consequences

Interaction response should remain immediate, but important consequences do not need to be rushed.

Separate at least conceptually:

1. immediate manipulation response;
2. ordinary card travel/settle;
3. authored mechanic/event moments.

Signature mechanics should communicate readable cause → effect and may breathe long enough for the player to understand and enjoy the event.

Particular attention includes:

- Scorch: destruction should carry credible combustion/destruction character and synchronized sound rather than only a fast generic disappearance;
- Weather/Clear Weather;
- Spy and draw consequence;
- Decoy exchange;
- Medic resurrection;
- Muster deployment;
- Tight Bond strengthening;
- Commander’s Horn;
- leader abilities;
- draws;
- passing;
- round transitions;
- life loss;
- final match result.

A full final audiovisual asset campaign may extend beyond Pass 11, but the Golden Match should not knowingly ship silent, generic, or mechanically illegible signature effects.

## D. Audio reliability

A real installed-iPhone-PWA play session produced **no audible sound** despite existing semantic audio hooks.

Before Pass 11 can be called complete, verify the actual player-facing audio path on the intended platform:

- mute/default state;
- persisted effects volume;
- first-user-gesture audio unlock;
- Web Audio/HTML media lifecycle behavior;
- background/resume/relaunch behavior;
- asset loading/decoding;
- playback request/rejection/error state;
- actual audible real-device output.

Semantic hook emission alone is not sufficient evidence that sound works.

## E. Haptic intent and platform truth

Haptics are part of the desired physical-card illusion, not merely decorative extras.

Candidate semantic moments:

- long press/pickup/grasp;
- nearby cards yielding/stepping aside;
- entering or locking a valid destination;
- board impact/settle;
- invalid return/rejection;
- selected major effect beats.

Automated/browser QA should verify semantic requests, timing, duplicate suppression, and capability handling. Actual iPhone tactile quality requires real-device review. If the web/PWA platform cannot produce the intended tactile vocabulary, document the platform ceiling and preserve the future native-wrapper path rather than pretending parity exists.

---

# Pass 11 QA / acceptance architecture

Release confidence should combine **machine proof + visual proof + live-browser proof + real-device proof**.

## Machine proof

Maintain all existing release gates and add Pass-11-specific coverage for:

- complete deterministic Golden Match lifecycle;
- legal full-size initialization;
- choices/mulligan/passing/exhaustion/rounds/factions/result/rematch;
- persistence/save integrity;
- interaction trajectory and forgiveness matrices;
- near misses, overshoots, diagonals, reversals, edges, ambiguity, and crowded rows;
- no mutation on rejected/ambiguous gestures;
- card-identity / `iid` continuity invariants if persistent presentation actors are introduced;
- audio/haptic semantic diagnostics;
- interruption and reduced-motion equivalence.

Do not weaken existing CI/QA to make new work pass.

## Temporal visual proof

Important interactions should produce evidence across time, not only terminal screenshots.

Capture recordings or sufficiently dense frame sequences plus telemetry for:

`pickup → manipulation → target acquisition → release → impact/effect → settle`

Review for:

- visual continuity;
- pointer fidelity;
- correct target exposure;
- localized/reversible neighbor displacement;
- clean invalid return;
- believable landing;
- cause/effect ordering;
- no clipping/teleport/pop;
- correct reduced-motion equivalent.

The latest exact candidate head must have its generated visual evidence inspected before merge.

## QA interaction flight recorder

Pass 11 should evaluate a QA-only instrumentation layer capable of exposing recent interaction intent/state, including where useful:

- pointer coordinates/path/velocity;
- gesture duration/release velocity;
- held `iid` and pickup offset;
- legal destinations;
- candidate target and ambiguity/confidence;
- forgiveness-region transitions;
- neighbor displacement;
- release commit/reject reason;
- presentation event timestamps;
- audio cue requests/status;
- haptic requests;
- authoritative engine action/final state.

Instrumentation is observation only, never gameplay authority.

## Live-browser proof

Use connected browser tooling such as TinyFish/ChatGPT Work where useful to independently operate candidate/deployed builds and inspect:

- landing/menu flow;
- Instant Match;
- mulligan;
- card play and targeting;
- passing/round progression;
- settings;
- restart/rematch;
- obvious visual/runtime failures.

This supplements rather than replaces deterministic Playwright CI.

## Real-device proof

An actual installed iPhone PWA remains the final authority for:

- touch ergonomics;
- perceived card weight/physicality;
- real audible output;
- lifecycle/background/relaunch behavior;
- orientation;
- tactile/haptic quality.

Real-device review should be the final sensory/product signoff, not the first line of basic bug discovery.

---

# Known work after Pass 11 — pass numbers intentionally not locked

These are established roadmap requirements. Assign exact pass numbers only as the work approaches and dependencies are better understood.

Some deeper physical-card/audiovisual work may move right of Pass 11 after the minimum Golden-Match standard above is met.

## Full Deck / Collection / Access Layer

Expose the complete migrated 216-card catalog through a production deck builder.

Required capabilities include:

- all factions;
- leaders;
- special cards;
- weather;
- deck legality rules;
- minimum-unit requirements;
- duplicate limits;
- faction restrictions;
- search/filtering;
- collection browsing;
- deck analytics;
- saved decks;
- presets;
- legacy Arun deck import using stable permanent card IDs.

The mobile deck-builder target remains:

`COLLECTION | DECK | ANALYSIS`

## Full Faction + Leader Playability

Remove controlled integration-match limitations so the player can select legitimate factions, leaders, and legal decks and play broad combinations through the same engine/UI path.

Every card and leader supported by the canonical classic rules should ultimately be accessible without developer-state injection.

## Advanced Physical-Card Presentation

After the Golden Match minimum bar is secure, continue toward the fuller embodied-card vision where justified:

- richer neighbor influence/avoidance ecology;
- more sophisticated velocity-sensitive throw/flick behavior;
- adaptive row breathing/exposure across dense boards;
- deeper material/weight/rotation/settle language;
- persistent actor continuity across more complex nested effects;
- broader haptic vocabulary if platform capability permits.

Do not let advanced physics become rules authority or create non-deterministic outcomes.

## Audiovisual Identity / Reference Study

Perform a dedicated audiovisual reference/research pass before binding final assets.

The original Witcher 3 Gwent may be used to understand the intended material/magical communication language; exact cloning is not required unless legally and technically appropriate. Establish a coherent bespoke vocabulary for:

- card/table contact;
- parchment/leather/wood/metal character;
- Scorch/fire/destruction;
- frost/weather;
- Horn resonance;
- Spy/Decoy/Medic/Muster;
- graveyard/revival;
- round/result transitions;
- restrained silence/space between events.

Audio timing should be authored with visual choreography rather than as detached confirmation sounds.

## Final AI System

Replace Integration Bot scaffolding with the intended real difficulty architecture:

**Novice → Standard → Veteran → Master → Grandmaster**

Higher difficulty must mean better reasoning, planning, valuation, passing, sequencing, weather usage, baiting, round management, card conservation, and opponent modeling — **not hidden rule-breaking or secret information access**.

Maintain the formal separation:

```text
AIKnowledgeState != GameState
```

## Save / Resume / Persistence Maturity

Turn the existing persistence foundation into reliable production save/resume behavior across:

- reloads;
- PWA launches;
- interrupted animations;
- backgrounding;
- device rotation;
- normal match lifecycle.

`Continue Match` must restore exact authoritative game state, not reconstructed presentation state.

This should naturally extend into deterministic replay/event-log infrastructure and robust undo/redo where the selected mode permits it.

## Cheats / Custom Assists / Sandbox

Finish the modular cheat system as a first-class engine/product layer rather than burying cheats inside gameplay code.

Cheats and assists remain individually toggleable and must never silently contaminate Classic.

Planned capabilities include:

- reveal opponent hand;
- reveal opponent deck;
- reveal next draw;
- reveal AI intent;
- controlled drawing;
- spawning/selecting cards;
- duplicating cards;
- reviving/returning cards;
- weather manipulation;
- Horn manipulation;
- leader restoration;
- life restoration;
- forced pass;
- turn switching;
- undo/redo;
- save/load/restart;
- deck-rule overrides;
- custom starting hands;
- custom lives;
- favorite cheats.

Match classification remains explicit:

- `CLASSIC`
- `ASSISTED`
- `MODIFIED`
- `SANDBOX`

Statistics must remain separable accordingly.

## Complete UX Shell

Mature:

- Quick Start;
- Classic Match;
- Custom Match;
- Sandbox;
- deck selection;
- faction/leader selection;
- difficulty setup;
- rules/help;
- settings;
- match history/statistics;
- Continue Game flow;
- post-match flow.

The product should no longer expose development scaffolding as a normal player experience.

## PWA / iPhone Productization

The long-term target remains a true iPhone-quality experience.

- Portrait is preferred for menus, collection, deck building, settings, and management surfaces.
- Landscape remains the gameplay target.

Continue improving:

- safe-area behavior;
- touch ergonomics;
- PWA installation;
- offline-first operation;
- service-worker reliability;
- asset caching;
- orientation transitions;
- haptics;
- app lifecycle behavior;
- eventual path toward a native iPhone wrapper/app if justified by platform ceilings such as haptic fidelity.

## Asset Independence / Definitive Presentation

Gradually remove production dependence on Arun's remotely hosted artwork by establishing a controlled local asset pipeline.

Arun's project remains a rules/card/reference oracle and compatibility target, but Definitive Edition should have its own stable production asset architecture and bespoke battlefield presentation.

Functional battlefield geometry must remain deterministic DOM/CSS/SVG geometry. Never return to generated-image geometry for lanes, card sockets, weather bands, special slots, hand zones, or other functional layout.

## Final completeness / parity campaign

Before treating the product as genuinely complete, run exhaustive testing across:

- catalog;
- rules;
- interaction;
- AI;
- save/resume;
- devices;
- accessibility;
- PWA behavior;
- full matches across the card pool.

Deterministic regression tests and fuzzing remain permanent release gates, not one-time development tools.

---

# Governing development principle

> **Rules correctness first → interaction correctness → readable gameplay choreography → premium physical feel → complete normal match → complete access → smarter AI → product maturity.**

Do not rush cosmetic expansion at the expense of the engine.

Do not let temporary preview limitations dictate production architecture.

Every pass should leave behind regression coverage so later work cannot silently undo earlier gains.

The product north star for interaction remains:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

---

# Current forward handoff

Current completed production milestone:

**Pass 10.4C — Feel / Presentation Polish — COMPLETE / MERGED / GREEN / DEPLOYED.**

Current implementation milestone:

**None.** A documentation-only pre-Work transition checkpoint is reconciling continuity, roadmap, QA doctrine, and model-routing instructions.

Next implementation milestone:

**Pass 11 — Golden Match / Complete Normal Match.**

Pass 11 must begin only after the transition checkpoint is merged/verified and after the next work cycle updates the actual `CONTINUITY.md` before implementation.