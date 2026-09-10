# Pass 10.4R — Interaction & Motion Research

Status: RESEARCH COMPLETE
Runtime baseline: Pass 10.3 Battlefield UX Architecture
Purpose: define the interaction and motion language before animation implementation.

## Executive decision

Gwent Definitive should use motion as an information system, not decoration. The target is a synthesis of three influences:

1. The Witcher 3 classic Gwent supplies the tactile fantasy-card character: cards feel like physical objects, abilities have recognizable audiovisual signatures, and major effects feel consequential.
2. Apple interaction principles supply discipline: direct manipulation, immediate feedback, reversible intent, alternate input paths, clear destination affordances, accessibility, and restrained motion.
3. Gwent Definitive supplies the modernized implementation: deterministic rules remain authoritative while a presentation layer converts semantic game events into motion, sound, and future haptic choreography.

The resulting product should feel alive without feeling busy. Motion must explain what moved, what changed, why a score changed, whose turn it is, and whether an action committed.

## Research basis and confidence

### High-confidence design sources

Apple Human Interface Guidelines:
- Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Gestures: https://developer.apple.com/design/human-interface-guidelines/gestures
- Drag and drop: https://developer.apple.com/design/human-interface-guidelines/drag-and-drop
- Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Playing haptics: https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- Game controls: https://developer.apple.com/design/human-interface-guidelines/game-controls

Web platform references:
- Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- setPointerCapture: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- touch-action: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
- Web Animations API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
- Element.animate(): https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
- requestAnimationFrame(): https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Animation performance: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate

### Classic Gwent evidence

Official rule reference:
- CDPR Gwent manual: https://cdn-l-thewitcher.cdprojektred.com/media/TW3/Pdf/GwentManuals/en-Manual-Gwent-ONLINE.pdf

Arun Sundaram reference implementation:
- https://github.com/asundr/gwent-classic

Arun's implementation is not treated as a frame-accurate oracle for CDPR's original animation timings, but it is useful evidence of the interaction vocabulary expected by classic-Gwent players. The source explicitly has a card-placement duration constant of 1000 ms, ability-specific calls such as `card.animate("horn")` and `card.animate("muster")`, Scorch animation before graveyard transfer, and a dedicated sound vocabulary including bond, clear, close/ranged/siege placement, decoy, discard, draw, fog, frost, horn, medic, morale, muster, pass, rain, redraw, scorch, spy, turn cues, and round/game cues.

Public Witcher 3 gameplay recordings were used as visual reference for the character and pacing of the minigame, but exact frame timings are not claimed from those videos in this document.

## Human-factors conclusions

### 1. Direct manipulation should be supported, but never required

Apple recommends familiar gestures, immediate feedback, and more than one way to perform important actions. For Gwent Definitive, the primary model should therefore be dual-path:

- Two-tap: tap a card to select, then tap a legal destination.
- Drag: touch and drag a card directly to a legal destination.

Both must produce the same validated engine action. There must never be separate game logic for tap-placement and drag-placement.

This is especially important on iPhone because drag is expressive and satisfying but can be less comfortable or precise than tapping. Accessibility, one-handed use, fatigue, and screen-edge reach all argue for an equivalent tap path.

### 2. Intent must be reversible until commit

The interaction should distinguish selection from commitment.

Selecting a card is reversible and cheap. Dragging is reversible until a legal drop commits. Releasing on dead space returns the card to its source. Tapping a different card changes selection. Tapping empty board/background cancels selection. Irreversible game actions such as Pass should receive stronger confirmation feedback than ordinary selection.

### 3. The board must preserve spatial continuity

The player should see the card travel from source to destination. Existing cards should redistribute around the incoming card rather than teleporting between layouts. Spy must visibly cross the centerline. Medic must visibly recover a card from graveyard context. Decoy should visually exchange positions. Muster should visibly bring related units into the row.

Spatial continuity reduces change blindness and makes state transitions easier to understand.

### 4. Motion hierarchy should match gameplay consequence

Not all events deserve equal duration or spectacle.

Recommended motion classes:

- MICRO: 70–140 ms — press, selection acknowledgement, row hover, score tick micro-response.
- ROUTINE: 160–300 ms — ordinary card lift, card return, normal placement, hand redistribution.
- ABILITY: 300–700 ms — Spy, Horn, Weather, Bond, Medic, Decoy, leader activation.
- MAJOR: 650–1200 ms — Scorch, Muster cascade, round victory/loss, match result.

These are design targets, not externally sourced platform requirements. They should be tuned through real-device testing.

### 5. Motion must never hold the rules engine hostage

The deterministic rules engine remains authoritative. Animation is downstream presentation.

Correct architecture:

Player gesture
→ validated GameAction
→ deterministic state transition
→ semantic event bundle
→ motion planner
→ presentation queue
→ visual/audio/haptic execution
→ final DOM reconciliation

Animation callbacks must never decide rules outcomes. If an animation is interrupted, skipped, reduced, or the page loses focus, the final visual state must still reconcile to the engine state.

## Input architecture recommendation

### Use Pointer Events, not native HTML5 drag-and-drop

For the board, use Pointer Events with `setPointerCapture()` and explicit hit testing against legal destination rectangles.

Reasons:
- one input model covers touch, mouse, and pen;
- pointer capture supports continuous direct manipulation even when the finger moves off the original element;
- browser-native HTML drag-and-drop carries desktop/file-transfer semantics that do not match this game;
- historical WebKit drag-and-drop performance issues make native HTML drag/drop an unnecessary risk for a motion-heavy iPhone PWA.

### touch-action policy

Do not apply `touch-action: none` globally. That can interfere with browser zoom/accessibility behavior. Restrict gesture suppression to the active battlefield card/drag surface during direct manipulation, while preserving ordinary system behavior elsewhere.

### Drag state machine

IDLE
→ POINTER_DOWN
→ PRESS_CANDIDATE
→ SELECTED or DRAGGING
→ DRAGGING_OVER_LEGAL / DRAGGING_OVER_INVALID
→ COMMITTING or RETURNING
→ IDLE

Recommended thresholds for initial implementation:
- drag activation distance: 7–10 CSS px;
- hold is not required to start dragging;
- card follows finger immediately once threshold is crossed;
- invalid release triggers spring-back/return;
- legal destination highlights only after drag begins or selection is active.

Thresholds are implementation targets and should be validated on iPhone rather than treated as fixed constants forever.

## Selection model

### Tap selection

On tap:
- card lifts 8–14 px;
- scale increases approximately 1.06–1.10;
- shadow/depth increases;
- neighboring hand cards create slightly more breathing room where possible;
- legal destinations illuminate;
- card information appears through a compact contextual treatment, not a full-screen interruption.

A second tap on the same card may open the detailed inspector if desired, but the first tap should prioritize play intent rather than information overload.

### Drag selection

During drag:
- card detaches visually from the hand compositor but leaves a source placeholder/ghost so the hand does not collapse under the finger;
- card tracks pointer position using transforms;
- scale should remain near selected size, not balloon dramatically;
- a subtle tilt may respond to pointer velocity/direction, capped to a small angle;
- legal rows respond as the card crosses them;
- the currently active destination receives the strongest highlight;
- invalid board regions remain quiet rather than flashing aggressively.

### Drop behavior

Valid drop:
- destination locks;
- engine action commits;
- dragged card transitions from finger position to compositor-calculated destination;
- affected row reflows using FLIP-style position interpolation;
- score changes follow after card landing, not before.

Invalid drop:
- card returns to exact source slot with a short spring/settle;
- no toast is required unless the reason is rules-based and non-obvious;
- if a card can never be played in the current state, it should not imply drag availability in the first place.

## Motion grammar

### Preferred technical primitives

1. Pointer tracking: `requestAnimationFrame()` only for live finger-following and velocity/tilt calculation.
2. Settling, card travel, fades, scale and most effects: Web Animations API (`Element.animate`) or CSS transitions.
3. Reflow choreography: FLIP-style measurement (First, Last, Invert, Play), using transforms to animate between compositor states.
4. Avoid animating layout-heavy properties such as `left`, `top`, `width`, or `height` every frame when transform/opacity can express the same effect.
5. Particle-heavy effects should be bounded and optional; prefer DOM/CSS/SVG for v1 unless profiling shows a clear need for canvas/WebGL.

### Performance targets

- target 60 fps on current iPhone Safari/PWA;
- no gameplay action should require a permanent animation loop;
- pointermove handlers do minimal work and schedule visual work via rAF;
- only `transform` and `opacity` should animate continuously during drag when practical;
- no more than one major presentation queue per committed action;
- effects degrade gracefully when page visibility changes or frame rate drops;
- animation state must be disposable and reconstructible from engine state.

## Semantic choreography specification

### Ordinary unit placement

1. select/lift;
2. legal row indicates eligibility;
3. commit by tap or drop;
4. card travels to row;
5. row cards make room through FLIP interpolation;
6. card settles with a restrained impact;
7. row score counts to new value;
8. total score follows;
9. turn indicator transitions.

Target total presentation: ~220–360 ms after commit.

### Spy

Spy is a signature spatial effect and should be immediately legible.

1. selected Spy lifts;
2. opponent's legal row highlights despite ownership inversion;
3. card crosses the centerline into opponent territory;
4. opponent row accepts/reflows around it;
5. opponent row/total score updates;
6. two draw events fire sequentially from deck source to player's hand;
7. hand compositor opens space for each incoming card;
8. turn state advances.

Do not obscure the fact that the opponent receives the Spy's strength. The crossing motion is part of the explanation.

### Commander's Horn

1. Horn card travels to the row special socket, or leader activation originates from leader card;
2. socket gives a brief brass/amber ignition pulse;
3. a directional ripple runs through affected non-hero units;
4. affected strength badges count upward;
5. row score counts upward;
6. total score follows;
7. glow settles to a persistent low-energy Horn state.

No explosive particle shower. Horn should feel martial and forceful, not magical fireworks.

### Tight Bond

1. newly played Bond unit lands normally;
2. matching units receive a quick connective pulse/line or shared emblem flash;
3. affected power badges update together;
4. row score updates as one grouped event;
5. persistent state returns to calm.

The animation must make multiplicative linkage understandable without repeatedly replaying a long effect on every future score recalculation.

### Muster / rally / pack

Muster is a signature animation and should feel like units answering a call.

1. initiating Muster card lands;
2. brief rally pulse originates from it;
3. related cards are identified from deck/hand source zones;
4. summoned cards arrive in a staggered cascade, approximately 70–110 ms apart;
5. each card enters the target row and the row compositor continuously redistributes;
6. score may tick per arriving card or resolve in small grouped beats depending on swarm size;
7. for very large swarms, accelerate the middle of the cascade so spectacle does not become waiting;
8. final pack settles together.

Suggested adaptive cadence:
- 1–3 additional cards: individual arrivals;
- 4–6: rapid stagger;
- 7+: first two individual, middle group accelerated, final card distinct.

### Scorch

Scorch should be the strongest single-card destructive effect in classic play.

1. Scorch commits to the battlefield effect context;
2. threatened highest-strength target(s) receive a very brief pre-impact emphasis;
3. ignition sweeps through all doomed targets nearly simultaneously;
4. affected cards char/flash and collapse/fade toward graveyard trajectory;
5. destroyed cards move to graveyard or vanish into a scorch-to-grave transition;
6. surviving row packs close using FLIP interpolation;
7. row scores count downward;
8. total scores follow;
9. Scorch card itself resolves to graveyard as dictated by the rules.

Keep the destructive read strong but short. Do not hide target identity under full-screen flames. Accessibility mode replaces flame motion with a high-contrast target flash + dissolve/fade.

### Weather

Weather must visually connect the special card with the rows it affects.

1. weather card travels to the central weather/status area;
2. a restrained environmental front spreads to the corresponding row type on both sides;
3. affected non-hero power values transition to weather-adjusted values;
4. row totals update;
5. persistent row treatment remains while weather is active.

Frost: edge frost/cold desaturation.
Fog: mild localized haze, never enough to reduce card legibility.
Rain: subtle wet sheen/rain streak cue around Siege rows.
Clear Weather reverses the treatments in a short synchronized clearing motion.

### Medic

1. Medic lands;
2. graveyard selection surface opens while battlefield remains visible;
3. chosen card highlights in graveyard context;
4. selected card rises out of grave context and travels to its row;
5. destination row reflows;
6. revived card's own on-play effects then enter the presentation queue if rules permit;
7. scores update after the revived sequence.

### Decoy

1. Decoy selection identifies valid friendly unit targets;
2. chosen unit lifts from row;
3. Decoy travels into the vacated slot/row;
4. returned unit travels toward hand;
5. row and hand compositors reconcile simultaneously;
6. score changes animate after exchange.

This should look like an exchange, not two unrelated teleports.

### Morale Boost

1. morale unit lands;
2. a short, quiet row-wide pulse passes through other eligible units;
3. affected unit values increment;
4. row/total score updates.

Lower spectacle than Horn.

### Hero

Hero placement receives a stronger material landing and a brief immunity crest/glint, then settles. The goal is recognition of special status, not a long hero cut-in.

### Leader activation

1. leader card lifts/tilts or illuminates in its dock;
2. ability-specific visual origin comes from leader area;
3. effect choreography executes on its target;
4. leader returns to a visibly spent state.

Passive leaders do not animate each time their continuous rule is consulted.

### Pass

Pass is strategically important and irreversible for the round.

1. press state is heavier than ordinary button taps;
2. PASS label locks into persistent player status;
3. player's hand subtly de-emphasizes to communicate no further plays;
4. turn state moves to opponent if applicable.

Do not use a modal confirmation every time; use strong state feedback and only consider confirmation as an optional accessibility/safety preference if user testing shows accidental passes.

### Round resolution

1. both pass / exhaustion trigger is recognized;
2. turn indicator becomes RESOLVING;
3. winning/losing totals hold briefly for comprehension;
4. round winner/loss life indicator updates;
5. non-retained cards flow or fade to graveyard in grouped row-clearing motion;
6. faction retention/resurrection effects resolve visibly;
7. weather clears if rules require;
8. next round hand/board state establishes;
9. new round indicator appears.

Normal round transition target: 800–1200 ms, skippable/accelerable after the first comprehension beat.

### Match result

Match-complete presentation may exceed normal motion hierarchy slightly but should remain restrained. The result should feel conclusive, not monetized or casino-like.

## Audio architecture

Sound should subscribe to the same semantic presentation events as animation. The current reference vocabulary strongly supports this approach because the Arun project already distinguishes many mechanic-specific sound categories.

Define sound hooks such as:
- UI_CARD_SELECT
- CARD_COMMIT_CLOSE / RANGED / SIEGE
- CARD_DRAW
- CARD_DISCARD
- SPY_TRIGGER
- HORN_TRIGGER
- BOND_TRIGGER
- MUSTER_TRIGGER
- MEDIC_TRIGGER
- DECOY_TRIGGER
- SCORCH_TRIGGER
- WEATHER_FROST / FOG / RAIN / CLEAR
- PASS
- TURN_PLAYER / TURN_OPPONENT
- ROUND_WIN / ROUND_LOSE
- GAME_WIN / GAME_LOSE

The implementation may use original-reference audio only when licensing/provenance permits. The semantic hook system itself must not depend on a particular sound asset.

## Haptic architecture

Apple's design guidance strongly supports haptics when they form a clear causal relationship with visual/audio feedback and are not overused.

For the web/PWA path, haptic support is capability-gated because vibration support remains inconsistent across Safari/WebKit. Therefore 10.4A/B should create semantic haptic hooks without requiring them for feedback.

Planned hooks:
- selection: very light tick;
- valid destination acquisition: optional subtle alignment tick;
- successful card commit: light impact;
- Horn: medium impact;
- Scorch: sharp/heavier impact;
- round won/lost: notification-like success/warning pattern in eventual native build.

In the eventual native iOS package, map these hooks to UIKit/Core Haptics. Haptics remain user-disableable.

## Reduced-motion and accessibility contract

`prefers-reduced-motion: reduce` must not merely shorten everything indiscriminately. It should replace spatial and depth-heavy movement with equivalent state communication.

Reduced-motion substitutions:
- card flight → short fade/scale transition between source and destination;
- large spring-back → direct fade/settle;
- Scorch flame sweep → target flash + dissolve;
- Muster cascade → grouped fade-in with minimal stagger;
- row reflow → short opacity crossfade or very small transform interpolation;
- weather environmental movement → static treatment fade;
- no repeated ambient particle motion.

Core actions remain equally understandable with sound muted and haptics absent. Color is never the only legal-destination signal.

Touch targets should strive for Apple's 44×44 pt default control size for major controls, with smaller visible objects receiving larger invisible hit regions where appropriate.

## Presentation queue rules

1. Each committed engine action produces one presentation transaction.
2. Presentation transactions may contain parallel and sequential phases.
3. New user input is blocked only for the minimum phases that could create ambiguity.
4. Pure score counting must never block interaction after board state is stable.
5. The queue may fast-forward on repeated taps only after the rules result is already committed.
6. `visibilitychange`, rotation, resize, or route changes can cancel visual animations and immediately reconcile to final state.
7. Save state is the deterministic engine state, never intermediate animation state.
8. Undo restores state, then uses a concise reverse/reconcile transition rather than attempting literal reverse playback of every particle.

## Motion tokens

Recommended initial token set:

```text
motion.micro.fast       80ms
motion.micro.normal    120ms
motion.routine.fast    180ms
motion.routine.normal  240ms
motion.routine.slow    320ms
motion.ability.fast    360ms
motion.ability.normal  480ms
motion.ability.slow    650ms
motion.major.normal    800ms
motion.major.slow     1100ms
```

Easing families:
- DIRECT: cubic-bezier(.2,.8,.2,1) — routine translation/selection.
- SETTLE: spring-like cubic or WAAPI keyframes with slight overshoot — card landing/return.
- IMPACT: fast-in/slow-out emphasis — Scorch/Horn target response.
- FADE: ease-out — information appearing/disappearing.

The implementation should prefer a small token vocabulary over bespoke timings for every effect.

## Interaction preference model

User-facing setting:

Card placement:
- HYBRID (default): tap-to-select + tap-row, and drag-to-place both enabled.
- TAP: drag disabled except optional board inspection gestures.
- DRAG: direct drag emphasized, tap still remains accessible for critical alternate actions.

Motion intensity:
- SYSTEM (default): follows reduced-motion preference.
- FULL
- REDUCED

Haptics:
- ON / OFF, capability-gated.

Sound:
- existing game audio preference system later controls effects/music independently.

## Research conclusions that are now locked

1. Pass 10.4 implementation must support both drag and two-tap placement.
2. Input is presentation-layer only; both methods dispatch identical GameActions.
3. Native HTML5 drag-and-drop is rejected for battlefield card movement.
4. Pointer Events + pointer capture are the selected input primitive.
5. Web Animations API + transforms/opacity are the primary animation primitive.
6. FLIP-style interpolation is the selected strategy for hand and row redistribution.
7. Motion is driven by semantic engine events, never by rules branching inside animations.
8. Major abilities receive distinct choreography; ordinary cards remain fast.
9. Scorch and Muster are signature showcase effects but must remain readable and skippable/accelerable.
10. Weather effects reinforce affected rows without reducing card legibility.
11. Sound and haptics are event subscribers, not embedded in game logic.
12. PWA haptics are optional/capability-gated; native iOS haptics are a future first-class target.
13. Reduced motion is a complete alternate presentation mode, not a degraded experience.
14. Pass 10.3 geometry/compositor remains authoritative; animation may move visual clones/transforms but may not change final slot logic.
15. The animation system must be interruption-safe and reconcile instantly to engine state.

## Exit criteria for 10.4R

Research is complete when:
- interaction model is chosen;
- motion architecture is specified;
- semantic choreography exists for common and signature mechanics;
- accessibility and reduced-motion behavior is specified;
- PWA implementation primitives are selected;
- timing/easing token vocabulary is defined;
- sound/haptic hooks are identified;
- implementation is decomposed into buildable subpasses with measurable gates.

All criteria are met by this document and the companion machine-readable contract / implementation blueprint.