# Commit Message Guide

This repo's history mostly follows [Conventional Commits](https://www.conventionalcommits.org/). It isn't currently enforced by tooling (no `commitlint` hook — `pre-commit` only runs `lint-staged` for code formatting), so treat this as the house style to match, not a hard gate.

## Format

```
<type>: <short summary, imperative mood, no trailing period>

[optional body — the "why", not a restatement of the diff]
```

## Types actually used in this repo's history

| Type | Use for |
|---|---|
| `feat` | A new user-facing capability or endpoint |
| `fix` | A bug fix |
| `refactor` | Restructuring code without changing behavior |
| `chore` | Tooling, config, dependency bumps — nothing that changes app behavior |

(Conventional Commits also defines `docs`, `test`, `style`, `perf`, `ci`, `build` — reasonable to use if the type actually fits, even though they haven't appeared in this repo's history yet.)

## Examples from this repo's own log

```
feat: add auth, cart, order, wishlist, review, category modules
fix: remove stray backend app.ts/server.ts from frontend/src
fix: rename ResetPAsswordPage to ResetPasswordPage
refactor: update product module and shared config/types
chore: update tooling config and dependencies
```

## Guidelines

- **Imperative mood:** "add", "fix", "remove" — not "added", "fixes", "removes". Test: the summary should complete "If applied, this commit will ___."
- **One logical change per commit.** A commit that touches both `backend/` and `frontend/` is fine if it's one coherent change (e.g. add an endpoint + the frontend call for it); it's not fine if it's two unrelated fixes bundled together — split those with `git add -p`.
- **Summary line ≈50 chars, hard-wrap body at ~72** if you add one. Most changes here don't need a body — the diff speaks for itself. Add one when the *why* isn't obvious from the diff (a workaround for a library bug, a deliberate tradeoff, a non-obvious root cause).
- **Scope is optional** (`fix(auth): ...`) — this repo hasn't used scopes so far; add one only if it meaningfully disambiguates.
- **Reference the root cause, not just the symptom**, when a fix isn't self-explanatory — e.g. prefer `fix: make CSRF/refresh cookies host-only so they round-trip under 127.0.0.1` over `fix: csrf bug`.

## What NOT to do

- Don't write vague summaries: `fix: bug`, `update stuff`, `wip`. If it's genuinely a work-in-progress commit on a personal branch, that's fine locally — clean it up (`git rebase -i`, squash) before it lands on `main` via PR.
- Don't restate the filename in the summary when the diff already shows it: `fix: update auth.controller.ts` says nothing `fix: <what actually changed and why>` wouldn't say better.
- Don't bundle a dependency bump with a feature change — split them so a revert of one doesn't have to take the other with it.
