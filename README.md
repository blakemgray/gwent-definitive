# Gwent Classic — Definitive Edition

Canonical JS-first hosted build.

## Runtime baseline — Pass 10.3 Battlefield UX Architecture

Pass 10.3 remains the current playable runtime. It replaces the old full-width visual-row assumption with Battlefield Geometry Contract v2:

- functional row territory is separate from the visual card rail;
- every row pack is mathematically centered;
- first and last cards are protected from clipping;
- sparse rows remain centered while dense rows compress only when required;
- the ten-card hand uses an independent centered compositor;
- turn state, pass state, total score, row score, cards, hand, weather, leader state, and tertiary counts follow an explicit information hierarchy;
- weather is reinforced on affected rows instead of living only in a central strip;
- the card inspector is narrower so tactical board context remains visible;
- the six-row structural requirement remains non-negotiable.

## Pass 10.4R — Interaction & Motion Research

The research/specification pass preceding animation implementation is complete. It locks the interaction language before runtime animation code is added.

Core decisions:

- Hybrid placement is the default: tap-select + tap destination and direct drag are both first-class.
- Both input methods dispatch the same validated GameAction.
- Pointer Events + pointer capture are the selected drag primitive; native HTML drag-and-drop is rejected for the battlefield.
- Web Animations API plus transform/opacity motion is the primary animation path; requestAnimationFrame is reserved mainly for live pointer-following.
- Hand and row redistribution use FLIP-style interpolation around the Pass 10.3 compositor's authoritative final positions.
- Engine state commits before presentation; animation can never decide rules outcomes.
- Scorch, Muster, Spy, Horn, Weather, Medic, Decoy, Bond, pass, round resolution, and related effects have explicit semantic choreography.
- Audio and future haptics are subscribers to semantic presentation events rather than rules logic.
- Reduced-motion mode has mechanic-specific substitutions and must retain equivalent gameplay clarity.
- The animation system must be interruption-safe: rotation, visibility changes, skips, or cancelled effects reconcile directly to deterministic engine state.

Research artifacts:

- `docs/PASS10_4R_INTERACTION_MOTION_RESEARCH.md`
- `config/interaction-motion-contract.json`
- `docs/PASS10_4R_IMPLEMENTATION_BLUEPRINT.md`
- `docs/PASS10_4R_SOURCE_NOTES.md`

The next implementation sequence is 10.4A Direct Manipulation, 10.4B Gameplay Choreography, then 10.4C Feel / Accessibility / Performance.

### Battlefield QA matrix

CI drives the live app at 852×393 through sparse rows (1, 2, 4 cards), ordinary density (8), swarm density (12), all six rows populated, all-weather state, opponent-passed state, ten-card and three-card hands, inspector-open state, and save/restore. Screenshots are archived from every verification run for visual review.

### Local checks

```bash
npm test
python -m http.server 4173
GWENT_TEST_URL=http://127.0.0.1:4173 python tests/ui_smoke.py
```

Production deployment occurs only after verification succeeds on `main`.
