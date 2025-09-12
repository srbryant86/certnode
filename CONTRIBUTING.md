Contribution guidelines.

Auto‑push Git hook (optional)
- Purpose: Push every commit automatically to your current branch’s remote.
- Local only: hooks are not versioned; each developer opts in.

Option A — Use core.hooksPath (recommended)
- Copy the provided hook into a tracked path and point Git at it:
  1) `git config core.hooksPath scripts/git-hooks`
  2) Ensure `scripts/git-hooks/post-commit` is executable on macOS/Linux: `chmod +x scripts/git-hooks/post-commit`
  3) Commits will auto‑push to `origin <branch>` unless overridden by env vars below

Option B — Manual local hook
- Copy the script to `.git/hooks/post-commit` in your clone and make it executable on macOS/Linux.

Environment controls
- `GIT_AUTOPUSH=0` disables auto‑push for that commit/process
- `GIT_REMOTE=<name>` pushes to a different remote (default: `origin`)

Notes
- If a push fails, the hook prints a message and continues (your commit is still created).
- Hooks run locally; CI/CD should not rely on them.


