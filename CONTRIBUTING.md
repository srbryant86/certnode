# Contribution Guidelines

Task taxonomy and commit subjects
- Use prefixed labels with IDs for traceability. See `docs/TASK_TAXONOMY.md`.
- Format commit subjects as `type(labelNN): summary`.
  - Examples:
    - `feat(a24): SDK publishing prep`
    - `docs(d07): update audit checklist`
    - `ci(c12): add release workflow`
    - `test(t22): add JWKS rotation tests`

Auto-push Git hook (optional)
- Purpose: Push every commit automatically to your current branch’s remote.
- Local only: hooks are not versioned; each developer opts in.

Option A — Use core.hooksPath (recommended)
- Copy the provided hook into a tracked path and point Git at it:
  1) `git config core.hooksPath scripts/git-hooks`
  2) Ensure `scripts/git-hooks/post-commit` is executable on macOS/Linux: `chmod +x scripts/git-hooks/post-commit`
  3) Commits will auto-push to `origin <branch>` unless overridden by env vars below

Option B — Manual local hook
- Copy the script to `.git/hooks/post-commit` in your clone and make it executable on macOS/Linux.

Environment controls
- `GIT_AUTOPUSH=0` disables auto-push for that commit/process
- `GIT_REMOTE=<name>` pushes to a different remote (default: `origin`)

Notes
- If a push fails, the hook prints a message and continues (your commit is still created).
- Hooks run locally; CI/CD should not rely on them.

Pre-push docs gate (recommended)
- Purpose: Prevent pushes of code changes without accompanying documentation updates so state stays traceable if context drops.
- Enable via core.hooksPath (same as above):
  1) git config core.hooksPath scripts/git-hooks
  2) Ensure scripts/git-hooks/pre-push is executable on macOS/Linux: chmod +x scripts/git-hooks/pre-push
- Behavior:
  - Inspects commits being pushed; if code files changed but neither AGENTS.md nor docs/internal/ACTUAL_ROADMAP.md were touched, the push is blocked with guidance.
  - Suggests running npm run docs:update and committing results.
  - Does not run in CI; local-only guard.
