# Gwent Classic — Definitive Edition
## Forward Roadmap Continuity

**Purpose:** preserve the intended future development sequence and established post-Pass-11 requirements across ChatGPT conversation limits and implementation handoffs.

This file is the **forward roadmap companion** to [`CONTINUITY.md`](CONTINUITY.md).

- `CONTINUITY.md` remains the canonical **running project state / pass ledger** and must be updated as work is actually completed.
- `FUTURE_CONTINUITY.md` preserves **intended future direction** so a new conversation does not have to reconstruct the roadmap from chat history.
- When the two differ because implementation has advanced, current explicit user instruction and the current repository/green CI state take precedence, followed by `CONTINUITY.md`; this file supplies the intended future sequence that has not yet been executed.
- Exact pass numbering is locked only where explicitly stated below. Requirements after Pass 11 are established, but their pass numbers are intentionally **not yet assigned**.

---

# Pass 10.4B — Signature Gameplay Choreography

Once direct manipulation is trustworthy, make the important Gwent mechanics feel specifically like Gwent rather than generic card movement.

Build authored presentation choreography around signature events and abilities while keeping the deterministic engine completely authoritative underneath.

Priority treatment includes:

- Spy placement and draw consequences;
- Decoy swaps;
- Medic resurrection;
- Muster deployment;
- Tight Bond strengthening;
- Weather application and removal;
- Commander’s Horn;
- Scorch destruction;
- leader abilities;
- drawing cards;
- passing;
- round transitions;
- board clearing;
- life loss;
- other mechanically important events.

These sequences must communicate **cause → effect** clearly rather than becoming decorative animation.

This is the pass where individual mechanics begin receiving their own visual grammar, timing, emphasis, sequencing, and readable battlefield reactions.

### Governing constraints

- deterministic engine state remains authoritative;
- presentation never decides legality or outcomes;
- Pass 10.3 final battlefield geometry remains authoritative;
- Pass 10.4A tap/drag parity and canonical commit path remain intact;
- presentation must remain interruption-safe and disposable;
- reduced-motion equivalents must preserve mechanical clarity;
- every newly choreographed mechanic receives targeted regression coverage.

---

# Pass 10.4C — Feel / Presentation Polish

Take the now-functional interaction and choreography systems and make the entire battlefield feel premium and cohesive.

Tune:

- motion curves;
- timing;
- responsiveness;
- card weight;
- hover/press states;
- target feedback;
- selection clarity;
- score changes;
- row reactions;
- transitions;
- sound hooks;
- haptic hooks;
- reduced-motion equivalents;
- interruption behavior;
- general moment-to-moment pacing.

The goal is **not more animation**. The goal is a battlefield that feels physical, immediate, intentional, polished, and native-quality on iPhone while preserving the classic Witcher 3 Gwent identity.

---

# Pass 11 — Golden Match / Complete Normal Match

This is the major functional milestone after the Pass 10.4 interaction series.

Build one genuinely complete, production-quality normal Gwent match from beginning to end with no developer shortcuts.

Required scope:

- real legal deck initialization;
- opening draw;
- proper mulligan;
- playable hand through the direct-manipulation system;
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

The Golden Match should be something a player can start, play normally, finish, and immediately recognize as a real game of classic Gwent rather than an integration demonstration.

---

# Known work after Pass 11 — pass numbers intentionally not locked

These are established roadmap requirements. Assign exact pass numbers only as the work approaches and dependencies are better understood.

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

- Portrait is preferred for menus, collection, deck building, settings, and other management surfaces.
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
- eventual path toward a native iPhone wrapper/app if justified.

## Asset Independence / Definitive Presentation

Gradually remove production dependence on Arun’s remotely hosted artwork by establishing a controlled local asset pipeline.

Arun’s project remains a rules/card/reference oracle and compatibility target, but Definitive Edition should have its own stable production asset architecture and bespoke battlefield presentation.

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

> **Rules correctness first → interaction correctness → readable gameplay choreography → premium feel → complete match → complete access → smarter AI → product maturity.**

Do not rush directly into cosmetic expansion at the expense of the engine.

Do not let temporary preview limitations dictate production architecture.

Every pass should leave behind regression coverage so later work cannot silently undo earlier gains.

---

# Current forward handoff

Current completed implementation milestone remains:

**Pass 10.4A — Direct Manipulation**

Next prepared implementation milestone:

**Pass 10.4B — Signature Gameplay Choreography**

After that:

**Pass 10.4C — Feel / Presentation Polish → Pass 11 — Golden Match / Complete Normal Match.**
