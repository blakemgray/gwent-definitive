# Pass 10.4R — Source Notes and Evidence Levels

This file records the evidence used to design the Interaction & Motion System. It distinguishes normative platform guidance from classic-Gwent reference evidence and project-specific design inference.

## A. Normative / high-authority platform guidance

### Apple Human Interface Guidelines — Motion
https://developer.apple.com/design/human-interface-guidelines/motion

Used for:
- motion as feedback/status/instruction rather than spectacle alone;
- keeping custom motion coherent with platform expectations.

### Apple HIG — Gestures
https://developer.apple.com/design/human-interface-guidelines/gestures

Used for:
- tap and drag as familiar standard gestures;
- immediate gesture feedback;
- supporting more than one interaction method;
- avoiding a custom gesture as the only way to perform an important action.

### Apple HIG — Drag and drop
https://developer.apple.com/design/human-interface-guidelines/drag-and-drop

Used for:
- visible legal-destination feedback;
- invalid-drop feedback / return to source;
- offering alternatives to drag-and-drop;
- allowing a direct single-motion drag where appropriate.

### Apple HIG — Accessibility
https://developer.apple.com/design/human-interface-guidelines/accessibility

Used for:
- target sizing and spacing;
- alternatives to gestures;
- simple common interactions;
- reduced-motion accommodations;
- avoiding reliance on one feedback channel.

### Apple HIG — Playing haptics
https://developer.apple.com/design/human-interface-guidelines/playing-haptics

Used for:
- causal haptic mapping;
- synchronized visual/audio/tactile feedback;
- avoiding overuse;
- keeping haptics optional.

### Apple HIG — Game controls
https://developer.apple.com/design/human-interface-guidelines/game-controls

Used for:
- direct touch interaction with game objects where practical;
- minimizing unnecessary virtual-control overlays.

## B. Web implementation references

### MDN — Pointer Events
https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

Used for:
- one pointer model across touch/mouse/pen;
- pointer cancellation semantics;
- input-handler performance guidance;
- touch-action relationship.

### MDN — setPointerCapture()
https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture

Used for:
- maintaining drag control after the pointer leaves the source card bounds.

### MDN — touch-action
https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action

Used for:
- preventing unwanted browser gesture interception on the direct-manipulation surface;
- caution against globally disabling zoom/pan behavior.

### MDN — Web Animations API / Element.animate()
https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
https://developer.mozilla.org/en-US/docs/Web/API/Element/animate

Used for:
- script-controlled, browser-optimized animation timing;
- keeping animation objects explicit and cancellable.

### MDN — requestAnimationFrame()
https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame

Used for:
- live pointer-following visual updates synchronized to repaint;
- correct timing on different refresh-rate displays.

### MDN — Animation performance
https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate
https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance

Used for:
- transform/opacity-first motion;
- avoiding expensive layout-heavy per-frame animation;
- keeping interaction smooth and responsive.

### WebKit historical issue references
https://bugs.webkit.org/show_bug.cgi?id=227635
https://bugs.webkit.org/show_bug.cgi?id=193917

Used cautiously for:
- rejecting native HTML5 drag-and-drop as the game-board primitive;
- preferring Pointer Events / pointer capture for direct manipulation.

These bug reports are historical evidence, not proof of a current Safari defect. The design decision is primarily architectural: HTML drag-and-drop semantics are unnecessary for an in-game card surface when Pointer Events provide a cleaner direct-manipulation model.

## C. Classic Gwent reference evidence

### CDPR Gwent manual
https://cdn-l-thewitcher.cdprojektred.com/media/TW3/Pdf/GwentManuals/en-Manual-Gwent-ONLINE.pdf

Used for:
- rules semantics that the presentation must communicate, including Muster, Spy, Agile, Medic, Tight Bond, Morale Boost, Scorch, and Commander's Horn.

It is a rules reference, not an animation specification.

### Arun Sundaram — gwent-classic
https://github.com/asundr/gwent-classic

Used for:
- classic-remake interaction vocabulary;
- evidence that ability-specific motion/audio treatment is valuable;
- reference calls including `card.animate("horn")`, `card.animate("muster")`, and Scorch animation before graveyard transfer;
- a 1000 ms card-placement duration constant in the remake;
- dedicated sound categories.

Observed sound vocabulary in Arun's `sfx/` directory includes:
- bond
- clear
- common close / ranged / siege
- decoy
- discard
- draw
- fog
- frost
- hero
- horn
- mardroeme
- medic
- morale
- muster
- pass
- rain
- redraw
- scorch
- spy
- player/opponent turn
- round win/loss
- game win/loss
- UI card interactions

Important limitation: Arun's code is a fan remake and is not treated as authoritative proof of CDPR's exact original timing, easing, or visual implementation.

## D. Public gameplay observation

Representative public Witcher 3 gameplay footage was reviewed as a qualitative reference for the original minigame's pacing and physical-card character. The research does not claim exact frame timings from video because the available source tooling did not provide a frame-accurate event annotation workflow.

Therefore:
- claims about classic Gwent rules come from the official manual / source parity work;
- claims about Arun implementation come from Arun's source;
- proposed timing tokens and choreography in 10.4R are Gwent Definitive design decisions informed by platform guidance and qualitative reference, not claims about the original game.

## E. Project-specific inference

The following are deliberate Gwent Definitive choices rather than sourced facts:
- hybrid tap + drag as default placement mode;
- 7–10 px initial drag threshold target;
- selected-card scale 1.06–1.10;
- the exact motion token timings;
- FLIP-style row/hand redistribution;
- adaptive Muster cadence;
- Scorch target pre-emphasis before destruction;
- compact leader-origin choreography;
- presentation queue architecture;
- reduced-motion substitutions for each effect;
- the separation of 10.4 into A/B/C implementation subpasses.

These choices should be validated through actual iPhone playtesting and may be tuned without changing the underlying research principles.