# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** concise permanent implemented-state handoff. Older detail remains preserved in Git history; this file records the current authoritative state needed to resume safely.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Verified production main:** `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b` — run #145 / `34641027264` full verify + Pages deploy success  
**Current branch / PR:** `pass-11-golden-match` / PR #11  
**Latest exact green Pass 11 implementation head:** `7e0c95ff3d77092853c89788271a3c69b00a324f`  
**Latest exact-head implementation workflow:** run #234 / `34685457343` — FULL SUCCESS  
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match**  
**Current phase:** **11.1A CLOSED / 11.1B CLOSED / 11.2A CLOSED / 11.2B CLOSED / 11.2C CLOSED / 11.2D CLOSED**  
**Current task:** **checkpoint before next Pass 11 area; next planned work is player-facing audio/haptic/platform-truth audit, then remaining consequence pacing and complete Golden Match end-to-end acceptance**  
**11.2 architecture contract:** `docs/PASS11_11_2_PHYSICAL_CARD_ARCHITECTURE.md` at commit `f6a754c8044b8a633234c48e21a8454683b2ea21`  
**Pass 11 planning:** 100%  
**Pass 11 implementation:** ~57%  
**Formally verified/closed:** ~50%  
**Default model:** GPT-5.6 Sol · High  
**Last updated:** 2026-09-12 America/New_York

---

# 0. Authority and work protocol

Precedence: current user instruction → current repository/green CI → this file → `FUTURE_CONTINUITY.md` → current contracts/config → `MODEL_ROUTING.md` for model choice → older archives/chat.

Before every new implementation task or resumed cycle: read `CONTINUITY.md`, `FUTURE_CONTINUITY.md`, and `MODEL_ROUTING.md`; then write an actual checkpoint to this file before changing implementation code. Every work update includes completion percentage and an exact **Next action**. Model/effort recommendation is surfaced only when a change is actually justified by evidence or task risk.

Never weaken/delete/bypass CI or QA merely to make a candidate green. GitHub is authoritative for source/branches/PRs/CI/artifacts and merge verification. Playwright/CI provides deterministic machine and temporal-browser proof. TinyFish is an independent live-product QA channel for coarse player-facing flows when it can navigate the product reliably; it is not a substitute for deterministic microinteraction QA and should not be repeatedly retried when the agent itself is misnavigating the UI. Precise drag/target/temporal interaction proof belongs to Playwright + telemetry + manually inspected artifacts. Real-device iPhone review remains required for final physical touch/audio/haptic/platform signoff. Merge only the latest exact fully-green head after manual visual evidence review.

Every status update should also include a concise **layman’s explanation** of what the current engineering work means for the actual game/player experience.

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
- `src/target-exposure.js` — 11.2C presentation-only target exposure/local neighbor yield; no rules or commit authority.
- `src/card-continuity.js` — 11.2D observation-only `iid` continuity telemetry + final-visibility guard; no rules or geometry authority.
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

QA doctrine: **machine proof + temporal visual proof + independent live-flow proof where tool-appropriate + real-device proof**. Use the strongest tool for the evidence type rather than forcing one browser agent onto every interaction. Playwright owns precise deterministic interaction/temporal proof; TinyFish independently operates coarse live player flows where reliable; real iPhone remains final authority for physical feel and platform-specific behavior.

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

## 11.2C — predictive card-target exposure — CLOSED

Permanent behavior:

- target-specific legal units remain in 10.3 absolute resting geometry; selecting Decoy no longer broad-reflows the row;
- `src/target-exposure.js` is presentation-only and consumes the existing controller/11.2B winner rather than choosing or committing actions;
- locked Decoy targets are represented by a presentation-only actor keyed to target `iid`, raised above the held Decoy while authoritative resting geometry remains stable;
- actor preserves recognizable art/current power; normal scale ~1.16× with ~7.2 px lift in approved evidence;
- only immediate local neighbors yield slightly and restore reversibly;
- target transfer/leave/cancel/interruption restores exactly one resting representation;
- reduced motion preserves unmistakable identity without translation;
- trajectory-only highlight expires with the 120 ms velocity window; late release rejects with zero mutation;
- intent geometry uses stable candidate rectangles, not transient exposure transforms;
- tap/keyboard/canonical `commitAction()` ownership remains unchanged.

Closure implementation head `e6ccde4ca191bcbf8062404bfbd97d6fbc0a6548`; run #221 / `34681981459` full success. Approved artifact `10294431189`, digest `sha256:01bd9604178e6931bc13a5d1e9b22b9c1f658adbc3d90211d64ca73ad970803a`, manually reviewed and approved.

TinyFish evidence for this precise drag slice remained inconclusive because its runs repeatedly navigated into pause/settings/developer surfaces. That is automation-agent misnavigation, not failed product evidence, and does not override deterministic Playwright/temporal proof. Do not repeatedly retry TinyFish for this microinteraction; use it later for coarse end-to-end flow where reliable.

## 11.2D — card identity continuity / temporal proof — CLOSED

11.2D makes the ordinary source → moving proxy → authoritative final-card handoff explicit and measurable without introducing a rules-bearing actor system or duplicating 10.4B mechanic choreography.

Permanent behavior / proof:

- `src/card-continuity.js` observes `iid`, source/proxy/final visibility/rectangles, queue state, engine zone, and lifecycle stages; instrumentation remains observation-only;
- the final board representation is synchronously guarded before the queue-start sample once engine commit/reconcile has occurred, so the moving proxy remains the sole full-strength perceived card during flight;
- on queue cancellation/interruption, final-guard release is deferred until the queue's proxy cleanups have run, preventing a final+proxy duplicate seam while preserving engine-first authority;
- ordinary valid drag and tap preserve one continuous perceived identity;
- invalid release and pre-commit interruption return to the original hand identity with zero engine mutation;
- post-commit interruption keeps the already-committed action exactly once and reconciles to one final board representation;
- reduced-motion path obeys the same identity invariant;
- frozen Pass 10.3 rest geometry and the single canonical action path remain untouched.

The new gate intentionally exposed two real seams before closure: candidate `36f2f5fa5d23b550bfd224d5b0f1b4aadbdd9acf` / run #231 failed on a duplicate at `queue-start`; candidate `27f7c723ef5c16b90a320c626ce3d1c629f9f235` / run #233 passed that seam but then exposed a post-commit interruption duplicate at `final-revealed`. Neither test was weakened. The implementation was fixed at the presentation handoff boundaries.

**Closure implementation head:** `7e0c95ff3d77092853c89788271a3c69b00a324f`.  
**Run #234 / `34685457343`: FULL SUCCESS.** The unchanged six-case 11.2D gate passed, followed by preserved direct-manipulation, tap/drag parity, bot gate, presentation-failure recovery, **256-trial physical interaction stress**, semantic landing, save/visibility lifecycle, WebKit/iPhone-targeted interaction, 10.4B signature + adversarial choreography, and 10.4C feel/pacing gates.

**Approved exact-head artifact:** `pass11-2d-card-continuity-qa` artifact `10295831164`, digest `sha256:26b04b5139cfd96f5b6c3666c48ace3ec1125786a90f461f1a90d4bee2818c98`.

Manual artifact review covered the full 10-frame temporal sequence plus `continuity_matrix.json` / trace evidence: drag pickup → committed guarded flight → settled; tap flight; invalid return; pre-commit interruption before/restored; post-commit interruption guarded/reconciled; reduced-motion settled. No visual duplicate or zero-representation gap was observed in the reviewed evidence. Final matrix states show exactly one full-strength representation in all six cases; invalid/pre-commit cases remain in hand with zero mutation, and post-commit interruption records `committedExactlyOnce: true` before one final board representation.

---

# 5. Remaining Pass 11 / broader roadmap

The next Pass 11 work area is the **player-facing audio / haptic / PWA platform-truth audit**. The user previously reported no audible sound at all in the installed iPhone PWA, so semantic cue emission alone is not sufficient. The next cycle must first update this continuity file, then trace and test actual defaults, volume/mute persistence, user-gesture unlock, asset loading/decoding, playback success/failure, background/resume/relaunch behavior, and honest haptic capability semantics. Automated/browser evidence should verify requests/status/capability handling; actual iPhone output and tactile quality remain real-device signoff items.

After audio/haptic truth, remaining Golden Match work includes consequence pacing where still needed, complete normal-match end-to-end acceptance, real-device sensory signoff, adversarial integration review, final exact-head CI/artifact review, and merge/deploy verification.

After Pass 11, exact pass numbers remain intentionally unlocked. Established work includes full deck/collection access, full faction/leader playability, final AI ladder Novice→Standard→Veteran→Master→Grandmaster with `AIKnowledgeState != GameState`, mature persistence/replay/history, modular assists/cheats/sandbox, complete UX shell, richer physical-card ecology, dedicated audiovisual identity, PWA/iPhone productization/native-wrapper option where platform ceilings justify it, controlled local asset pipeline, and exhaustive all-card/all-faction parity.

GitHub remains canonical for active development. Reference Drive: `Gwent Classic - Arunsundaram` (`1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`). Legacy product root: `Gwent Definitive - blakemgray` (`1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`).

> **Rules correctness first → interaction correctness → readable gameplay choreography → premium physical feel → complete normal match → complete access → smarter AI → product maturity.**

**Current Pass 11:** planning 100%; implementation ~57%; formally verified/closed ~50%.  
**Current phase:** 11.2D closed; awaiting next user-triggered work cycle.  
**Next action:** on the next user trigger, refresh repository state and update `CONTINUITY.md` first, then begin the evidence-driven player-facing audio/haptic/PWA platform-truth audit before changing implementation.