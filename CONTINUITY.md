# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff. Git history preserves older detail; this file records the current authoritative state needed to resume safely.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Verified production main before this hotfix:** `8b2085530e25ef5f05d99a25b00dc4fb307f4127`  
**Pass 11 production merge:** `aa8b6043d68c42ae2dc5310b57106a5a5808a150`  
**Production Verify + Deploy:** Run #300 / `34701697634` — **FULL SUCCESS**  
**Final production-docs Verify + Deploy:** Run #301 / `34702404779` — **FULL SUCCESS**  
**Current branch:** `hotfix/battlefield-card-crop`  
**Current PR:** #12 — `Hotfix: preserve full battlefield card faces`  
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match — DEPLOYED**  
**Current phase:** **BATTLEFIELD CARD-FACE HOTFIX — FIRST CANDIDATE AUTOMATED-GREEN BUT VISUALLY REJECTED; ROOT CAUSE REFINED**  
**Current task:** **correct the shared battlefield card-shell aspect so the loaded Witcher card face fills its placed-card body without cropping or side gutters, while preserving row/lane geometry, dense packing semantics, rules authority, and interaction behavior**  
**Hotfix implementation:** 75%  
**Hotfix verification:** 85% — first candidate full CI green, but exact-head manual visual acceptance failed  
**Default model:** GPT-5.6 Sol · High  
**Last updated:** 2026-09-12 America/New_York

---

# 0. Required start-here protocol

Before substantive resumed work:

1. Read this file in full.
2. Read `FUTURE_CONTINUITY.md` in full.
3. Read `MODEL_ROUTING.md` in full.
4. Reconcile current `main`, current open PRs, and latest workflow state against this file.
5. Treat GitHub as authoritative over chat memory or assumptions.
6. Before implementation changes, write a fresh continuity checkpoint if repository state has moved materially.

Precedence: current user instruction → current repository / exact-head green CI → this file → `FUTURE_CONTINUITY.md` → current contracts/config → `MODEL_ROUTING.md` → older archives/chat.

Never weaken, delete, or bypass CI/QA merely to make a candidate green. Playwright/CI owns deterministic machine and temporal-browser proof. TinyFish is useful for independent live-product QA where reliable, but not as the primary interface for precise GitHub operations or microinteraction proof. Real-device iPhone review remains required for final physical touch/audio/haptic/platform observations.

Every user-facing progress update should include **Implementation %**, **Verified %**, a concise **Layman’s terms** explanation, and the exact **Next** action.

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

**Pass 10.3 Battlefield Geometry Contract v2 remains authoritative for row order, lanes, rail ownership, final resting placement, and packing.** Final row order remains Opponent Siege / Ranged / Close / Weather / Player Close / Ranged / Siege.

The roadmap permits reopening a closed pass when current evidence proves a genuine regression in that pass's responsibility. This hotfix therefore may correct the **placed-card shell aspect inside Pass 10.3** because the real-device defect and artifact review now prove that the existing `0.696` board-card aspect is not faithful to the canonical card face. Do not change row geometry, row ownership, legal destinations, rules, scoring, or engine state.

---

# 2. Pass 11 production state

Pass 11 is deployed and supplies a genuine normal Instant Match from menu to fresh rematch with legal full-size decks, opening draw/mulligan, complete turn/round/result lifecycle, choices, persistence, readable power/identity, intent forgiveness, predictive targeting, card continuity, Web Audio/platform handling, serialized opponent scheduling, coherent PWA updates, and the closed Pass 10.3/10.4 interaction stack.

Production installed-PWA shell generation remains **`11.golden.4`**.

Hotfix PR #12 currently carries candidate shell generation **`11.golden.5`**. It has not been deployed, so further corrections within PR #12 may remain under `11.golden.5` until release as long as the exact final candidate is fully reverified.

Current save format remains independently versioned:

- format: `pass11-normal-v1`
- save build: `11.golden.1`
- bounded legacy builds: `11.1A`, `11.1B`

Do not bump save format/build for this presentation/geometry hotfix; save semantics have not changed.

---

# 3. Confirmed real-device regression — placed battlefield card face

**Source:** real installed-iPhone production play after Pass 11 deployment.

**Observed:** played battlefield cards do not preserve the expected full physical card face/frame after placement. The defect is visible in normal play and weakens persistent card identity.

**Reproduction scope confirmed by user:**

- all three player rows are affected equivalently;
- all three opponent rows are affected equivalently;
- both player and enemy placed cards are affected;
- therefore the defect is global/shared rather than faction-, row-, side-, or card-specific.

**Expected:** the complete canonical card face/frame remains visible and the placed-card shell itself has the same proportions as the card art. Dense rows may overlap/compress horizontally through the existing packing algorithm, but an individual card body must not crop, stretch, or sit as a narrow face inside an incorrectly wide shell.

---

# 4. First hotfix candidate — automated green, visual rejection

Initial candidate head before the refined diagnosis:

`4a358d57a560caaa86487a48b0aada089d9ab7e2`

Changes in that candidate:

- `physical-card.css`: battlefield card art changed from `object-fit: cover` to `object-fit: contain` + centered positioning;
- target-exposure actor received the same full-face fit;
- all-six-rows browser regression case added;
- PWA shell generation advanced to `11.golden.5`;
- shell-generation contracts updated.

Exact-head evidence:

- Main Verify Run #302 / `34707761039` — **SUCCESS**;
- Storage Resilience Run #17 / `34707761133` — **SUCCESS**;
- PR deploy job — **SKIPPED** as intended;
- readability artifact `pass11-2a-battlefield-readability-qa` ID `10302168100`, digest `sha256:7c6fc09d5951c4c6e60e7995a41975b06f870752f083ca118ffc62a86d9ccf22`.

**Manual artifact verdict: REJECTED.**

The new `08_full_card_face_all_rows_both_sides.png` proved the test was incomplete: the whole source image loaded, but the visible card face remained materially narrower than the battlefield card shell, leaving side gutters. Automated green status was therefore not accepted as release evidence.

This is exactly why exact-head visual artifact inspection remains mandatory.

---

# 5. Refined root cause

Source tracing after the rejected artifact found:

- `src/battlefield-ux.js` hard-codes battlefield card width as `cardH * 0.696`;
- the same file also uses `0.696` for hand cards, but this hotfix is scoped to the confirmed placed-battlefield defect;
- Arun's canonical Witcher card presentation uses approximately **`16.1 / 30.4 ≈ 0.5296`** for the full card face (`.card-lg`), consistent with the tall/narrow source card artwork;
- therefore the battlefield shell is substantially too wide for the actual card face;
- `object-fit: cover` hid that mismatch by filling the wide shell through cropping;
- switching only to `contain` correctly stopped cropping but exposed the underlying shell-aspect defect as side gutters/narrow-face presentation.

**Correct repair direction:**

1. keep `object-fit: contain` so the source face cannot be cropped;
2. change the **battlefield placed-card shell only** to the canonical card-face aspect;
3. leave hand-card geometry untouched in this hotfix;
4. keep the existing rail width, lane geometry, centering, row order, packing algorithm, minimum exposure logic, and dense-row overlap semantics;
5. strengthen QA to compare each placed card shell's rendered aspect against its loaded image's `naturalWidth / naturalHeight`, rather than merely asserting a hard-coded `0.696` shell plus `contain`.

---

# 6. Hotfix acceptance contract

1. Fix the shared placed-card renderer once; no per-row/per-side exceptions.
2. Preserve Pass 10.3 row/lane/rail geometry, ownership, centering, and dense packing behavior.
3. Permit the narrow correction of the battlefield **card-shell aspect** because current evidence proves the old value itself is the regression.
4. Do not alter hand-card geometry in this hotfix unless new evidence proves it is necessary for the reported battlefield defect.
5. Preserve card identity, current-power overlays, targeting, tap/drag parity, choreography, presentation interruption safety, and engine authority.
6. Every representative player/opponent row must show a shell aspect matching the loaded source art closely enough that `contain` does not create material side/top gutters.
7. Browser QA must use the actual loaded image natural dimensions to catch future source/shell aspect mismatch.
8. Inspect the exact-head all-six-rows screenshot after the corrected implementation.
9. Exact-head Main + Storage workflows must both be green after the corrected implementation.
10. Do not merge/deploy without explicit user authorization.

---

# 7. Key runtime boundaries

Directly relevant:

- `src/battlefield-ux.js` — authoritative final battlefield card sizing/packing; now proven to contain the bad board-card aspect constant.
- `physical-card.css` — image fitting; `contain` remains appropriate.
- `tests/pass11_readability_ui.py` — must be strengthened from hard-coded `0.696` acceptance to loaded-art aspect parity.
- `src/target-exposure.js` / `physical-card.css` target actor — should inherit corrected source card body dimensions without becoming rules authority.
- `sw.js` + PWA contracts — candidate shell generation `11.golden.5` already covers this unreleased hotfix branch.

Closed systems should remain untouched unless exact-head regression evidence proves otherwise:

- engine/rules;
- save schema;
- interaction intent legality;
- gesture commit path;
- presentation queue/opponent gate;
- round/result lifecycle.

---

# 8. Verified production evidence before hotfix

- Pass 11 exact functional head `20183a10f68b4fff7084936e5aa3194c5a55a7c2`: Main Verify Run #297 / `34700148543` **SUCCESS**; Storage Run #14 / `34700148554` **SUCCESS**.
- Docs-inclusive PR head `2e45b401238f7b4363684a8eca6027035b60a32f`: Main Run #299 / `34700876842` **SUCCESS**; Storage Run #16 / `34700876857` **SUCCESS**.
- PR #11 merged as `aa8b6043d68c42ae2dc5310b57106a5a5808a150`.
- Production Run #300 / `34701697634`: full Verify + Pages deploy **SUCCESS**.
- Docs-only production closeout `8b2085530e25ef5f05d99a25b00dc4fb307f4127`.
- Run #301 / `34702404779`: full Verify + Pages deploy **SUCCESS**.
- Live site served `Gwent Classic — Definitive Edition · Pass 11` after deployment.

---

# 9. Exact next action

1. Amend `src/battlefield-ux.js` so **board** card width uses the canonical card-face aspect (~`16.1/30.4`) while hand-card sizing remains unchanged.
2. Strengthen `tests/pass11_readability_ui.py` so each of the six placed cards must match its loaded image natural aspect within a tight tolerance, in addition to requiring `object-fit: contain` and loaded art.
3. Run PR exact-head Main + Storage workflows.
4. Download and manually inspect the fresh `08_full_card_face_all_rows_both_sides.png` artifact.
5. Update PR #12 body and continuity with exact final evidence.
6. Stop at merge-ready. Merge/deploy only after explicit user authorization.

Do not reopen broader gameplay architecture unless the corrected exact-head evidence proves this localized repair insufficient.