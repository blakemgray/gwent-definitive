# Gwent Classic — Definitive Edition

Canonical JS-first hosted build.

## Pass 10.2 — Production Hardening

This pass converts the hosted prototype into a reliable development baseline: normalized source files, CI-gated deployment, PWA cache validation, deterministic card-art resolution, versioned local match persistence, developer-mode gating, and the frozen six-row battlefield geometry contract.

### Local checks

```bash
npm test
python -m http.server 4173
GWENT_TEST_URL=http://127.0.0.1:4173 python tests/ui_smoke.py
```

Production deployment occurs only after verification succeeds on `main`.
