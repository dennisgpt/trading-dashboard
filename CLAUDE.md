# CLAUDE.md

Guidance for Claude when working in this repository.

## Project
Desktop trading dashboard (working title "Trading Dashboard", final name TBD).
A modular dashboard made of dockable panels: watchlist, charts, TradingView widget, paper trading, later indicators, alerts and news.
Hobby project, run like a professional project. Primary platform Windows, must stay macOS-compatible.
Full requirements: `docs/anforderungen.md`. Architecture decisions: `docs/adr/`.
**Current status and next steps: `docs/STATUS.md` – read it at the start of every task and update it when a task is done.**

## Workflow
Planning happens in a separate Claude chat; Dennis pastes task prompts here. For each task:
1. Read `docs/STATUS.md` and the relevant docs.
2. Create a branch, implement, run the checks from "Commands".
3. Update `docs/STATUS.md` (and `docs/anforderungen.md` / ADRs if a decision changed).
4. Commit, push, open a PR that references the issue. Report back with a short summary of what changed and anything that needs Dennis' decision.

## Stack
- Tauri 2 (Rust backend in `src-tauri/`)
- React 19 + TypeScript + Vite (frontend in `src/`)
- Tailwind CSS v4 + shadcn/ui (theme in `src/app/globals.css`, components via `npx shadcn@latest add <name>`), Zustand, Inter
- Planned: dockview (panel layout), lightweight-charts, TanStack Query, SQLite via tauri-plugin-sql, window-vibrancy (glass effect)

## Commands
- `npm install` – install dependencies
- `npm run tauri dev` – run the desktop app in dev mode
- `npm run typecheck` – TypeScript check
- `npm run test` – unit tests (Vitest), `npm run test:watch` while developing
- `npm run build` – build frontend
- `npm run tauri build` – build installer
- In `src-tauri/`: `cargo fmt`, `cargo clippy -- -D warnings`

## Git & GitHub rules (strict)
- **Never add Claude as co-author** (also enforced in `.claude/settings.json`). No `Co-Authored-By: Claude ...` trailer, no "Generated with Claude Code" line, no Claude attribution in commits, PR titles or PR descriptions.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:` (scope optional, e.g. `feat(watchlist): ...`).
- Never commit directly to `main`. Work on branches `feat/...`, `fix/...`, `docs/...`, `chore/...`, `ci/...`, `refactor/...`, `test/...` and merge via pull request.
- Every PR references its issue (`Closes #12`) and must pass CI.
- `main` is protected by a GitHub ruleset: PR required, status check "Typecheck, build & lint" must pass, no force push (repo admin may bypass in emergencies).

### Pushing
- Push only with `node scripts/push-branch.mjs [branch]` (defaults to the current branch). It allows the branch prefixes above, rejects `main`, any flags (no force push) and never deletes remote branches.
- Raw `git push` is blocked for Claude in both shells: in Bash by the Sixth Sense plugin hook (`block-dangerous-git.js`, not configurable), in Bash and PowerShell by the project hook `.claude/hooks/guard-git-push.mjs` (registered in `.claude/settings.json`). Do not edit the plugin; change the rules in the project files instead.
- Remote branch deletion, force pushes and pushes to `main` stay with Dennis.

## Code conventions
- Code, identifiers, comments and commit messages in English. UI text in German.
- Visual design ("Graphite Glass": tokens, panels, badges, light/dark): `docs/design.md`. In light mode never use the light accent `#A8CFFF` as text, use `accentFg`.
- TypeScript strict mode, no `any` without a comment explaining why.
- Function components + hooks. One panel per folder under `src/panels/`.
- Folder structure and dependency rules: `docs/adr/0002-architektur.md`. `src/core/` stays free of React and Tauri imports. Import via the `@/` alias (`@/core/market/...`).
- Market data runs in TypeScript; Rust only handles OS tasks (keychain, SQLite, window effects, notifications).
- Market data access only through provider adapters (one interface, one adapter per source: Binance, Finnhub, Twelve Data ...). UI never calls an API directly. Interface and registry: `docs/adr/0003-provider-interface.md`.
- Logic in `src/core/` gets Vitest tests next to the code (`*.test.ts`).
- Every price shown carries its data mode: `live` or `delayed`.
- Data model: `docs/datenmodell.md`. Timestamps are Unix ms (UTC); paper account money is integer minor units (`MinorUnits`, `src/lib/money.ts`), prices and quantities are plain numbers.

## Security
- Never commit API keys, tokens or `.env` files. No keys shipped with the app.
- Users enter their own API keys in the settings; keys are stored in the OS keychain (Windows Credential Manager / macOS Keychain), never in plain files or localStorage.
- Keep Tauri capabilities minimal: only grant permissions a feature actually needs.

## Trading
- Paper trading only for now (own simulated engine). Real order execution is out of scope until explicitly decided.
