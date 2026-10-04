# Active work — first lit 3D table scene (2026-10-03)

## Exact candidate diagnostic checkpoint — 2026-10-03

The first QA successor `167aede7e57bd5d90f7021455b455e5baf892712` (tree `918dce14df2efc652b8bb07533adba1337c4c8ef`) moved past capture actionability. Main #322 / `37175212121` then failed the unchanged causal shadow-floor luminance assertion in Chromium; WebKit and later baseline gates were not reached. Storage #35 / `37175212102` succeeded; deployment skipped. Its artifact `11292891820`, SHA256 `6abcc77c7c656a44965c4d7ac8d868396fa7b6e23bd87cce021fa34c7f5e7786`, was downloaded and the actual resting/held frames inspected. This is an unresolved GPU readback/rendering failure, not accepted as a tool limitation. A follow-up records paired measurements before asserting and includes them in failure logs. The unchanged full 3D suites now run in separate Chromium/WebKit jobs with fail-fast disabled, so either failure cannot conceal the other browser or stop the retained baseline contracts; deployment requires all jobs. No runtime, pixel threshold or behavioral gate was relaxed. Diagnose the paired values before correcting the responsible layer.

Draft PR #14 (`feat/lit-3d-table-scene`) was created and attached at source `77440042fed519bb569025e5412950c325575bd2`, tree `ee2fed0a94f471062cd1fb704f304a9b6c1fb8e6`. Main #321 / `37174445449` failed in the new 3D Chromium gate while its element screenshot waited for scroll-into-view stability during a sustained grab; the archived failure page actually paints the full table/card. WebKit was not reached. Storage #34 / `37174445517` succeeded; deployment was skipped. CI checkout `9c01d3f2994831bb69297e66346c3e9536d84e0e` and the canonical local package share runtime fingerprint `8d32288ebb50d18f9b9bb5bdc4e20c82df2bbf171323b17e6f9395a06fe1102c`. Artifact `11292846478` was downloaded, SHA256 `cdff5b54a54de382121650dd11caaf3ef5a49c542fac714088bc7adf10313ae9` checked, and the failure pixels manually inspected. The exact local package passed all 18 Node suites and the full Chromium 3D suite. These results do not constitute full CI or phone acceptance.

Independent minimal controls now localize two Windows Playwright 1.62.1 / WebKit 26.5 failures outside Gwent. A plain WebGL2 canvas remains red in its backing pixels but disappears from page capture after actual viewport rotation; preserving the buffer, fresh continuous draws and DOM remount do not recover it, while a new context does. A separate tiny cache-first service worker succeeds on controlled online reload but its offline reload fails with WebKit's internal navigation error; Chromium completes the same control. Scripts, versions, JSON and manually inspected frames are preserved in `../evidence/table3d-review-resize/`. This is supporting evidence about this Windows test environment, not proof about Safari or the original production crop. Do not add speculative renderer/context-recreation patches or skip the strict gate.

The QA-only successor captures the actual page composite clipped to the same canvas bounds, avoiding the element-screenshot actionability/scroll stage during a held/effect frame. It retains all painted-table, moved-floor-shadow, causal GPU readback, sustained held-height and engine/save assertions. Verify this successor's exact head in full CI and inspect Linux WebKit pixels. Approximate implementation 90%, verification 65%; no release is authorized. The old isolated preview still contains only `4d96af5`.

Exact next action: push the QA/documentation successor to draft PR #14, run unchanged behavioral gates and inspect Linux WebKit rotation/offline evidence. Recommend GPT-6.1 Sol / High until that seam is resolved, then Medium for packaging and device instructions.

The user explicitly authorized the first real 3D scene and Adobe/Higgsfield asset creation: “Higgsfield and adobe are in. Give it your absolute best.” This supersedes the earlier scene proposal status below. No new deployment, PR merge, native migration or production release is authorized. The prior isolated preview remains the old exact `4d96af5` application; its authorization does not cover this new candidate.

Current branch: `feat/lit-3d-table-scene`, starting HEAD `4d96af5f4fe9f2c64fa06f509369840aefdf574e`; main freshly reconciled at `8b7429d1ec6615dce5a8e6f956ceb2286647713d`. It depends on the unmerged PR #13 interaction foundation. The commit containing this checkpoint is the first diagnostic scene candidate; inspect its exact branch/PR head and runs before assigning verification. Contract: `docs/TABLE3D_SCENE_CONTRACT.md`. Target: iPhone 17 Pro, exact iOS unknown. Seven supplied images are visual references, never real-device acceptance evidence.

Scope: actual lit 3D card bodies/table/props, one committed ability light, coherent semantic touch and visual geometry, finite renderer lifecycle, bounded resources, offline dependencies and on-device renderer telemetry. First camera is overhead orthographic by deliberate contract, so the established canonical touch/layout path can be retained. A more cinematic perspective camera and native engine decision are later evidence-driven choices. The rules core, saves, IDs, hidden-information policy and match classifications remain locked.

Assets: Adobe generated and refined the oak material; Higgsfield authored private editable Blender scene revision 3, project `76aa4f34-1eab-4244-85d4-1c7bb26c43bc`, structural GLB verification and manual Eevee inspection passed. Runtime GLB has 31 meshes / 15,032 triangles. Source and report live in `../evidence/table3d-assets/`; portable runtime assets/provenance in `assets/table3d/`. These asset checks do not prove browser or phone behavior. Three.js 0.186.1 is pinned and vendored with verified registry integrity/licence/provenance, including its SkeletonUtils dependency.

Current phase: cross-browser paint diagnosis and exact-candidate preparation. Approximate implementation 90%, verification 55%; this scene is not accepted or release-ready. Generation is `11.table3d.scene.1`. All 18 Node suites pass. Chromium normal tap/drag/Spy/opponent/contact/rotation/context restoration/finite idle, all-six-zone density access, installed-entry selection, controlled reload and offline cached-art reopen passed on development source. Temporal samples prove one painted embodiment and stable mesh identity from hand through committed travel to board. A dragged proxy retains its `drag` class during flight; the test now checks committing travel rather than falsely requiring a `flight` class. Actual card-caster and Horn light readbacks change floor pixels, with Horn captured near peak. CORS-upload-only fault injection preserves visible, interactive native art and engine/save truth. Exact-head full CI remains required.

Corrected new QA defect: Windows Playwright 1.62.1 WebKit 26.5 omitted the GPU scene from page captures after the context was created beneath a hidden match screen. A controlled active-screen initialization restored the actual table/cards; keeping the canvas visible alone, preserving buffers, forcing opaque context and changing z-index/transform/isolation did not. The renderer now waits for the actual active match before allocating GPU resources. A separate held-height defect let the planar solver's transient lift decay during a sustained grab; the 3D body now retains height 18 until release, matching hand pickup. The unchanged floor-shadow, normal-play and peak-Horn assertions then passed in WebKit before rotation.

Remaining new QA defect: WebKit's actual page canvas becomes absent after viewport rotation/resizing while metrics still report loaded meshes and draws. The strict central-table screenshot gate fails and is retained. One extra post-resize drawing frame did not correct it and was discarded. Preserve `../evidence/table3d-buffer-probe/` and WebKit failure artifacts. Run the unchanged gate in CI's Linux WebKit to distinguish the renderer from Windows WebKit's resized-canvas compositor/capture before choosing another correction. Neither offscreen pixels nor a green Chromium run can close this failure.

Ownership: canonical semantic DOM and gesture controller remain authoritative; scene owns planar contact/poses; Three consumes public visible actors, with iid mesh leases through temporary hiding, per-body native fallback, orthographic projected-quad frontmost picking, DPR cap 1.75, finite RAF and bounded retained textures. Active/leased unique textures can exceed the resident target 48 and cannot be evicted; that target is not a hard cap. Static table structure receives but does not cast shadows. Latest reviewed Chromium captures show 81 submissions / 28,072 triangles for 12 cards. CPU timings are submission/synchronization, not GPU execution or iPhone frame-rate proof.

Corrected integration findings: missing transitive SkeletonUtils import, collapsed relative battle shell, stretched prop scaling, imported wood source sharing/mapping, dark footer over hand, portrait leader overlap and empty-strip sizing. Sparse landscape cards now approach 98 px high; all-six dense landscape still compresses cards and overlap can cover bodies. Local formation navigation accesses every crowded card. Broad cinematic perspective, full sensory campaign and native migration remain outside this first slice. A defensive worker guard rejects legacy opaque entries for CORS uploads; normal opaque-image cache poisoning was not demonstrated (the current worker only writes `res.ok`, which opaque responses lack). Original production side-cutting and actual iPhone Safari/Home Screen acceptance remain open; neither this prototype nor PR #12 is accepted as their fix.

Exact next action: commit/push this diagnostic candidate to a new draft PR, run retained full CI and the unchanged strict GPU-paint gate, inspect the WebKit evidence and correct the localized cause. Prepare an exact-source package before asking for permission to deploy a new isolated phone preview. Recommended GPT-6.1 Sol / High for this remaining paint diagnosis; return to Medium for routine QA/documentation after it is resolved. No merge/deployment is authorized.

---

# Active work — physical tabletop motion candidate

## Platform discussion — 3D scene proposal

The user asked about 3D assets, real-time lighting, native app delivery and helpful plugins. Research and connected-tool discovery are recorded in `../TABLETOP_VISUAL_DIRECTION.md`. Current recommendation is an actual 3D table/card scene tested on the phone before selecting PWA, Capacitor or native-engine delivery. Capacitor preserves web rendering; a native engine would require a larger integration/port while retaining rules contracts. Higgsfield's connected Blender/GLB workflow can supply scene assets; no extra plugin, generation job, new 3D scene or migration was started. The user confirmed iPhone 17 Pro; exact iOS version remains unreported. Target that device for the rendering benchmark. This is a proposed direction, not a new locked platform decision. Candidate remains `4d96af5`; phone acceptance and original crop diagnosis remain open.

## Visual direction checkpoint — seven supplied references

The user supplied seven tabletop/tavern reference images after the isolated preview was deployed. These establish proposed visual direction, not phone acceptance: one continuous worn table, larger recognizable cards, loose front-to-back groupings, contact shadows, coherent warm lighting and atmosphere around the edges. Photo 6 is the clearest composition reference; Photo 7 supplies atmosphere; Photo 3 supplies close landscape scale. The complete brief is `../TABLETOP_VISUAL_DIRECTION.md`; portable images/hashes are in `../evidence/tabletop-visual-references/`.

No runtime changes, new candidate, preview update, merge or production release occurred at this checkpoint. Source remains `4d96af5`, interaction implementation 100%, verification 90%, actual-device acceptance pending. The full material/lighting/sensory vision and original crop remain open. Next: collect the user's actual preview feedback, then reconcile a narrow scene/material contract against these references. This local documentation is outside the verified source candidate.

## Authorized isolated iPhone preview — 2026-10-02

The user explicitly approved isolated preview deployment ("Sure, let me see!"). The private preview is live at https://gwent-tabletop-iphone-4d96af5.blakemanracerman13.chatgpt.site/?tabletop=1. Production and PR #13 merge remain unauthorized and unchanged. Application candidate is still `4d96af5f4fe9f2c64fa06f509369840aefdf574e`, release `11.tabletop.motion.2`, packaged Windows fingerprint `f56ed4a6689d1f683f06ace09463caa09fcda2559cf7e92c686004740d33e08a`.

Sites project `appgprj_6ac074d9e090819196ca362245a2cd2a`; successful deployment `appgdep_6ac0759a99a4819192661a0e8f8f9eff`; version `appgprj_6ac074d9e090819196ca362245a2cd2a~appgver_1d00163860a08191a6730bf456d1fe3e`. The separate hosting checkout is `../tabletop-iphone-preview-4d96af5`, hosting commit `e82c0c57610492eed4449fbdac6f08418fc11c28`. This hosting commit is not the Gwent application's source identity. The skill workflow pushed and packaged that mirror; all 42 application files in the deployment tar were checked byte-for-byte against the verified candidate. Tar SHA256 `c3bb5a9c74997faa16397b934e91e01e22da9277916edeb9f79fe5fe0c3430f4`. Native publication returned `succeeded` with the URL. The private audience can require the owner's sign-in. No bypass token was generated.

Implementation: 100% of interaction phase. Verification: 90%, pending actual iPhone Safari/Home Screen acceptance. Test deployment: COMPLETE. Production release: not authorized. No source runtime changes occurred. Actual deployed phone controller/build identity must be captured from Device diagnostics; native publication plus matching archive bytes does not substitute for that device evidence. The larger vision and original production clipping defect remain open.

Exact next action: user opens the preview in Safari, starts normal gameplay, tests both-side contact/rearrangement and both orientations, exports Device diagnostics, then adds a distinct Gwent Tabletop Home Screen icon and repeats. Expected source `4d96af5...` and release/worker `.2`. Preserve screenshots and separate Safari/PWA reports. Recommend GPT-6.1 Sol / High for interpreting device failures; Medium for routine follow-up if both environments pass. No merge or production deployment without explicit authorization.

## Local final-evidence checkpoint — 2026-10-02

This documentation-only working checkpoint follows verified candidate `4d96af5f4fe9f2c64fa06f509369840aefdf574e`; it is not included in that candidate. Branch remains `feat/physical-tabletop-prototype`, draft PR #13, source tree `0ea518720992e0138f4147491befd30b831266c0`. No runtime changes followed verification. PR #13's description records the same final proof on GitHub; the workspace report `../TABLETOP_CANDIDATE_REPORT.md` records package and artifact locations.

Main #320 / `37075958133`: Verify SUCCESS, deployment SKIPPED. Storage #33 / `37075958239`: SUCCESS. CI checkout `87703c8cbd77a6c3486118d4e5529997768cb8b0` has the identical candidate tree, parents main `8b7429d1ec6615dce5a8e6f956ceb2286647713d` / candidate `4d96af5...`. Artifact `11257076673`, SHA256 `b5a62a34a60137795ed7ff1794cb174a2fe6f5f922977ce924de187675e60a28`, was downloaded, checksum-verified and visually reviewed. Chromium settled and WebKit contact/settled/portrait/focus/crowded/manifest/Decoy frames paint loaded source art. Inspector readiness JSON shows the image incomplete before waiting, complete/decoded afterward; the blank prior frame exposed an unobserved capture stage, not a reason for speculative CSS changes. Runtime remains `11.tabletop.motion.2`, CI fingerprint `f36518823009de0c5d4033bdcaa42b3421c37a8d0beb6a7ed4856cb94227953c`. Actual worker/cache identity and a retained hand/board pair are recorded.

Implementation: 100% of the interaction phase. Verified: approximately 90%; real iPhone Safari/Home Screen, touch/performance and crop evidence remain pending. Production/main remains `8b7429d...`, generation `11.golden.5`. At the prior final-evidence checkpoint no deployment had occurred; the authorized private preview above now supersedes that state. No production merge or deployment was performed. The final Windows site archive is `../evidence/tabletop-motion-4d96af5-local/tabletop-4d96af5-site.zip`, SHA256 `43f90a1c006553245cba02d6d34249fb6765ae5671202fcfaba0a486daeeff85`, source fingerprint `f56ed4a6689d1f683f06ace09463caa09fcda2559cf7e92c686004740d33e08a`; local desktop preview is http://127.0.0.1:4184/?tabletop=1.

Superseded next action: authorization was obtained and the isolated preview above was deployed; now follow `docs/TABLETOP_DEVICE_ACCEPTANCE.md` and collect Safari/PWA reports and screenshots. Separate origin is required for the proposed preview because the existing worker cleans other origin cache names during activation; a same-origin preview could affect production caches. Do not merge, publish or mark the phase/crop closed before the required authorization/device evidence. Recommend GPT-6.1 Sol / Medium for test deployment; High for reproduced device-specific diagnosis/tuning. Commit this local documentation at a later authorized checkpoint and verify the resulting head if it becomes the release candidate.

## Current checkpoint — installed-entry correction

Final candidate QA update: runtime head `ec11d8b7301f05d64e333e8158c77139e6a1e39e` (tree `9348ff11acf218ce8c1c52490cb62e460b5cec92`) passed full Main #319 / `37074084258` and Storage #32 / `37074084236`; deployment SKIPPED. CI checkout `3f18dea54ace80b15cf13c64ae17a98dd5a3409e` has the identical tree. Downloaded artifact `11256311464`, SHA256 `ac5b71f10eeed0da6375affbc276c754e30e8dd8244d5654338d75425d905d42`, records coherent `.2` worker/cache and manifest launch in Chromium/WebKit. CI runtime fingerprint is `f36518823009de0c5d4033bdcaa42b3421c37a8d0beb6a7ed4856cb94227953c`; Windows staged bytes have `f56ed4a6689d1f683f06ace09463caa09fcda2559cf7e92c686004740d33e08a`.

Manual artifact review then caught one WebKit portrait focus frame with blank inspector art. Its board art was loaded, and other focus frames painted. The screenshot helper waited only for board images, so inspector load/decode readiness was unobserved. A QA-only successor now records before/after focus image readiness, waits for every board/focus image to load and decode, then allows paint frames before capture. No runtime/CSS tweak or new shell generation is justified by this unlocalized artifact. Review the successor's readiness JSON and actual WebKit pixels before accepting focus evidence; do not infer a runtime fix from a green property assertion. This successor needs its own exact-head CI/artifacts. Main #319 remains valid runtime evidence, with that explicit visual limitation.

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
