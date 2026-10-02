# Tabletop candidate — iPhone acceptance

Production has not been changed. A branch URL is not a deployed website. First verify the exact PR #13 candidate and obtain explicit authorization for a separate test deployment. Record its URL and stamped source SHA before asking the user to test. Do not substitute production for the candidate.

On the authorized candidate URL:

1. Open Safari with `?tabletop=1`, start a normal match, and play two cards into the same territory. Tap a card to inspect its effective power; close the detail.
2. Slide one placed card against the other. The neighbor should move gently, cards should settle, and scores/turn should stay unchanged. Rearrange an opponent card too.
3. Rotate between portrait and landscape, including once while holding a card. Play another normal card in each orientation. Check whole-table readability, hand selection, row identity, pass and menu access.
4. Open match menu → Device diagnostics. Refresh and copy/export the report. Take a full-table screenshot and note whether any card sides still appear cut, whether touch feels immediate, and whether motion settles.
5. Add that candidate to the Home Screen and repeat the same sequence there. Send the Safari and installed-PWA reports separately, together with the iPhone model and any screenshot showing clipping.

Expected identity: application/CSS/input/battlefield/service-worker generation `11.tabletop.motion.1`; physics and scene `tabletop.motion.1`; stamped exact source SHA matches the approved candidate; `packaged: true`. A missing worker, waiting worker, unknown generation or mismatch is diagnostic evidence, not acceptance. Reports include URL, display mode, viewport/visualViewport/DPR, controller/cache state, image source/intrinsics, clipping ancestry, retained same-session hand comparison, card poses and pointer status.

The hand is the clipping control: collect the report after normal hand-to-board play so the same iid/source has both ancestry snapshots. Report does not erase caches or activate a waiting worker. Preserve evidence before attempting an update.

Acceptance is pending until the user confirms both orientations and both Safari/PWA environments. The older production crop regression remains open until its mechanism is supported and the user confirms the relevant device candidate. Browser emulation and CI support this check; they cannot close it.
