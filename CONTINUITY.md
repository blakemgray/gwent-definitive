# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff. This is the concise current-state authority; older detail remains preserved in Git history.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Verified production main:** `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b` — run #145 / `34641027264` full verify + Pages deploy success  
**Current branch / PR:** `pass-11-golden-match` / PR #11  
**Latest verified Pass 11 implementation head:** `2865c8d520c0e961a594918672c3121c31b5b524`  
**Latest exact-head workflow:** run #187 / `34662963707` — FULL SUCCESS  
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match**  
**Current phase:** **11.1A CLOSED / 11.1B CLOSED / 11.2A CLOSED / 11.2B ACTIVE**  
**Current task:** **11.2B pure intent resolver — geometry-relative forgiveness + ambiguity-safe candidate scoring with no rules authority**  
**11.2 architecture contract:** `docs/PASS11_11_2_PHYSICAL_CARD_ARCHITECTURE.md` at commit `f6a754c8044b8a633234c48e21a8454683b2ea21`  
**Pass 11 planning:** 100%  
**Pass 11 implementation:** ~34%  
**Formally verified/closed:** ~31%  
**Default model:** GPT-5.6 Sol · High  
**Last updated:** 2026-09-11 America/New_York

---

# 0. Authority and work protocol

Precedence: current user instruction → current repository/green CI → this file → `FUTURE_CONTINUITY.md` → current contracts/config → `MODEL_ROUTING.md` for model choice → older archives/chat.

Before every new implementation task or resumed cycle: read `CONTINUITY.md`, `FUTURE_CONTINUITY.md`, and `MODEL_ROUTING.md`; then write an actual checkpoint to this file before changing implementation code. Every work update includes completion percentage, model recommendation, escalation/return trigger, and an exact **Next action**.

Never weaken/delete/bypass CI or QA merely to make a candidate green. Merge only the latest exact fully-green head after manual visual evidence review. Real-device iPhone review remains required for final sensory/platform signoff.

---

# 1. Locked product doctrine

Build the definitive modern implementation of classic The Witcher 3 Gwent, using `asundr/gwent-classic` as the rules/card oracle while keeping runtime deterministic, mobile-first, testable, and engine/presentation separated.

Locked invariants:

- Engine state is authoritative; presentation never decides legality, scoring, effects, or outcome.
- Engine commits before presentation; presentation is disposable and interruption-safe.
- Stable card IDs + per-match `iid`s remain authoritative identity.
- Tap, drag, keyboard, opponent, and restored-session actions use one canonical validated action path.
- Invalid/ambiguous intent returns with zero authoritative mutation.
- Bot/opponent mutation cannot occur during unresolved player presentation/choice.
- AI difficulty means better reasoning, never hidden-information cheating.
- Match classes remain `CLASSIC`, `ASSISTED`, `MODIFIED`, `SANDBOX`.
- Instrumentation is observation-only.

Interaction north star:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

Primary gameplay target is iPhone landscape PWA. Cards should feel like persistent physical objects. Interpret intent generously when unambiguous and conservatively when a specific target matters.

**Pass 10.3 Battlefield Geometry Contract v2 is frozen authority.** Final order: Opponent Siege / Ranged / Close / Weather / Player Close / Ranged / Siege. Motion may interpolate above final slots, but final/rest geometry remains 10.3-owned.

---

# 2. Canonical runtime boundaries

Key files:

- `src/gwent-engine.js` — deterministic rules engine.
- `src/cards-catalog.js` — 216-card catalog.
- `src/battlefield-ux.js` — frozen final geometry/reconciliation.
- `src/gesture-controller.js` — canonical direct manipulation.
- `src/presentation-queue.js` — serialized cancellable presentation.
- `src/presentation-events.js` — semantic before/after adapter.
- `src/gameplay-choreography.js` — signature consequence choreography.
- `src/choreography-external-gate.js` — external/bot presentation gate.
- `src/presentation-feedback.js` — semantic audio/haptic hooks + copy cleanup.
- `src/motion-tokens.js`, `feel-polish.css` — motion/tactile vocabulary.
- `app.js` — production shell, Golden Match setup, choice/lifecycle UI, bounded Standard opponent.

Engine/catalog baseline: 216/216 cards, 44/44 ability tokens, 22/22 leaders, 5/5 factions; ordinary play, Spy, Bond, Muster, Medic choices, Decoy, Weather/Clear, Horn, Scorch, Hero, pass/auto-pass, rounds, factions, leaders, legal deck validation, deterministic shuffle, mulligan, and persisted normal-match state.

Closed authority: Passes 10.3, 10.4A Direct Manipulation, 10.4B Signature Gameplay Choreography, and 10.4C Feel/Presentation remain closed unless current evidence proves a genuine regression.

---

# 3. Pass 11 contract

Pass 11 must ship one genuine normal Instant Match: legal full-size decks, opening draw/mulligan, complete normal turn loop, all locked-deck choices, passing/exhaustion, scoring, rounds, faction/life effects, best-of-three terminal result, restart/rematch, and save integrity without developer shortcuts.

It is not accepted merely because the engine can technically reach `winner`.

Minimum production bar also requires readable played cards/current power, predictive target clarity, ambiguity-aware forgiveness, continuous perceived card identity, actual player-facing audio, honest haptic capability semantics, and legible major-effect pacing while preserving frozen final geometry and engine authority.

QA doctrine: **machine proof + temporal visual proof + live-browser proof + real-device proof**. A later QA-only interaction flight recorder should expose pointer path/velocity, held `iid`, legal destinations, candidate/confidence/ambiguity, forgiveness transitions, local displacement, commit/reject reason, engine before/after digest, presentation stages, audio status, and haptic status.

---

# 4. 11.1A — legal setup / mulligan — CLOSED

Implemented: reusable deck validation; deterministic production shuffle with explicit ordered QA fixtures; engine-owned two-card mulligan; card conservation/events/gating; legal Golden Match presets (Northern Realms 31 cards: 25 units/6 specials; Monsters 36 cards: 29 units/7 specials); schema-v2 prepared/active persistence; exact prepared-hand restore; permanent Node + Playwright setup gates.

Closure evidence:

- head `3b67c3d0591dca4d77d66c788630101e31be8a46`;
- run #151 / `34644865929` full success;
- setup artifact `10281992451`, digest `sha256:fac448619f05887566127ae7076e829787bdff82ff977746ce5ec84635c5fac5`, manually approved;
- verified legal 10-card opening hand, mulligan restore, clean empty-board match start, player hand 10/deck 21, opponent hand 10/deck 26, no page errors.

---

# 5. 11.1B — lifecycle / choice broker — CLOSED

Implemented: typed pending-choice routing; engine-provided choice candidates; deterministic opponent-choice handling; safe unsupported-choice state; pending-choice save/restore; durable terminal result; Restart confirmation; Resume/Rematch/Main Menu paths; lifecycle contract/browser gates.

Run #159 initially exposed a preserved 10.4B adversarial Medic→Muster failure. Root cause was not engine state: the new generic choice broker had removed the stable Medic target semantic hook used by the preserved gate. Commit `d2fb0c3740a7cad0924c4bae44f11fc609fd2cc8` restored `data-medic=<iid>` while preserving the generic `data-choice-index` broker. The preserved test was not weakened.

Exact closure proof on `d2fb0c3740a7cad0924c4bae44f11fc609fd2cc8`:

- run #175 / `34654254329` — full workflow success;
- Pass 11 setup/mulligan + lifecycle/restart/result/rematch gates success;
- direct manipulation/parity/bot-gate/failure-recovery/256-trial stress/semantic landing/save-restore/WebKit success;
- primary 10.4B choreography + full preserved adversarial matrix including nested Medic→Muster success;
- 10.4C feel/feedback/reduced-motion/pacing success.

Exact-head artifacts manually reviewed:

- lifecycle `10284289590`, `sha256:dfae87edcf2db6c7fab9300419b6dfcae69a222a64430bc271722fcbcf8fe548`;
- signature choreography `10284623881`, `sha256:41ba2e6e5177868b2e280e63ebe3d281f896c43d6df6a5dcafaab0d0fa29d96f`;
- feel/presentation `10284623884`, `sha256:3b9cc4561ae4d6008c79a0d828796e6329eb3000514dd04eecb712db9fd0647a`;
- setup `10284469173`, `sha256:99efd0bcd38e0bc781f0124a9b53036834a9d450d154fe95c4bd0ab4dae59c3f`.

Visual review confirmed restored Medic choice, readable Restart confirmation, durable terminal result, coherent nested Medic→Muster final reconciliation, interruption/reduced variants, and no page errors.

Independent TinyFish candidate QA: run `c150599b-1ce0-4ebd-a78c-aec73217b8e4` (84 s / 35 steps) operated the current branch through landing → Quick Start → opening hand/mulligan → multiple normal plays/opponent reactions → match menu → Restart confirmation → cancel/resume. TinyFish reported no blocker and stable critical path. Its one `Element not found` occurred while attempting to click a row for Scorch; Scorch is global rather than row-targeted, so this is an automation mis-target, not demonstrated product regression.

---

# 6. 11.2 — physical-card / targeting architecture — ACTIVE

Architecture is locked in `docs/PASS11_11_2_PHYSICAL_CARD_ARCHITECTURE.md` at commit `f6a754c8044b8a633234c48e21a8454683b2ea21`.

The locked design preserves four authorities/layers:

1. **10.3 final geometry** remains the only owner of reconciled card packing.
2. **10.4A gesture controller** remains the only owner of selection/drag/commit/invalid-return input flow.
3. A new **pure intent resolver** will score only engine-provided legal destinations from live geometry and return candidate/confidence/reason data; it will not mutate DOM/rules.
4. A presentation-only **target exposure / actor-lease layer** may apply transient transforms and harden the existing proxy→final-card handoff without becoming rules authority.

11.2 implementation slices are locked as:

- **11.2A — battlefield readability semantics — CLOSED:** always render current effective power, semantic/accessibility metadata, density QA; no geometry change.
- **11.2B — pure intent resolver — ACTIVE:** geometry-relative forgiveness/ambiguity/trajectory matrix integrated into existing controller.
- **11.2C — predictive card-target exposure:** precise Decoy target lock + local reversible neighbor yield.
- **11.2D — continuity hardening / temporal proof:** explicit proxy identity metadata and source/proxy/final continuity evidence.

## 11.2A closure evidence

Implemented as an additive presentation layer (`src/battlefield-readability.js` + `physical-card.css`) with dedicated Playwright coverage and explicit PWA/CI/deploy wiring. It does not own rules, card packing, or final geometry.

Exact closure proof on `2865c8d520c0e961a594918672c3121c31b5b524`:

- run #187 / `34662963707` — full workflow success;
- new Pass 11.2A battlefield readability/current-power gate success;
- all preserved setup/lifecycle/10.3/10.4A/10.4B/10.4C/WebKit/stress gates success;
- readability artifact `10287892839`, digest `sha256:17bd23ee5a6dc6ea739aa2ca65e8a024642c74b6e5ece25af77622661da73772`, manually approved.

Visual review confirmed 1/2/4/8/12-card rows preserve centered/no-cutoff resting geometry while every played unit exposes current effective power and retains card art. The weather proof correctly changes a 6-power close unit to displayed power 1 and row score 1. Dense 12-card rows remain intentionally compact at rest; temporary interaction exposure belongs to 11.2C rather than altering frozen resting geometry.

Current task is **11.2B**. It must remain a deterministic pure scoring/resolution layer over the legal destinations already supplied by the engine/controller. It may consider pointer position, release velocity/trajectory, live destination geometry, target family, and ambiguity, but it may not invent legality, mutate state, or bypass the existing `commitAction()` path.

Model routing: GPT-5.6 Sol · High. Astra Medium is only justified if deterministic ambiguity-safe intent cannot be expressed cleanly without violating frozen action/geometry authority.

**Exact next action:** implement and fuzz-test a pure intent resolver first, covering precision zone, forgiveness zone, unambiguous overshoot/trajectory support, ambiguous target rejection, and invalid return. Only after the resolver contract is green should `src/gesture-controller.js` consume its result on drag release.

---

# 7. Broader roadmap

After Pass 11, pass numbers remain intentionally unlocked. Established work includes full deck/collection access, full faction/leader playability, final AI ladder Novice→Standard→Veteran→Master→Grandmaster with `AIKnowledgeState != GameState`, mature persistence/replay/history, modular assists/cheats/sandbox, complete UX shell, richer physical-card ecology, dedicated audiovisual identity, PWA/iPhone productization/native-wrapper option where platform ceilings justify it, controlled local asset pipeline, and exhaustive all-card/all-faction parity.

GitHub remains canonical for active development. Reference Drive: `Gwent Classic - Arunsundaram` (`1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`). Legacy product root: `Gwent Definitive - blakemgray` (`1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`).

> **Rules correctness first → interaction correctness → readable gameplay choreography → premium physical feel → complete normal match → complete access → smarter AI → product maturity.**

**Current Pass 11:** planning 100%; implementation ~34%; formally verified/closed ~31%.  
**Current phase:** 11.2B pure intent resolver.  
**Next action:** implement the pure resolver + deterministic/fuzz coverage before integrating release behavior into the existing controller.
