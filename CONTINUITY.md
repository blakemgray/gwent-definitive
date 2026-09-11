# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff. Recover the project from this file plus the repository, not chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Current verified repository main head:** `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b`  
**Latest exact-head main verification:** run #145 / `34641027264` — full verify **success**, Pages deploy **success**  
**Current completed production milestone:** **Pass 10.4C — Feel / Presentation Polish**  
**Current active implementation milestone:** **Pass 11 — Golden Match / Complete Normal Match — 11.1A closed / 11.1B stabilization active**  
**Current active repository task:** **11.1B exact-head stabilization: diagnose preserved Medic→Muster adversarial gate failure**  
**Current work branch:** `pass-11-golden-match`  
**Current work PR:** #11 — `Pass 11: Golden Match`  
**Resumed-cycle checkpoint head:** `9d371340d2c4aa349b923ea5119a993f49275a8a`  
**Latest exact-head workflow before resumed checkpoint:** run #159 / `34648516237` — **failure** in preserved Pass 10.4B adversarial `Medic→Muster` choreography gate after Pass 11 setup/lifecycle/direct-manipulation/WebKit/primary choreography gates passed  
**Estimated Pass 11 planning completion:** **100%**  
**Estimated overall Pass 11 implementation progress:** **26%**  
**Estimated formally verified/closed Pass 11 progress:** **18%**  
**Default current-work model:** **GPT-5.6 Sol · High**; escalate only per `MODEL_ROUTING.md`  
**Last updated:** 2026-09-11 America/New_York

Pass 10.4C remains complete, merged, fully verified, visually approved, and deployed. Run #145 verified and deployed exact `main` head `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b`. The Pass 11 cycle is open on `pass-11-golden-match`, created from that exact green head. PR #11 contains the mandatory startup checkpoint and the repository-grounded `docs/PASS11_GOLDEN_MATCH_CONTRACT.md`; planning is complete and gameplay implementation began only after that contract was established. Pass 11.1A is closed: code commit `84c9b77f6b6c648373125fb651eefa8da239d5d1`, continuity-aligned candidate `182684264502d772b2197b3abdc3bc7d4196543a`, and fixture-isolation repair `3b67c3d0591dca4d77d66c788630101e31be8a46`. Run #151 / `34644865929` passed the full workflow on that exact implementation head; its Pass 11 setup evidence was manually inspected and approved.

The 11.1B lifecycle/choice/restart/rematch work is substantially implemented on later commits. Exact PR head `3a1ab389d94b5a6f0eb222a75df58efb85ee7da8` passed the new Pass 11 legal setup/mulligan gate, the new Pass 11 choice/restart/terminal-save/rematch gate, direct-manipulation baseline/parity/stress/lifecycle gates, WebKit/iPhone interaction, bot/presentation failure recovery, and primary 10.4B choreography. Run #159 failed later in the preserved 10.4B adversarial choreography matrix at the nested Medic→Muster scenario. The current stabilization task is therefore to prove whether that failure is a genuine product regression or a synthetic/adversarial-fixture synchronization assumption, without weakening the preserved gate.

---

# 0. Mandatory continuity protocol

This file is authoritative for implemented/current project state. `FUTURE_CONTINUITY.md` is the forward-roadmap companion. `MODEL_ROUTING.md` governs model/effort recommendations for Work/Codex cycles but never overrides product or repository authority.

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
2. Read `FUTURE_CONTINUITY.md` in full.
3. Read `MODEL_ROUTING.md` before choosing a model/effort level.
4. **Write an actual checkpoint update to this file in GitHub before doing further implementation work.** Chat-only continuity does not count.
5. Record active pass/task, branch/PR/head, latest meaningful CI evidence or blocker, exact next action, and estimated completion percentage.
6. Percentage is for visibility only; never compress scope, rush QA, skip visual review, or weaken a gate.
7. Every user-facing progress report should include the current percentage.
8. Every user-facing work message should end with a concrete **Next action**.
9. On merge/deploy or task completion, update this file again with final SHAs, CI, artifacts, visual findings, remaining debt, and handoff. A deliberately marked terminal continuity-only closeout may be verified once without creating a recursive commit solely to record its own verification.

### Model-transparency rule

Before every substantial phase, report:

- current phase/task;
- completion percentage;
- recommended model and reasoning effort;
- why that level is justified;
- escalation trigger;
- de-escalation/return trigger;
- exact next action.

Model escalation is a recommendation, not permission. GPT-6 Astra allowance is scarce on the current Plus plan. Do not silently spend Astra merely because it is available; default to the least-expensive model/effort that can reliably complete the task to the required standard. `MODEL_ROUTING.md` is the standing authority for the detailed routing protocol.

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

## Current production snapshot — Pass 10.4C + pre-Work transition

Pass 10.4C production evidence:

- PR #8 merged.
- Final PR head: `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`.
- Merge/runtime SHA: `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`.
- Final PR validation: run #136 / `34620304920` — every gate **success**.
- Production verification + Pages deployment: run #137 / `34621157464` — verify **success**, deploy **success**.
- README-aligned docs head: `a6851a1d5959ee530a0644b21529e606ea621c5f`.
- README-aligned verification + Pages: run #140 / `34623641751` — verify **success**, deploy **success**.
- Terminal Pass-10.4C repository-closeout head: `388f90cf230492093a89ccb67a67bd929ad4a12d`.
- Terminal Pass-10.4C repository-closeout verification + Pages deployment: run #141 / `34625822361` — verify **success**, deploy **success**.
- Visually approved Pass-10.4C release artifact: `10270749326` / `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`.

Pre-Work transition evidence:

- Transition PR: #9 — merged.
- Exact PR head: `19393f835d4f474cdafd2efb689ec2e6a696e273`.
- Exact-head PR validation: run #142 / `34637982426` — full verify **success**.
- PR #9 merge/main SHA: `4d7d6e0b7dc95c25e02418001400e0da538c2a66`.
- Main verification + Pages deployment: run #143 / `34638840306` — full verify **success**, deploy **success**.
- Run #142 generated all four existing visual QA packages; representative Pass-10.4C artifact `10279156191`, digest `sha256:280f076f308313abdcb96beae5167396ac8d29136d1497bec949bb18b838fd00`, was manually inspected from the exact PR head before merge. Selection, active-target drag, ordinary landing, invalid-return state, reduced motion, settings, and representative Scorch/Muster/Spy/Horn/Decoy/Medic frames showed no new visual regression. The PR changed Markdown only; no runtime/gameplay file changed.

Run #143 again passed static engine/catalog/PWA/motion/direct-manipulation/choreography/feel validation, frozen 10.3 geometry, 10.4A interaction/touch/parity, presentation-aware bot gating, disposable failure recovery, 256-trial physical stress, semantic landing, lifecycle/save-restore, WebKit/iPhone, 10.4B primary/adversarial choreography, and 10.4C feel/feedback/reduced-motion/pacing, then successfully staged and deployed Pages.

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

Release confidence should be built from **machine proof + visual proof + live-browser proof + device proof**.

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

Production now has hosted PWA infrastructure, deterministic classic engine, 216-card catalog, frozen 10.3 geometry, 10.4A direct manipulation, iPhone/WebKit coverage, 10.4B choreography, adversarial QA, 10.4C feel/feedback/accessibility polish, CI-protected Pages deployment, a reconciled Pass-11-first roadmap, expanded temporal/live-browser/device QA doctrine, and explicit Work model-routing rules.

Broader work after the revised Pass 11 includes unrestricted legal deck builder, polished faction/leader selection, complete unrestricted mulligan/effect choices, final AI ladder through Grandmaster, mature save/resume/replay, modular assists/cheats/sandbox, complete victory/rematch/UX shell, local permitted-art ownership/caching, richer physical-card and audiovisual presentation, and final offline/install/native-quality polish.

---

# 10. Archive context

GitHub is canonical for active development.

Reference Drive folder: `Gwent Classic - Arunsundaram` — `1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`  
Legacy product root: `Gwent Definitive - blakemgray` — `1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`

---

# 11. Current Pass 11 work cycle

**Pass 10.4C is closed. Pass 11 planning is complete; 11.1A is closed and 11.1B stabilization is active.**

Authoritative startup evidence:

- exact starting `main` head: `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b`;
- run #145 / `34641027264` — exact-head full verification success and Pages deployment success;
- work branch: `pass-11-golden-match`, created from that exact head;
- last fully green verified implementation head for closed 11.1A: `3b67c3d0591dca4d77d66c788630101e31be8a46`;
- resumed-cycle checkpoint head: `9d371340d2c4aa349b923ea5119a993f49275a8a`;
- current planning completion: **100%**;
- estimated implementation progress: **26%**;
- estimated formally verified/closed progress: **18%**;
- Pass 11 contract commit: `c85b9264cae68f41f18d941b5134480d119dcf17`;
- model recommendation: **GPT-5.6 Sol · High**.

### 11.1A — legal setup / mulligan foundation — CLOSED

Implemented and verified:

- reusable deck validation for unit minimum, special/weather maximum, faction/leader eligibility, catalog identity, and copy availability;
- explicit deterministic production shuffle while preserving ordered test fixtures;
- engine-owned mulligan phase, two-card limit, card conservation, semantic events, and gameplay gating;
- legal versioned Golden Match presets: Northern Realms 31 cards (25 units / 6 specials) and Monsters 36 cards (29 units / 7 specials);
- schema-v2 persistence for prepared mulligan and active match phases;
- exact prepared-hand restore and Continue flow;
- permanent Node and Playwright Pass 11 setup gates plus generated screenshots;
- no change to Pass 10.3 battlefield geometry or the Pass 10.4 interaction/choreography stack.

Run #148 succeeded on the exact planning head before implementation. Run #150 / `34644065607` then proved the new engine and Pass 11 setup/browser gate, but exposed a preserved Pass-10.4B choreography test's hidden dependency on the former ordered production quick-start deck (`no playable frost`). Production shuffle was retained. Commit `3b67c3d0591dca4d77d66c788630101e31be8a46` repaired only the test by constructing an explicit ordered QA fixture.

Run #151 / `34644865929` passed every static, engine, fuzz, frozen-geometry, direct-manipulation, parity, bot-gate, failure-recovery, 256-trial stress, lifecycle, WebKit/iPhone, choreography, adversarial, feel, and Pass 11 setup gate on that exact implementation head.

The exact-run `pass11-legal-setup-qa` artifact is `10281992451`, digest `sha256:fac448619f05887566127ae7076e829787bdff82ff977746ce5ec84635c5fac5`. Manual frame-by-frame review confirmed:

- a readable 10-card opening hand from the legal 31-card Northern Realms deck;
- persisted restore after one of two mulligans, with the replaced card absent and the counter correct;
- a clean normal-match start with empty rows, player hand 10 / deck 21, opponent hand 10 / deck 26, and no disguised preplayed state;
- artifact summary legality counts of 25 units / 6 specials for the player and 29 units / 7 specials for the opponent;
- no browser page errors.

### 11.1B — lifecycle / choice broker — ACTIVE STABILIZATION

Substantial implementation is present on the current branch, including typed pending-choice routing, deterministic opponent-choice handling, durable terminal-result save behavior, restart/rematch/menu paths, dedicated lifecycle contract/browser gates, and PWA/CI graph updates.

Run #159 / `34648516237` on exact head `3a1ab389d94b5a6f0eb222a75df58efb85ee7da8` established the following boundary:

- `npm test` passed, including `pass11-setup-contract` and `pass11-lifecycle-contract`;
- Pass 11 legal setup/mulligan browser gate passed;
- Pass 11 choice/restart/terminal-save/rematch browser gate passed;
- direct manipulation, destination parity, presentation bot gate, presentation-failure recovery, 256-trial interaction stress, semantic landing, save/restore lifecycle, WebKit/iPhone, and primary 10.4B choreography gates passed;
- the preserved 10.4B adversarial choreography matrix failed in the nested Medic→Muster scenario before the 10.4C feel gate could run;
- generated Pass 11 setup/lifecycle artifacts still archived from the failed run but are not release proof while the exact head is red.

The immediate question is whether the Medic→Muster failure is a genuine regression or a synthetic fixture/timing assumption. Do not weaken the gate. Trace engine `pendingChoice`, nested Medic→Muster choreography ownership, presentation queue state, and the adversarial fixture's transition ordering. If production semantics are correct and the test violates the established serialized presentation contract, repair the fixture to exercise the real contract. If production semantics are wrong, fix production.

**Exact next action:** inspect the current exact-head Medic→Muster adversarial fixture and corresponding engine/presentation code, reproduce the failure path from source, classify regression vs. fixture assumption, make the smallest root-cause repair without weakening coverage, then rerun the complete workflow and visually inspect the latest exact-head artifacts if green.