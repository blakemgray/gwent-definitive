# Pass 10.4C — Feel / Presentation Polish Contract

## Mission

Take the trusted Pass 10.3 geometry, Pass 10.4A direct-manipulation path, and Pass 10.4B authored mechanic choreography and make the battlefield feel cohesive, physical, immediate, and native-quality on iPhone without changing classic Gwent rules or final battlefield geometry.

The goal is **not more animation**. The goal is better timing, tactile response, hierarchy, pacing, accessibility, feedback, and performance.

## Non-negotiable architecture

- `src/gwent-engine.js` remains authoritative for legality and outcomes.
- Pass 10.3 remains final battlefield geometry authority.
- Pass 10.4A remains the canonical tap/drag commit path.
- Pass 10.4B remains the mechanic/lifecycle cause→effect choreography layer.
- 10.4C may tune motion tokens, visual response, semantic feedback subscriptions, and performance behavior only.
- No animation callback may decide or roll back game state.
- Audio/haptic feedback subscribes to semantic presentation events; it never owns rules.
- Reduced-motion mode must preserve equivalent gameplay information.
- Interruption must still reconcile immediately to authoritative state.

## Feel targets

### Direct manipulation

- pointer-down response should be immediate and visually legible;
- selected cards should feel lifted rather than surrounded by debug chrome;
- legal destinations remain identifiable through shape/text/luminance, not color alone;
- active targets should feel magnetized without moving the 10.3 geometry;
- invalid drops should return quickly with restrained spring behavior;
- drag proxy should feel materially connected to the source card;
- ordinary committed placement should regain input quickly once ambiguity is gone.

### Motion language

- routine actions remain fast;
- signature effects retain readable authored beats;
- major effects do not linearly consume time as card counts rise;
- score/row response follows the visible cause and should not become the pacing bottleneck;
- overshoot is restrained and physical rather than rubbery;
- transform/opacity remain the preferred continuous properties.

### Semantic feedback

Provide a presentation-only feedback adapter with stable hook names for:

- selection;
- valid destination acquisition;
- ordinary card commit by row;
- draw/discard;
- Spy;
- Horn;
- Tight Bond;
- Muster;
- Medic;
- Decoy;
- Scorch;
- Frost/Fog/Rain/Clear Weather;
- Pass;
- turn change;
- round win/loss/draw;
- match win/loss/draw.

The adapter must expose independently controllable effects volume and mute state. Final licensed audio assets are intentionally deferred; hook names and routing are the durable contract.

Web haptics are capability-detected and optional. They must never be required for confirmation and default conservatively. A future native iOS adapter can map the same semantic hooks to UIKit/Core Haptics.

## Accessibility

Reduced motion must:

- eliminate long travel as a requirement for comprehension;
- remove major depth/parallax behavior;
- collapse secondary score/reflow interpolation;
- keep mechanic identity through concise fades/pulses/textual or structural cues;
- preserve legal-target and selected-state clarity;
- leave final DOM and engine state equivalent to normal motion.

Feedback must remain understandable with sound muted and haptics unavailable.

## Performance budget

Target: contemporary iPhone Safari/PWA in landscape.

Release goals:

- 60 fps target during ordinary interaction;
- no permanent animation loop at idle;
- drag updates use transform-only visual movement;
- no animation-induced scroll/layout thrash;
- no sustained major-effect jank;
- all registered `Animation` objects are cancelled/released after reconciliation;
- no unbounded transient DOM growth across repeated actions;
- presentation feedback subscribers remain disposable and do not duplicate on reinstall.

## QA gate

The inherited Pass 10.3/10.4A/10.4B release matrix remains mandatory.

10.4C adds targeted checks for:

- tuned motion-token contract and reduced-motion policy;
- pointer-down / selection / active-target visual response;
- ordinary tap and drag placement pacing;
- invalid return pacing;
- semantic feedback hook emission without engine mutation;
- mute/effects-volume settings behavior;
- optional haptic capability gating;
- no duplicate feedback subscriptions;
- no persistent animation loop or transient-node growth at idle;
- animation cleanup after cancellation/interruption;
- native iPhone landscape visual contact sheet covering the locked 10.4R quality list.

Minimum visual inspection set:

- hand selection;
- drag over legal and invalid territory;
- two-tap card flight;
- ordinary unit landing;
- Spy crossover + draws;
- single and multi-target Scorch;
- Horn;
- Tight Bond;
- small and large Muster;
- Frost/Fog/Rain/Clear;
- Medic;
- Decoy;
- Pass;
- round win/loss;
- reduced-motion equivalents.

## Release blockers

- any rules/engine outcome depends on feedback or animation completion;
- tap and drag diverge in rules outcome;
- 10.3 geometry changes to achieve visual polish;
- active/legal destinations become color-only;
- reduced motion omits mechanic information;
- audio/haptics become required to understand an action;
- idle page retains a permanent animation loop;
- presentation leaves stale DOM/transient nodes after cancellation;
- sustained jank appears in ordinary interaction or major effects;
- final visual artifact reads as diagnostic/debug UI rather than a premium Gwent battlefield.

## Handoff

Pass 10.4C is complete only after the latest branch head is green across all inherited + 10.4C gates, native iPhone-landscape visual evidence is inspected, `CONTINUITY.md` is updated, the PR is merged, and main verification + Pages deployment succeed.

After that, begin **Pass 11 — Golden Match / Complete Normal Match**.