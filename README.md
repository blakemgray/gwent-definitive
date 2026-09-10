# Gwent Classic — Definitive Edition

Canonical JS-first hosted build.

## Pass 10.3 — Battlefield UX Architecture

Pass 10.3 intentionally revisits the in-match interface before Golden Match. It replaces the old full-width visual-row assumption with Battlefield Geometry Contract v2:

- functional row territory is separate from the visual card rail;
- every row pack is mathematically centered;
- first and last cards are protected from clipping;
- sparse rows remain centered while dense rows compress only when required;
- the ten-card hand uses an independent centered compositor;
- turn state, pass state, total score, row score, cards, hand, weather, leader state, and tertiary counts follow an explicit information hierarchy;
- weather is reinforced on affected rows instead of living only in a central strip;
- the card inspector is narrower so tactical board context remains visible;
- the six-row structural requirement remains non-negotiable.

### Battlefield QA matrix

CI drives the live app at 852×393 through sparse rows (1, 2, 4 cards), ordinary density (8), swarm density (12), all six rows populated, all-weather state, opponent-passed state, ten-card and three-card hands, inspector-open state, and save/restore. Screenshots are archived from every verification run for visual review.

### Local checks

```bash
npm test
python -m http.server 4173
GWENT_TEST_URL=http://127.0.0.1:4173 python tests/ui_smoke.py
```

Production deployment occurs only after verification succeeds on `main`.
