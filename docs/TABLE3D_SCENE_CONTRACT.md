# Lit 3D table scene — first playable slice

Date: 2026-10-03. Branch: `feat/lit-3d-table-scene`. Starting source: verified tabletop candidate `4d96af5f4fe9f2c64fa06f509369840aefdf574e`; production/main reconciled at `8b7429d1ec6615dce5a8e6f956ceb2286647713d`. This branch depends on PR #13's unmerged interaction foundation. It is a new candidate, not a release of that dependency.

## Mission and why now

Build one normally playable Gwent match scene with actual 3D card bodies, a material table, coherent real-time shadows and one engine-driven ability-light treatment. Establish whether the supplied visual direction works on the user's iPhone 17 Pro before choosing final PWA, native-wrapper or native-engine delivery.

The existing interaction prototype proves persistent identities, contact and rearrangement but does not meet the material/lighting reference. The user explicitly authorized this first scene and use of connected Higgsfield and Adobe. Real-phone acceptance of the previous interaction candidate and the original production crop defect remain open; no success is inherited from references or browser images.

## In scope

- Opt-in `?table3d=1` normal gameplay, preserving current baseline and tabletop modes.
- Local, pinned Three.js WebGL 2 renderer; offline-controlled module and asset paths.
- Editable Higgsfield/Blender table and perimeter props, portable GLB, Adobe wood material source with provenance.
- Thin physical card geometry, canonical source artwork, lift/contact shadows and coherent warm lighting.
- Near-overhead orthographic gameplay camera for the first slice. It keeps the projected plane aligned with the existing semantic touch geometry; it is a deliberate readable camera, not a perspective implementation claim.
- Borderless front-to-back semantic groups with adaptive occupied-row depth, loose packing and the existing contact solver.
- Existing normal tap/drag engine actions, both-side presentation-only rearrangement, local inspection and dense-card access.
- One public, engine-confirmed ability light treatment with cancellation and reduced-motion handling.
- GPU readiness/failure/context lifecycle, finite idle scheduling, renderer diagnostics and an install manifest retaining the selected mode.

## Out of scope and invariants

No rules/catalog/AI/save-schema changes, new decks, new native packaging, full tavern characters/hand animation, ray tracing, full ability campaign or general 3D rigid-body engine. This slice does not claim to diagnose or fix the old production clipping mechanism.

The engine owns legality, scoring, effects and results; stable IDs/iids, canonical tap/drag actions, hidden-information boundaries and CLASSIC/ASSISTED/MODIFIED/SANDBOX remain intact. Pose/contact is presentation-only. The existing gesture controller remains the sole pointer owner. The 3D backend reads public render state and cannot dispatch gameplay or write saves.

## Ownership and interfaces

Persistent semantic DOM supplies accessibility, canonical interaction and authoritative card data. The existing tabletop scene owns planar poses/contact. The new renderer consumes projected bodies and temporary actor visibility; there must be exactly one painted embodiment per iid through play, effects, cancellation and reset. Meshes cannot ignore CSS actor leases. Per-frame drawing cannot mutate the DOM in ways that trigger gameplay observers.

Renderer interface: `enabled`, `ready`, `invalidate(reason)`, `projectCard(iid)`, `pick(point, eligible)`, `toLocal(iid, point)`, `effect(event)`, `metrics()`, and cleanup/context lifecycle. Normal failure leaves readable interactive semantic cards and the authoritative match intact. A new renderer has its own readiness signal; semantic faces are suppressed only after validated GPU readiness.

Internal phases: reconstruction/contract; asset blockout and review; renderer and composition integration; normal-path/pixel/temporal verification; adversarial ownership/lifecycle review; correction; exact-candidate handoff and phone acceptance.

## Deliverables and acceptance

1. A locally playable opted-in scene with the seven references recorded, controlled assets and an editable Blender source.
2. Recognizable full card art, coherent contact/lift shadows and readable totals/power in portrait and landscape. No static background substitutes for moving-card lighting.
3. Real normal play, opponent consequences, pass/round/reset and exact-target behavior keep the existing rules gates. Card bodies remain unique through travel and effects.
4. Either-side rearrangement and inspection leave engine/history/save unchanged. Crowded cards remain reachable; rejected gestures produce no mutation.
5. The chosen ability treatment occurs from a committed public event, visibly changes scene illumination, stops on cancellation/reset and keeps reduced-motion equivalence.
6. Missing textures, failed GPU, context loss/restore, background/resume and resize remain recoverable without changing the match. Idle drawing stops; resource counts remain bounded across rematch.
7. Diagnostics name source/build/worker plus GPU renderer, asset readiness/errors, draw calls/triangles/texture counts and measured frame timings. 60 fps interaction is a proposed phone target, not a browser-emulation result.
8. User confirms the new candidate on the actual iPhone in both orientations and Safari/Home Screen before device acceptance or pass closure.

## Verification and artifacts

Automated: preserve all retained engine/PWA/storage/motion/UI gates; add layout and adapter contracts and a real normal-action 3D gate. Demonstrate that known-bad `4d96af5` lacks the rendered mesh/lighting behavior. Use frame/pixel evidence of shadow movement and ability illumination, not only desired property assertions.

Integration/visual/temporal: inspect hand -> held -> committed -> landing -> ability -> settle frames, both orientations, dense access, frontmost exact-target picking, interruption, resize, background and context loss. Inspect the GLB in the actual runtime as well as the Blender render. Runtime source art must load/decode before accepted screenshots.

Artifacts: exact source/tree SHA, pinned dependency integrity/license, plugin project/revision and material provenance, local asset hashes, normal-path screenshots/frame sequences, browser reports, workflow IDs/results, deployable archive and phone diagnostics/feedback.

## Model routing, authorization and exit

Default: GPT-6.1 Sol / High for scene ownership/input/rendering integration. Return to Medium once those interfaces are settled. Escalate only for an instrumented unresolved rendering/ownership conflict. Parallel ownership is limited to asset project, renderer module and new tests; root owns app/scene/layout/loading/PWA integration.

Implementation, asset authoring, ordinary checks, corrections, review and draft-PR preparation are authorized. The existing preview authorization covered `4d96af5` only. No new preview publication, merge or production deployment without explicit authorization.

Exit: implementation and exact-candidate automated/visual evidence are complete, continuity and artifacts are recorded, and the user has accepted the actual-phone scene. Release remains separate. Before phone acceptance, report a testable candidate and the exact remaining evidence instead of closing the pass.

Next action: integrate the pinned renderer/asset adapter and front-to-back scene while preserving the canonical action and actor-visibility contracts.
