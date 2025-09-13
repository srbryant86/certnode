# Task Taxonomy and Labels

Use short, prefixed labels to categorize work. Combine with incremental IDs (NN) and keep commit subjects consistent.

## Labels

- aNN — Application (API/server, core features)
  - Examples: `feat(a24): SDK publishing`, `fix(a28): metrics sum overflow`
- iNN — Infra (Terraform, AWS, pipelines, containerization)
  - Examples: `chore(i03): add Dockerfile`, `ci(i04): GHCR publish on tag`
- wNN — Website (web UI/verify page, viewer)
  - Examples: `feat(w10): verify UI drag-drop`, `style(w11): theme toggle`
- dNN — Docs (roadmaps, checklists, policies)
  - Examples: `docs(d05): SECURITY and RUNBOOK`, `docs(d06): audit checklist refresh`
- sNN — SDKs (Node/Web SDKs, types, packaging)
  - Examples: `feat(s12): export JWKSManager`, `docs(s13): README caching example`
- tNN — Tools/Tests (CLIs, test runners, benchmarks, scripts)
  - Examples: `feat(t20): jwks-integrity-check`, `test(t21): rotation overlap`
- cNN — CI/CD (workflows, release automation)
  - Examples: `ci(c30): add nightly benchmark`, `ci(c31): openapi check`
- mNN — Monitoring (metrics, dashboards, alerts)
  - Examples: `feat(m02): /metrics endpoint`, `docs(m03): MONITORING guide`
- rNN — Rotation/Keys (JWKS, key rotation tooling)
  - Examples: `feat(r01): rotate validation`, `docs(r02): S3+CloudFront guidance`
- eNN — Examples/Demos (sample apps/snippets)
  - Examples: `feat(e01): node sign example`, `feat(e02): web embed`
- gNN — Governance/Security (CODEOWNERS, security contact, policy)
  - Examples: `chore(g01): CODEOWNERS`, `docs(g02): SECURITY contact`

Notes:
- Use the most specific label; cross-cutting work may include secondary labels in the body.
- For application-layer roadmap continuity, continue `aNN` for core backend features.
- Keep commit subjects as `type(labelNN): summary` for traceability.

