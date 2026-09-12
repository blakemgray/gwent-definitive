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
**Current phase:** **BATTLEFIELD CARD-FACE HOTFIX — IMPLEMENTATION + AUTOMATED + VISUAL ACCEPTANCE COMPLETE / MERGE AUTHORIZATION PENDING**  
**Current task:** **preserve this exact hotfix candidate, verify this docs-inclusive head, and do not merge/deploy until the user explicitly authorizes it**  
**Hotfix implementation:** 100%  
**Hotfix verification:** 100% on implementation head; docs-inclusive exact-head verification pending this continuity commit  
**Default model:** GPT-5.6 Sol · High  
**Last updated:** 2026-09-12 America/New_York

---

# 0. Required start-here protocol

Before substantive resumed work:

1. Read this file in full.
2. Read `FUTURE_CONTINUITY.md` in full.
3. Read `MODEL_ROUTING.md` in full.
4. Reconcile current `main`, PR #12 head, and exact-head workflows against this file.
5. Treat GitHub as authoritative over chat memory or assumptions.
6. Do not merge/deploy from a generic `continue`, `finish`, or similar instruction. Merge/deploy requires explicit authorization.

Precedence: current user instruction → current repository / exact-head green CI → this file → `FUTURE_CONTINUITY.md` → current contracts/config → `MODEL_ROUTING.md` → older archives/chat.

Never weaken, delete, or bypass CI/QA merely to make a candidate green. Exact-head visual evidence remains mandatory for player-facing rendering fixes.

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

Pass 10.3 remains authoritative for battlefield row/lane/rail ownership, final resting placement, and deterministic packing. This hotfix narrowly corrects the **placed-card body aspect/padding inside that geometry** because real-device and artifact evidence proved those values themselves were defective. It does not change row order, lane bounds, legal destinations, scoring, rules, or engine state.

---

# 2. Production state and versioning

Production `main` remains `8b2085530e25ef5f05d99a25b00dc4fb307f4127` until PR #12 is explicitly merged.

Production installed-PWA shell generation remains **`11.golden.4`**.

PR #12 carries candidate installed-PWA shell generation **`11.golden.5`**, necessary because the precached battlefield runtime changed. No PR workflow deployed it.

Save semantics are unchanged:

- format: `pass11-normal-v1`
- save build: `11.golden.1`
- bounded legacy builds: `11.1A`, `11.1B`

No save-format/build bump is warranted.

---

# 3. Confirmed regression

Real installed-iPhone production play showed that placed battlefield cards did not preserve the expected complete physical card face/frame. The defect reproduced equivalently on:

- player close / ranged / siege;
- opponent close / ranged / siege.

This proved a shared placed-card rendering defect rather than a faction, row, side, or individual-card issue.

Expected behavior: the placed-card body itself should have the same proportions as the loaded Witcher card art, with the complete face/frame visible. Dense rows may overlap through the existing deterministic packer, but individual cards must not crop, stretch, or appear as a narrow strip inside a padded/wide shell.

---

# 4. Rejected first candidate — important QA lesson

First candidate head:

`4a358d57a560caaa86487a48b0aada089d9ab7e2`

It changed battlefield art from `object-fit: cover` to `contain`, added an all-six-rows test, and advanced the candidate shell to `11.golden.5`.

It was automated-green:

- Main #302 / `34707761039` — SUCCESS;
- Storage #17 / `34707761133` — SUCCESS.

But manual review of exact-head readability artifact `10302168100` (`sha256:7c6fc09d5951c4c6e60e7995a41975b06f870752f083ca118ffc62a86d9ccf22`) **rejected** the candidate: the image was no longer cropped, but the face still rendered as a narrow strip with material side gutters inside the card shell.

This demonstrated why green CSS/property assertions are not sufficient without inspecting the generated player-facing artifact.

---

# 5. Final root cause

Three shared factors combined:

1. `physical-card.css` used `object-fit: cover`, which cropped a mismatched source face to fill its box.
2. `src/battlefield-ux.js` hard-coded battlefield card width as `cardH * 0.696`, substantially wider than the canonical/source-art card face (~`16.1 / 30.4 ≈ 0.5296`).
3. Placed units are `<button class="unit">` elements, but the authoritative board-card surface did not reset browser/UA button padding. On a very small battlefield card, horizontal button padding could consume a large share of the visible card face, especially on WebKit/iPhone.

The first `contain` fix merely exposed factors 2 and 3.

---

# 6. Final implementation

Implementation head before this docs-only closeout:

**`c8b728425bed4ec637c155c9d462bd72a4c866b2`**

### `src/battlefield-ux.js`

- added canonical board-face aspect `16.1 / 30.4`;
- board card outer width is calculated so the **inner face box**, after borders under global `border-box` sizing, matches that aspect;
- applies only to placed battlefield cards;
- existing hand-card `0.696` geometry remains untouched by this hotfix;
- rail width, row order, centering, pack algorithm, minimum exposure, overlap behavior, and final resting ownership remain unchanged;
- exposes `GwentBattlefieldUX.boardCardAspect` for QA observation only.

### `physical-card.css`

- authoritative placed battlefield unit buttons now have `padding:0`;
- placed art uses `object-fit:contain` and centered positioning as a no-crop guard;
- predictive target actor preserves the same uncropped full-face presentation.

### `tests/pass11_readability_ui.py`

The regression test now populates **all six battlefield rows** and, for every player/opponent row, requires:

- zero computed card-button padding;
- loaded source art with valid natural dimensions;
- `object-fit: contain` + centered positioning;
- inner card-face aspect matching the image's actual `naturalWidth / naturalHeight` within tight tolerance;
- exposed board-card aspect matching that same loaded-art aspect;
- image element filling the entire inner card-face box.

This stronger test would fail both the original production defect and the first green-but-visually-wrong hotfix candidate.

All prior density/readability, touch, targeting, choreography, lifecycle, PWA, Golden Match, stress, and storage gates remain intact.

---

# 7. Exact implementation-head evidence

Implementation head: `c8b728425bed4ec637c155c9d462bd72a4c866b2`

- Main Verify Run #309 / `34709726806` — **SUCCESS**
- Storage Resilience Run #24 / `34709726754` — **SUCCESS**
- PR deploy job — **SKIPPED** as intended

Main #309 cleared, among other gates:

- battlefield geometry/density;
- strengthened Pass 11.2A full-face/readability regression;
- intent/target exposure/card continuity;
- platform truth and coherent PWA upgrade;
- complete Golden Match;
- direct manipulation + destination parity;
- presentation-aware opponent gate;
- presentation failure recovery;
- **256 physical stress trials**;
- save/visibility lifecycle;
- **WebKit/iPhone-targeted interaction**;
- signature/adversarial choreography;
- 10.4C feel/pacing;
- all visual artifact archives.

Exact-head readability artifact:

- name: `pass11-2a-battlefield-readability-qa`
- ID: `10302553573`
- digest: `sha256:57981c2e117e687948c08d7117d4ed392f6371f882eb931b72e6746cbf7890d0`

Exact-head storage artifact:

- ID: `10303035858`
- digest: `sha256:f711447dab05c57c7e13a61bab737721c0a3eab02d41053b34e0bffc9f067459`

---

# 8. Manual visual acceptance — PASS

Manually inspected from the exact implementation-head artifact:

- `08_full_card_face_all_rows_both_sides.png`
- `05_density_12.png`

Verdict: **PASS**.

Observed:

- the actual card face now fills its physical card body instead of appearing as a narrow central strip;
- full card art/frame remains visible;
- player and opponent rows are consistent across all six row positions;
- power badges remain readable;
- the 12-card dense row remains centered, coherent, and deterministic;
- lane/rail/row geometry remains intact;
- no broad reflow or gameplay-layout regression was introduced.

This is the first hotfix candidate that satisfies both automated and human visual acceptance.

---

# 9. PR #12 state

PR #12 is open, mergeable, and unmerged.

Its body has been updated to the final diagnosis, implementation, exact implementation-head CI, artifact IDs/digests, and manual visual PASS.

No production deploy occurred from PR verification.

---

# 10. Final docs-inclusive closeout protocol

This continuity update is intentionally docs-only and moves the branch head beyond the verified implementation head.

Exact next action after this commit:

1. identify the new docs-inclusive PR head;
2. require Main Verify + Storage Resilience to succeed on that exact head;
3. confirm PR #12 remains open/mergeable/unmerged and production `main` remains unchanged;
4. stop at **merge-ready**;
5. merge/deploy only after explicit user authorization.

After explicit merge/deploy authorization only:

- reconcile PR head and workflows again;
- merge using the expected exact head SHA to prevent a race;
- observe post-merge Main verification and Pages deployment to completion;
- verify production `main` and hosted build;
- update continuity with the final production merge/deploy SHA and evidence.

Do not infer merge/deploy authorization from `continue`, `finish`, or other generic continuation language.