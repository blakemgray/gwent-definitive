# Lit table: iPhone acceptance

Target: iPhone 17 Pro. Exact iOS version and actual Safari/Home Screen performance remain unverified. This is the first overhead 3D scene, with real meshes and lighting; it is not the finished cinematic table design. The old production side-cutting defect is still open.

The old `4d96af5` tabletop preview does not contain this scene. A new isolated preview requires explicit authorization after the candidate's checks pass. Never install this candidate over the production icon as a substitute for a distinct test build.

## Simple procedure after a test URL is authorized

1. Open the new URL ending in `?table3d=1` in Safari. Start an Instant Match. Keep the phone landscape first.
2. Play a normal unit by tapping, then play another by dragging. Look for the complete printed face during pickup, travel and landing. Move two played cards together and let go: the neighbor should move locally, with a lifted shadow, and settle. Repeat on an exposed opponent card.
3. Tap a played card to inspect it. Cycle through its formation if cards overlap. Check printed art and effective power, then close the detail. Rotate to portrait and repeat.
4. Use the normal Northern Realms leader when available. The confirmed Horn should briefly illuminate the nearby table. This slice implements Horn/Spy lighting; it does not yet replace every existing ability/audio treatment.
5. Open the match menu → Device diagnostics → export/copy the report. Capture a screenshot of the table and report any cut sides, unreadable detail, wrong touch target, flicker, long pause or stutter. Include the iOS version.
6. Add the new URL to Home Screen under its distinct **Gwent Table 3D** name. Open that icon and repeat steps 2–5. After a match has loaded online, background/resume it and try a reload with network disabled. Cached art should remain usable; newly encountered uncached cards require the network.

Keep Safari and Home Screen observations separate. No automated browser run constitutes a physical installation test.

## Expected diagnostic evidence

- Release/active worker/cache generation: `11.table3d.scene.1`; exact source SHA/fingerprint must match the candidate report, not an earlier nearby commit.
- Selected manifest/start URL preserves `table3d=1`; display mode identifies Safari versus standalone.
- `tabletop.lighting`: ready status, loaded table/wood, actual card sources/dimensions, mesh tokens, per-card DOM fallback and upload errors, renderer DPR cap, draw calls/triangles and sampled timing data.
- Original hand/board image bounds and clipping ancestry remain available in the same report.

Timings measure browser CPU synchronization/submission and frame intervals. They do not directly measure GPU execution, haptics, heat or battery use. The proposed interaction target is 60 fps; acceptance requires actual-phone observation and measured sustained behavior.

## Known limits of this first scene

The camera is overhead orthographic. Table geometry fills the responsive viewport; props keep their physical proportions. Cards use planar contact with actual 3D lift, thickness and light rather than a general rigid-body simulation. Dense landscape play still compresses card size; local inspection exposes every card. Cards can physically cover one another and must be moved or inspected through formation navigation. Characters, hands, a cinematic perspective camera, a broader effects campaign and native packaging are outside this slice.

Implementation, automated verification, device acceptance and release are separate. Close this scene pass only after the required physical-device acceptance, and merge/deploy only after explicit authorization.
