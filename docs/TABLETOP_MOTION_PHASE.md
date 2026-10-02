# Physical tabletop — adaptive table and manipulation phase

Mission: make the normal match playable as larger persistent cards in six loose, adaptive semantic territories, with direct rearrangement, local contact and settling, and local inspection in both orientations.

Starting state: foundation head `60187ffdfd8465b6e715b3191519212964bc4284` passed Main #314 / `37036859705` and Storage #27 / `37036859827`; browser artifacts reviewed. Draft PR #13; production unchanged. Existing crop defect remains unresolved. Foundation real-iPhone acceptance is pending.

Scope: opt-in `?tabletop=1`; responsive side-grouped territories; scene-owned card poses and contact solver; actual board gestures on either side through the existing input owner; contextual inspection; rotation/background/reset cleanup; normal-path tests, temporal and crowded artifacts.

Out of scope: rules/content/AI/save changes, broad VFX/audio overhaul, native wrapper, multiplayer, a general rigid-body engine, and speculative claims about the escaped crop defect.

Locked invariants: engine owns legality, row/side membership, scores and outcomes. Card iid and surviving DOM identity persist. Hand actions retain canonical tap/drag commits. Board manipulation never invokes engine actions or writes saves. Authoritative choices and authored presentation block board pickup; ambient settling does not block a legal turn indefinitely. Prototype-only composition leaves baseline gates intact.

Interfaces: pure territory/packing/contact calculations consume geometry only. Scene owns final left/top, dimensions, CSS rotation and lift; existing authored effects retain temporary transform leases. Gesture controller owns pointer arbitration, cancellation and synthetic-click suppression. Target-specific hand gestures use frontmost exposed card geometry; physical board drag is suppressed while a hand play is selected. Contact permits overlap with minimum local exposure; it does not spring all cards back to a rigid pack. Explicit focus can cycle every card in a crowded semantic territory.

Deliverables: geometry/contact model; integrated scene and board gestures; portrait/landscape table and local focus; pose/interaction diagnostics; deterministic and normal-path browser regressions; reviewed sparse/crowded and temporal evidence; current continuity.

Acceptance: larger sparse cards than baseline; six identifiable borderless territories fit the table in both orientations; rearrangement on either side preserves exact engine/history/save data and ordinary commits preserve arrangements; neighbors respond locally and motion becomes idle; cancellation/rotation/background cannot orphan a held body; inspection reaches covered cards and effective power; Decoy commits the visible intended target; normal tap, drag, opponent, effects, round/reset/resume paths remain valid.

Verification: pure solver convergence/bounds and invalid inputs; real browser pointer gestures and baseline known-bad controls; Chromium/WebKit normal-play/cancellation/ability tests; density fixture used only for dense layout, alongside normal creation; before/held/release/settled frames and runtime geometry; full retained CI; real-iPhone Safari and installed-PWA feedback remains required for sensory acceptance and crop closure.

Artifacts: exact source head and CI checkout/tree, runs, loaded-art images, temporal frames, JSON geometry/pose/idle reports, baseline/candidate comparison, device procedure. Continuity records implementation versus verification and open real-device evidence.

Model routing: GPT-6.1 Sol / High for cross-system implementation and review. Escalate only for a localized ownership or targeting conflict that remains after reproducible instrumentation. Return to Medium for routine verification once those boundaries hold.

Authorization: implementation and draft PR updates authorized. No merge, deployment or publication. Exit: automated/artifact candidate ready, then real-iPhone acceptance; release is separate. This phase cannot close from CI alone.

Checkpoint: runtime implementation `f7253e964ed1628d8e3e9f68c76400ddf99da401` passed Main #317 / `37070794313` and Storage #30 / `37070794350`; loaded-art Chromium/WebKit temporal, portrait, crowded, focus and Decoy artifacts reviewed. Implementation 100%; runtime verification 90%, with actual-iPhone acceptance pending. Canonical continuity records exact trees, CI checkout, fingerprints, artifact digest and the failed/superseded candidates.

Next action: verify the documentation-inclusive final head, then obtain authorization for a separate candidate test deployment and collect actual-iPhone acceptance. The phase remains open until its device exit condition is satisfied.
