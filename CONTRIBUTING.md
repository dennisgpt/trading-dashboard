# Mitmachen

## Ablauf
1. Issue anlegen oder ein bestehendes nehmen
2. Branch von `main` erstellen: `feat/kurzer-name`, `fix/kurzer-name`, `docs/...`, `chore/...`
3. Commits nach [Conventional Commits](https://www.conventionalcommits.org/de/): `feat: ...`, `fix: ...`, `docs: ...`
4. Pull Request gegen `main` öffnen, Issue verlinken (`Closes #12`)
5. CI muss grün sein, dann mergen

## Vor dem PR
```bash
npm run typecheck
npm run build
cd src-tauri && cargo fmt && cargo clippy -- -D warnings
```

## Bugs melden
Über die Issue-Vorlage „Bug melden“. Bitte Windows-/macOS-Version und App-Version angeben.
