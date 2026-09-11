# Gwent Classic — Definitive Edition

Canonical JS-first hosted build.

> **Project handoff / continuity:** read both [`CONTINUITY.md`](CONTINUITY.md) and [`FUTURE_CONTINUITY.md`](FUTURE_CONTINUITY.md) before starting a new pass. `CONTINUITY.md` is the canonical running record for doctrine, pass history, current repository state, QA evidence, known debt, and the exact next action. During active development it is updated at the start of each work cycle and again during merge/deploy closeout. `FUTURE_CONTINUITY.md` preserves intended forward direction across conversation limits.

## Current implementation status

**Pass 10.4C — Feel / Presentation Polish is complete, merged, fully green, visually approved, and deployed to production.** Pass 10.3 remains the authoritative battlefield geometry/layout baseline, Pass 10.4A remains the canonical direct-manipulation/action foundation, Pass 10.4B remains the cause→effect gameplay choreography layer, and Pass 10.4C is the tactile feel/feedback/accessibility polish layer on top of them.

The next implementation milestone is **Pass 11 — Golden Match / Complete Normal Match**. Post-Pass-11 requirements are established in `FUTURE_CONTINUITY.md`; later exact pass numbers are intentionally not yet locked.

Production evidence for 10.4C: PR #8 final head `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`; merge/runtime `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`; final PR Run #136 / `34620304920` fully green; production Run #137 / `34621157464` fully green with Pages deployment success.

## Runtime baseline — Pass 10.3 Battlefield UX Architecture

Pass 10.3 remains the battlefield geometry authority:

- functional row territory is separate from the visible card rail;
- every row pack is mathematically centered;
- first and last cards are protected from clipping;
- sparse rows remain centered while dense rows compress only when required;
- the ten-card hand uses an independent centered compositor;
- turn state, pass state, total score, row score, cards, hand, modifiers, then tertiary counts follow an explicit information hierarchy;
- weather is reinforced on affected rows instead of living only in a central strip;
- the card inspector is narrower so tactical context remains visible;
- the six-row structure remains non-negotiable.

## Pass 10.4R — Interaction & Motion Research

The specification pass preceding interaction/choreography implementation is complete.

Core decisions:

- Hybrid placement is the default: tap-select + tap destination and direct drag are both first-class.
- Both input methods dispatch the same validated GameAction.
- Pointer Events + pointer capture are the drag primitive; native HTML drag-and-drop is rejected for the battlefield.
- Web Animations API plus transform/opacity motion is the primary animation path; requestAnimationFrame is reserved mainly for live pointer-following.
- Hand and row redistribution use FLIP-style interpolation around Pass 10.3's authoritative final positions.
- Engine state commits before presentation; animation can never decide rules outcomes.
- Scorch, Muster, Spy, Horn, Weather, Medic, Decoy, Bond, pass, round resolution, and related effects have explicit semantic choreography.
- Audio and future haptics subscribe to semantic presentation events rather than rules logic.
- Reduced-motion mode has mechanic-specific substitutions and retains equivalent gameplay clarity.
- Rotation, visibility changes, skips, or cancelled effects reconcile directly to deterministic engine state.

Research artifacts:

- `docs/PASS10_4R_INTERACTION_MOTION_RESEARCH.md`
- `config/interaction-motion-contract.json`
- `docs/PASS10_4R_IMPLEMENTATION_BLUEPRINT.md`
- `docs/PASS10_4R_SOURCE_NOTES.md`

Implementation sequence from 10.4R:

1. **10.4A Direct Manipulation — complete**
2. **10.4B Signature Gameplay Choreography — complete / production**
3. **10.4C Feel / Presentation Polish — complete / production**
4. **Pass 11 Golden Match / Complete Normal Match — next**

## Pass 10.4A — Direct Manipulation

The production interaction foundation provides:

- tap-select → tap legal destination;
- direct Pointer Events drag;
- pointer capture + 8 px activation threshold;
- legal destinations exclusively from engine `legalActions`;
- one canonical action commit path for tap and drag;
- invalid-drop zero mutation;
- source placeholder + drag/landing proxies;
- FLIP redistribution around Pass 10.3 geometry;
- inspector as secondary intent;
- keyboard destination / Escape cancellation;
- reduced-motion equivalents;
- presentation-aware bot gating;
- interruption/failure cleanup and save/restore integrity.

## Pass 10.4B — Signature Gameplay Choreography

Pass 10.4B adds a presentation-only semantic choreography layer without changing classic rules, Pass 10.3 final geometry, or the Pass 10.4A canonical input/action path.

Implemented presentation language includes:

- cause-before-consequence sequencing for Scorch, Muster, Spy, Commander’s Horn, Weather/Clear Weather, Medic, Decoy, Tight Bond, Morale, leaders, Hero landings, draw/pass, round resolution, match result, Monster retention, and Skellige/round-start lifecycle effects;
- presentation-only pre/post visual snapshots so destructive/swap/round effects preserve identity even though engine state has already committed;
- serialized, cancellable choreography on the existing presentation queue;
- external Pass/leader/choice/Medic bot gating so opponent state cannot mutate during unresolved player presentation;
- viewport-clamped cues, reduced-motion equivalents, and interruption-safe cleanup;
- explicit runtime/PWA load graph rather than semantic-adapter bootstrapping;
- synchronous Pass 10.3 reconciliation before post-action visual capture so external actions cannot snapshot raw pre-layout DOM geometry.

Primary contract:

- `docs/PASS10_4B_CHOREOGRAPHY_CONTRACT.md`

## Pass 10.4C — Feel / Presentation Polish

Pass 10.4C is the final interaction-layer polish pass before Golden Match. It is presentation-only and preserves the deterministic engine, frozen 10.3 geometry, 10.4A canonical action path, and 10.4B choreography causality.

Implemented and now in production:

- tuned motion timing/easing and physical card-weight vocabulary;
- tactile press state and lifted selection treatment;
- cleaner legal and active target feedback without the old debug-style selected pill;
- reduced-motion equivalents that preserve target/action information;
- semantic feedback adapter for selection, valid destination, card commit, draw, Spy, Horn, Bond, Muster, Medic, Decoy, Scorch, Weather/Clear, Pass, turn, round result, and game result;
- effects-volume and mute persistence;
- optional capability-gated web haptics, off by default;
- semantic audio hooks decoupled from final media assets and rules logic;
- explicit 10.4C runtime/PWA/deploy graph;
- visible release-identity ownership moved out of lower 10.4B substrate and into the current presentation layer;
- player-facing cleanup of integration-era copy such as `ENGINE RESOLVED` / `ENGINE CHOICE` without changing engine logs or developer tooling.

Run #133 / `34617300625` on implementation head `ee600e8b856b9743ad4a58501b7a84b11f40dbb2` passed every inherited and 10.4C-specific gate. Artifact `10270749326` was manually reviewed at 852×393 and approved: selection weight, active targeting, ordinary landing, invalid return, reduced motion, settings, and representative 10.4B mechanic/lifecycle frames showed no release-blocking visual regression.

The final docs-inclusive PR head `e6a357606c6d0e978ceabf93e2f456377b3f6ac2` then passed Run #136 / `34620304920`, and merged production SHA `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d` passed Run #137 / `34621157464` with Pages deployment success.

Measured QA evidence on the approved candidate included ~25.7 ms pointer press response and ~237.7 ms invalid-return completion. These are evidence only; hosted-runner timing is not used as a reason to weaken visual or accessibility review.

Primary contract:

- `docs/PASS10_4C_FEEL_PRESENTATION_CONTRACT.md`

## Battlefield / interaction QA matrix

CI drives the live app at 852×393 through sparse rows, ordinary density, swarm density, all six rows populated, all-weather state, passed state, ten-card/three-card hands, inspector-open state, and save/restore. Screenshots are archived for visual review.

Pass 10.4A additionally gates direct manipulation, tap/drag parity, interruption/failure recovery, semantic landing continuity, lifecycle/save-restore behavior, stress trials, and WebKit/iPhone-targeted interaction.

Pass 10.4B additionally gates signature choreography, reduced-motion/cancellation reconciliation, plus an adversarial eight-scenario matrix covering tied multi-row Scorch, 8+ Muster, Spy 10→11 hand pressure, Horn over Tight Bond, all-weather Clear Weather, Medic→Muster nesting, Decoy-on-Spy, and Round 2→3 Monster retention + Skellige resurrection.

Pass 10.4C additionally gates tactile selection/target feedback, ordinary landing/invalid-return pacing, semantic audio/haptic hook dispatch, persisted feedback settings, reduced-motion feel, duplicate-install/transient-leak protection, player-facing copy cleanup, and visual artifact generation.

### Local checks

```bash
npm test
python -m http.server 4173
GWENT_TEST_URL=http://127.0.0.1:4173 python tests/ui_smoke.py
```

Production deployment occurs only after verification succeeds on `main`.
