## Summary

- What does this PR change and why?

## Type

- [ ] feat
- [ ] fix
- [ ] docs
- [ ] chore
- [ ] test
- [ ] ci
- [ ] refactor / perf / style

## Scope (taxonomy labels)

- Use the task taxonomy for scope in your commit subjects: `type(labelNN): summary`
- Labels: a (App), i (Infra), w (Website), d (Docs), s (SDKs), t (Tools/Tests), c (CI/CD), m (Monitoring), r (Rotation/Keys), e (Examples), g (Governance)
- Example: `feat(a34): error model consistency`

## Checklist

- [ ] Tests updated or added where appropriate
- [ ] Docs updated (README.md, AGENTS.md, docs/internal/*)
- [ ] Ran `npm run docs:update` and committed generated changes (TASKS/PROJECT_SUMMARY)
- [ ] Local docs gate passes (`node tools/check-docs-updated.js`)
- [ ] OpenAPI updated if API surface changed
- [ ] Benchmark passes locally (`node tools/benchmark.js`) and p99 < 100ms
- [ ] Monitoring/metrics updated if relevant
- [ ] Follows commit subject convention (`type(labelNN): summary`)

## Notes

- Link issues/tasks here
