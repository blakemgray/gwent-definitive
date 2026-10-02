# Active work — physical tabletop foundation

**Updated:** 2026-10-02 America/Indianapolis.
**Branch:** `feat/physical-tabletop-prototype`, created from reconciled main `8b7429d1ec6615dce5a8e6f956ceb2286647713d`.
**Authority:** the user's new tabletop vision and explicit implementation authorization supersede the frozen presentation geometry for the opt-in prototype. Rules, semantic rows, iid identity, canonical actions, storage and classification remain authoritative.
**Current phase:** foundation candidate verification: diagnostics, keyed bodies and scene-owned final geometry implemented. First candidate passed CI; the in-match diagnostic entry and its normal-user-path test form the final follow-up candidate. See `docs/PHYSICAL_TABLETOP_PROTOTYPE_CONTRACT.md`.
**Foundation implementation:** 100%. **Foundation verified:** 80% at this checkpoint (local checks and first-candidate CI pass; follow-up CI/artifact review and real-iPhone remain pending). **Full playable prototype:** approximately 25% implemented; adaptive composition/contact/board gestures/local focus remain. No merge/deploy authorization.
**Locked experience:** either side can be rearranged presentation-only; portrait and landscape fully playable; whole table plus local focus; weighted and responsive. Adaptive row composition remains a prototype choice pending feedback.
**Open defect:** the installed-iPhone crop still fails acceptance. No root cause or fixed status is inferred from the new renderer.
**Current production:** main `8b7429d...`, verified/deployed by Run #312 / `37007918595`; runtime generation `11.golden.5`. The historical hotfix evidence below remains relevant.
**Local evidence:** 15 Node suites, 37 real-browser DOM assertions, normal tap/drag/opponent/Spy/Decoy/cancellation/resize/reset paths, observation-only diagnostics/export and restart isolation. Legacy mode fails the same persistence oracle. Loaded public art is required for accepted screenshots; initial network-blocked screenshots were rejected.
**First candidate:** `cf390b139f3e98f2ad71f640651d880ae1b3093e`, draft [PR #13](https://github.com/blakemgray/gwent-definitive/pull/13). [Main #313 / `37035002598`](https://github.com/blakemgray/gwent-definitive/actions/runs/37035002598) verification SUCCESS, deployment SKIPPED; [Storage #26 / `37035002379`](https://github.com/blakemgray/gwent-definitive/actions/runs/37035002379) SUCCESS. These results belong to that candidate. Check PR #13's current head/runs for the successor containing this checkpoint and the in-match diagnostic entry; do not transfer the earlier green status to a changed head.
**Candidate modes:** ?tabletop=1 enables persistent nodes/scene; match menu → Device diagnostics captures the active played board, retained hand control and clipping ancestry. Settings and ?diagnostics=1 also open reports in either mode. Packaging stamps the exact checked-out source SHA and source fingerprint; PR CI may identify GitHub's synthetic merge commit, while an explicitly staged branch build identifies the branch head.
**Next:** verify the follow-up candidate and inspect Chromium/WebKit artifacts, then implement adaptive territories/contact/board gestures/local focus. The six-rail composition and portrait gameplay guard still exist at this foundation checkpoint. Real-iPhone acceptance and release remain separate.

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
