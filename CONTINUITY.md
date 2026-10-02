# Active work — physical tabletop motion candidate

## Current checkpoint — installed-entry correction

The documentation-inclusive `.1` candidate `72a3a5ee29f427aa2324383b8a71340b11fefda0` exposed a separate confirmed launch defect during final review: prototype selection requires `?tabletop=1`, but its selected manifest started at `./`. An installed launch could therefore reopen the baseline renderer. This is a prerequisite for meaningful phone acceptance; it is not a proven cause of the original production card crop.

The successor on draft PR #13 selects `manifest-tabletop.webmanifest` only in prototype mode, with an explicit tabletop start URL and distinct identity/title. Both root and repository-mounted paths are checked; baseline installation retains its existing manifest. The new manifest is included in production staging and all 41 service-worker precache paths. Application/core/tabletop/physical-card/input/battlefield/worker generation advances to `11.tabletop.motion.2`; unchanged scene/physics and diagnostic modules retain their own versions.

Evidence: the new browser launch regression FAILED on the unchanged packaged `72a3a5e` candidate at the manifest-selection assertion, then PASSED on corrected local source. It follows the selected manifest's actual start URL, starts a normal portrait match, and compares the baseline launch control. `realInstallation: false` explicitly distinguishes this from physical installation. All 16 Node validation suites and 37 real-browser DOM assertions pass locally. Full exact-head CI, loaded-art review, and physical Safari/Home Screen acceptance must still be recorded for this successor; earlier green runs do not verify changed runtime code.

Implementation: 100% of this interaction phase. Verification: approximately 90% on the prior runtime; the corrected successor needs its own final automated evidence. No public test URL, merge or deployment is authorized. Next: verify PR #13's exact corrected head and inspect its cross-browser manifest-launch/temporal artifacts, then obtain authorization for a separate iPhone test deployment. The older checkpoints below are historical where superseded by this launch correction.

**Updated:** 2026-10-02 America/Indianapolis.
**Branch:** `feat/physical-tabletop-prototype`, created from reconciled main `8b7429d1ec6615dce5a8e6f956ceb2286647713d`.
**Authority:** the user's new tabletop vision and explicit implementation authorization supersede the frozen presentation geometry for the opt-in prototype. Rules, semantic rows, iid identity, canonical actions, storage and classification remain authoritative.
**Current phase:** motion implementation verified; documentation-inclusive candidate verification and real-iPhone acceptance pending. Implementation was authorized by the user on GPT-6.1 Sol / High; routine verification recommendation is Medium. See `docs/TABLETOP_MOTION_PHASE.md` and `docs/PHYSICAL_TABLETOP_PROTOTYPE_CONTRACT.md`. Current final candidate authority is draft PR #13's exact head; this checkpoint follows the exact verified runtime implementation below. Do not assign earlier green status to an unverified changed head.
**Foundation implementation:** 100%. **Foundation verified:** 90% (final head `60187ffdfd8465b6e715b3191519212964bc4284` passed Main #314 / `37036859705` and Storage #27 / `37036859827`; loaded-art artifacts reviewed; real-iPhone pending). CI checkout `c8b412d8bdc02ffbbb2281b318568ce6ba8dba27` has the identical source tree `09e40f2fceb32e2a1a882d5450aec3e925ba0575`. **Full playable prototype:** approximately 25% implemented at phase entry; adaptive composition/contact/board gestures/local focus remain. No merge/deploy authorization.
**Locked experience:** either side can be rearranged presentation-only; portrait and landscape fully playable; whole table plus local focus; weighted and responsive. Adaptive row composition remains a prototype choice pending feedback.
**Open defect:** the installed-iPhone crop still fails acceptance. No root cause or fixed status is inferred from the new renderer.
**Current production:** main `8b7429d...`, verified/deployed by Run #312 / `37007918595`; runtime generation `11.golden.5`. The historical hotfix evidence below remains relevant.
**Local evidence:** 15 Node suites, 37 real-browser DOM assertions, normal tap/drag/opponent/Spy/Decoy/cancellation/resize/reset paths, observation-only diagnostics/export and restart isolation. Legacy mode fails the same persistence oracle. Loaded public art is required for accepted screenshots; initial network-blocked screenshots were rejected.
**First candidate:** `cf390b139f3e98f2ad71f640651d880ae1b3093e`, draft [PR #13](https://github.com/blakemgray/gwent-definitive/pull/13). [Main #313 / `37035002598`](https://github.com/blakemgray/gwent-definitive/actions/runs/37035002598) verification SUCCESS, deployment SKIPPED; [Storage #26 / `37035002379`](https://github.com/blakemgray/gwent-definitive/actions/runs/37035002379) SUCCESS. These results belong to that candidate. Check PR #13's current head/runs for the successor containing this checkpoint and the in-match diagnostic entry; do not transfer the earlier green status to a changed head.
**Candidate modes:** ?tabletop=1 enables persistent nodes/scene; match menu → Device diagnostics captures the active played board, retained hand control and clipping ancestry. Settings and ?diagnostics=1 also open reports in either mode. Packaging stamps the exact checked-out source SHA and source fingerprint; PR CI may identify GitHub's synthetic merge commit, while an explicitly staged branch build identifies the branch head.
**Motion implementation:** 100% of this phase's candidate scope. **Runtime verified:** 90%: all 16 Node suites, full exact-head retained CI, Chromium/WebKit normal paths and manually reviewed loaded-art artifacts pass on `f7253e964ed1628d8e3e9f68c76400ddf99da401`. Physical-device acceptance remains. This documentation-only successor must receive its own workflow result before being used as the final release candidate. Full vision is not complete: broad physical effect/audio treatment and sensory tuning are later work.
**Implemented:** six borderless side-grouped territories with modest density allocation; sparse cards up to 196 px in portrait and 79 px at the tested landscape viewport; canonical board-face aspect; persistent loose arrangements; board gestures on either side; local contact, friction, finite settlement and idle shutdown; local effective-power inspector with navigation through every crowded-territory card; portrait gameplay unlocked only in prototype mode. Generation `11.tabletop.motion.1` includes the pure physics module in precache and packaging.
**Ownership:** scene owns final position, dimensions, independent CSS rotation/lift and stacking. Existing authored animation retains temporary transform leases. The existing gesture controller owns pointer arbitration. Engine commits cancel a physical pickup before rendering; authored presentation pauses ambient motion. Completed player/opponent placements create local contact impulses. Neither board gestures nor inspection commits gameplay or saves.
**Escaped defects caught in this phase:** native image drag cancelled board pickup; contact against a horizontal wall failed despite vertical space; pointer cancellation could cause an inspector click; delayed release after an opponent commit outlived timed click suppression. Each has normal-path coverage; wall contact also has a pure regression shown failing before correction. Readability's repeated score text replacement and geometry-only observer noise were removed to avoid needless reconciliation during motion.
**Motion evidence:** `tests/tabletop-motion-ui.js` compares baseline small cards/portrait guard with candidate normal play in both orientations, records before/held/settled frames, verifies real neighbor displacement and unchanged engine/save, persistent DOM/image identity, whole-group cancellation, pointercancel/pagehide, opponent commit during hold, rotation, finite idle, reduced motion, occluded Decoy rejection and visible target return. The separately labelled 22-card density fixture proves six-zone bounds and access to all 12 cards in a crowded territory; it is not used as normal-play evidence. Existing foundation/ability/diagnostic and baseline gates remain.
**First motion candidate:** `59aa03cb6b36c0f29a2e54dc2bd1f2c74d47f3e5`, tree `38cbdf75958f38854001feab44ff127048fb0424`. Storage #28 / `37069499725` SUCCESS; Main #315 / `37069499818` FAILED at the old foundation absolute-coordinate assertion after a same-territory play. Its CI checkout `b4c1b140c4f3ba342118aef1bbc5aaac7aeba8f6` had the identical candidate tree. The updated foundation test makes a genuinely unrelated-territory normal drag and asserts preserved normalized manual placement under density-driven resizing; resetting to a centered pack still fails. Local-contact behavior retains its separate actual-displacement regression. A changed candidate requires new full CI; do not transfer Storage #28 success to it.
**Verification successor:** `d103eba46c372b13308efab96cc5f0cf223918c5` passed the corrected foundation, device diagnostics and normal Spy/Decoy gates in Main #316 / `37069865524`; Storage #29 / `37069865663` SUCCESS. CI checkout `74be857ff00afe44edcd034f395ea37c47f9d844` has identical tree `2c28ab9b73c7e463f1360e57b9119bbc3cdddb7e`. The new cross-browser motion gate exceeded its expected duration; previously unbounded idle/art waits now have explicit deadlines and stage logging so missing paint/assets or stalled settlement fails with geometry/source evidence. This harness correction does not remove any behavior assertions. Inspect the successor's exact-head run for the localized result.
**Correction to apparent stall:** full Main #316 logs show that Chromium/WebKit motion actually completed successfully in about 3 minutes 39 seconds. The status endpoint used for progress had returned stale data; there was no demonstrated renderer stall. The added deadlines/stage logs remain useful QA improvements. Main #316 was superseded before full completion; its partial results are not final-head verification.
**Verified runtime head:** `f7253e964ed1628d8e3e9f68c76400ddf99da401`, tree `8cecce905cdf92ecd74eb0cedda751a2d825a969`. [Main #317 / `37070794313`](https://github.com/blakemgray/gwent-definitive/actions/runs/37070794313) Verify SUCCESS, deployment SKIPPED; [Storage #30 / `37070794350`](https://github.com/blakemgray/gwent-definitive/actions/runs/37070794350) SUCCESS. All retained gates, including Golden Match/rematch, destination parity, failure recovery, 256-trial stress, WebKit and adversarial choreography, passed. CI checkout `5a60589d9048b8a89dd35c7e96262abc662ee787` has the identical candidate tree and parents main `8b7429d` / implementation `f7253e9`.
**Reviewed artifact:** `tabletop-foundation-diagnostics-qa`, ID `11254154948`, SHA256 `abdf3a1f6627ecf158ab4953d77b97bde6bada3dc90bcd265844e1769b111727`. Loaded-art Chromium/WebKit before/held/settled, portrait, crowded layout, focus and Decoy frames were inspected; runtime reports identify the CI checkout above, fingerprint `0d4a4912b5746e29d73f93345deea77a2a17d62ef07ef0394587bc262ac78917`, active worker/cache generation `11.tabletop.motion.1` and retained hand comparison. Windows staged bytes use fingerprint `369d4b55e7dc72b6cfb016fac3a770f5fcdd5042812b312af281ea64428c1de3` because checkout line endings differ. Fingerprints describe actual packaged bytes; Git trees establish source identity. Physical touch/performance/PWA acceptance remains unproven.
**Next:** verify the documentation-inclusive PR #13 head and its artifacts, then obtain explicit authorization for a separate iPhone test deployment. No public test URL has been deployed; production still uses the old renderer. Follow `docs/TABLETOP_DEVICE_ACCEPTANCE.md`. Do not mark the phase closed or the original crop fixed before the user's actual-device confirmation. Real-iPhone acceptance and release remain separate.

The prior crop handoff below is retained as defect history. Its statements that work has not started, portrait is guarded, and old final geometry is frozen describe the production baseline, not the newly authorized prototype.

---
# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff. Git history preserves older detail; this file records the current authoritative state needed to resume safely.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Pass 11 production merge:** `aa8b6043d68c42ae2dc5310b57106a5a5808a150`  
**Pass 11 production Verify + Deploy:** Run #300 / `34701697634` — **SUCCESS**  
**Battlefield-card hotfix PR:** #12 — `Hotfix: preserve full battlefield card faces`  
**Hotfix merge commit:** `f9671eacf46000e876e6dbed4e5291f2be457181`  
**Hotfix production Verify + Deploy:** Run #311 / `34711086588` — **SUCCESS**  
**Production shell generation:** `11.golden.5`  
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match — DEPLOYED**  
**Current phase:** **REAL-DEVICE BATTLEFIELD CARD-CROPPING REGRESSION REOPENED / CODEX HANDOFF**  
**Current task:** **determine the true real-device cause of placed battlefield card side-cutting and fix it from first principles; do not inherit the previous root-cause conclusion merely because CI and desktop artifacts passed**  
**Implementation state:** shipped hotfix exists but is **not accepted** for this defect  
**Automated verification state:** green but **insufficient to establish real-device correctness for this issue**  
**Real-device acceptance:** **FAIL — user still sees the card-cutting issue on production after PR #12 shipped**  
**Last updated:** 2026-10-02 America/New_York

---

# 0. Required start-here protocol

Before substantive resumed work:

1. Read this file in full.
2. Read `FUTURE_CONTINUITY.md` in full.
3. Read `MODEL_ROUTING.md` in full, but treat its old Pass-11 status text as historical where stale.
4. Reconcile current `main`, deployment state, open branches/PRs, and current production source before editing.
5. Treat GitHub as source/code/CI authority, but treat **current real-device reproduction as the highest authority for this visual defect**.
6. Create a new narrow diagnostic/fix branch from current `main`; do not continue the merged PR #12 branch as if its diagnosis were proven.
7. Before changing code, establish a reliable way to prove which exact CSS/JS/service-worker generation is running on the user's real device.
8. Do not merge/deploy without explicit user authorization.

Precedence for this defect:

> current user real-device evidence → current production source/runtime → exact-device instrumentation → CI/browser artifacts → prior diagnosis/history

Do **not** weaken tests merely to make a candidate green. Instead, improve the test so it reproduces the real failure mode.

---

# 1. Locked product doctrine

Build the definitive modern implementation of classic *The Witcher 3* Gwent while preserving the classic rules foundation by default and modernizing the experience around it.

Locked invariants:

- Engine state is authoritative; presentation never decides legality, scoring, effects, or outcome.
- Engine commits before presentation; presentation is disposable, cancellable, and interruption-safe.
- Stable card IDs plus per-match `iid`s remain authoritative identity.
- Tap, drag, keyboard, opponent, and restored-session actions converge on one canonical validated action path.
- Invalid or ambiguous intent produces zero authoritative mutation.
- Opponent mutation cannot occur during unresolved presentation or player choice.
- AI difficulty means better legal reasoning, never hidden-information cheating.
- Match classes remain `CLASSIC`, `ASSISTED`, `MODIFIED`, `SANDBOX`.
- Instrumentation is observation-only.

Interaction north star:

> **A caveman should be able to pick it up and play without realizing it is all digital.**

Primary gameplay target: installed iPhone landscape PWA.

Pass 10.3 remains authoritative for battlefield row/lane/rail ownership and deterministic final placement **except where current evidence proves a concrete rendering defect inside that responsibility**. Do not protect an old geometry assumption from investigation merely because it was previously marked closed.

---

# 2. Current production state

Current production hotfix merge:

**`f9671eacf46000e876e6dbed4e5291f2be457181`**

PR #12 merged the exact verified candidate after:

- implementation head `c8b728425bed4ec637c155c9d462bd72a4c866b2` passed Main #309 / `34709726806` and Storage #24 / `34709726754`;
- docs-inclusive merge candidate `1ce7e711f2eeb7a8d303a72209bacc414d807c35` passed Main #310 / `34710346563` and Storage #25 / `34710346580`;
- production merge `f9671eac...` passed Verify + Pages Deploy Run #311 / `34711086588`.

The installed-PWA shell generation was advanced from `11.golden.4` to **`11.golden.5`**.

Save semantics remain:

- format: `pass11-normal-v1`
- save build: `11.golden.1`
- bounded legacy builds: `11.1A`, `11.1B`

No known rules/save-state issue is implicated by the current regression.

---

# 3. Real-device regression — authoritative current truth

The user originally reported that played battlefield cards appeared horizontally cut/cropped on the left and right sides.

Original confirmed scope:

- all three player rows;
- all three opponent rows;
- player and enemy cards affected equivalently;
- therefore the symptom is global/shared rather than row-, side-, faction-, or single-card-specific.

A screenshot from the real device showed the placed card face visually reduced/cut in a way that did not match the full card shown in hand.

PR #12 attempted to fix this and was shipped.

**On 2026-10-02, after opening the current production build, the user explicitly reported:**

> **“Still the card cutting issue.”**

This real-device observation **reopens the defect** and invalidates any prior claim that PR #12 solved the production symptom.

The defect is therefore still open on current production until Codex (or a later agent) obtains new real-device evidence showing otherwise.

---

# 4. What PR #12 changed — useful evidence, NOT a proven root cause

PR #12 changed three main areas:

### A. Image fitting

`physical-card.css`

- changed placed battlefield card images from crop-style `object-fit: cover` behavior to `object-fit: contain`;
- centered the image;
- applied equivalent no-crop behavior to predictive target actors.

### B. Battlefield card shell geometry

`src/battlefield-ux.js`

- replaced placed-card width factor `0.696` with a canonical/reference card-face aspect approximately `16.1 / 30.4 ≈ 0.5296`;
- accounted for borders under global `border-box` sizing;
- deliberately left hand-card `0.696` geometry unchanged;
- preserved row/lane dimensions, centering, packing, and overlap algorithms.

### C. Button padding

`physical-card.css`

- added `padding: 0` to placed `.unit[data-inspect-board]` buttons to prevent UA button padding from consuming the tiny battlefield card face.

These were reasonable hypotheses and materially changed the renderer, but **the continued real-device reproduction proves that this explanation was incomplete, wrong, not active on the user's device, or masking a separate layer of clipping**.

Do not simply repeat or slightly tweak these same changes without proving the actual runtime failure.

---

# 5. Why previous QA was misleading

The hotfix passed a strengthened browser test that populated all six battlefield rows and asserted:

- zero computed button padding;
- loaded source art;
- `object-fit: contain`;
- centered object positioning;
- inner face aspect approximately equal to `naturalWidth / naturalHeight`;
- image element filling the inner face box.

The exact implementation-head artifact `08_full_card_face_all_rows_both_sides.png` was manually reviewed and appeared correct in the desktop/browser CI environment.

Production Run #311 also passed:

- battlefield geometry/readability;
- complete Golden Match;
- direct manipulation;
- 256-trial stress gate;
- save/visibility lifecycle;
- WebKit/iPhone-targeted browser automation;
- choreography/feel;
- Pages deployment.

**Those results are no longer sufficient acceptance evidence for this bug.**

The testing blind spot may involve one or more of:

- true Mobile Safari / installed-PWA rendering differences not represented by automated WebKit;
- stale or mixed PWA/service-worker generations on the device;
- CSS cascade/order/specificity differences at actual runtime;
- transforms/contain/overflow/clip-path/masking on an ancestor or presentation actor rather than the `<img>` itself;
- a different renderer/path being used during normal play than the QA-injected state;
- card image/source asset framing or intrinsic transparent/cropped bounds;
- device-pixel-ratio/subpixel sizing/rounding at very small board-card widths;
- viewport/orientation/safe-area-specific CSS;
- later style mutation after the assertions run;
- transition/animation wrapper clipping;
- visual scaling that leaves the DOM box technically correct while the perceived painted result is not;
- a service-worker update lifecycle issue causing production source and actual installed runtime to diverge.

This list is intentionally non-exhaustive. Codex should investigate, not anchor on it.

---

# 6. Required diagnostic standard for Codex

The next attempt should be evidence-first.

Before proposing another fix, Codex should answer at least these questions:

1. **What exact production build is the real iPhone actually running?**
   - establish visible/runtime build identity, service-worker controller/version, loaded CSS/JS asset generation, and whether an older worker/client remains active;
   - if necessary add a temporary or permanent diagnostics surface that the user can screenshot.

2. **Which actual DOM element is visibly clipped on the real device?**
   - card outer button/shell;
   - inner image element;
   - image content itself;
   - overlay/power badge interaction;
   - ancestor lane/rail;
   - transform actor/continuity actor;
   - animation/presentation wrapper;
   - something else.

3. **What are the real-device computed dimensions and styles?**
   Capture for one affected card at minimum:
   - `getBoundingClientRect()` for shell, image, relevant ancestors;
   - computed width/height/padding/border/overflow/clip-path/mask/object-fit/object-position/transform/transform-origin;
   - intrinsic image dimensions;
   - devicePixelRatio;
   - viewport visual/layout dimensions;
   - current orientation/display mode;
   - service-worker/controller/build identity.

4. **Does the defect exist in Safari browser mode, installed PWA mode, or both?**
   Test separately if practical.

5. **Does the same source image render correctly in hand and incorrectly on board in the same live session?**
   If yes, compare the complete computed-style/ancestor chain between those two contexts rather than comparing only the `<img>` rules.

6. **Can the automated test be changed so it actually fails on the same mechanism?**
   Do not merge another candidate whose regression test cannot distinguish the known-bad current production behavior.

---

# 7. Suggested investigation surfaces

Start with, but do not limit investigation to:

- `src/battlefield-ux.js`
- `physical-card.css`
- `feel-polish.css`
- `src/battlefield-readability.js`
- `src/card-continuity.js`
- `src/target-exposure.js`
- `src/gesture-controller.js`
- `src/presentation-queue.js`
- main/base CSS rules affecting `.unit`, `button`, `.units`, `.lane`, row containers, transforms, overflow, containment, masks, filters, and transitions
- `sw.js`
- app bootstrap/update lifecycle
- PWA manifest/display/orientation behavior
- any card-source image processing/reference mapping
- actual normal-match render path versus QA fixture/injected-state path

Search the full cascade and runtime ownership chain; do not assume the defect lives in the file that visually names the card.

---

# 8. Branch / release rules for the next fix

- Start a **new branch from current `main`** for diagnosis/fix.
- Preserve the currently working Pass 11 rules/gameplay systems.
- Instrument first if needed; do not guess repeatedly at CSS.
- Add a regression test that targets the discovered real mechanism.
- Require exact-head CI and visual artifacts.
- Most importantly, require **real iPhone confirmation before calling the defect fixed**.
- Browser/WebKit simulation is supporting evidence only.
- Do not merge/deploy without explicit user authorization.

A candidate is not “fixed” merely because CI is green or a desktop artifact looks right.

---

# 9. Historical hotfix evidence retained for comparison

Rejected first candidate:

- head `4a358d57a560caaa86487a48b0aada089d9ab7e2`
- Main #302 / `34707761039` — SUCCESS
- Storage #17 / `34707761133` — SUCCESS
- artifact `10302168100`
- verdict at the time: visually rejected because `contain` exposed narrow side-gutter presentation.

Final PR #12 implementation candidate:

- head `c8b728425bed4ec637c155c9d462bd72a4c866b2`
- Main #309 / `34709726806` — SUCCESS
- Storage #24 / `34709726754` — SUCCESS
- readability artifact `10302553573`
- artifact digest `sha256:57981c2e117e687948c08d7117d4ed392f6371f882eb931b72e6746cbf7890d0`
- desktop/browser artifact review: PASS
- **real-device production result after merge: FAIL — symptom persists**

Docs-inclusive merge candidate:

- `1ce7e711f2eeb7a8d303a72209bacc414d807c35`
- Main #310 / `34710346563` — SUCCESS
- Storage #25 / `34710346580` — SUCCESS

Production hotfix merge:

- `f9671eacf46000e876e6dbed4e5291f2be457181`
- Run #311 / `34711086588` — Verify SUCCESS + Pages Deploy SUCCESS
- real-device acceptance on 2026-10-02: **FAIL for battlefield card cutting**

---

# 10. Exact next action

Hand the project to Codex.

Codex should:

1. pull/reconcile current `main`;
2. read `CONTINUITY.md`, `FUTURE_CONTINUITY.md`, and `MODEL_ROUTING.md`;
3. create a new diagnostic branch from current `main`;
4. reconstruct the complete normal-play placed-card render/cascade/runtime path;
5. establish real-device build/style instrumentation before another speculative fix;
6. identify why current production can pass browser assertions yet still paint the card incorrectly on the user's iPhone;
7. produce a narrowly scoped candidate with a regression test that reproduces the discovered mechanism;
8. stop at a real-device-testable candidate and ask the user to validate on iPhone before final merge/deploy.

The previous PR #12 diagnosis is **historical evidence, not an accepted solution**.
