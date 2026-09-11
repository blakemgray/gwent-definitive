# Gwent Classic — Definitive Edition
## Canonical Running Project Continuity

**Purpose:** permanent implemented-state handoff for this project. Recover the project from this file plus the repository, not chat memory.

**Repository:** `blakemgray/gwent-definitive`  
**Canonical hosted build:** `https://blakemgray.github.io/gwent-definitive/`  
**Default branch:** `main`  
**Current production runtime / Pass 10.4C merge:** `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`  
**Last verified production workflow:** run #137 / `34621157464` — verify **success**, Pages deploy **success**  
**Current completed production milestone:** **Pass 10.4C — Feel / Presentation Polish**  
**Current active implementation milestone:** **None — Pass 10.4C is closed**  
**Next planned implementation milestone:** **Pass 11 — Golden Match / Complete Normal Match**  
**Final PR:** `#8 — Pass 10.4C — Feel / Presentation Polish`  
**Final PR head:** `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`  
**Latest visually approved implementation artifact:** `10270749326`, digest `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`  
**Estimated Pass 10.4C completion:** **100%**  
**Last updated:** 2026-09-11 America/New_York

Pass 10.4C is merged, fully verified on `main`, visually approved, and deployed. Do not reopen it unless a genuine regression is discovered against current production evidence.

---

# 0. Mandatory continuity protocol

This file is authoritative for implemented/current state. `FUTURE_CONTINUITY.md` is the forward-roadmap companion.

Source precedence:

1. Current explicit user instruction.
2. Current repository code + green CI behavior.
3. This file.
4. `FUTURE_CONTINUITY.md`.
5. Current pass contracts/config.
6. Older archives.
7. Chat memory.

### Start-of-task rule

For every new implementation task or resumed work cycle:

1. Read the current branch's `CONTINUITY.md` first.
2. **Write an actual checkpoint update to this file in GitHub before doing further implementation work.** Chat-only continuity does not count.
3. Record active pass/task, branch/PR/head, latest meaningful CI evidence or blocker, exact next action, and an estimated completion percentage.
4. Percentage is for visibility only; never compress scope, rush QA, skip visual review, or weaken a gate.
5. Every user-facing progress report should include the current percentage.
6. Every user-facing work message should end with a concrete **Next action**.
7. On merge/deploy, update this file again with final SHAs, CI, artifacts, visual findings, remaining debt, and handoff.

---

# 1. Locked product doctrine

## Mission

Build the definitive modern implementation of **classic The Witcher 3 Gwent**, using Arun Sundaram's `asundr/gwent-classic` as the behavior/card/rules oracle while keeping the new runtime deterministic, testable, mobile-first, and engine/presentation separated.

Match classifications remain `CLASSIC`, `ASSISTED`, `MODIFIED`, `SANDBOX`; statistics must not blur them together.

## Rules

- Preserve classic TW3 Gwent rules/card behavior.
- Engine state is authoritative and deterministic.
- Presentation never decides legality/outcomes.
- Animation failure never rolls back a valid committed action.
- AI difficulty comes from better reasoning, never hidden-information cheating.

## Interaction

- JS-first hosted PWA; iPhone landscape is the primary gameplay target.
- Hybrid tap-select→tap-destination and direct Pointer Events drag.
- Both dispatch the same canonical validated action.
- Invalid gestures return visually with zero mutation.
- Reduced motion preserves equivalent gameplay clarity.

## Visual language

Witcher 3 atmosphere + premium physical tabletop + modern iOS discipline: dark wood, iron, parchment, leather, aged brass/gold, ivory; restrained effects; no generic free-to-play visual language.

## Battlefield geometry authority

**Pass 10.3 Battlefield Geometry Contract v2 is frozen authority.** Final order: Opponent Siege / Ranged / Close / Weather / Player Close / Ranged / Siege. Later motion may interpolate around final slots but may not replace geometry math.

---

# 2. Canonical architecture

```text
Card DB / rules data
        ↓
GameState
RuleEngine / ActionEngine / EffectEngine / ScoreEngine
        ↓
AI / Cheats / Replay / Undo
        ↓
Presentation API / semantic event adapter
        ↓
Battlefield UX / gestures / choreography / audio / haptic hooks
        ↓
Hosted web app / PWA / future native-quality iOS shell
```

Locked architecture:

- stable card IDs + per-match `iid`s;
- semantic event/action logs;
- one rules path regardless of input method;
- engine commits before presentation;
- presentation is disposable;
- interruption/failure reconciles to engine truth;
- bot/opponent mutation cannot occur inside unresolved player presentation.

Key runtime files:

- `src/gwent-engine.js` — deterministic rules engine.
- `src/cards-catalog.js` — 216-card catalog.
- `src/battlefield-ux.js` — frozen 10.3 geometry/reconciliation authority.
- `src/motion-tokens.js` — shared motion/reduced-motion policy, tuned by 10.4C.
- `src/presentation-queue.js` — serialized cancellable presentation transactions.
- `src/interaction-turn-gate.js` — 10.4A bot gate.
- `src/presentation-events.js` — 10.4B semantic before/after + engine-delta adapter.
- `src/gameplay-choreography.js` — 10.4B choreography runtime.
- `src/choreography-external-gate.js` — 10.4B external-action/Auto-Bot gate + synchronous 10.3 geometry sync; no visible milestone ownership.
- `src/gesture-controller.js` — 10.4A canonical direct-manipulation controller.
- `src/presentation-feedback.js` — 10.4C semantic audio/optional-haptic subscriber + player-facing copy normalization.
- `feel-polish.css` — 10.4C tactile polish layer.

All active runtime modules are explicit in `index.html` and the PWA/deploy graph. Dynamic loading from semantic adapters remains rejected.

---

# 3. Engine/catalog baseline

Established parity:

- 216/216 card definitions;
- 44/44 known ability tokens;
- 22/22 leaders;
- 5/5 factions.

Engine supports ordinary play, Spy, Tight Bond, Muster, Medic + pending choice, Decoy, Weather/Clear, Horn, row/leader Horn, Scorch/row Scorch, Hero, passing/auto-pass, round resolution, factions, leaders, and deterministic legal actions.

---

# 4. Deployment workflow

Workflow: `.github/workflows/deploy-pages.yml`

Policy: branch → PR → full static/browser/geometry/interaction/WebKit/pass-specific gates → visual inspection → latest-head green → merge → full `main` verification → Pages deploy → final continuity update.

### Current production snapshot — Pass 10.4C

- PR #8 merged.
- Final PR head: `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`.
- Merge/runtime SHA: `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`.
- Final PR validation: run #136 / `34620304920` — every gate **success**.
- Production verification + Pages deployment: run #137 / `34621157464` — verify **success**, deploy **success**.
- Visually approved release artifact: `10270749326` / `sha256:9d06882cc9f6d363ce4b5cbe494023f11e9058c57fbc2bd52e1839a335ac3990`.

Run #137 passed static engine/catalog/PWA/motion/direct-manipulation/choreography/feel validation, frozen 10.3 geometry, full 10.4A interaction/touch/parity, presentation-aware bot gating, disposable failure recovery, 256-trial physical stress / 512 committed interactions, semantic landing, lifecycle/save-restore, WebKit/iPhone, primary 10.4B choreography, the eight-scenario 10.4B adversarial matrix, and the 10.4C feel/feedback/reduced-motion/pacing gate. Production site staging/upload/deploy succeeded.

---

# 5. Pass history

Historical entries remain explicit; do not invent missing history.

- **Pass 5:** initial interactive prototype; preview limitations are not production requirements.
- **Pass 5B:** no-JS/hash workaround; intentionally abandoned as production direction.
- **Pass 6:** art/inspector investigation; identified preview and WebKit positioning issues.
- **Pass 6.1:** inspector recovery + explicit assist states.
- **Pass 7:** deterministic engine foundation, seeded RNG, stable instances, legal actions, semantic logs, classifications, history.
- **Pass 8:** complete 216-card catalog migration + UI integration.
- **Pass 9:** source-parity rules completeness; fixed Horn occupancy, exhaustion, Scorch/Decoy legality, lifecycle defects.
- **Pass 10:** rejected bespoke battlefield attempt; live DOM geometry is authoritative.
- **Pass 10.1:** deterministic six-row battlefield recovery.
- **Pass 10.2:** continuity gap; no verified standalone dossier—do not invent one.
- **Pass 10.3:** frozen Battlefield Geometry Contract v2 and centered/compressed row/hand compositor.
- **Pass 10.4R:** complete interaction/motion research; locked sequence 10.4A → 10.4B → 10.4C → Pass 11.

## Pass 10.4A — Direct Manipulation

**Status:** complete / merged / green.  
PR #5 merge `7367cd69042d93f0f895bc9150f0207df30f8f1c`; WebKit stabilization `731f5fc3c93eb7bd445b52edaad1ff65db73f6ed`.

Locked foundation: tap/drag parity; Pointer Events; 8 px threshold; pointer capture; engine `legalActions`; one `commitAction()`; zero-mutation invalid return; placeholders/proxies; FLIP; inspector secondary intent; keyboard/Escape; reduced motion; bot gate; semantic landing; disposable presentation failure; persistence/interruption cleanup.

## Pass 10.4B — Signature Gameplay Choreography

**Status:** complete / merged / green / deployed.  
PR #7; implementation head `6a34c9ce1c6fe1ae43d47eb329187e70cd546535`; final PR head `1623caed9c72a80d110e3ec4efdc3e2838d9ee3c`; merge/runtime `a6adca26dc2bc52be9adb8ee7e551843bf00eee2`.

Locked behavior: engine-first; choreography owns no rules state; cause before consequence; destructive identity before collapse; score after visible cause; same language for opponent actions; reduced-motion equivalents; external Auto-Bot gate; post-action snapshot only after synchronous 10.3 reconciliation.

Coverage: Scorch, Muster, Spy, Horn, Weather/Clear, Medic, Decoy, Bond, Morale, Leader, Hero, draw/discard, Pass, rounds, match result, Monster retention, Skellige resurrection, Northern Realms draw. Adversarial QA covers tied Scorch, 8+ Muster, Spy 10→11, Horn+Bond, all-weather Clear, Medic→Muster, Decoy-on-Spy, Round 2→3 retention + two Skellige returns.

## Pass 10.4C — Feel / Presentation Polish

**Status:** **COMPLETE / MERGED / GREEN / DEPLOYED TO PRODUCTION.**

Branch: `pass-10-4c-feel-presentation-polish`  
PR: #8  
Green implementation head: `ee600e8b856b9743ad4a58501b7a84b11f40dbb2`  
Final PR/docs head: `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`  
Merge/runtime SHA: `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`  
Final PR CI: run #136 / `34620304920` — **success**  
Production CI + Pages: run #137 / `34621157464` — verify **success**, deploy **success**

### Implemented

- 10.4C motion/easing/physical-feel vocabulary in `motion-tokens.js`.
- `feel-polish.css`: tactile press, lifted selection, cleaner legal/active target treatment, reduced-motion equivalent; no geometry ownership.
- `presentation-feedback.js`: presentation-only semantic feedback hooks for selection, valid destination, row-specific commit, draws, Spy, Horn, Bond, Muster, Medic, Decoy, Scorch, Weather/Clear, Pass, turns, round result, and game result.
- Persisted effects volume + mute.
- Optional web haptics are capability-detected, opt-in, and off by default.
- Final audio assets remain decoupled from rules; 10.4C provides semantic hooks rather than binding media to game logic.
- Explicit 10.4C load/PWA/deploy graph.
- Lower-layer 10.4B code no longer overwrites visible current-pass milestone/build identity; static regression guard locks ownership.
- Presentation-only normalization removes development-era `ENGINE RESOLVED` / `ENGINE CHOICE` language from ordinary player-facing feedback while preserving semantic logs/developer tooling/engine behavior.
- Browser QA rejects engine jargon in ordinary landing and Medic presentation.

### Manual visual approval

Artifact `10270749326` was manually inspected at the canonical 852×393 target and approved before merge.

Verified:

- physical selection lift/weight without the old debug `SELECTED` pill;
- clear structural/gold active-target feedback;
- ordinary landing centered and clean, with player-facing `REDANIAN FOOT SOLDIER` rather than engine jargon;
- invalid drag returns cleanly with no persistent transient;
- reduced motion preserves legal-destination clarity;
- feedback settings integrate into the normal scrollable Settings surface;
- Medic signature presents `REVIVE`; nested Medic→Muster uses `MEDIC · UNIT REVIVED` and correct card-scale geometry;
- representative Scorch, Muster, Spy, Horn, Weather/Clear, Decoy, Leader, round-resolution, reduced-motion, interruption, Monster-retention, and Skellige-return frames show no visual regression.

Measured evidence from the approved candidate: pointer press ~25.7 ms; invalid return ~237.7 ms. These values are evidence only and are not used to justify skipping visual/accessibility review.

### 10.4C handoff

Pass 10.4C is closed. Do not reopen it unless current production evidence exposes a genuine regression. The interaction/presentation stack is now:

- 10.3 — final geometry authority;
- 10.4A — canonical direct manipulation/action path;
- 10.4B — engine-first mechanic/lifecycle choreography;
- 10.4C — tactile feel, feedback, reduced-motion polish, semantic audio/haptic hooks, copy cleanup, and presentation consistency.

The next implementation work belongs in **Pass 11 — Golden Match / Complete Normal Match**.

---

# 6. Current product status / broader debt

Production now has hosted PWA infrastructure, deterministic classic engine, 216-card catalog, frozen 10.3 geometry, 10.4A direct manipulation, iPhone/WebKit coverage, 10.4B choreography, adversarial QA, 10.4C feel/feedback/accessibility polish, and CI-protected Pages deployment.

Broader work after 10.4C includes Pass 11 Golden Match, unrestricted legal deck builder, polished faction/leader selection, complete unrestricted mulligan/effect choices, final AI ladder through Grandmaster, mature save/resume/replay, modular assists/cheats/sandbox, full victory/rematch shell, local permitted-art ownership/caching, and final offline/install/native-quality polish.

---

# 7. Forward roadmap

`FUTURE_CONTINUITY.md` remains forward authority.

**Next implementation milestone: Pass 11 — Golden Match / Complete Normal Match.**

Pass 11 must validate one complete normal match with legal deck initialization, opening draw/mulligan, direct manipulation hand, all required choice dialogs, player/opponent turns, passing/exhaustion, scoring, rounds, factions/lives, best-of-three result, restart/rematch, and save integrity without developer shortcuts.

Do not invent later pass numbers unless explicitly assigned.

---

# 8. Archive context

GitHub is canonical for active development.

Reference Drive folder: `Gwent Classic - Arunsundaram` — `1dZWKlRFWTcOu3iYwXAdPx-mbz4dj-jlr`  
Legacy product root: `Gwent Definitive - blakemgray` — `1dDtOJP3wYTVfQiXP3bYUjdcH1bkx96yu`

---

# 9. Current handoff

**Pass 10.4C is complete, merged, fully verified, visually approved, and deployed.**

Production evidence:

- final PR head: `e6a357606c6d0e978ceabf93e2f456377b3f6ac2`;
- merge/runtime SHA: `c25ad6e4d2bf7b5f544a0612e5e770c25d7ce22d`;
- final PR run: #136 / `34620304920` — success;
- production run: #137 / `34621157464` — verify success, Pages deploy success;
- visually approved QA artifact: `10270749326`.

No known runtime, rules, geometry, interaction, WebKit, choreography, reduced-motion, semantic-feedback, copy, or visual blocker remains for 10.4C.

**Exact next action:** begin **Pass 11 — Golden Match / Complete Normal Match** when explicitly triggered. At the start of that task, update this file in GitHub first, then build from current green `main` while preserving 10.3/10.4A/10.4B/10.4C authority boundaries.
