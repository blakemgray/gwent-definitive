# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** concise permanent implemented-state handoff. Older detail remains preserved in Git history; this file records the current authoritative state needed to resume safely.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Verified production main:** `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b` — run #145 / `34641027264` full verify + Pages deploy success  
**Current branch / PR:** `pass-11-golden-match` / PR #11  
**Latest exact green Pass 11 candidate head:** `351b234bee8627bccfdfb48bd7a0c77dc7cfacc3`  
**Latest exact-head workflow:** run #216 / `34680311476` — FULL SUCCESS  
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match**  
**Current phase:** **11.1A CLOSED / 11.1B CLOSED / 11.2A CLOSED / 11.2B CLOSED / 11.2C ACTIVE**  
**Current task:** **11.2C visual-acceptance correction — make the predictive Decoy target visibly emerge from behind the dragged card while keeping intent scoring on stable resting geometry**  
**11.2 architecture contract:** `docs/PASS11_11_2_PHYSICAL_CARD_ARCHITECTURE.md` at commit `f6a754c8044b8a633234c48e21a8454683b2ea21`  
**Pass 11 planning:** 100%  
**Pass 11 implementation:** ~45%  
**Formally verified/closed:** ~37%  
**Default model:** GPT-5.6 Sol · High  
**Last updated:** 2026-09-12 America/New_York

---

# 0. Authority and work protocol

Precedence: current user instruction → current repository/green CI → this file → `FUTURE_CONTINUITY.md` → current contracts/config → `MODEL_ROUTING.md` for model choice → older archives/chat.

Before every new implementation task or resumed cycle: read `CONTINUITY.md`, `FUTURE_CONTINUITY.md`, and `MODEL_ROUTING.md`; then write an actual checkpoint to this file before changing implementation code. Every work update includes completion percentage, model recommendation, escalation/return trigger, and an exact **Next action**.

Never weaken/delete/bypass CI or QA merely to make a candidate green. GitHub is authoritative for source/branches/PRs/CI/artifacts and merge verification. Playwright/CI provides deterministic machine and temporal-browser proof. TinyFish is the independent live-product QA channel at meaningful checkpoints, not the primary repository interface. Merge only the latest exact fully-green head after manual visual evidence review. Real-device iPhone review remains required for final sensory/platform signoff.

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
- `src/gesture-controller.js` — canonical direct manipulation and 11.2B intent consumption.
- `src/interaction-intent.js` — pure 11.2B forgiveness/ambiguity/trajectory resolver; no rules or DOM authority.
- `src/battlefield-readability.js`, `physical-card.css` — 11.2A always-visible current power / readable identity presentation.
- `src/target-exposure.js` — 11.2C presentation-only target lock/local neighbor yield; no rules or commit authority.
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

QA doctrine: **machine proof + temporal visual proof + live-browser proof + real-device proof**. Playwright artifacts and telemetry must be inspected on the latest exact candidate head; TinyFish independently operates the candidate/deployed player experience at meaningful checkpoints; real iPhone remains final authority for physical touch/audio/haptic/platform feel.

---

# 4. Closed Pass 11 slices

## 11.1A — legal setup / mulligan — CLOSED

Legal full-size Golden Match presets, deterministic production shuffle/QA fixtures, engine-owned two-card mulligan, schema-v2 prepared/active persistence, exact restore, and setup browser/contract gates are permanent. Closure head `3b67c3d0591dca4d77d66c788630101e31be8a46`; run #151 / `34644865929` full success; artifact `10281992451`, digest `sha256:fac448619f05887566127ae7076e829787bdff82ff977746ce5ec84635c5fac5`, manually approved.

## 11.1B — lifecycle / choice broker — CLOSED

Typed pending-choice routing, deterministic opponent choice, safe unsupported-choice state, choice save/restore, durable result, Restart/Resume/Rematch/Main Menu lifecycle are permanent. Preserved Medic semantic compatibility was restored without weakening 10.4B. Closure head `d2fb0c3740a7cad0924c4bae44f11fc609fd2cc8`; run #175 / `34654254329` full success; setup/lifecycle/choreography/feel artifacts manually approved. Independent TinyFish run `c150599b-1ce0-4ebd-a78c-aec73217b8e4` traversed landing → Quick Start → mulligan → normal plays/opponent reactions → match menu → Restart confirmation → cancel/resume with no demonstrated blocker.

## 11.2A — battlefield readability semantics — CLOSED

`src/battlefield-readability.js` + `physical-card.css` add always-visible effective power and semantic/accessibility identity without owning packing. Closure head `2865c8d520c0e961a594918672c3121c31b5b524`; run #187 / `34662963707` full success; artifact `10287892839`, digest `sha256:17bd23ee5a6dc6ea739aa2ca65e8a024642c74b6e5ece25af77622661da73772`, manually approved. 1/2/4/8/12-card rows preserve centered/no-cutoff resting geometry.

## 11.2B — pure intent resolver — CLOSED

`src/interaction-intent.js` is deterministic and DOM/engine-free; the existing controller consumes its result without adding a second commit path. Direct hit, geometry-relative singular forgiveness, bounded fresh singular trajectory assistance, ambiguity rejection, precision-first card targets, and zero-mutation invalid return are locked.

Closure head `07b21e88c8958f5c55acc994b41d9fa073a2e227`; run #202 / `34665042268` full success. Node intent contract: **5,178 assertions across deterministic matrix + 2,500 randomized trials**. Preserved direct-manipulation, parity, failure recovery, 256-trial stress, WebKit/iPhone-targeted interaction, 10.4B signature/adversarial, and 10.4C feel gates all passed. Artifact `10289035781`, digest `sha256:14145a2eccb2024edc8dda10cc7f946df6f85fee845bc8cc1e942b26a74a9fa2`, manually approved.

---

# 5. 11.2C — predictive card-target exposure — ACTIVE

11.2C starts with Decoy because it is the clearest ambiguous target family and live play exposed broad disruptive reflow when Decoy was selected.

Implemented candidate foundation at exact green head `351b234bee8627bccfdfb48bd7a0c77dc7cfacc3`:

- `src/target-exposure.js` presentation-only target lock + immediate-neighbor yield;
- `physical-card.css` predictive target/neighbor presentation;
- target-specific legal units remain `position:absolute`, fixing the earlier broad Decoy row reflow caused by generic `.dm-legal-target { position:relative; }` overriding 10.3 absolute packing;
- target exposure consumes the existing controller winner and does not choose/commit actions;
- velocity-only target emphasis is re-evaluated after the 120 ms freshness window so visual state cannot outlive 11.2B intent truth;
- reduced-motion path preserves target emphasis while suppressing neighbor displacement;
- dedicated `tests/pass11_target_exposure_ui.py` + archived artifact gate added; PWA/service-worker/deploy wiring advanced to 11.2C.

Exact machine proof on `351b234bee8627bccfdfb48bd7a0c77dc7cfacc3`:

- run #216 / `34680311476` — **FULL SUCCESS**;
- Node/engine/PWA contracts all success;
- 10.3 geometry success;
- Pass 11 setup/lifecycle success;
- 11.2A readability success;
- 11.2B intent success;
- new **11.2C predictive card-target exposure/local-yield gate success**;
- preserved direct manipulation/parity/bot gate/failure recovery/**256-trial stress**/semantic landing/save-restore/WebKit success;
- 10.4B signature + adversarial success;
- 10.4C feel success.

Exact-head 11.2C artifact: `10293703549`, digest `sha256:e0e4fb74beddbb7dd5fed77080acdbc25411b643e46ff03d5597d8209e32c0e6`.

**Manual visual acceptance result: NOT YET APPROVED.** The artifact proves broad Decoy reflow is gone, candidate transfer/local neighbor behavior is deterministic, leave/cancel/reduced-motion cleanup is correct, and trajectory highlight expiry is truthful. However, the dragged Decoy still visually occludes too much of the locked target card. The target is technically selected but does not yet satisfy the stronger product requirement that the intended unit visibly emerge/raise so its identity and current power are unmistakable before release.

Therefore 11.2C remains ACTIVE despite a full-green exact head. Do not spend TinyFish on this known-deficient candidate; TinyFish comes after the corrected exact head is internally green and its temporal artifact passes manual visual review.

### 11.2C locked correction requirements

- engine/controller legal actions remain the only source of candidate targets;
- 11.2B remains the only intent scorer; 11.2C is presentation only;
- intent scoring must use stable/resting candidate geometry rather than geometry displaced by transient target-exposure transforms;
- the locked Decoy target must visibly emerge around/above the held card enough that artwork/current power/identity are recognizable before release;
- only immediate local neighbors may yield; no broad row repacking/reflow;
- transforms are transient/reversible and must not change 10.3 `left/top/width/height` resting authority;
- moving away/losing confidence/ambiguity/cancel/interruption/reduced motion restores untouched resting geometry;
- reduced motion must still make the exact target unmistakable without requiring animated displacement;
- target visual state must not outlive current valid predictive intent;
- tap/keyboard semantics and canonical `commitAction()` ownership remain unchanged;
- corrected QA must assert **material target visibility/exposure**, not merely class presence or neighbor movement;
- after exact-head full CI and manual artifact approval, run an independent TinyFish live-product QA check before closing 11.2C.

Model routing: **GPT-5.6 Sol · High**. Escalate to Astra Medium only if making the target visibly emerge cannot be separated from authoritative intent geometry or otherwise forces a frozen-authority conflict.

**Exact next action:** implement target emergence from stable resting rectangles, add a deterministic visual/geometry assertion that the target remains materially visible around the dragged Decoy, rerun the complete exact-head workflow, manually inspect replacement temporal evidence, then use TinyFish for independent live-product QA if and only if the artifact is clean.

---

# 6. Remaining 11.2 and broader roadmap

**11.2D — continuity hardening / temporal proof** remains next after 11.2C closure: explicit proxy presentation identity metadata, source/proxy/final continuity evidence, ordinary placement + invalid return + interruption proof, and observation around Decoy/Medic without duplicating 10.4B ownership.

After Pass 11, exact pass numbers remain intentionally unlocked. Established work includes full deck/collection access, full faction/leader playability, final AI ladder Novice→Standard→Veteran→Master→Grandmaster with `AIKnowledgeState != GameState`, mature persistence/replay/history, modular assists/cheats/sandbox, complete UX shell, richer physical-card ecology, dedicated audiovisual identity, PWA/iPhone productization/native-wrapper option where platform ceilings justify it, controlled local asset pipeline, and exhaustive all-card/all-faction parity.

GitHub remains canonical for active development. Reference Drive: `Gwent Classic - Arunsundaram` (`1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`). Legacy product root: `Gwent Definitive - blakemgray` (`1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`).

> **Rules correctness first → interaction correctness → readable gameplay choreography → premium physical feel → complete normal match → complete access → smarter AI → product maturity.**

**Current Pass 11:** planning 100%; implementation ~45%; formally verified/closed ~37%.  
**Current phase:** 11.2C predictive card-target exposure visual-acceptance correction.  
**Next action:** expose the locked Decoy target more clearly without feeding transient transforms back into intent geometry; then full exact-head CI → manual visual review → TinyFish live-product QA.