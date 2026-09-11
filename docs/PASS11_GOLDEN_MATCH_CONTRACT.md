# Pass 11 — Golden Match / Complete Normal Match
## Implementation and Acceptance Contract

**Status:** established before gameplay implementation  
**Branch:** `pass-11-golden-match`  
**Starting main head:** `f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b`  
**Starting verification:** run #145 / `34641027264` — verify success; Pages deploy success  
**Authority:** current user instruction → current repository and green CI → `CONTINUITY.md` → `FUTURE_CONTINUITY.md` → this contract  
**Planning date:** 2026-09-11

---

# 1. Outcome

Pass 11 ships one genuine production-quality normal match through the ordinary **Instant Match** path.

A player must be able to launch the installed or hosted product, receive legal classic decks, draw and mulligan a real opening hand, play a complete best-of-three match against a rules-observing opponent, understand every required choice and consequence, finish in victory/defeat/draw, restore the match safely after interruption, and restart or rematch without developer controls.

Pass 11 is not accepted if the engine can technically reach `winner` while the ordinary product still looks or behaves like an integration fixture.

The interaction standard remains:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

---

# 2. Locked invariants

The following are non-negotiable:

1. **Engine truth wins.** Presentation never decides legality, scoring, effects, or match outcome.
2. **One action path.** Tap, drag, keyboard, opponent, and restored-session actions use the same canonical engine validation/commit boundary.
3. **Frozen battlefield authority.** Pass 10.3 row order, row territory, score wells, special slots, centering, packing invariants, and final reconciliation remain authoritative.
4. **Presentation is disposable.** Cancellation, animation failure, backgrounding, resize, orientation change, or reload cannot roll back or duplicate a committed action.
5. **Stable identity.** Permanent card ID and match `iid` semantics remain stable. Presentation actors may be keyed by `iid` but never become rules authority.
6. **Zero-mutation rejection.** Invalid or ambiguous player intent returns cleanly and produces byte-equivalent authoritative rules state.
7. **No closed-pass churn.** Passes 10.3–10.4C reopen only if current evidence proves a regression in their locked responsibility.
8. **No green-by-deletion.** Existing CI gates may be extended or corrected, never weakened, bypassed, deleted, or loosened merely to pass.
9. **No developer shortcut in normal play.** QA fixtures remain explicit and unreachable through ordinary Instant Match.
10. **Classic classification integrity.** Normal Golden Match stays `CLASSIC`; assists, cheats, and injected states remain classified separately.

---

# 3. Repository-grounded baseline audit

| Area | Current evidence | Status entering Pass 11 | Required disposition |
|---|---|---:|---|
| Production deck setup | `app.js` exposes two 16-card player lists and two 16-card opponent lists | Absent | Replace ordinary presets with legal full-size classic decks |
| Opening draw | `createMatch()` draws 10 from the front of the supplied array | Partial | Deterministic shuffled draw from validated decks |
| Deck legality | No runtime validator for unit minimum, special maximum, faction, or availability limits | Absent | Add engine/data-level legality validation and test it |
| Mulligan | UI permits up to two sequential exchanges and may finish early | Partial | Preserve intuitive flow; make result deterministic, legal, restorable, and production-labeled |
| Turn/actions | Canonical legal actions, engine commit, player drag/tap, and heuristic opponent exist | Strong foundation | Remove integration framing and prove full-match completion without deadlock |
| Pending choices | Engine supports multiple choice types; ordinary UI assumes every pending choice is Medic; opponent has no resolver | Partial | Fully handle every choice reachable by the Golden Match decks and fail safely on any unsupported choice |
| Passing/exhaustion | Engine implements explicit pass and automatic no-action pass | Present | Prove across full normal match, including post-pass opponent continuation |
| Scoring/rounds/lives | Engine implements score snapshots, faction tie rule, life loss, round clearing, next round, and match winner | Present | Prove production UI sequencing and best-of-three completion |
| Golden Match factions | Northern Realms vs Monsters presets exercise Northern Realms draw and Monster retention | Useful foundation | Keep this pairing for the locked Golden Match unless evidence requires change |
| Result/rematch | Result overlay and rematch exist; active save is cleared on terminal state | Partial | Add durable terminal-state behavior and prove rematch/restart/menu transitions |
| Persistence | Engine state saves after commit and restores; schema validation is minimal; terminal state is discarded | Partial | Protect exact normal-match state at all required lifecycle checkpoints |
| Battlefield current power | `renderUnit()` shows a power badge only when effective power differs from base | Absent | Show readable current power on every played unit |
| Battlefield identity | Full art is present, but board cards are approximately 28×40 px and live play found them token-like | Partial | Preserve recognizable identity and adaptive exposure inside 10.3 authority |
| Direct drag | Pointer tracking, proxy flight, tap parity, clean invalid return, and interruption handling exist | Strong foundation | Preserve what works |
| Intent/forgiveness | Final-point hit test uses the same 7 px expansion for rows and card-specific targets | Absent | Add geometry-relative, ambiguity-aware intent resolution |
| Predictive target clarity | Target element may highlight, but no confidence/ambiguity model or localized exposure exists | Absent | Make the exact Decoy target unmistakable before release |
| Neighbor response | No minimum target-exposure displacement layer exists | Absent | Add localized, reversible exposure where needed for target clarity |
| Physical identity | Proxy/ghost choreography exists, but no temporal proof prevents disappear/reappear gaps across all required transitions | Partial | Meet a measurable continuous-identity invariant |
| Audio | Feedback dispatches `gwent:audio-hook`; no listener, renderer, media node, Web Audio graph, or audio asset exists | Absent | Ship an actually audible, lifecycle-safe baseline audio path |
| Haptics | Optional `navigator.vibrate` attempt exists; no delivery/unavailable telemetry | Partial | Ship semantic requests, capability truth, duplicate suppression, and real-device validation |
| Consequence pacing | Cause/effect choreography exists; installed-device review found important consequences too fast | Partial | Retune important mechanics without slowing direct manipulation |
| Current CI | Strong Pass 10.3–10.4C deterministic, browser, WebKit, stress, and visual gates | Strong foundation | Add Pass 11 lifecycle, intent, temporal, audio/haptic, and exact-candidate evidence |
| Complete production match QA | Fuzz matches and injected browser scenarios exist; no ordinary Instant Match start-to-rematch gate exists | Absent | Add deterministic Golden Match browser and engine gates |

---

# 4. Must ship in Pass 11

## 4.1 Legal production initialization

The ordinary Instant Match path must:

- use one versioned Northern Realms player deck and one versioned Monsters opponent deck;
- satisfy classic deck legality: at least 22 unit cards, no more than 10 special/weather cards, correct faction/neutral eligibility, catalog availability/duplicate rules, and a valid faction leader;
- validate both presets before a match can start;
- create stable `iid` instances;
- shuffle deterministically from the selected seed through engine-owned RNG;
- draw the correct opening hand, including leader/faction modifiers;
- keep ordered QA fixtures explicitly opt-in and unreachable from normal UI;
- expose no “card slice,” “integration,” or demonstration language to an ordinary player.

A full deck builder is not required. The two production presets are sufficient only if they are genuinely legal and use the same deck-validation contract future decks will consume.

## 4.2 Opening draw and mulligan

The player may replace up to two opening cards and may finish early.

Acceptance requires:

- the hand begins at the rules-correct size;
- every replacement comes from the remaining shuffled deck;
- a replaced card cannot immediately redraw itself;
- the operation preserves total card identity/count and deterministic RNG state;
- mulligan progress and eligibility are obvious;
- reload/interruption cannot duplicate or lose cards;
- finalizing enters the same normal match regardless of whether zero, one, or two cards were replaced.

Opponent mulligan may be deterministic policy rather than player-facing UI, but it must be legal, reproducible, and recorded in semantic events.

## 4.3 Complete normal turn loop

The ordinary UI must complete a match without developer controls:

- player card play by drag or tap;
- opponent play through the same engine action API;
- active leader play for the locked leaders;
- normal card effects required by the two production decks;
- explicit player pass;
- continued opponent play after player pass;
- opponent pass;
- automatic pass when no legal actions remain;
- pending-choice resolution for both sides;
- no mutation while player presentation/choice is unresolved;
- no deadlock if a card effect, round-start effect, or restored state exposes a pending choice.

The production opponent in Pass 11 may remain a bounded “Standard” heuristic. It must be rule-observing, deterministic for a fixed seed/state, capable of finishing the Golden Match, and free of normal-player “Integration Bot” labeling. The final difficulty ladder remains later work.

## 4.4 Required choices

Every pending choice reachable from the locked Golden Match decks must have a complete player or opponent path.

At minimum this includes:

- Medic graveyard target selection when an eligible target exists;
- nested row selection if a revived agile unit in the locked deck can require it;
- any leader/card choice introduced by the final locked presets.

The choice router must:

- render by explicit `pendingChoice.type`;
- expose only engine-provided candidates;
- dispatch `resolveChoice()` through the canonical commit/history/save/presentation boundary;
- restore correctly after reload;
- provide an explicit safe diagnostic state for an unknown/unimplemented choice instead of throwing or corrupting the match.

Choice surfaces for factions/leaders/cards that are impossible in the locked Golden Match may move right as listed in section 5.

## 4.5 Round, faction, life, and match completion

The Golden Match must visibly and deterministically prove:

- row and total scoring;
- explicit and automatic passing;
- round result;
- correct life loss, including draw behavior;
- Northern Realms post-round draw;
- Monster unit retention;
- board/weather/special cleanup;
- correct next-round starter;
- best-of-three completion;
- victory, defeat, and match draw terminal states;
- a readable final score history;
- **Rematch** creates a fresh legal match;
- **Restart Match** is available during play through a deliberate confirmation flow;
- **Main Menu** exits cleanly;
- reloading a terminal match restores the terminal result until the player chooses rematch, restart, or exit.

## 4.6 Save integrity

Persistence must store authoritative state, not presentation state.

Required checkpoints include:

- prepared/mulligan state;
- ordinary player turn;
- ordinary opponent turn;
- pending player choice;
- immediately after engine commit while presentation is in flight;
- after visibility/background interruption;
- between rounds;
- terminal result.

Acceptance requires schema/build validation, safe rejection of malformed or incompatible saves, no stale presentation transients after restore, and exact state equality for supported checkpoints. Mature replay, cross-version migration, cloud sync, and unrestricted history remain later work.

## 4.7 Battlefield readability

Every played unit must expose:

- recognizable card art/identity;
- readable current effective power, including unchanged base power;
- clear modified-power treatment without hiding the actual current value;
- accessible name, current power, row, and meaningful ability information.

Density behavior must:

- use the available rail for sparse rows;
- compress/overlap progressively only as density requires;
- retain current power and enough identity to distinguish cards;
- preserve first/last edge, centering, row bounds, score wells, special slots, and the frozen six-row order;
- temporarily expose a relevant target without changing the reconciled final 10.3 layout.

## 4.8 Intent, forgiveness, and predictive targeting

Raw one-size-fits-all rectangular hit testing is insufficient.

The resolver must use live semantic geometry and classify actions by ambiguity:

- **ordinary singular row/global/weather placement:** generous geometry-relative forgiveness may accept a clear near miss;
- **multiple row destinations:** commit only when one destination is clearly dominant;
- **card-specific targets such as Decoy:** require precise, high-confidence commitment;
- **trajectory/flick assistance:** may inform a singular unambiguous destination, never choose among meaningful card-specific targets;
- merely crossing a legal region never commits; release intent controls the decision;
- ties/overlap/low confidence reject cleanly.

Before release on a card-specific action:

- exactly one candidate target is unmistakable;
- the candidate card lifts/emphasizes and remains visually identifiable;
- adjacent cards may yield locally just enough to expose it;
- displacement is reversible and may not broadly reflow the row;
- leaving the confidence region removes the lock and restores the row.

Tap remains first-class and must require the same explicit target selection for ambiguous actions.

## 4.9 Continuous physical card identity

For every required hand-to-destination, Decoy exchange, Medic revival, draw, discard/destruction, round clear/retention, and invalid return:

- a card's `iid` maps to one continuous perceived actor through the meaningful transition;
- no frame presents an unexplained disappearance followed by a respawn elsewhere;
- temporary duplicate DOM used for choreography may not create visible double identity;
- destruction visibly concludes before the actor disappears;
- a returned/revived card visibly travels or transforms into its destination;
- interruption reconciles to exactly one final rendered representation of engine truth.

A persistent actor registry is permitted but not mandated. Acceptance is behavioral and temporal; any registry remains presentation-only.

## 4.10 Baseline audio

Pass 11 must add a real audio consumer, not only semantic hooks.

Required behavior:

- local, permitted baseline sounds or deterministic Web Audio synthesis for card pickup/settle, valid lock, rejection, pass, round result, and the important Golden Match mechanics;
- audio context/media unlock on a deliberate user gesture;
- correct mute and effects-volume defaults;
- persistence of settings;
- resume/relaunch recovery;
- preload/decode/playback error handling;
- request, start, completion/rejection, and reason telemetry;
- no duplicate bursts from repeated observers or restored presentation;
- reduced motion does not imply muted audio;
- installed-iPhone PWA produces audible output, unless a specific capability blocker is reproduced and documented with evidence.

A final bespoke audiovisual asset campaign is not required, but silent or purely generic signature consequences are not acceptable.

## 4.11 Baseline haptics and capability truth

Required semantic moments:

- pickup/grasp;
- valid-destination lock;
- board settle;
- invalid return;
- selected major effect/result beats.

The feedback layer must record requested, delivered, suppressed, or unavailable status with reason and prevent duplicate pulses. It may use available web capability and/or an explicit future bridge interface. Unsupported platforms must be reported honestly in UI/telemetry; unsupported iPhone PWA haptics are not to be simulated as successful. Native-quality haptic fidelity may move right, but the semantic contract and supported-platform behavior may not.

## 4.12 Legible consequence pacing

Direct pointer response, selection, and ordinary placement stay immediate.

Important events receive authored cause → consequence → settle timing sufficient to read:

- Scorch;
- Weather/Clear;
- Spy and draws;
- Decoy;
- Medic;
- Muster;
- Tight Bond;
- Horn;
- leader ability;
- passing;
- round/life transition;
- final result.

Scorch must visibly communicate ignition/destruction before board collapse and score change. Pacing tokens remain centralized, reduced-motion equivalents remain clear, and no animation may block engine correctness.

---

# 5. Intentionally moved to the right

The following are established future requirements but are not Pass 11 release blockers:

- unrestricted deck builder, collection browser, analytics, imports, and saved-deck management;
- player-facing selection of every faction, leader, and arbitrary legal deck;
- complete UI choice coverage for engine states impossible under the locked Golden Match presets;
- final AI ladder from Novice through Grandmaster;
- broad opponent modeling and advanced strategic AI;
- complete cheats/assists/sandbox, statistics, match history, replay, and unrestricted undo/redo;
- cloud sync, cross-device persistence, and mature cross-version save migration;
- advanced neighbor ecology across all hand/board cards;
- sophisticated velocity/rotation/throw physics beyond the minimum unambiguous intent assistance;
- the final bespoke audiovisual identity/asset campaign;
- native-wrapper haptic fidelity where the PWA platform has a measured ceiling;
- unrestricted offline ownership/localization of the entire remote card-art catalog;
- full portrait management shell and final iPhone productization;
- final exhaustive all-card/all-faction parity campaign.

Moving these right may not be used to excuse a miniature deck, silent Golden Match, unreadable battlefield cards, ambiguous Decoy behavior, incomplete locked-deck choices, or a missing end-to-end normal match.

---

# 6. Implementation phases and model routing

These are internal phases, not new numbered major passes.

| Phase | Purpose | Default recommendation | Escalation / return rule |
|---|---|---|---|
| 11.0 | Reconstruction, audit, and this contract | GPT-5.6 Sol · High | Complete; no Astra need found |
| 11.1 | Legal setup, shuffle, mulligan, normal lifecycle, choice broker, result/save foundation | GPT-5.6 Sol · High | Escalate only for an unresolved engine/lifecycle state conflict; return after the state contract is fixed |
| 11.2 | Readability, continuous identity, intent/forgiveness, predictive target exposure | Start GPT-5.6 Sol · High | Recommend GPT-6 Astra · Medium only if persistent actors + live geometry + ambiguity + interruption safety cannot be separated cleanly; return to Sol High immediately after the architecture decision |
| 11.3 | Locked architecture implementation in controlled slices | GPT-5.6 Sol · High | Localized implementation and tests do not justify Astra |
| 11.4 | Flight recorder, trajectory matrix, temporal evidence, browser/WebKit gates | GPT-5.6 Sol · High | De-escalate only for purely mechanical artifact handling; keep High for failure analysis |
| 11.5 | Audio/haptic/PWA implementation and installed-device diagnosis | GPT-5.6 Sol · High | Astra Medium only after instrumented evidence leaves a genuine lifecycle/cross-system defect unresolved; return for fixes |
| 11.6 | Adversarial integration review | GPT-6 Astra · Medium recommended at the phase boundary | User must explicitly switch/authorize; findings return to Sol High |
| 11.7 | Fixes, exact-head CI, temporal visual inspection, live-browser and real-device signoff | GPT-5.6 Sol · High | Astra only for a narrow unresolved high-risk defect |
| 11.8 | Final pre-merge audit | Sol High unless remaining cross-system risk justifies Astra Medium | Astra Max only for an exceptional narrow blocker and explicit user approval |

No standing Astra Max use is planned.

---

# 7. Required QA and release acceptance

## 7.1 Deterministic machine proof

Add permanent gates for:

- legal deck validation and rejection matrix;
- stable seeded shuffle/opening draw/mulligan;
- card conservation and unique `iid` invariants;
- complete Golden Match engine traces across multiple seeds and victory/defeat/draw shapes;
- every locked-deck effect and pending choice;
- explicit pass and exhaustion auto-pass;
- faction effects, life loss, round starters, and terminal winner;
- rematch/restart state isolation;
- supported save checkpoints and malformed-save rejection;
- rejected/ambiguous gesture byte-equivalent state;
- intent trajectory matrix: near miss, overshoot, diagonal, reversal, boundary, overlap, crowded row, multiple targets, and low confidence;
- `iid` continuity/reconciliation invariants;
- audio/haptic request/status/duplicate-suppression diagnostics;
- interruption and reduced-motion equivalence.

Fuzzing remains adversarial and must include full-size legal decks, pending choices, pass decisions, and bounded completion. Fuzz success may not replace exact Golden Match assertions.

## 7.2 Browser and WebKit proof

Playwright must operate the ordinary product path, not only injected states:

`landing → Instant Match → mulligan → normal turns → pass/rounds → result → rematch/restart`

Required environments include Chromium and iPhone-targeted WebKit at the canonical 852×393 viewport. Tests must cover restore during a pending choice and during committed presentation, orientation/visibility interruption, and installed/PWA-relevant audio unlock behavior where automation can observe it.

## 7.3 Temporal visual proof

For important interactions, generate dense frame sequences and/or recordings with synchronized telemetry for:

`pickup → manipulation → candidate lock → release → flight/impact → effect → settle`

Required sequences include:

- ordinary row play;
- Decoy target acquisition and ambiguous rejection;
- invalid return;
- Spy;
- Medic;
- Muster;
- Horn/Bond;
- Weather/Clear;
- Scorch;
- round/life transition;
- final result/rematch;
- reduced-motion equivalents.

Visual review must confirm identity continuity, pointer fidelity, exact candidate clarity, localized reversible displacement, final geometry, current-power readability, cause/effect order, and absence of clipping/pop/teleport.

## 7.4 Flight recorder

A QA-only, disabled-by-default flight recorder should expose:

- timestamps;
- pointer path/velocity and gesture duration;
- held `iid` and pickup offset;
- live legal destinations;
- candidate/confidence/ambiguity;
- forgiveness/lock transitions;
- local displacement;
- commit or reject reason;
- engine action and before/after state digest;
- presentation stages;
- audio request/playback status;
- haptic request/delivery status.

It is observation only and may not influence rules or production outcomes.

## 7.5 Live-browser and real-device proof

Before merge:

- operate the exact candidate through the player-facing flow using connected live-browser tooling where useful;
- inspect the generated QA evidence personally for the latest exact PR head;
- complete an installed-iPhone PWA pass for touch feel, audible output, lifecycle, orientation, and haptic capability truth.

The real device should judge sensory/platform quality after automated logic/layout gates are green; it should not be the first place basic defects are discovered.

## 7.6 Release sequence

1. All existing and new gates pass on the latest exact PR head.
2. Generated temporal/visual artifacts from that exact head are manually inspected.
3. Live-browser and installed-device findings are recorded.
4. Any fix creates a new exact head and repeats affected plus full required gates.
5. Merge only the latest exact fully green head.
6. Verify the resulting exact `main` head with full CI.
7. Verify Pages deployment and live production behavior.
8. Close `CONTINUITY.md` with final SHAs, run/artifact evidence, visual findings, remaining move-right debt, and next action.
9. Do not create a recursive continuity-only commit merely to record verification of a deliberately terminal continuity-only stamp.

---

# 8. First implementation slice

The first gameplay slice after this contract is accepted is **11.1A — legal normal-match foundation**:

1. introduce reusable deck-legality validation;
2. define and validate the two full-size Golden Match presets;
3. implement deterministic production shuffle/opening draw;
4. preserve explicit ordered QA-fixture capability outside ordinary UI;
5. upgrade mulligan state persistence and semantic events;
6. add engine and ordinary-UI tests proving legal 10-card hands with full remaining decks;
7. keep all presentation/geometry behavior otherwise unchanged.

This slice is intentionally engine/setup-first. Physical-card architecture begins only after the normal match starts from truthful state.
