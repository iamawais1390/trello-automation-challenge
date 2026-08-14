# Trello Automation Challenge

Functional and performance end-to-end tests for a Trello workflow — create a board, create a list, create a card, update it, and clean up — implemented with Playwright and JavaScript.

**Live Allure report:** https://iamawais1390.github.io/trello-automation-challenge/

## Setup

Requires Node 20.6+ (uses `process.loadEnvFile()`).

```bash
npm install
```

Create a `.env` file in the project root:

```
TRELLO_API_KEY=your-key
TRELLO_TOKEN=your-token
```

Get these from `https://trello.com/power-ups/admin` (API key) and by authorizing a token via `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=AutomationChallenge&key=YOUR_KEY`.

## Commands

```bash
npx playwright test                     # run the full suite
npx playwright test tests/boards.spec.js   # run one file
npx playwright test -g "creates a board"   # run by test name
npx playwright test --ui                # interactive UI mode
npx playwright show-report               # view the last HTML report

npm run lint                             # ESLint (core rules + eslint-plugin-playwright on tests/)
npm run typecheck                        # tsc --noEmit, enforcing the // @ts-check pragma used throughout
```

## Architecture

Each layer only talks to the one below it:

- **`tests/*.spec.js`** — orchestration and assertions only. No direct HTTP calls, no raw `expect()`.
- **`assertions/`** — a single `Assert` object (`assertions/assert.js`) wrapping Playwright's `expect()` for every check used in this suite (`assertIsOk`, `assertHasStatus`, `assertIsTruthy`, `assertAreEqual`, `assertAreNotEqual`, `assertContains`, `assertResponseTime`). Each method logs before/after via `src/logger.js` and, on failure, rethrows as `AssertionError` (`assertions/assertionError.js`) with the custom description on top and the original Playwright failure chained underneath via the native `Error` `cause` option.
- **`fixtures/`** — a Playwright `test.extend()` chain: `fixtures/login.js` (`apiAuth` fixture — verifies Trello auth, then hands back the authenticated `request` fixture) → `fixtures/test-data.js` (adds `boardName`, and `randomListName`/`randomCardName` factories for generating distinct random names per call).
- **`src/`** — thin per-resource API clients (`boards.js`, `lists.js`, `cards.js`), each wrapping `request.get/post/put/delete(...)` for one Trello resource, plus `auth-client.js` (auth header + login check) and `timing.js` (`withTiming()`, a response-time measurement wrapper).

### Auth

Trello has no session/login endpoint — a key + token pair is sent as an `Authorization: OAuth ...` header on every request. `src/auth-client.js`'s `authHeader()` is the single source of truth for that header, used by `playwright.config.js` (applied globally via `use.extraHTTPHeaders`) and anywhere a *different* auth context is needed (e.g. the invalid-auth negative test in `boards.spec.js`).

### Test coverage

- **Boards** — create (+ response-time SLA), missing name → `400`, invalid auth → `401`, delete, cascade delete (verifies deleting a board also removes its lists/cards), delete-already-deleted → `404`.
- **Lists** — create under a valid board (+ SLA, + verification via `GET /boards/{id}/lists`), missing name → `400`, invalid board id → `400`, archive (lists can't be hard-deleted via the API, only archived).
- **Cards** — create under a valid list (+ SLA, + verification), optional name defaults to `""`, missing/invalid `idList` → `400`, rename + description update (+ SLA, + re-fetch verification), move between lists, update non-existent card → `404`, partial update doesn't clobber untouched fields, delete.
- **Workflow** — one chained test mirroring the brief's described sequence: create board → create list → create card → update card → clean up, with a `try/finally` safety net so a failed assertion mid-chain still deletes the board.

## CI / CD

Three independent GitHub Actions workflows, each its own status check, run on every push/PR to `main` (plus manual `workflow_dispatch`):

- **Lint** (`.github/workflows/lint.yml`)
- **Typecheck** (`.github/workflows/typecheck.yml`)
- **Test** (`.github/workflows/test.yml`) — installs Playwright's Chromium browser, runs the suite, uploads the Playwright HTML report as a downloadable artifact. On pushes/dispatches against `main` only, it additionally generates the Allure report (via `simple-elf/allure-report-action`, a Docker-based action that bundles its own Java runtime) and publishes it to `allure-reports-branch`, which GitHub Pages serves.

Branch protection on `main` requires a pull request for every change (no direct pushes, including for the repo owner) and the branch to be up to date before merging.

### Allure report history

The Allure report action keeps up to the last 20 CI runs, each individually browsable (`/9/`, `/11/`, ...), plus a `history/` folder carried forward run-to-run so trend charts (pass/fail, duration) inside any report reflect *all* retained runs, not just the latest. The root URL always redirects to the most recent run.

## Assumptions & decisions

**Performance testing scope.** Clarified directly with the recruiter: implementation is expected to be Playwright/JavaScript only. Performance testing here means per-endpoint response-time SLA assertions (`Assert.assertResponseTime()`, 1500ms threshold, tuned against real observed latency of ~400–900ms) folded into the functional test for each write endpoint — not true load/throughput testing. An earlier draft fired concurrent requests at Trello's live production API to check latency under load; this was removed, since load-testing a third-party API we don't own and have no agreement to test isn't something to do casually, even at modest concurrency.

**Repository visibility.** The repo is public rather than private. GitHub branch protection (required to enforce "no direct pushes to `main`") needs either a public repo or a paid GitHub Pro plan — verified via the API before making the call. Reasonable trade-off for a take-home challenge a reviewer needs access to anyway; no sensitive data lives in the repo (credentials are local-only, via a gitignored `.env` / GitHub Actions secrets).

**Type checking (`jsconfig.json`).** Every file uses `// @ts-check` + JSDoc rather than TypeScript source. `checkJs` is deliberately `false` at the compiler-options level — with it `true`, `tsc` also checks third-party files pulled in transitively via module resolution (hit this concretely: `@types/node` references `punycode`, and the real npm `punycode` package installed as a transitive dependency produced ~15 unrelated errors from a file we don't own). Relying on the per-file pragma instead scopes checking to just this codebase's own files, which all already carry it.

**Git branching practice.** Every change in this repo's history went through a feature branch and a pull request — enforced by branch protection, not just convention. The Trello API suite itself (boards/lists/cards/workflow tests, fixtures, assertions layer) was developed iteratively in one continuous working session *before* the repository was initialized; branching discipline applies to every commit from the first one onward, but that initial batch of work wasn't itself split across multiple PRs.

## Known gaps

- The **Telenor E2E GUI Challenge** (also part of the original brief) is not implemented.
- Allure history is retained for the last 20 CI runs; there's no index page listing them — older runs are reachable at `/<run-number>/` if you know the number, or by checking `allure-reports-branch`'s file tree.
