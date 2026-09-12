# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** concise permanent implemented-state handoff. Older detail remains preserved in Git history; this file records the current authoritative state needed to resume safely.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Verified production main:** `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b` — run #145 / `34641027264` full verify + Pages deploy success  
**Current branch / PR:** `pass-11-golden-match` / PR #11  
**Latest exact green Pass 11 implementation head:** `0b7b2d3bbcca15771c656ea1e35c91ced114c8b8`  
**Latest exact-head implementation workflow:** run #257 / `34688258610` — FULL SUCCESS  
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match**  
**Current phase:** **11.1A CLOSED / 11.1B CLOSED / 11.2A CLOSED / 11.2B CLOSED / 11.2C CLOSED / 11.2D CLOSED / AUTOMATED AUDIO-HAPTIC-PWA PLATFORM TRUTH CLOSED / TRUE GOLDEN MATCH MACHINE+E2E GREEN; TERMINAL VISUAL CHOREOGRAPHY REPAIR ACTIVE; REAL-IPHONE SENSORY SIGNOFF PENDING**  
**Current task:** **repair the terminal round → match-result presentation overlap revealed by manual Run #257 artifact inspection, then rerun exact-head E2E/visual acceptance without weakening the Golden Match gate**  
**11.2 architecture contract:** `docs/PASS11_11_2_PHYSICAL_CARD_ARCHITECTURE.md` at commit `f6a754c8044b8a633234c48e21a8454683b2ea21`  
**Pass 11 planning:** 100%  
**Pass 11 implementation:** ~73%  
**Formally verified/closed:** ~58%  
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
- `src/presentation-feedback.js` — semantic audio/haptic cue routing, settings, haptic capability diagnostics, and copy cleanup.
- `src/platform-feedback.js` — concrete Web Audio output, user-gesture unlock, lifecycle resume/recovery, and playback-status diagnostics; no rules/action authority.
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

## Audio / haptic / PWA platform truth — AUTOMATED CLOSED; REAL-DEVICE SIGNOFF PENDING

The audit established the original installed-iPhone silence cause: semantic `gwent:audio-hook` events existed, but no concrete audio player consumed them. The game had a conductor with no orchestra.

Permanent automated behavior / proof now includes:

- `src/platform-feedback.js` concrete Web Audio output with procedural/offline-safe cues for ordinary interaction and signature mechanics;
- trusted user-interaction `AudioContext` creation/unlock/resume;
- background/pageshow/visibility lifecycle recovery and explicit playback status diagnostics;
- real gain propagation from persisted effects volume/mute settings;
- concrete status separation between semantic request and actual browser playback outcome;
- `src/presentation-feedback.js` haptic diagnostics distinguishing disabled, unsupported, attempted, success, rejection, and failure;
- capability-truth Settings copy rather than a silently dead haptic toggle;
- PWA/service-worker/deployment inclusion with cache pin advanced through the platform-feedback slice;
- permanent Node/Chromium/WebKit QA for real audio scheduling, reload persistence, lifecycle recovery, supported/unsupported haptic semantics, and preserved interaction behavior.

**Closure implementation head:** `e8cfb8d482bd3b581fff72b33658c6ea3463c7d8`.  
**Run #250 / `34687098690`: FULL SUCCESS.** The concrete platform-feedback gate passed, followed by preserved direct manipulation, destination parity, bot gate, presentation recovery, **256-trial stress**, semantic landing, save/visibility lifecycle, WebKit/iPhone-targeted touch + audio unlock/resume + honest haptic capability, 10.4B signature/adversarial choreography, and 10.4C feel/pacing.

**Approved exact-head artifact:** `pass11-platform-feedback-qa` artifact `10296330417`, digest `sha256:eba21219a36427640302874905b917170a4ee81d9f0f8d31c625eb8542c7eb63`.

Manual artifact review confirmed the replacement 852×393 settings screenshot visibly shows Effects volume at 40%, Mute effects, and Haptic feedback capability state. `platform_feedback_matrix.json` confirmed a real card selection produced `audioPlayed: 1` with a running context and zero audio failures; `SCORCH_TRIGGER` recorded `played` at gain `0.35`; settings persisted through reload; lifecycle resume succeeded with zero failures; and the simulated supported-vibration path issued exactly one vibration call with one successful haptic status. The separate WebKit/iPhone-targeted gate proves real touch unlock/audio scheduling, suspend→resume recovery, zero audio failures, and—when vibration capability is absent—requires `hapticUnsupported >= 1` with zero haptic successes.

**Important device boundary:** automation does not prove that a human actually hears speaker output or feels tactile feedback on the installed iPhone. Current PWA/browser haptic capability remains platform-limited and must never be represented as Core Haptics parity. Actual installed-iPhone audible output, background/relaunch behavior, and tactile quality remain required real-device signoff items before final Pass 11 sensory acceptance.

## Golden Match true start-to-result gate — MACHINE/E2E GREEN; VISUAL CLOSURE PENDING

A permanent no-state-injection Golden Match browser gate now starts from the normal menu, opens Instant Match, performs a real mulligan, enters the battlefield, drives ordinary player actions only through the visible card/target/pass UI, allows the normal opponent loop to respond, resolves player choices through the product choice panel when present, exercises one real mid-match reload → Continue restore, reaches a natural best-of-three result, verifies durable terminal persistence, and starts a fresh Rematch mulligan with the seed advanced. A static contract rejects `setStateForQA` or direct save-state injection in this gate.

The first attempt, run #256 / `34688076377`, correctly failed on a test typo: the engine emits `ROUND_ENDED`, while the new trace assertion initially checked `ROUND_END`. Only that assertion name was corrected; gameplay behavior and acceptance thresholds were not weakened.

**Latest exact green E2E head:** `0b7b2d3bbcca15771c656ea1e35c91ced114c8b8`.  
**Run #257 / `34688258610`: FULL SUCCESS.** The true Golden Match gate passed, then all preserved direct-manipulation, parity, bot gate, presentation-failure recovery, **256-trial physical interaction stress**, semantic landing, save/visibility lifecycle, WebKit/iPhone-targeted, 10.4B signature/adversarial, and 10.4C feel/pacing gates also passed.

**Exact-head artifact:** `pass11-golden-match-e2e-qa` artifact `10296306715`, digest `sha256:1319cd9179877238e9ba1a1139746e205f0ba2890094b91f16330de5d4fb056c`.

Machine/telemetry evidence from the natural browser match is strong: Round 1 p2 win `10–0`, Round 2 p1 win `16–14`, Round 3 p1 win `16–12`, terminal winner `p1`; explicit player pass occurred; live reload restored state exactly; terminal save phase is `result`; rematch seed advanced. Natural stage durations include round-end ~`1029.8 ms`, `1498.9 ms`, `1026.2 ms` and match-result ~`750.0 ms`, with major mechanic stages such as Scorch/Horn/Weather/Muster/Bond/Decoy also receiving materially legible presentation time. Separate engine-only shape traces prove natural player victory, opponent victory, draw, and contested completion without deadlock.

**Manual visual acceptance finding — BLOCKER:** the Run #257 artifact is not visually clean enough to close. Start, before/after live reload, and fresh Rematch mulligan are coherent. Round 1/2 end evidence is understandable. But the terminal transition visibly overlaps presentation layers: on the final round, the `MATCH COMPLETE / VICTORY` result modal is already visible while `ROUND WON` and transient battlefield card ghosts are still playing over it; the subsequent `match-result` stage briefly overlays another `VICTORY` cue across the already-visible result modal. This violates the intended sequential consequence hierarchy (“input response fast; consequences can breathe”) and makes the ending feel like two scenes playing at once. CI green does not override this visual defect.

**Required fix boundary:** preserve engine-first committed `winner` state and durable save semantics; repair presentation-only reveal ordering so the terminal result UI remains withheld while round-end consequence choreography runs, then presents the match-result beat cleanly and reveals the stable result modal only after that beat. Do not hide the defect by changing artifact timing or weakening the Golden Match gate.

---

# 5. Remaining Pass 11 / broader roadmap

Remaining Golden Match work now includes:

- terminal round → match-result choreography sequencing repair identified by manual Run #257 artifact review;
- rerun exact-head Golden Match E2E and manually approve replacement temporal/result evidence before closing the slice;
- real-device iPhone audio/sensory signoff;
- independent coarse live-flow QA where browser tooling is reliable;
- adversarial integration review;
- final exact-head CI/artifact review;
- merge/deploy verification.

Do **not** globally slow consequence timing merely because prior playtest feedback said some animations were too snappy. Run #257 natural-match telemetry already shows substantial round/signature timing. Make further pacing changes only where replacement full-match evidence demonstrates a concrete readability/feel gap.

After Pass 11, exact pass numbers remain intentionally unlocked. Established work includes full deck/collection access, full faction/leader playability, final AI ladder Novice→Standard→Veteran→Master→Grandmaster with `AIKnowledgeState != GameState`, mature persistence/replay/history, modular assists/cheats/sandbox, complete UX shell, richer physical-card ecology, dedicated audiovisual identity, PWA/iPhone productization/native-wrapper option where platform ceilings justify it, controlled local asset pipeline, and exhaustive all-card/all-faction parity.

GitHub remains canonical for active development. Reference Drive: `Gwent Classic - Arunsundaram` (`1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`). Legacy product root: `Gwent Definitive - blakemgray` (`1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`).

> **Rules correctness first → interaction correctness → readable gameplay choreography → premium physical feel → complete normal match → complete access → smarter AI → product maturity.**

**Current Pass 11:** planning 100%; implementation ~73%; formally verified/closed ~58%.  
**Current phase:** true Golden Match machine/E2E proof is green; terminal visual choreography repair is active; real-iPhone sensory signoff remains pending.  
**Next action:** make the smallest presentation-only terminal result reveal-order fix, add/strengthen temporal assertions so a result modal cannot coexist with `round-end` or transient match-result cue states, then rerun exact-head CI and manually inspect the replacement Golden Match artifact before closing the slice.