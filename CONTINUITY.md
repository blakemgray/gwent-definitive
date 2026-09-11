# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff. Recover the project from this file plus the repository, not chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Current production runtime / Pass 10.4C merge:** `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`  
**Current verified repository main head:** `388f90cf230492093a89ccb67a67bd929ad4a12d`  
**Latest exact-head verification:** run #141 / `34625822361` — full verify **success**, Pages deploy **success**  
**Current completed production milestone:** **Pass 10.4C — Feel / Presentation Polish**  
**Current active implementation milestone:** **None — Pass 11 has not started**  
**Current active repository task:** **Pre-Work continuity / roadmap / model-routing transition checkpoint**  
**Current transition branch:** `docs/pre-work-pass11-transition`  
**Current transition PR:** none yet  
**Estimated transition-checkpoint completion:** **20%**  
**Next implementation milestone:** **Pass 11 — Golden Match / Complete Normal Match**  
**Last updated:** 2026-09-11 America/New_York

Pass 10.4C remains complete, merged, fully verified on `main`, visually approved, and deployed. Run #141 re-proved the full verification matrix and Pages deployment on the terminal Pass-10.4C repository-closeout head. No gameplay implementation is active during this transition checkpoint. The purpose of this branch is to preserve the live-play findings, revised Pass 11 intent, expanded QA doctrine, and model-routing discipline before handing substantial work to ChatGPT Work.

---

# 0. Mandatory continuity protocol

This file is authoritative for implemented/current project state. `FUTURE_CONTINUITY.md` is the forward-roadmap companion. `MODEL_ROUTING.md`, once present, governs model/effort recommendations for Work/Codex cycles but never overrides product or repository authority.

Source precedence:

1. Current explicit user instruction.
2. Current repository code + green CI behavior.
3. This file.
4. `FUTURE_CONTINUITY.md`.
5. Current pass contracts/config.
6. `MODEL_ROUTING.md` for model/effort selection only.
7. Older archives.
8. Chat memory.

### Start-of-task rule

For every new implementation task or resumed work cycle:

1. Read the current branch's `CONTINUITY.md` first.
2. Read `FUTURE_CONTINUITY.md`; if `MODEL_ROUTING.md` exists, read it before choosing a model/effort level.
3. **Write an actual checkpoint update to this file in GitHub before doing further implementation work.** Chat-only continuity does not count.
4. Record active pass/task, branch/PR/head, latest meaningful CI evidence or blocker, exact next action, and estimated completion percentage.
5. Percentage is for visibility only; never compress scope, rush QA, skip visual review, or weaken a gate.
6. Every user-facing progress report should include the current percentage.
7. Every user-facing work message should end with a concrete **Next action**.
8. On merge/deploy or task completion, update this file again with final SHAs, CI, artifacts, visual findings, remaining debt, and handoff.

### Model-transparency rule

Before every substantial phase, report:

- current phase/task;
- completion percentage;
- recommended model and reasoning effort;
- why that level is justified;
- what condition would justify escalation or de-escalation.

Model escalation is a recommendation, not permission. GPT-6 Astra allowance is scarce on the current Plus plan. Do not silently spend Astra merely because it is available; default to the least-expensive model/effort that can reliably complete the task to the required standard.

---

# 1. Locked product doctrine

## Mission

Build the definitive modern implementation of **classic The Witcher 3 Gwent**, using Arun Sundaram's `asundr/gwent-classic` as the behavior/card/rules oracle while keeping the runtime deterministic, testable, mobile-first, and engine/presentation separated.

Match classifications remain `CLASSIC`, `ASSISTED`, `MODIFIED`, `SANDBOX`; statistics must not blur them together.

## Rules

- Preserve classic TW3 Gwent rules/card behavior.
- Engine state is authoritative and deterministic.
- Presentation never decides legality/outcomes.
- Animation failure never rolls back a valid committed action.
- AI difficulty comes from better reasoning, never hidden-information cheating.

## Interaction

- JS-first hosted PWA; iPhone landscape is the primary gameplay target.
- Hybrid tap-select→tap-destination and direct Pointer Events drag.
- Both dispatch the same canonical validated action.
- Invalid gestures return visually with zero mutation.
- Reduced motion preserves equivalent gameplay clarity.
- Player intent should be interpreted generously when unambiguous and conservatively when a specific target matters.
- Cards should behave as persistent physical objects rather than transient UI tokens.

### Physical-card north star

The user-standard for interaction is intentionally simple and severe:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

That means manipulation, target acquisition, rejection, landing, audiovisual feedback, and haptic feedback should be understandable through direct physical intuition rather than interface decoding.

## Visual language

Witcher 3 atmosphere + premium physical tabletop + modern iOS discipline: dark wood, iron, parchment, leather, aged brass/gold, ivory; restrained effects; no generic free-to-play visual language.

## Battlefield geometry authority

**Pass 10.3 Battlefield Geometry Contract v2 is frozen authority.** Final order: Opponent Siege / Ranged / Close / Weather / Player Close / Ranged / Siege. Later motion may interpolate around final slots but may not replace geometry math.

Temporary physical manipulation, neighbor displacement, target exposure, throw/flick motion, and effect choreography may consume live geometry and interpolate above it; at rest and after reconciliation, 10.3 final geometry remains authoritative.

---

# 2. Canonical architecture

```text
Card DB / rules data
        ↓
GameState
RuleEngine / ActionEngine / EffectEngine / ScoreEngine
        ↓
AI / Cheats / Replay / Undo
        ↓
Presentation API / semantic event adapter
        ↓
Battlefield UX / gestures / choreography / audio / haptic hooks
        ↓
Hosted web app / PWA / future native-quality iOS shell
```

Locked architecture:

- stable card IDs + per-match `iid`s;
- semantic event/action logs;
- one rules path regardless of input method;
- engine commits before presentation;
- presentation is disposable;
- interruption/failure reconciles to engine truth;
- bot/opponent mutation cannot occur inside unresolved player presentation;
- visual continuity may be preserved through persistent presentation actors keyed by `iid`, but those actors may never become rules authority.

Key runtime files:

- `src/gwent-engine.js` — deterministic rules engine.
- `src/cards-catalog.js` — 216-card catalog.
- `src/battlefield-ux.js` — frozen 10.3 geometry/reconciliation authority.
- `src/motion-tokens.js` — shared motion/reduced-motion policy, tuned by 10.4C.
- `src/presentation-queue.js` — serialized cancellable presentation transactions.
- `src/interaction-turn-gate.js` — 10.4A bot gate.
- `src/presentation-events.js` — 10.4B semantic before/after + engine-delta adapter.
- `src/gameplay-choreography.js` — 10.4B choreography runtime.
- `src/choreography-external-gate.js` — 10.4B external-action/Auto-Bot gate + synchronous 10.3 geometry sync; no visible milestone ownership.
- `src/gesture-controller.js` — 10.4A canonical direct-manipulation controller.
- `src/presentation-feedback.js` — 10.4C semantic audio/optional-haptic subscriber + player-facing copy normalization.
- `feel-polish.css` — 10.4C tactile polish layer.

All active runtime modules are explicit in `index.html` and the PWA/deploy graph. Dynamic loading from semantic adapters remains rejected.

---

# 3. Engine / catalog baseline

Established parity:

- 216/216 card definitions;
- 44/44 known ability tokens;
- 22/22 leaders;
- 5/5 factions.

Engine supports ordinary play, Spy, Tight Bond, Muster, Medic + pending choice, Decoy, Weather/Clear, Horn, row/leader Horn, Scorch/row Scorch, Hero, passing/auto-pass, round resolution, factions, leaders, and deterministic legal actions.

---

# 4. Deployment workflow and current production

Workflow: `.github/workflows/deploy-pages.yml`

Policy: branch → PR → full static/browser/geometry/interaction/WebKit/pass-specific gates → visual inspection → latest-head green → merge → full `main` verification → Pages deploy → final continuity update.

## Current production snapshot — Pass 10.4C

- PR #8 merged.
- Final PR head: `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`.
- Merge/runtime SHA: `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`.
- Final PR validation: run #136 / `34620304920` — every gate **success**.
- Production verification + Pages deployment: run #137 / `34621157464` — verify **success**, deploy **success**.
- README-aligned docs head: `a6851a1d5959ee530a0644b21529e606ea621c5f`.
- README-aligned verification + Pages deployment: run #140 / `34623641751` — verify **success**, deploy **success**.
- Terminal repository-closeout head: `388f90cf230492093a89ccb67a67bd929ad4a12d`.
- Terminal repository-closeout verification + Pages deployment: run #141 / `34625822361` — verify **success**, deploy **success**.
- Visually approved release artifact: `10270749326` / `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`.

Run #137 passed static engine/catalog/PWA/motion/direct-manipulation/choreography/feel validation, frozen 10.3 geometry, full 10.4A interaction/touch/parity, presentation-aware bot gating, disposable failure recovery, 256-trial physical stress / 512 committed interactions, semantic landing, lifecycle/save-restore, WebKit/iPhone, primary 10.4B choreography, the eight-scenario 10.4B adversarial matrix, and the 10.4C feel/feedback/reduced-motion/pacing gate. Production site staging/upload/deploy succeeded.

Run #140 repeated the complete matrix on the documentation-aligned main head. Run #141 repeated the full matrix once more on the terminal Pass-10.4C repository-closeout head and successfully deployed Pages. No runtime change occurred between the 10.4C merge and these documentation-only closeout heads.

---

# 5. Pass history

Historical entries remain explicit; do not invent missing history.

- **Pass 5:** initial interactive prototype; preview limitations are not production requirements.
- **Pass 5B:** no-JS/hash workaround; intentionally abandoned as production direction.
- **Pass 6:** art/inspector investigation; identified preview and WebKit positioning issues.
- **Pass 6.1:** inspector recovery + explicit assist states.
- **Pass 7:** deterministic engine foundation, seeded RNG, stable instances, legal actions, semantic logs, classifications, history.
- **Pass 8:** complete 216-card catalog migration + UI integration.
- **Pass 9:** source-parity rules completeness; fixed Horn occupancy, exhaustion, Scorch/Decoy legality, lifecycle defects.
- **Pass 10:** rejected bespoke battlefield attempt; live DOM geometry is authoritative.
- **Pass 10.1:** deterministic six-row battlefield recovery.
- **Pass 10.2:** continuity gap; no verified standalone dossier—do not invent one.
- **Pass 10.3:** frozen Battlefield Geometry Contract v2 and centered/compressed row/hand compositor.
- **Pass 10.4R:** complete interaction/motion research; locked sequence 10.4A → 10.4B → 10.4C → Pass 11.

## Pass 10.4A — Direct Manipulation

**Status:** complete / merged / green.  
PR #5 merge `7367cd69042d93f0f895bc9150f0207df30f8f1c`; WebKit stabilization `731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`.

Locked foundation: tap/drag parity; Pointer Events; 8 px threshold; pointer capture; engine `legalActions`; one `commitAction()`; zero-mutation invalid return; placeholders/proxies; FLIP; inspector secondary intent; keyboard/Escape; reduced motion; bot gate; semantic landing; disposable presentation failure; persistence/interruption cleanup.

## Pass 10.4B — Signature Gameplay Choreography

**Status:** complete / merged / green / deployed.  
PR #7; final PR head `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`; merge/runtime `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`.

Locked behavior: engine-first; choreography owns no rules state; cause before consequence; destructive identity before collapse; score after visible cause; same language for opponent actions; reduced-motion equivalents; external Auto-Bot gate; post-action snapshot only after synchronous 10.3 reconciliation.

Coverage: Scorch, Muster, Spy, Horn, Weather/Clear, Medic, Decoy, Bond, Morale, Leader, Hero, draw/discard, Pass, rounds, match result, Monster retention, Skellige resurrection, Northern Realms draw. Adversarial QA covers tied Scorch, 8+ Muster, Spy 10→11, Horn+Bond, all-weather Clear, Medic→Muster, Decoy-on-Spy, Round 2→3 retention + two Skellige returns.

## Pass 10.4C — Feel / Presentation Polish

**Status:** **COMPLETE / MERGED / GREEN / DEPLOYED TO PRODUCTION.**

Branch: `pass-10-4c-feel-presentation-polish`  
PR: #8  
Green implementation head: `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`  
Final PR/docs head: `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`  
Merge/runtime SHA: `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`  
Final PR CI: run #136 / `34620304920` — **success**  
Production CI + Pages: run #137 / `34621157464` — verify **success**, deploy **success**  
README-aligned docs verification + Pages: run #140 / `34623641751` — verify **success**, deploy **success**  
Terminal closeout verification + Pages: run #141 / `34625822361` — verify **success**, deploy **success**

### Implemented

- 10.4C motion/easing/physical-feel vocabulary in `motion-tokens.js`.
- `feel-polish.css`: tactile press, lifted selection, cleaner legal/active target treatment, reduced-motion equivalent; no geometry ownership.
- `presentation-feedback.js`: presentation-only semantic feedback hooks for selection, valid destination, row-specific commit, draws, Spy, Horn, Bond, Muster, Medic, Decoy, Scorch, Weather/Clear, Pass, turns, round result, and game result.
- Persisted effects volume + mute.
- Optional web haptics are capability-detected, opt-in, and off by default.
- Final audio assets remain decoupled from rules; 10.4C provides semantic hooks rather than binding media to game logic.
- Explicit 10.4C load/PWA/deploy graph.
- Lower-layer 10.4B code no longer overwrites visible current-pass milestone/build identity; static regression guard locks ownership.
- Presentation-only normalization removes development-era `ENGINE RESOLVED` / `ENGINE CHOICE` language from ordinary player-facing feedback while preserving semantic logs/developer tooling/engine behavior.
- Browser QA rejects engine jargon in ordinary landing and Medic presentation.

### Manual visual approval

Artifact `10270749326` was manually inspected at the canonical 852×393 target and approved before merge.

Verified:

- physical selection lift/weight without the old debug `SELECTED` pill;
- clear structural/gold active-target feedback;
- ordinary landing centered and clean, with player-facing `REDANIAN FOOT SOLDIER` rather than engine jargon;
- invalid drag returns cleanly with no persistent transient;
- reduced motion preserves legal-destination clarity;
- feedback settings integrate into the normal scrollable Settings surface;
- Medic signature presents `REVIVE`; nested Medic→Muster uses `MEDIC · UNIT REVIVED` and correct card-scale geometry;
- representative Scorch, Muster, Spy, Horn, Weather/Clear, Decoy, Leader, round-resolution, reduced-motion, interruption, Monster-retention, and Skellige-return frames show no visual regression.

Measured evidence from the approved candidate: pointer press ~25.7 ms; invalid return ~237.7 ms. These values are evidence only and do not justify skipping visual/accessibility review.

### 10.4C authority handoff

Pass 10.4C is closed. Do not reopen it unless current production evidence exposes a genuine regression. The interaction/presentation stack is now:

- 10.3 — final geometry authority;
- 10.4A — canonical direct manipulation/action path;
- 10.4B — engine-first mechanic/lifecycle choreography;
- 10.4C — tactile feel, feedback, reduced-motion polish, semantic audio/haptic hooks, copy cleanup, and presentation consistency.

---

# 6. Pre-Pass-11 live play findings and revised product intent

A real installed-iPhone-PWA play session after Pass 10.4C produced new product-level evidence. These findings do **not** automatically reopen 10.3/10.4A/10.4B/10.4C; they redefine what the next production-quality Golden Match must prove unless a current regression is separately demonstrated.

## Functional / normal-match findings

- Instant Match visibly behaved like an integration-sized setup rather than a production normal match: observed state showed 8-card hands, 6-card decks, and two cards already played per side, implying a 16-card total state rather than a legal classic deck.
- Pass 11 must therefore remove disguised integration/demo initialization from the ordinary normal-match path and use genuinely legal full-size deck initialization.

## Battlefield readability findings

- Battlefield cards currently become too small and token-like, particularly compared with available row space.
- Played unit cards do not adequately preserve the full card identity/art presentation.
- Played unit cards do not visibly expose their current power score at the level required for strategic scanning.
- Sparse rows should use available space; dense rows may progressively compress/overlap, but essential card identity and current power must remain readable.

## Physical-card interaction findings

The current drag tracking feels strong and should be preserved. The next interaction layer should add physical truthfulness without weakening deterministic rules or tap/drag parity:

- visual card identity should remain continuous through hand → manipulation → effect → battlefield/graveyard/returned hand; avoid perceptible disappear/reappear transitions;
- nearby cards should yield subtly and predictably around the manipulated card so relevant cards become more visible while deciding;
- target-specific actions such as Decoy must expose the exact candidate target before release through lift, visibility, emphasis/glow, and localized neighbor movement rather than broad row reflow;
- ordinary unambiguous row placement may use a meaningful forgiveness territory;
- overshoot/flick trajectories may contribute to intent only when the destination is unambiguous;
- merely crossing eligible territory must not itself force placement;
- ambiguous actions such as Decoy must demand more precise target commitment and should return cleanly when intent is uncertain;
- invalid or insufficiently clear releases return physically to origin with zero rules mutation;
- velocity-aware throwing/flicking is desirable where it can remain intuitive and deterministic at the action-selection boundary;
- tap placement remains first-class: a tapped card should move itself convincingly into the same canonical final destination.

## Pacing / audiovisual findings

- Current consequence animations are generally too fast/snappy for the desired normal-match feel; interaction itself should stay immediate, while important consequences may breathe.
- Signature mechanics should use authored cause → effect pacing rather than generic fast transitions.
- Scorch communicates destruction mechanically but should feel like combustion/destruction: ignition/burning/disintegration character, synchronized sound, then board/score consequence.
- Weather, Horn, Spy, Medic, Muster, Decoy, round transitions, and other signature mechanics need coherent audiovisual identities rather than generic confirmation feedback.
- The user reported **no audible sound at all** in the installed iPhone PWA despite existing semantic audio hooks. Treat this as an unresolved player-facing QA finding until real-device audio behavior, mute/volume defaults, WebKit audio unlock/lifecycle, asset playback, and error paths are verified.

## Haptic findings / intent

Haptics are part of the physical-card illusion rather than optional decoration. Desired semantic moments include:

- long-press/pickup/grasp;
- cards yielding or stepping aside;
- entering/locking a valid destination;
- board impact/settle;
- invalid-return/rejection;
- selected signature effect beats where stronger feedback is appropriate.

Web/PWA capability limitations must be measured honestly. Automated QA can verify requested haptic semantics/timing, but actual iPhone tactile quality requires real-device signoff. If the PWA cannot achieve the intended iPhone tactile language, preserve the future native-wrapper path rather than faking certainty.

## Geometry-independence requirement

Physics, card interaction, forgiveness, target exposure, animation, and audiovisual sequencing should consume live semantic battlefield/card geometry rather than hard-coded viewport coordinates. Future board-dimension changes must not require rewriting each interaction or mechanic.

---

# 7. Revised Pass 11 meaning

`FUTURE_CONTINUITY.md` remains forward-roadmap authority after current explicit instruction and current repository/green-CI state.

**Next implementation milestone: Pass 11 — Golden Match / Complete Normal Match.**

Pass 11 still must validate one complete normal match with legal deck initialization, opening draw/mulligan, direct-manipulation hand, all required choice dialogs, player/opponent turns, passing/exhaustion, scoring, rounds, factions/lives, best-of-three result, restart/rematch, and save integrity without developer shortcuts.

Live play has raised the minimum production bar. A Golden Match is not complete merely because start→finish rules execute. Pass 11 must also establish the minimum viable physical-card truthfulness required for a production-quality normal match:

- legal full-size normal-match initialization rather than integration-sized fixtures;
- readable played cards, including current power and recognizable card identity;
- predictive target clarity for target-specific actions;
- sensible action-forgiveness behavior with conservative ambiguity handling;
- clean invalid return with zero mutation;
- reliable player-facing audio path or explicit proven platform blocker;
- baseline meaningful haptic semantics with real-device capability validation;
- more legible pacing for major mechanic consequences;
- preservation of 10.3 final geometry and the single canonical rules/action path.

Deeper physical simulation, richer neighbor ecology, advanced throw behavior, and a full bespoke audiovisual asset campaign may be staged to the right if needed, but Pass 11 must not knowingly ship a technically complete match that still behaves like an integration demo.

Do not invent later pass numbers unless explicitly assigned.

---

# 8. Expanded QA doctrine for Pass 11 and later

Release confidence should be built from **machine proof + visual proof + device proof**.

## Machine proof

- deterministic engine/rules regression and fuzzing;
- legal-action and lifecycle invariants;
- interaction trajectory/forgiveness matrices, including near misses, overshoots, diagonals, edge releases, ambiguity, reversal, and crowded-board states;
- no illegal mutation on rejected gestures;
- persistent card-identity / `iid` continuity assertions where presentation actors are introduced;
- save/resume/reload/backgrounding/orientation lifecycle validation;
- audio and haptic semantic/event diagnostics.

## Temporal visual proof

Generated QA should move beyond only beginning/end screenshots for important interactions. Capture dense frame sequences or recordings plus telemetry for pickup → manipulation → target acquisition → release → impact/effect → settle.

Important physical invariants include:

- no perceptible visual disappearance/teleport between zones;
- pointer fidelity while held;
- exactly one unmistakable target before target-specific commit;
- localized, reversible neighbor displacement;
- clear valid/invalid return behavior;
- final landing aligned to authoritative geometry;
- synchronized cause/effect sequencing.

Before merge, visually inspect generated QA artifacts for the latest exact candidate head.

## Interaction flight recorder

Pass 11 planning should evaluate a QA-only instrumentation layer exposing enough recent interaction state to correlate a visual defect with system intent. Candidate telemetry includes:

- pointer coordinates/path/velocity;
- held card `iid` and pickup offset;
- legal destinations;
- candidate target and ambiguity/confidence information;
- forgiveness region entered/exited;
- neighbor displacement;
- release decision and commit/reject reason;
- presentation events/timestamps;
- audio cue requests/status;
- haptic cue requests;
- authoritative engine action and final state.

Instrumentation must not become gameplay authority and must be removable/disabled in normal play.

## Live-browser proof

Use connected live-browser tooling such as TinyFish/ChatGPT Work where useful to independently operate the deployed/candidate product: menu flow, Instant Match, mulligan, turns, targeting, settings, restart/rematch, and obvious visual/runtime failures. Browser automation supplements rather than replaces deterministic Playwright CI.

## Real-device proof

An actual iPhone installed-PWA pass remains necessary for touch ergonomics, audible output, lifecycle behavior, orientation, and especially tactile/haptic feel. The user should not be the first person discovering basic logic/layout defects; real-device review should primarily judge the final sensory experience and platform-specific behavior after automated/browser QA is already strong.

---

# 9. Current product status / broader debt

Production now has hosted PWA infrastructure, deterministic classic engine, 216-card catalog, frozen 10.3 geometry, 10.4A direct manipulation, iPhone/WebKit coverage, 10.4B choreography, adversarial QA, 10.4C feel/feedback/accessibility polish, and CI-protected Pages deployment.

Broader work after the revised Pass 11 includes unrestricted legal deck builder, polished faction/leader selection, complete unrestricted mulligan/effect choices, final AI ladder through Grandmaster, mature save/resume/replay, modular assists/cheats/sandbox, complete victory/rematch/UX shell, local permitted-art ownership/caching, richer physical-card and audiovisual presentation, and final offline/install/native-quality polish.

---

# 10. Archive context

GitHub is canonical for active development.

Reference Drive folder: `Gwent Classic - Arunsundaram` — `1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`  
Legacy product root: `Gwent Definitive - blakemgray` — `1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`

---

# 11. Current handoff

**Pass 10.4C is closed and the production baseline is green. Pass 11 has not started.**

Final production evidence before this transition checkpoint:

- runtime merge: `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`;
- final PR run: #136 / `34620304920` — success;
- production runtime run: #137 / `34621157464` — verify success, Pages deploy success;
- visually approved QA artifact: `10270749326`;
- README-aligned run: #140 / `34623641751` — verify success, Pages deploy success;
- terminal repository-closeout head: `388f90cf230492093a89ccb67a67bd929ad4a12d`;
- terminal repository-closeout run: #141 / `34625822361` — full verify success, Pages deploy success.

No known runtime, rules, geometry, interaction, WebKit, choreography, reduced-motion, semantic-feedback, copy, documentation, or visual blocker remains for 10.4C itself. New live-play findings are forward requirements/QA findings unless evidence establishes an actual regression.

**Transition task status:** in progress on `docs/pre-work-pass11-transition`; gameplay code remains untouched.

**Exact next action:** reconcile `FUTURE_CONTINUITY.md` to the current Pass-11-first roadmap and live-play findings, add `MODEL_ROUTING.md`, open a documentation PR, require exact-head green verification, then merge/verify before handing Pass 11 to ChatGPT Work.