# Git Commands Guide

Common git operations for working on this repo. This is a reference, not a deployment guide — it stops at "your change is committed/pushed," not at "your change is live."

## Getting started

```bash
git clone <repo-url>
cd mern-ecommerce
git checkout -b feat/your-feature-name
```

Branch naming used in this repo's history: `feat/...`, `fix/...`, `chore/...`, `refactor/...` — matching the [commit message convention](./COMMIT_MESSAGES.md).

## Everyday workflow

```bash
git status                      # what's changed
git diff                        # unstaged changes
git diff --staged               # staged changes, about to be committed

git add backend/src/foo.ts      # stage specific file(s)
git add -p                      # stage interactively, hunk by hunk (good for splitting unrelated changes)

git commit -m "fix: correct CSRF cookie domain handling"
```

`pre-commit` runs `lint-staged` automatically in both `backend/` and `frontend/` (see `.husky/pre-commit` in each) — it lints and formats whatever you've staged before the commit completes. If it fails, fix the reported issues and re-stage before committing again.

## Keeping your branch up to date

```bash
git fetch origin
git rebase origin/main           # replay your commits on top of latest main
# resolve conflicts if any, then:
git add <resolved-files>
git rebase --continue
```

Prefer `rebase` over `merge` for keeping a feature branch current — it keeps history linear and makes the eventual PR diff easier to review. Use `merge` only for actually combining finished branches.

## Pushing and PRs

```bash
git push -u origin feat/your-feature-name     # first push, sets upstream
git push                                       # subsequent pushes
```

Open a PR against `main` from your platform's UI (GitHub, etc.). CI runs via `.github/workflows/` on push/PR — check it's green before requesting review.

If you rebased after already pushing:

```bash
git push --force-with-lease
```

`--force-with-lease` (not plain `--force`) refuses to overwrite remote work you haven't seen yet — always prefer it when force-pushing a branch others might also be working on.

## Undoing things

| I want to... | Command |
|---|---|
| Discard uncommitted changes to a file | `git checkout -- <file>` (or `git restore <file>` on newer git) |
| Unstage a file (keep the edits) | `git restore --staged <file>` |
| Amend the last commit (message and/or contents) | `git add <file>; git commit --amend` |
| Undo the last commit, keep changes staged | `git reset --soft HEAD~1` |
| Undo the last commit, discard its changes entirely | `git reset --hard HEAD~1` (careful — destructive) |
| Revert a commit that's already pushed/shared | `git revert <commit-hash>` (safe — adds a new commit undoing it, doesn't rewrite history) |

## Inspecting history

```bash
git log --oneline -20                 # recent commits, one line each
git log --oneline --graph --all       # visualize branches
git log -- backend/src/app.ts         # history of one file
git blame backend/src/config/env.ts   # who changed each line, and when
git show <commit-hash>                # full diff of one commit
```

## Stashing (temporarily shelving work)

```bash
git stash                 # shelve uncommitted changes
git stash list             # see shelved stashes
git stash pop               # reapply the most recent stash and drop it
git stash apply              # reapply without dropping (if you might need it again)
```

## Two-package repo note

`backend/` and `frontend/` are separate npm packages in one git repo (not a workspace) — there's no root `package.json`. A single commit/PR can and often should touch both, e.g. adding an endpoint and the frontend call for it together, since git tracks the whole repo regardless of the package boundary.
