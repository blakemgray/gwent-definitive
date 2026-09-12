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
**Current milestone:** **Pass 11 — Golden Match / Complete Normal Match — DEPLOYED**  
**Current phase:** **REAL-IPHONE ACCEPTANCE FOUND REPRODUCIBLE BATTLEFIELD CARD-CROP REGRESSION / HOTFIX IN PROGRESS**  
**Current task:** **repair shared placed-card rendering so the full card face/frame remains visible on every battlefield row for both players; add regression proof; do not alter frozen gameplay geometry or rules authority**  
**Hotfix implementation:** 10%  
**Hotfix verification:** 0%  
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

**Pass 10.3 Battlefield Geometry Contract v2 remains frozen authority.** Final row order remains Opponent Siege / Ranged / Close / Weather / Player Close / Ranged / Siege. This hotfix must not change row geometry, row ownership, rules, target legality, or authoritative engine state.

---

# 2. Pass 11 production state

Pass 11 is deployed and supplies a genuine normal Instant Match from menu to fresh rematch with legal full-size decks, opening draw/mulligan, complete turn/round/result lifecycle, choices, persistence, readable power/identity, intent forgiveness, predictive targeting, card continuity, Web Audio/platform handling, serialized opponent scheduling, coherent PWA updates, and the closed Pass 10.3/10.4 interaction stack.

Current installed-PWA shell generation: **`11.golden.4`**.

Current save format remains independently versioned:

- format: `pass11-normal-v1`
- save build: `11.golden.1`
- bounded legacy builds: `11.1A`, `11.1B`

Do not bump save format/build for a presentation-only hotfix unless save semantics actually change.

---

# 3. Confirmed real-device regression — battlefield card horizontal crop

**Source:** real installed-iPhone production play after Pass 11 deployment.

**Observed:** played battlefield cards visibly crop the left and right sides of the card face/frame after placement. The effect is visible in normal play and weakens persistent card identity.

**Reproduction scope confirmed by user:**

- all three player rows are affected equivalently;
- all three opponent rows are affected equivalently;
- both player and enemy placed cards are affected;
- therefore the defect is global/shared rather than faction-, row-, side-, or card-specific.

**Expected:** a placed card may scale/compress according to frozen row geometry, but the complete card face/frame must remain visible and recognizable. The visual should remain the same physical card, scaled to its board slot, rather than a horizontally cropped token.

**Initial diagnosis:** inspect the shared placed-card visual shell and its image/frame fitting. Likely causes include a shared battlefield card container with a mismatched aspect ratio, cover-style image fitting, or an inner overflow clip. Do not assume the cause until source tracing confirms it.

**Hotfix acceptance contract:**

1. Fix the shared placed-card renderer once rather than adding per-row/per-side exceptions.
2. Preserve Pass 10.3 final row geometry and current dense-row behavior.
3. Preserve card identity, current power overlays, targeting, drag/tap parity, choreography, and engine authority.
4. Full left/right card frame/art must remain visible on representative player and opponent rows.
5. Add a deterministic/browser regression test that would fail if the placed card face is horizontally clipped again.
6. Inspect visual evidence from the exact hotfix head before merge.
7. Do not merge/deploy without explicit user authorization.

---

# 4. Key runtime boundaries for this hotfix

Likely relevant files to trace before editing:

- `src/battlefield-ux.js` — frozen final battlefield geometry/reconciliation.
- `physical-card.css` — shared card visual dimensions/art/frame presentation.
- `src/battlefield-readability.js` — battlefield power/readability overlays.
- `src/card-continuity.js` — perceived card identity/visibility continuity.
- `src/gesture-controller.js` — direct manipulation; should not own resting card crop.
- `app.js` — renderer/shell integration.

Other closed systems must remain untouched unless tracing proves they are directly responsible.

---

# 5. Verified production evidence before hotfix

- Pass 11 exact functional head `20183a10f68b4fff7084936e5aa3194c5a55a7c2`: Main Verify Run #297 / `34700148543` **SUCCESS**; Storage Run #14 / `34700148554` **SUCCESS**.
- Docs-inclusive PR head `2e45b401238f7b4363684a8eca6027035b60a32f`: Main Run #299 / `34700876842` **SUCCESS**; Storage Run #16 / `34700876857` **SUCCESS**.
- PR #11 merged as `aa8b6043d68c42ae2dc5310b57106a5a5808a150`.
- Production Run #300 / `34701697634`: full Verify + Pages deploy **SUCCESS**.
- Docs-only production closeout `8b2085530e25ef5f05d99a25b00dc4fb307f4127`.
- Run #301 / `34702404779`: full Verify + Pages deploy **SUCCESS**.
- Live site served `Gwent Classic — Definitive Edition · Pass 11` after deployment.

Previously reviewed Pass 11 artifacts remain valid evidence for the unaffected product baseline; this hotfix requires fresh visual proof specifically for battlefield card fitting.

---

# 6. Exact next action

1. Trace the shared placed-card DOM/CSS path on `hotfix/battlefield-card-crop`.
2. Compare hand-card and battlefield-card aspect/fitting behavior and identify the exact clipping owner.
3. Implement the narrowest shared fix without altering frozen row geometry.
4. Add regression coverage for full card-face visibility on both player and opponent rows.
5. Run targeted tests, then exact-head full CI and inspect visual artifacts.
6. Open a narrowly scoped hotfix PR against `main`.
7. Merge/deploy only after explicit user authorization.

Do not reopen closed gameplay architecture unless source/evidence proves the regression requires it.