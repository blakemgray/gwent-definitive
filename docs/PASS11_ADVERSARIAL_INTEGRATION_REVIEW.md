# Pass 11 — Bounded adversarial integration review

Date: 2026-09-12. Review checkpoint: GPT-6 Astra · Medium.
Verdict: hold PR #11 merge for F1 and F2. No implementation changes made.

## Authority and evidence

Read CONTINUITY.md, FUTURE_CONTINUITY.md, and MODEL_ROUTING.md in full. Live reconstruction matched the handoff:
- PR #11 open/unmerged, branch pass-11-golden-match, incoming head 24c14efa5714ad5f3943663ade3fc28bdcabba11.
- Base main f06ce78e2f3e1d1f1704ff84727d40b24bf03f7b.
- Run #261 / 34690086333 completed SUCCESS on the incoming head. Every verify step succeeded; deploy intentionally skipped.
- Runtime reviewed: 30cabd96a1004c7e0e5f896ed84849a0b181e83c. Incoming head differs only in continuity documentation.
- Beginning-of-cycle continuity checkpoint: fdb430432bb0c61f97afdbc25c65fdb60dcdb958. Its Run #262 / 34693124993 was in progress when checked; it is not claimed green.
- Downloaded Run #260 artifact 10297056990 and independently verified ZIP SHA-256 09500e172489878419f0a6b159b3d79df8157c6a8cbf5e0064e14d19b7891e8e.
- Reinspected 13_round_end_3.png, 31_match_result_stage.png, and 40_terminal_result.png. Accepted non-overlapping terminal sequencing remains valid.
- Source-level fault probes executed exact application functions, real engine/PresentationQueue, and exact storage/SW handlers using controlled timer/render/network/storage substitutes. These are diagnostic reproductions, not new browser acceptance evidence. Chromium installation timed out; no new local browser or real-iPhone success is claimed.
- No TinyFish use: production main is not this unmerged candidate.

Planning 100%; implementation ~77%; formally verified/closed ~70%. Review completion does not close unfixed findings or device acceptance.

## F1 — P1 release blocker: consecutive bot commits outrun presentation

**Boundary:** app scheduler → authoritative bot commit → MutationObserver choreography → semantic audio/result UI.

**Evidence:** app.js:419–432 commits, saves, renders, then schedules botMove at 220 ms whenever p2 still owns the turn/choice. app.js:498–512 has no queue-busy check at mutation time. src/interaction-turn-gate.js protects player card commits; src/choreography-external-gate.js protects selected player click controls. Neither protects the bot's own subsequent scheduled commit. src/gameplay-choreography.js:218 updates lastObservedState and returns when Queue.busy, thereby consuming the newly added engine events without scheduling their presentation.

After p1 passes, p2 can legally make consecutive plays until it beats p1 or exhausts its hand. A diagnostic fixture with p1 already passed and ahead, plus three ordinary p2 units, ran the exact app bot/scheduler functions against the real engine and a real unresolved PresentationQueue: p2 hand counts became 2 at t=0, 1 at t=220, and 0 at t=440; the latter two commits occurred with Queue.busy=true. Timer and render notification were substituted; this establishes scheduling failure, not a photographed visual outcome. Run #260 itself records normal authored stages well beyond 220 ms.

**Player impact:** later cards, scores, passing, or round/result state can advance while an earlier effect is still being shown; later semantic choreography/audio can be skipped. Winner authority stays correct, but the player may miss the explanation of how the round ended.

**Current coverage:** presentation_turn_gate_ui.py covers player ordinary commit → first bot move, plus cancellation. It does not assert no bot mutation during the bot's own presentation. Golden Match's sampled successful trace is not an all-commit queue invariant; it does not eliminate this case.

**New test needed:** yes. Browser trace after p1 passes while ahead: force multiple ordinary bot plays, a signature effect, and bot pass/round transition. Assert zero bot mutation while queue busy, each event presented once, completion/cancel/error re-arms exactly one eligible action. Include reduced motion and restored p2-turn state. Cover bot-owned choices as appropriate without broadening locked-deck scope.

**Blocks merge:** yes.

**Smallest safe fix:** guard the actual scheduled bot mutation against presentation/choice/menu/lifecycle eligibility and arrange one deferred re-arm after queue cleanup/idle. Apply to consecutive bot turns and bot choices, not merely player input wrappers. A busy return without an idle re-arm would create a deadlock. Do not globally shorten animation or extend a fixed timeout.

## F2 — P1 release blocker: cache identity does not guarantee a coherent runtime

**Boundary:** deployment package → installed service worker → HTML/CSS/JS version coherence.

**Evidence:** sw.js:10–14 precaches a build, but then serves navigation/scripts/styles/manifest network-first and writes successful individual responses into CORE. On individual fetch failure it searches caches. Thus an already controlling worker can serve new app.js while falling back to old engine/choreography/CSS before a complete new installation succeeds. Changing BUILD alone does not stop this network-first path under the old worker.

The exact networkFirst handler was executed with old app/engine cached, a successful fresh application response, and a failed engine network request. It returned NEW_APP + OLD_ENGINE. This is a handler-level network-fault reproduction, not an observed iPhone incident. The existing main worker uses the same network-first strategy, making main-to-Pass-11 transition relevant.

**Player impact:** installed clients can run a combination never tested by CI, especially during intermittent connectivity or an update. This is beyond the already-known stale BUILD hygiene item.

**Current coverage:** tests/pwa-validation.js checks files, load order, and literal cache pin. Platform feedback browser tests check playback/lifecycle, not old-install → new-release mixed-response behavior. Deployment packaging includes the current modules; no missing-file defect found.

**New test needed:** yes. Serve two actual release shells. Begin with old worker controlling, publish new shell, fail one updated script/style and/or new-worker install. Require all-old or all-new core content, never a mixture; verify later update, offline relaunch, and retained exact save.

**Blocks merge:** yes, as an installed-PWA release-consistency requirement.

**Smallest safe fix:** serve the precached core shell consistently from its versioned cache, advance BUILD, and activate/reload the new complete shell at a safe lifecycle boundary. Preserve dynamic art caching separately. Avoid mutating an old core cache with unversioned fresh code. Account for old-controller migration and multiple clients when choosing activation policy; do not simply add unconditional mid-match reload.

## F3 — P2 meaningful non-blocking issue: save failure interrupts UI after commit

**Boundary:** engine/history → localStorage → render/turn scheduling.

**Evidence:** app.js:419–425 assigns committed state before saveActiveMatch(), which calls uncaught localStorage.setItem in src/storage.js:14. If that throws, renderMatch and maybeAutoBot are skipped. A QuotaExceededError probe of the exact commit function showed engineAdvanced=true and renderCalls=0. Player playAction catches the error as ENGINE REJECTED ACTION even though the action already committed. Queue recovery cannot repair a save failure that interrupted the shell before its normal render/schedule boundary.

**Player impact:** under storage failure, the visible board and save may lag committed rules state; retry messaging is misleading, and a bot turn may not be scheduled. No claim that ordinary device storage currently fails.

**Current coverage:** presentation_failure_recovery.py injects an animation failure after successful commit/save/render; that is a different failure boundary. Existing save tests assume functioning storage.

**New test needed:** yes. Inject write failure for ordinary play, pending choice, terminal commit, and prepared match; verify coherent visible state and truthful unsaved status without action replay. Re-enable storage and verify explicit recovery.

**Blocks merge:** no for the currently proven normal-storage path; recommended bounded hardening before broad release. This classification does not certify storage-failure recovery.

**Smallest safe fix:** expose storage success/failure explicitly, always reconcile committed state, and show a truthful unsaved/recovery state. Never report engine rejection or saved success for a post-commit storage exception; never silently replay or roll back the move.

## F4 — P2 meaningful non-blocking contract gap: malformed saves pass envelope validation

**Boundary:** stored payload validation → Continue → engine/render consumers.

**Evidence:** src/storage.js:17–25 only requires schema/phase and truthy p1/p2 plus phase flags. The exact reader accepted:
```json
{"schema":2,"phase":"match","build":"incompatible","state":{"players":{"p1":{},"p2":{}}}}
```
app.js:606–613 then installs that state and renders it; required board/hand/deck structures are absent. The saved build field is not checked against any compatibility policy. This conflicts with docs/PASS11_GOLDEN_MATCH_CONTRACT.md §4.6's malformed/incompatible-save rejection requirement.

**Current coverage:** valid restored choice/result and phase checks exist; they do not demonstrate structural or build compatibility rejection.

**New test needed:** yes. Missing/invalid zones, invalid current player/phase, unknown card IDs, duplicate iids, inconsistent pending choice, and explicitly unsupported save version; retain exact round-trip of valid supported saves.

**Blocks merge:** no demonstrated corruption in saves produced by this candidate. However, do not claim the full malformed/incompatible-save acceptance contract closed until fixed or explicitly re-scoped.

**Smallest safe fix:** validate a minimal engine/save shape and supported format compatibility before exposing Continue. Reject safely with a recoverable new-match path; avoid an unnecessary general migration framework or rejecting every harmless cosmetic build change.

## Areas without a newly established defect

- Normal legal setup and two-card mulligan: engine-owned, deterministic, identity-conserving; phase gate prevents ordinary play before finish.
- Locked Golden Match rules, passing, faction/life progression and termination: current source and tests support the accepted baseline. No rules defect established here.
- Player typed choices: separate lifecycle gate demonstrates Medic restore/resolution; nested row choice has engine coverage. Run #260 summary says playerChoiceCount=0, so its natural-match trace must not be cited as proof of an actually exercised player choice.
- Player tap/drag canonical commit, Decoy ambiguity/target exposure and iid continuity: existing precision, zero-mutation rejection, geometry and interruption evidence remains valid. No new stale-target mutation defect established. Advanced nested actor presentation remains roadmap work.
- Terminal queue completion/cancel/failure: result is durable engine state and visibility is derived from presentation-busy, not a second persistent hidden-result latch. Queue cleanup removes busy on completion, cancellation and errors. No separate stuck-modal defect established. Add terminal cancel/error/reload cases alongside F1 verification because existing terminal evidence primarily covers normal completion and settled restore.
- Restart/Rematch: ordinary UI is blocked during active presentation; accepted fresh mulligan/save reset remains valid. Reuse of cN identifiers in a new match is not by itself an iid defect.
- Reduced motion: same engine/action path; no distinct rules defect established. F1 must still be tested under both timings.
- Audio/haptics: concrete playback, trusted unlock/resume, capability honesty remain automated evidence only. No new platform deadlock established. Real installed-iPhone audible/tactile/background behavior remains pending.
- Frozen Pass 10.3 final geometry and deployment module inclusion: no demonstrated regression.

## Hygiene and handoff

Known hygiene remains: Pass 10.4C visible title/buildline/developer labels; BUILD 11.audio.0; README says Pass 11 is next. Also refresh stale PR planning-only description and old forward-handoff wording while preserving roadmap authority. These are not the primary review findings.

No runtime fixes, permanent test changes, merges, deployments, or external messages were performed. Closed slices remain closed except the specifically identified integration defects; no global timing/geometry redesign is recommended.

Next execution: switch to GPT-5.6 Sol · High for F1/F2 fixes, recommended F3/F4 hardening, release-label/cache/README/status cleanup, test additions, final CI, exact-head artifact inspection, authorized merge/deployment, and TinyFish production smoke. Real-iPhone sensory signoff remains Blake's test. Astra Max is not justified.
