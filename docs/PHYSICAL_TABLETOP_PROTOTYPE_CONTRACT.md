# Physical tabletop — first playable proof

Status: first foundation implemented and locally verified; exact-head CI and real-device acceptance pending. The adaptive physical table remains the next implementation phase.

Date: 2026-10-02. Repository: `blakemgray/gwent-definitive`. Reconstructed baseline: clean `main` at `8b7429d1ec6615dce5a8e6f956ceb2286647713d`. This working contract is outside the repository; it creates no release candidate.

## Mission and starting state

Make an ordinary playable Gwent match feel like cards being handled on a table. Prove the physical layout and touch model on the user's iPhone before committing to a broad visual rebuild or a large physics stack.

Why now: the user wants larger cards, informal overlapping placement, contact between cards, gentle corrective movement, and useful space in both orientations. The current board is a centered six-rail compositor with 28–40 CSS-pixel board-card height. Every normal game commit recreates board and hand card DOM nodes. Several separate systems apply temporary movement and create replacement actors.

The installed-iPhone side-cutting defect remains open. PR #12 passed automated checks and failed user acceptance. Larger cards or a new renderer cannot establish that defect's cause or close it without device evidence.

## Agreed experience and boundaries

- Witcher 3 Gwent content and rules remain the foundation. Engine state owns legality, scoring, abilities, choices, outcomes, semantic rows, and ownership.
- The user may physically rearrange settled cards on either side. Visual movement never changes their gameplay identity or legal row.
- Portrait and landscape are both fully playable. The whole table stays visible; temporary local focus reveals covered art, power, and abilities.
- Input is responsive. Weight comes from contact, slight rotation, lift, shadows, release motion, and settling.
- Placement may overlap and remain imperfect. Correction preserves the user's arrangement and makes only the movement required for readability, row recognition, and usable input.
- Row borders and fixed rails give way to flexible territories. An optional question about adjacent row clusters versus familiar front-to-back formation is pending. Adaptive territories are the proposed prototype default; final composition is not locked by this contract.

In scope: current normal match with its existing two presets; persistent card bodies; adaptive territories; presentation-only rearrangement; constrained contact and settling; local inspection; one placement/impact treatment; device diagnostics; real-path regression evidence.

Out of scope: new factions or deck builder, AI redesign, expanded content, complete ability VFX, new audio library, multiplayer, native application migration, photorealism, and a general-purpose rigid-body engine.

The user explicitly replaces the old frozen final geometry for this new experience. Engine authority, stable card IDs plus match iids, canonical tap/drag commits, hidden-information boundaries, and match classification remain locked. Existing presentation semantics remain useful, but their geometry ownership must adapt.

## Architecture and implementation sequence

1. **Isolate the candidate.** Begin implementation on a new branch such as `feat/physical-tabletop-prototype` from reconciled current main. Keep the first proof opt-in through a prototype mode. Retain baseline presentation gates and add explicit candidate gates. Do not reuse PR #12's merged branch.
2. **Establish device observability first.** Provide an easy diagnostics entry and copy/export surface. Report runtime release identity, actual worker/controller and waiting status, cache generation when observable, loaded runtime/style generations, Safari versus standalone, URL, layout and visual viewport, orientation, DPR, safe areas, and useful platform information. Unknown legacy-worker data must be labeled unknown. A fresh network worker file is not proof of the active worker's version.
3. **Create persistent card bodies.** Reconcile authoritative semantic state into a registry keyed by match iid. Retain surviving DOM nodes and poses; move the same body across hand/board zones where practical. Create and retire bodies only for actual identity changes. Preserve row score, special-slot, weather, and accessibility semantics.
4. **Give geometry one owner.** The tabletop scene owns position, dimensions, rotation, stacking, lift, and settlement anchors. Drag/flight, FLIP, continuity, target exposure, and authored choreography must request movement or temporary ownership from that scene in prototype mode. They must not independently transform the same body or create simultaneous visible copies. Separate pose, face/effect, and readable annotation layers.
5. **Build the constrained table.** Start with existing DOM art and planar motion plus visual depth. Use adaptive borderless semantic territories, damped release motion, contact response, and soft territory/readability constraints. Deliberate overlap is allowed. Avoid a global repack after every touch or action. Stop the simulation when settled; background/resume and orientation changes reconcile safely.
6. **Extend the existing input owner.** One gesture state machine handles hand play, board rearrangement, and inspection. A presentation adapter provides current zone regions, settlement anchors, coordinate conversion, and exposed card hit regions. Hand play still commits through the canonical engine action path. Board rearrangement never dispatches gameplay actions.
7. **Prove the experience before expansion.** Run a normal match, inspect temporal artifacts, and obtain separate real-iPhone Safari and installed-PWA acceptance in both orientations. Tune the physical feel against that evidence before adding a full set of effects.

Proposed prototype defaults: a moved card pushes contacted neighbors; soft resistance keeps its semantic territory recognizable; stationary taps open local detail and tapping outside dismisses it; poses survive ordinary commits during the live session but are not added to the authoritative save schema. Orientation preserves relative arrangement where the new composition permits it. These defaults may be revised through prototype testing.

Important integration findings:

- `app.js` currently recreates board and hand markup on every commit; this is the first persistence seam.
- `src/battlefield-ux.js` currently writes all final rail geometry. It must delegate in prototype mode rather than continuously overwrite physical placement.
- The choreography observer watches match attributes. Per-frame physical pose updates must not trigger whole-board gameplay snapshots or gameplay event detection.
- The presentation queue must serialize authored consequences without treating ambient settling as an indefinitely busy gameplay action.
- Existing card-specific targeting uses axis-aligned rectangles. Rotated overlapping cards require frontmost exposed hit regions, especially for Decoy.
- Portrait has both a rotation guard and landscape-specific shell/inspector assumptions. A distinct usable composition and visual-viewport handling are required.
- Resting cards and current body-level clones have different CSS scope. Diagnostics and temporal painted evidence must cover all embodiments, including the source image and clipping ancestors.

## Deliverables and acceptance

Deliverables: an opt-in playable tabletop candidate; persistent-body and geometry adapter; board rearrangement and local focus; a small constrained-motion solver; copyable device diagnostics with hand/board comparisons; automated regressions; reviewed screenshots/frame sequences; updated repository continuity on the implementation branch.

Acceptance requires:

1. Normal tap and drag play, opponent action, pass, round transition, and result remain correct through the existing engine. No fixture-only path substitutes for normal play.
2. Exactly one visible embodiment per iid through pickup, commit, landing, effect, cancellation, and settlement. Unrelated commits retain surviving card nodes and valid user poses.
3. Rearranging either side changes no authoritative state, history, event log, score, legal action, classification, or save payload. It generates no unintended play or inspector click.
4. Sparse cards are visibly larger than the current production baseline in matched viewport captures. Crowded tables retain accessible effective power, recognizable ownership/row, and a way to inspect every card. Capture a full table and a 12-card crowded territory in each orientation.
5. Contact causes a visible local reaction. Once constraints are satisfied, cards settle and remain in the user's loose arrangement rather than snapping to a uniformly centered pack.
6. The whole table and essential controls remain usable in portrait and landscape. Local detail preserves table context and returns to the prior arrangement.
7. The diagnostics distinguish candidate runtime from stale/mixed or unknown client state and capture hand/board geometry, computed styles, image dimensions/source, actor ownership, and clipping ancestry in the same session.
8. On the actual iPhone, touch feels immediate, motion settles, and the table remains readable. The existing crop regression is accepted only after its mechanism is supported by evidence and the user confirms the relevant candidate on device.

## Verification, artifacts, and exit

Automated: preserve rules/lifecycle/storage gates; test solver bounds and settling with deterministic input; compare engine snapshots before/after physical gestures; test stable iid/node identity across unrelated normal commits; verify exposed overlap targeting and tap/drag equivalence. Baseline geometry tests remain baseline tests; tabletop assertions must explicitly target prototype mode.

Integration and temporal: use normal user actions to capture pickup → play → impact → effect → settle. Exercise both sides, dense boards, exact-target abilities, interruption, reduced motion, Safari viewport changes, rotation during manipulation, and background/resume. Assert no duplicate/hidden survivors, stale captures, unintended commits, or continued idle-frame work. Include painted art/badge/clipping evidence, rather than only desired CSS property assertions.

Known-bad discrimination: current production must fail the new persistence/rearrangement/portrait behavior gates before those gates support the candidate. The original cropping regression needs a separate mechanism-specific known-bad/fixed discriminator once device data localizes it; do not invent a cause to satisfy a test.

Artifacts: exact commit/head, automated output, matched baseline/candidate images, normal-play frame sequence or recording, density/overlap inspection captures, diagnostics export, device model/environment, Safari and installed-PWA feedback, and the user's acceptance status. Measure device frame timing and input/settlement traces; set a performance budget after the target iPhone is identified.

Model routing: GPT-6.1 Sol / high for ownership and interruption design; medium for routine implementation after those seams are stable. Escalation is warranted only for a narrow unresolved ownership, targeting, or lifecycle failure after instrumentation; stronger-model use is recommendation-only. Return to the workhorse once that issue is resolved.

Authorization: local reconstruction, contract work, and implementation preparation are authorized. Merge, deployment, publication, and production changes require explicit user authorization. A testable candidate and automated success do not close real-device acceptance.

Continuity: record this vision, replaced layout constraints, active branch/head, implementation/verification separately, unresolved crop status, tests/artifacts, device observations, and exact next action in the repository's canonical continuity at the implementation checkpoint.

Exit condition: the playable proof meets automated and artifact checks and the user accepts the physical experience on the real iPhone in portrait and landscape. Release remains a separate milestone. If device access requires hosting the candidate, prepare it first and request authorization for that specific test deployment.

Next action: establish the diagnostic/candidate identity seam, then implement keyed reconciliation and a single tabletop geometry owner on the new prototype branch.

## Foundation checkpoint — 2026-10-02

Implemented: runtime/worker/style diagnostics and export, exact-source packaging identity, opt-in keyed hand/board nodes, lifecycle resets, and scene-owned final positions seeded by baseline geometry. Prototype mode is `?tabletop=1`. Diagnostics are available through Settings or `?diagnostics=1` in either mode.

Local evidence: all 15 Node suites pass; real-browser DOM contract passes; normal tap, drag, opponent response, Spy/draw, Decoy return, cancellation, resize and reset checks cover persistent identity and inert presentation poses. Legacy mode fails the same stable-node oracle. Diagnostics tests cover actual worker response, hand/board ancestry, export/fallback, portrait panel and restart isolation. Source art must be loaded for screenshots to qualify as visual evidence. Initial sandbox-blocked captures were rejected and rerun with public-art access.

This foundation retains the baseline six-rail composition and portrait gameplay guard. Board touch rearrangement, contact physics, flexible composition, larger cards and local focus are not yet implemented. The crop defect is still open. The first foundation is an implementation checkpoint, not pass closure or release authorization.

Next implementation phase: build adaptive semantic territories and direct board manipulation on the persistent bodies, with a constrained contact/settling solver and local focus, then conduct real-iPhone acceptance.
