# Pass 10.3 — Battlefield UX / Information Architecture Contract

## Purpose

Design the in-match interface around how a complete classic Witcher 3 Gwent match is perceived and played on an iPhone landscape viewport. This pass is not a decorative reskin. It changes the spatial model so later full-deck gameplay does not inherit prototype interface debt.

## Decision hierarchy

The player must be able to perceive, in order of decision importance:

1. Whose turn it is / whether a choice is pending.
2. Total score comparison.
3. Score contribution of each combat row.
4. Identity, power state, and tactical role of cards in play.
5. The player's hand and remaining options.
6. Weather and row-special effects.
7. Round and life state.
8. Leader availability / expenditure.
9. Deck, graveyard, and hand counts.
10. Developer-only information.

No lower-priority datum may consume space that meaningfully harms a higher-priority one.

## Spatial model

### Row territory

A combat row retains a full deterministic interaction region. There are always exactly six combat rows in canonical order:

- Opponent Siege
- Opponent Ranged
- Opponent Close
- Player Close
- Player Ranged
- Player Siege

The weather summary remains between the two three-row groups.

### Visual card rail

The visible card-placement rail is narrower than the row territory. At the canonical 852×393 viewport the battlefield is capped at 640 px and each unit rail at 460 px. This prevents empty rows from reading as giant unfillable trenches while keeping adequate density for realistic and stress-case Gwent states.

### Card compositor

Board and hand cards are not positioned using fixed left alignment or fixed negative margins. A deterministic compositor measures the real rail and card height after render, calculates the pack width, and centers the result.

Rules:

- 1 card is perfectly centered.
- Sparse packs keep natural spacing.
- Compression begins only when natural width exceeds the rail.
- Compression has a minimum exposed face width.
- First and last cards must remain inside the rail.
- Pack center must remain within 1.5 px of rail center.
- Board and hand use separate density rules.

## Persistent state cues

Turn state is always visible in the center of the match header. Passing is persistent, not a transient toast. Both combatants display total score and life state. Opponent hand/deck counts remain visible without revealing hidden card identities.

## Row communication

Each row owns its label, special slot, centered card rail, row score, and card-count micro-indicator. Weather is summarized centrally but also visually reinforced on every affected row. This reduces the need to cognitively map detached status text back to its tactical consequence.

## Hand model

The hand is a protected centered rail independent of combat-row logic. Ten cards must fit without clipping at the canonical iPhone landscape viewport. Lower hand counts remain centered rather than sticking to either edge.

## Inspector model

Pass 10.3 reduces inspector width from the prior majority-of-screen treatment to no more than 43% of the canonical viewport, preserving battlefield context. Pass 10.4 will revisit selection, destination highlighting, card lift, and action choreography more deeply.

## Stress matrix

Every production candidate must be exercised at 852×393 through:

- empty battlefield;
- 1-card row;
- 2-card row;
- 4-card row;
- 8-card row;
- 12-card swarm row;
- all six combat rows occupied;
- all three weather effects active;
- opponent passed;
- 10-card hand;
- 3-card hand;
- card inspector open;
- save and restore.

The browser QA suite archives screenshots of these states. Automated geometry checks are necessary but not sufficient; visual inspection of the archived matrix is part of the release gate.

## Release blockers

- Any combat card clipped by its rail.
- Sparse card pack not centered.
- Hand pack not centered.
- Board wider than the V2 contract at canonical viewport.
- Any missing combat row or special slot.
- Pass state visible only as a toast.
- Inspector obscures more than 43% of canonical landscape width.
- Weather has no affected-row reinforcement.
- Production deployment bypasses browser QA.

## Boundary with Pass 10.4

Pass 10.3 owns information architecture, responsive zones, geometry, card packing, persistent state hierarchy, and context preservation. Pass 10.4 owns interaction feel and presentation choreography: selected-card lift, legal destination illumination, tap-to-place flow, play/draw/scorch/weather/round animations, tactile feedback, richer tabletop atmosphere, and final inspector behavior.
