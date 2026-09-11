# Gwent Classic — Definitive Edition
## ChatGPT Work / Codex Model Routing Protocol

**Purpose:** make model/effort selection explicit, economical, and transparent during repository work. This file governs **which model/effort to recommend for a task**; it does not override `CONTINUITY.md`, `FUTURE_CONTINUITY.md`, current user instruction, repository state, or CI evidence.

**Account constraint:** current ChatGPT plan is Plus. GPT-6 Astra allowance is scarce enough that Astra Max can consume most or all practical allowance in a single pass. Treat Astra as a specialist resource, not the default workhorse.

**Last updated:** 2026-09-11

---

# 1. Core rule

Use the **least-expensive model/effort that can reliably complete the current phase to the required standard**.

Do not equate “best available model” with “best model for this step.”

Default recommendation for substantial implementation work:

> **GPT-5.6 Sol · High**

Preferred escalation for genuinely difficult reasoning checkpoints:

> **GPT-6 Astra · Medium**

Exceptional escalation only:

> **GPT-6 Astra · Max / highest available effort**

Astra Max is not a normal pass setting. Recommend it only for a narrow problem where the expected capability gain is likely to materially change the result and the task has already been scoped tightly enough to avoid wasting the allowance.

If model names, available effort levels, or plan behavior change, preserve the underlying policy rather than blindly following stale labels: use the strongest sustainable workhorse by default and reserve the scarce frontier model for difficult high-leverage checkpoints.

---

# 2. Mandatory transparency before every substantial phase

Before beginning a substantial phase, report all of the following:

- **Current phase/task**
- **Completion percentage** for the current pass/task
- **Recommended model + effort**
- **Why that level is justified**
- **Escalation trigger** — what evidence/problem would justify a stronger model
- **De-escalation/return trigger** — when to return to the workhorse model
- **Exact Next action**

Example:

```text
Current phase: Pass 11 — functional Golden Match audit
Completion: 14%
Recommended model: GPT-5.6 Sol · High
Why: repository reconstruction, path tracing, and deterministic gap analysis are well within Sol's capability; Astra spend is not justified.
Escalation trigger: unresolved cross-system architecture conflict involving persistent card actors, live geometry, save state, and input intent.
Return trigger: once the architecture contract is locked, implementation returns to Sol High.
Next action: trace Instant Match initialization through deck creation, opening hand, mulligan, and first-turn state.
```

---

# 3. Astra is recommendation-only unless the user has already selected it

Do not silently consume scarce Astra usage.

When a phase would materially benefit from Astra:

1. explain why;
2. recommend the specific effort level;
3. stop at a clean checkpoint before the Astra-dependent work if the current model is different;
4. allow the user to switch models/effort;
5. continue only after the model context is appropriate or the user explicitly directs continuation without escalation.

Do not recommend Astra merely because:

- the task is long;
- a new pass has started;
- the work involves code;
- visual QA is involved;
- Astra is newer;
- the user asked for “maximum quality” in a generic sense.

Escalation must be tied to a concrete reasoning need.

---

# 4. Default routing by task type

## GPT-5.6 Sol · High — default workhorse

Use for most of the project:

- continuity updates and roadmap maintenance;
- repository reconstruction;
- codebase parsing;
- ordinary architecture within established boundaries;
- implementation of already-decided designs;
- deterministic engine work;
- test construction;
- Playwright/browser QA construction;
- CI debugging where the failure is reasonably localized;
- documentation;
- PR preparation;
- workflow/log inspection;
- routine visual artifact review;
- TinyFish/browser verification of known flows;
- final fixes after a higher-model review has identified issues.

## GPT-6 Astra · Medium — high-leverage reasoning checkpoint

Recommend when there is a real multi-system or ambiguous problem such as:

- designing persistent presentation actors while preserving engine-first authority, interruption safety, save integrity, and frozen final geometry;
- designing the forgiveness/throw-intent model across velocity, target ambiguity, live geometry, and tap/drag parity;
- diagnosing a defect spanning engine state, presentation queue, DOM geometry, browser lifecycle, and device-specific behavior where Sol has not converged;
- adversarial architecture review before locking a major new subsystem;
- final integration review of a complex pass where subtle cross-boundary failures are plausible;
- difficult reasoning about what belongs inside the current pass versus moving right without compromising the product milestone.

Astra Medium should normally return the task to Sol High once the difficult contract/diagnosis is resolved.

## GPT-6 Astra · Max / highest available effort — exceptional specialist

Recommend only when all are true:

- the problem is narrow and explicitly scoped;
- Sol High and/or Astra Medium have left a materially important unresolved issue, or the risk/reward of a one-shot top-tier review is unusually high;
- the result could materially alter architecture, correctness, or release confidence;
- the expected benefit justifies consuming a large share of the user's limited Plus allowance.

Good examples:

- a stubborn nondeterministic cross-system bug that survives strong instrumentation and lower-model analysis;
- a final adversarial review of a high-risk architecture immediately before it becomes expensive to reverse;
- a compact but exceptionally difficult state-machine/concurrency/lifecycle problem.

Bad examples:

- whole-pass implementation;
- routine coding;
- documentation cleanup;
- ordinary UI polish;
- running tests;
- summarizing CI;
- generic “make it better” review.

---

# 5. Suggested Pass 11 model routing

These are internal phases, **not new numbered passes**.

### 11.0 — Reconstruction + revised contract
**Default:** Sol High  
Read continuity, current source, current normal-match path, live-play findings, and establish exact Pass 11 acceptance criteria.

### 11.1 — Golden Match functional audit
**Default:** Sol High  
Trace legal setup through match result/rematch/save integrity and identify concrete gaps.

### 11.2 — Physical-card / targeting architecture
**Start:** Sol High  
**Escalate to Astra Medium if needed** for the persistent-actor + live-geometry + forgiveness/ambiguity + lifecycle contract.

### 11.3 — Core implementation
**Default:** Sol High  
Implement the locked design in controlled increments with regression coverage.

### 11.4 — Interaction telemetry / trajectory / temporal QA
**Default:** Sol High  
Build flight-recorder instrumentation, trajectory matrices, temporal visual artifacts, and assertions.

### 11.5 — Audio / haptic / PWA diagnosis
**Default:** Sol High  
Use Astra Medium only if platform lifecycle behavior or architecture remains genuinely tangled after evidence gathering.

### 11.6 — Adversarial integration review
**Preferred checkpoint:** Astra Medium  
Review cross-system correctness, acceptance criteria, visual/temporal evidence, and hidden failure modes. Return fixes to Sol High.

### 11.7 — Fixes + final CI
**Default:** Sol High

### 11.8 — Final pre-merge audit
**Preferred:** Sol High or Astra Medium depending on remaining risk.  
**Astra Max:** only if a narrow unresolved high-risk issue remains and the user approves the spend.

---

# 6. Work-mode operating rules

When using ChatGPT Work:

- repository state is authoritative; do not rely on chat recollection when repository continuity exists;
- read `CONTINUITY.md` → `FUTURE_CONTINUITY.md` → this file before substantial implementation;
- update the actual `CONTINUITY.md` at the beginning of each new implementation/resumed cycle before further work;
- GitHub is source/code/CI authority;
- connected live-browser tooling such as TinyFish/Work browser may be used for player-facing QA;
- do not weaken CI/QA to make a candidate green;
- inspect visual/temporal QA evidence for the latest exact candidate head before merge;
- merge only the latest exact fully-green PR head;
- after merge, verify `main` and deployment, then close continuity with final SHAs/evidence;
- every progress report contains completion percentage and ends with an exact **Next action**.

---

# 7. Cost-awareness principle

The project should optimize for **quality per scarce high-end-model minute**, not prestige of the selected model.

Astra is most valuable when it is given:

- a clean repository state;
- a narrow difficult question;
- strong evidence/telemetry;
- explicit invariants;
- a decision that will materially affect downstream implementation.

Do not spend Astra allowance on discovery work that Sol High can perform first.

---

# 8. Current handoff

For the upcoming Pass 11 transition:

- **Default Work configuration:** GPT-5.6 Sol · High.
- **Expected first Astra checkpoint:** only if 11.2 physical-card/targeting architecture presents a genuine cross-system design problem; otherwise remain on Sol High.
- **Expected deliberate Astra review:** 11.6 adversarial integration review, preferably Astra Medium.
- **Astra Max:** no planned standing use.

**Exact next action:** after the documentation transition checkpoint is merged and verified, begin the next Pass 11 work cycle on Sol High, update `CONTINUITY.md` first, then reconstruct the current Golden Match path and lock the implementation/acceptance contract before gameplay changes.