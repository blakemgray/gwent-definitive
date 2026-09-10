# Pass 10.4 Implementation Blueprint

This document converts the 10.4R research into buildable subpasses. It does not add runtime animation itself; it defines how implementation should proceed without destabilizing the deterministic engine or the Pass 10.3 battlefield compositor.

## Governing architecture

Runtime layers after 10.4 should be:

1. Rules Engine — authoritative deterministic state/actions.
2. Match Controller — validates intent and commits GameActions.
3. Presentation Event Adapter — converts engine event deltas into semantic presentation events.
4. Motion Planner — maps semantic events to choreography using motion tokens.
5. Gesture Controller — pointer/tap input state machine that never owns rules.
6. Battlefield Compositor — Pass 10.3 final positions.
7. Audio/Haptic Adapters — optional subscribers to presentation events.
8. DOM Renderer — final reconciled view.

The motion system should be able to be completely disabled and still leave a fully functional game.

## Pass 10.4A — Direct Manipulation

### Mission

Make card interaction feel physically direct and Apple-level predictable before implementing elaborate ability effects.

### Required runtime modules

Recommended modules:

- `src/gesture-controller.js`
- `src/presentation-queue.js`
- `src/motion-tokens.js`
- `src/flip-layout.js`
- `src/presentation-events.js`

Existing `src/battlefield-ux.js` remains responsible for final spatial composition but should expose geometry/slot information to the motion layer instead of mixing gesture state into layout logic.

### Required features

#### Selection
- first tap selects a card;
- selected card lifts/scales and remains readable;
- legal destinations become visible;
- tapping background cancels;
- tapping another card transfers selection;
- full inspector moves to secondary intent rather than intercepting first tap.

#### Two-tap placement
- select card;
- tap legal row/special/weather destination;
- action validates through the Match Controller;
- visual card flies from current visual location to compositor destination;
- row/hand redistributions animate through FLIP;
- engine result is authoritative even if animation is interrupted.

#### Drag placement
- pointerdown begins press candidate;
- crossing threshold begins drag;
- pointer capture owns movement until pointerup/cancel;
- visual card follows the finger via transform;
- source placeholder preserves hand geometry;
- legal destination currently under pointer receives active response;
- valid release commits same action used by tap path;
- invalid release returns card cleanly to source;
- pointercancel always reconciles safely.

#### Legal destination model

The Match Controller should expose normalized destinations such as:

```text
{kind:'row', playerId:'p1', row:'close'}
{kind:'row', playerId:'p2', row:'ranged'}
{kind:'special', playerId:'p1', row:'siege'}
{kind:'weather'}
{kind:'leader'}
```

The gesture layer may highlight only destinations returned by rules/action generation. It must never infer legality from card metadata on its own.

### 10.4A QA gate

Automated browser tests must verify:
- tap and drag produce identical engine state for the same card/action;
- invalid drag does not mutate engine state;
- card remains under pointer within acceptable lag during scripted drag;
- source placeholder prevents hand collapse while dragging;
- legal row indication appears only for legal targets;
- selection cancel leaves no stale UI state;
- 1, 3, 8, 12-card destination row reflow stays centered and unclipped;
- rotation during drag cancels safely;
- reduced-motion path still supports both input modes;
- no page errors.

Pass 10.4A is complete only when ordinary play feels good without any special ability animation.

## Pass 10.4B — Gameplay Choreography

### Mission

Turn semantic game effects into readable, distinctive, interruptible presentation sequences.

### Priority order

Tier 1 — signature classic effects:
1. Scorch
2. Muster
3. Spy
4. Commander's Horn
5. Weather / Clear Weather

Tier 2 — tactical choice/effect flows:
6. Medic
7. Decoy
8. Tight Bond
9. Morale Boost
10. Leader activation

Tier 3 — lifecycle polish:
11. Hero status
12. draw/discard
13. pass
14. round resolution
15. match result
16. faction-specific carryover/resurrection effects

### Presentation-event adapter

Do not depend only on the current coarse event log. 10.4B should introduce a presentation-event adapter that can derive a compact transaction from before/after state plus engine event delta.

Example:

```text
GameAction PLAY_CARD spy
Engine after-state committed
PresentationTransaction
  CARD_LEAVE_HAND(iid)
  CARD_ENTER_ROW(iid,p2,close)
  SPY_TRIGGER(iid)
  SCORE_CHANGE(p2,close,old,new)
  CARD_DRAW(p1,iid2)
  CARD_DRAW(p1,iid3)
  TURN_CHANGE(p1,p2)
```

This transaction is presentation metadata only. It is safe to discard and reconstruct from state/event deltas.

### Choreography rules

#### Scorch
- target identity visible before destruction;
- simultaneous doom cue for tied highest units;
- char/dissolve and grave trajectory;
- row closes only after target read is established;
- score decreases after destruction is visually legible;
- no full-screen flame that obscures which cards died.

#### Muster
- initiator is clearly first;
- summoned cards visibly originate from deck/hand abstraction;
- stagger is adaptive to swarm size;
- row keeps re-centering as units enter;
- long swarms accelerate rather than linearly consuming seconds.

#### Spy
- card crosses ownership boundary;
- opponent score update remains visible;
- exactly two draw animations follow;
- drawn cards arrive into real hand slots.

#### Horn
- special socket or leader is visible origin;
- row-wide effect precedes score update;
- persistent Horn state remains readable after animation ends.

#### Weather
- central weather card and affected rows are causally connected;
- visual effect never obscures card art/power;
- Clear Weather visibly removes persistent treatment.

#### Medic / Decoy
- preserve source-to-destination continuity;
- keep board visible during choice;
- never use a detached modal that forces the player to remember the board.

### 10.4B QA gate

For each mechanic above, browser QA must capture:
- pre-state;
- mid-animation signature frame;
- final state;
- reduced-motion equivalent;
- interrupted animation followed by correct final reconciliation.

Stress cases:
- Scorch multiple tied targets across rows;
- Muster into 8+ card row;
- Spy when hand grows from 9 to 11;
- Horn with Tight Bond already active;
- all three weather types simultaneously;
- Medic reviving a card that itself triggers an effect;
- Decoy on a Spy;
- round transition with Monster retention / Skellige resurrection where available.

## Pass 10.4C — Feel, Audio Hooks, Haptics, Accessibility, Performance

### Mission

Polish timing and coherence after all key choreography exists.

### Motion tuning

Tune token durations on real iPhone hardware. The research values are initial targets, not sacred numbers.

Measure:
- time from pointerdown to visible response;
- drag visual latency;
- card-commit duration;
- time from commit to regained input;
- major effect duration;
- percentage of frames exceeding 16.7 ms;
- subjective ability to understand cause/effect at normal speed.

### Audio

Implement semantic audio adapter with independently controllable:
- effects volume;
- music volume later;
- mute;
- accessibility captions/visual feedback remains sufficient without sound.

Do not bind rules to legacy sound files. Preserve hook names even if audio provenance changes later.

### Haptics

Web/PWA:
- capability-detect only;
- never require vibration for confirmation;
- default conservative.

Native iOS future adapter:
- map selection to selection feedback;
- card land to light impact;
- Horn to medium impact;
- Scorch to sharper/heavier impact;
- round result to notification-style feedback.

### Reduced motion

Automated test should emulate `prefers-reduced-motion: reduce` and verify:
- no long travel animations required to understand actions;
- no major parallax/depth shifts;
- no repeated ambient particles;
- all final states and highlights remain equivalent.

### Performance budget

Target device: contemporary iPhone Safari/PWA in landscape.

Release goals:
- 60 fps target during ordinary interaction;
- no persistent animation loop at idle;
- no animation-induced scroll/layout thrashing;
- drag path uses transform updates only during pointer movement;
- major effect must not produce sustained jank;
- memory growth does not accumulate across repeated animations;
- all `Animation` objects are cancelled/garbage-collectable after reconciliation.

### 10.4C visual quality gate

A contact sheet/video capture should include at minimum:
- hand selection;
- drag over legal/invalid rows;
- two-tap card flight;
- ordinary unit landing;
- Spy crossover + draws;
- Scorch single target;
- Scorch multi-target;
- Horn;
- Tight Bond;
- Muster small pack;
- Muster large swarm;
- Frost/Fog/Rain/Clear;
- Medic;
- Decoy;
- Pass;
- round win/loss;
- reduced-motion equivalents.

The pass is not approved only because tests are green. It requires visual inspection at native iPhone landscape dimensions.

## Interaction design decisions deferred intentionally

The following should be tested rather than prematurely locked:
- exact drag threshold inside the 7–10 px target range;
- exact selected-card scale inside 1.06–1.10;
- whether second tap opens inspector or a dedicated info affordance is better;
- exact spring overshoot values;
- whether score count-up/down should animate every integer or interpolate/step for very large changes;
- exact amount of card tilt during drag;
- whether destination rows magnetize visually before release;
- user preference for confirmation on Pass;
- final audio asset set and licensing.

## Golden Match relationship

Pass 11 should not begin until 10.4A/B/C establish the interaction layer. Golden Match is then the first full gameplay validation of:
- full legal decks;
- complete round lifecycle;
- normal human interaction without developer shortcuts;
- presentation queues under real chained mechanics;
- AI turns using the same choreography system;
- strategic pacing with animation enabled.

This ordering prevents full-match implementation from hardening around prototype interactions.

## Go/no-go criteria for beginning 10.4A

10.4A may begin when:
- 10.4R research is approved;
- the machine-readable interaction-motion contract is present;
- Pass 10.3 compositor remains stable;
- no one plans to place rules logic inside animation callbacks;
- hybrid tap/drag interaction is accepted as the default direction.

These conditions are satisfied by Pass 10.4R.