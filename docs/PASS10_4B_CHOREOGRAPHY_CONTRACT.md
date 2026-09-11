# Pass 10.4B — Signature Gameplay Choreography Contract

## Status

Implementation / merge candidate. This contract records the runtime boundaries and release gate for Pass 10.4B.

Pass 10.3 remains authoritative for final battlefield geometry. Pass 10.4A remains authoritative for direct manipulation and the canonical validated action path.

## Mission

Make mechanically important classic Gwent events read specifically as Gwent rather than generic card movement. Presentation must communicate **cause → effect** while deterministic engine state remains authoritative underneath.

## Non-negotiable architecture

1. Rules and legality remain in `src/gwent-engine.js` and the existing match controller.
2. Tap and drag continue to commit the same validated GameAction.
3. Engine state commits before presentation begins.
4. Presentation may be cancelled, skipped, or fail without rolling back committed engine/persisted state.
5. All mechanic-specific choreography serializes through the existing presentation queue.
6. Pass 10.3 owns final positions; choreography may measure/interpolate existing DOM geometry but may not substitute a new positioning system.
7. Auto-bot mutation may not occur while player presentation is unresolved.
8. Reduced-motion mode must preserve equivalent mechanic comprehension.

## Semantic presentation adapter

`src/presentation-events.js` version `10.4B.0` derives presentation-only metadata from before/after state plus engine event deltas.

Captured context includes:

- card locations;
- compact board snapshots;
- row/total scores;
- life totals;
- hand counts;
- engine event delta;
- round and winner state.

Recognized mechanic families include:

- Spy and its draws;
- Muster summons;
- global / row Scorch;
- Medic revival;
- Decoy swap;
- Weather / Clear Weather;
- Commander's Horn from card or leader;
- Tight Bond;
- Morale Boost;
- Hero landing;
- leader activation;
- draws;
- manual / exhaustion Pass;
- life loss;
- round end / board clear / next round;
- match result;
- faction resurrection / carryover presentation where represented by engine events.

The adapter is disposable metadata. It never decides legality or outcome.

## Choreography runtime

Primary files:

- `src/gameplay-choreography.js`
- `gameplay-choreography.css`
- `src/choreography-external-gate.js`
- `src/presentation-events.js`

`src/gameplay-choreography.js` turns semantic events into staged transactions. Signature stages are serialized after the existing Pass 10.4A placement / FLIP executor within the same presentation queue transaction.

### Authored grammar

- **Spy** — ownership-boundary emphasis followed by the actual two draw events.
- **Muster** — initiator/context cue, adaptive summon staggering, row response.
- **Scorch** — doomed-row emphasis with tied-target count/readability before the settled board is accepted.
- **Decoy** — explicit swap cue and affected-row response.
- **Medic** — resurrection cue followed by revived-card/row response.
- **Weather** — weather-band origin followed by linked affected-row response; Clear Weather removes that emphasis.
- **Horn** — socket/leader origin followed by row-wide and score response.
- **Bond / Morale** — strengthening cue tied to the affected row.
- **Leader** — leader-origin emphasis before consequences settle.
- **Pass** — manual vs hand-exhaustion language.
- **Round resolution** — winner/readout, life change, occupied-board clear response, next-round cue.
- **Match result** — victory / defeat / draw emphasis.

Pass 10.4B establishes readable grammar. Exact timing curves, audio/haptics, card weight, final visual restraint, and native-device tuning remain Pass 10.4C work.

## External action bridge

Some existing product controls commit through the app shell rather than `api.playAction` (notably Pass, leader/choice controls, legacy inspector play paths, and bot actions).

`src/gameplay-choreography.js` observes authoritative post-commit state/event-log changes and creates presentation-only transactions for those actions without introducing a second rules path.

`src/choreography-external-gate.js` suppresses the legacy synchronous auto-bot scheduler for external player commit controls while their presentation transaction is unresolved, then releases it on queue complete/cancel/error. This extends the Pass 10.4A no-mid-presentation-bot-mutation doctrine to the newly choreographed action families.

## Reduced motion and interruption

Reduced motion substitutes concise opacity/highlight responses for long travel while retaining mechanic identity.

Queue cancellation / visibility interruption must:

- remove cues and ghosts;
- remove transient classes;
- release bot gating;
- leave committed authoritative state untouched;
- leave no stale presentation state.

## QA / release gate

Permanent Node gates:

- engine regression;
- catalog fuzz invariants;
- PWA runtime graph;
- 10.4R motion contract;
- 10.4A direct-manipulation contract;
- 10.4B choreography contract.

Permanent browser gates retain every Pass 10.3 / 10.4A geometry, direct-manipulation, destination-parity, stress, lifecycle, failure-recovery, semantic-landing, bot-gating, and WebKit/iPhone assertion.

Pass 10.4B additionally gates:

- real engine Spy semantic sequence and exactly two draw events;
- real engine Weather persistent state plus authored treatment;
- signature mid-animation frames for Muster, Scorch, Decoy, Medic, Horn, Bond, leader, Pass, and round resolution;
- external app-level Pass observation;
- reduced-motion semantic equivalence;
- explicit queue cancellation with zero engine mutation and complete transient cleanup.

Archived visual QA must include native 852×393 captures for the above mechanic families and be manually inspected before merge.

## Release blockers

Do not merge if any of the following occurs:

- a classic rule changes to accommodate animation;
- 10.3 geometry regresses;
- tap/drag state parity regresses;
- animation owns or mutates engine state;
- bot state mutates during unresolved player presentation;
- reduced-motion loses mechanic information;
- interruption leaves transient DOM or changes authoritative state;
- signature cues obscure the relevant board state rather than clarifying it;
- the latest PR head is not green across the complete inherited + 10.4B gate.

## Handoff after completion

After 10.4B is merged, deployed, and continuity-closed, the next planned pass is **Pass 10.4C — Feel / Presentation Polish**: tune the established interaction/choreography system for premium timing, responsiveness, card weight, score/row reactions, audio/haptic hooks, accessibility, interruption behavior, performance, and cohesive native-quality iPhone feel without adding animation merely for spectacle.
