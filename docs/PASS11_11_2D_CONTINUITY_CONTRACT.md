# Pass 11.2D — Card Continuity / Temporal Proof
## Locked implementation contract

**Status:** locked before 11.2D runtime implementation  
**Branch:** `pass-11-golden-match`  
**Parent exact-green implementation head:** `e6ccde4ca191bcbf8062404bfbd97d6fbc0a6548`  
**Parent verification:** run #221 / `34681981459` — full success  
**Authority:** current user instruction → repository/green CI → `CONTINUITY.md` → `FUTURE_CONTINUITY.md` → `docs/PASS11_11_2_PHYSICAL_CARD_ARCHITECTURE.md` → this contract  
**Model:** GPT-5.6 Sol · High

---

# 1. Outcome

11.2D makes the already-existing source → proxy → authoritative-final handoff explicitly observable and temporally truthful without introducing a global actor registry, a second action path, rules-bearing presentation state, or alternate battlefield geometry.

The player should perceive one physical card identity moving between zones. Engine state remains authoritative; presentation actors are disposable.

---

# 2. Existing path and identified seam

The current direct-manipulation path already does most of the right work:

1. a hand card is the authoritative source DOM element;
2. drag creates a proxy clone and marks the source as a placeholder;
3. tap creates a flight proxy for the same source;
4. `commitAction()` commits through the canonical engine action;
5. `GwentBattlefieldUX.reconcile()` renders final authoritative board geometry;
6. the proxy flies toward the final card rectangle;
7. the final card is hidden during flight;
8. cleanup removes the proxy and reveals the authoritative final element;
9. cancellation/interruption reconciles back to engine truth.

The identified temporal seam is between steps 5 and 7: after engine commit/reconcile, the final card can be visible for a rendered frame before `animateFlight()` hides it, while the proxy is also visible. 11.2D must remove that perceptible duplicate-identity seam without delaying engine commit or changing final geometry.

---

# 3. Observation-only identity telemetry

Telemetry belongs to the existing direct-manipulation/presentation owner and must never influence legality, target selection, commit, scoring, AI, or geometry.

For the actively manipulated `iid`, record a bounded ordered trace of continuity samples. Each sample contains only observation data:

- monotonically increasing `seq`;
- `stage` reason code;
- relative `timeMs`;
- `iid`;
- `inputMethod` where known (`drag`, `tap`, `keyboard`);
- direct-manipulation `phase`;
- presentation queue busy state;
- engine-authoritative zone for that `iid` (`hand`, `board:<pid>:<row>`, `grave:<pid>`, `weather`, `special:<pid>:<row>`, `missing`);
- source hand element snapshot;
- drag proxy snapshot;
- flight proxy snapshot;
- authoritative final board element snapshot;
- each element snapshot: `present`, `visible`, `rect`, `role`, and stable presentation `iid` metadata where applicable;
- `visibleRepresentationCount` for the manipulated `iid` at the sampled render boundary;
- optional cancellation/interruption reason.

Trace storage is bounded and QA-observational only. Normal gameplay behavior must not depend on it.

Presentation proxies must carry explicit metadata:

- `data-presentation-iid=<iid>`;
- `data-presentation-role=drag-proxy|flight-proxy`.

No new rules identity is created; the engine `iid` remains authority.

---

# 4. Temporal truth invariants

At sampled render-frame boundaries for ordinary valid placement:

- after pickup begins, there is always at least one visible representation of the manipulated `iid` until settlement;
- the source may remain present as a placeholder while a proxy is visible, but it is not a second full-strength actor;
- after engine commit, the authoritative final card may exist in DOM but must be hidden before the next rendered frame while the flight proxy remains visible;
- no rendered frame may show both a fully visible flight proxy and a fully visible authoritative final card for the same `iid`;
- settlement ends with zero proxies and exactly one visible authoritative final card in the engine-authoritative zone;
- final `left/top/width/height` remain 10.3-owned.

For invalid drag return:

- engine state remains byte-equivalent;
- the proxy remains the moving actor during return;
- the hand source remains a placeholder until return cleanup;
- idle state ends with zero proxies and exactly one visible hand source.

For interruption before commit:

- no engine mutation;
- proxy/placeholder state is cleared;
- exactly one visible hand source remains.

For interruption after commit / during flight:

- the committed engine action is never rolled back or repeated;
- cleanup removes the proxy;
- authoritative state is reconciled;
- exactly one visible final representation remains in the engine-authoritative zone.

Reduced motion must satisfy the same identity-count invariants even when movement collapses to a short fade/settle.

---

# 5. Implementation constraints

- Keep `src/gesture-controller.js` as the owner of source/proxy/final continuity.
- Keep `GwentPresentationQueue` as cancellation/cleanup authority.
- Keep `src/battlefield-ux.js` as final resting geometry authority.
- Do not add a global rules-bearing actor registry.
- Do not add a second commit/action path.
- Do not delay or rollback engine commit for animation.
- Do not make telemetry required for production behavior.
- Do not duplicate Decoy/Medic consequence choreography owned by 10.4B.

The preferred repair for the duplicate-frame seam is to identify and hide the authoritative final element inside the already-active presentation transaction before yielding to the next animation frame, register cleanup immediately, then measure its final geometry and execute the existing flight.

---

# 6. Permanent browser acceptance matrix

Create a dedicated temporal browser gate with frame-aware telemetry/artifacts for at least:

1. **Valid drag ordinary unit** — pickup → legal target → release → engine commit → proxy flight → final settle; no zero-identity frame and no proxy+final duplicate frame.
2. **Valid tap ordinary unit** — explicit selection/destination → flight → final settle; same identity invariants and same canonical action result.
3. **Invalid drag return** — move/release outside accepted intent; state digest unchanged; proxy returns; one hand source at idle.
4. **Pre-commit interruption** — cancel/pointer/viewport-style interruption during drag; no mutation; one hand source at idle.
5. **Post-commit presentation interruption** — cancel the presentation queue during flight after the engine action has committed; action remains committed exactly once; cleanup/reconcile leaves one authoritative final card and zero proxies.
6. **Reduced motion valid placement** — same identity-count invariants with reduced-motion presentation.

Where practical, observe Decoy/Medic-related transitions for continuity anomalies, but their mechanic-specific choreography remains 10.4B-owned and is not reimplemented here.

The gate must archive temporal screenshots/telemetry and be manually inspected on the latest exact head before 11.2D closure.

---

# 7. QA responsibility

- Node/static tests verify telemetry is observation-only and PWA/load graph is explicit.
- Playwright owns precise frame/identity/interrupt temporal proof.
- Manual artifact inspection owns perceptual acceptance.
- TinyFish is not required for this microinteraction slice if it cannot reliably remain on the battlefield; reserve it for coarse live-flow checkpoints where it can operate the UI correctly.
- Real iPhone remains final authority for physical touch/audio/haptic feel later in Pass 11.

---

# 8. Closure criteria

11.2D closes only when:

- the dedicated continuity gate passes all six cases;
- the full preserved 10.3–10.4C and Pass 11 regression suite is green on the exact head;
- WebKit/iPhone-targeted interaction remains green;
- archived temporal evidence is manually inspected and approved;
- no telemetry becomes gameplay authority;
- no engine, action-path, or final-geometry ownership is duplicated.

---

# 9. Exact next action

Implement explicit proxy presentation metadata, bounded continuity sampling, and the early final-card hide/cleanup boundary inside the existing `gesture-controller.js` presentation transaction. Then add the dedicated Playwright continuity matrix and wire it into the PWA/CI artifact graph before running full exact-head verification.