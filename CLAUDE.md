# CLAUDE.md

Keep `CLAUDE.md` and `AGENTS.md` identical apart from their title.

## This repository is in production

`@meteorwallet/sdk` is published on npm and used by real DApps, and the NEAR Connect executor this
repo builds (`near-connect/meteor-near-connect.js`) is loaded by live sites. Compatibility here is
real:

- **The public surface is a contract.** Exports, the outputs and errors a DApp receives, and the
  account and connection records the SDK keeps in a user's browser must keep working for existing
  consumers and stored state — or change deliberately, in a major version, with a migration.
  `bun run check-public-surface` and `bun run check-package-consumable` guard part of this; the
  rest is on the change itself.
- **Users' sessions and keys are real.** An upgrade must never strand a signed-in account, a paired
  wallet or a function-call key.
- [`RELEASE-GATES.md`](RELEASE-GATES.md) is the live list of what must be true before a release.

## Release policy

**Never run a real release or deployment. The user runs it — always, no exceptions.** Three things in
this repo leave the machine for good:

- **`bun run release <version>`** — bumps, builds, publishes `@meteorwallet/sdk` to npm and
  git-tags. A version number can never be reused, even after `npm unpublish`.
- **A push to `release/meteor-near-connect`** — publishes the NEAR Connect executor that live DApps
  load (`.github/workflows/release-meteor-near-connect.yml` and
  `release-meteor-nera-connect-github.yml`).
- **A push to `release/sdk-demo-app` or `release/sdk-demo-app-dev`** — a Cloudflare Pages production
  deployment of the demo (`.github/workflows/release-sdk-demo-app.yml`).

This holds **even when releasing is the agreed goal of the task**, and even when the user approved a
plan that says "release x.y.z". Approving a plan, or picking an option that mentions a release, is
never approval to publish — the approval is the user running the command or the push themselves. Do
the preparation, then stop and hand back with what you verified and the exact command to run.

Safe to run unprompted (nothing leaves the machine):

- `bun run checks`, and `bun run test` / `bun run build` in `packages/meteor-sdk-v1`
- `bun run check-package-consumable` — packs the tarball and installs it into a temporary project;
  npm is only read.
- `bun run release:dry <version>` — but it only *prints* the build and publish steps; its `run()`
  skips execution under `--dry-run`. Run those steps separately to actually check them.

Never run `bun publish` / `npm publish` directly either.

The connect libraries (`@meteorwallet/connect`, `@meteorwallet/connect-shared`) come from the sibling
`../meteor-connect-bridge`, under the same policy — see its `AGENTS.md`. A change there reaches this
repo only after its release and a pin bump in `packages/meteor-sdk-v1/package.json`, and reaches
NEAR Connect DApps only once the executor is released from here.

## Commit messages

**The commit is always the person's**: agents never commit, amend or touch the git index. So
**every turn that finishes a substantial piece of work that should be committed ends with a commit
message, ready to paste, without being asked** — the end of a task or a stage, a fix the person
will deploy or test, a review's findings built. A small edit in the middle of a task needs none.

- **Covers exactly what is uncommitted:** check `git status` and `git log -1` first, so it neither
  repeats the last commit nor misses a file another agent changed in the same turn.
- **A conventional subject** — `feat:`, `fix:` or `chore:`, one line, saying what changed — then a
  short body by area: what was built or fixed and why, the tests that hold it, what is left open.
  Written for the repository's history, not the conversation: no "as you asked", no chat ids.
- **In one fenced block**, ending with the attribution line the session gives for commits.
- **One message per repository.** Work here often spans `../meteor-connect-bridge` or
  `../meteor-v2-apps`; when the same task left uncommitted changes in a sibling, give that repo its
  own message, labelled with the repo's name, under the same rules.

## Environment

- **OS**: use the host shown in the active environment context; do not assume a shell.
- **Package manager**: Bun — use `bun` and `bunx` instead of npm/npx/yarn for all TypeScript/JavaScript tasks.

## Monorepo commands

- **Packages**: `packages/meteor-sdk-v1` is the published `@meteorwallet/sdk`;
  `meteor-sdk-v1-test-web` is the demo and engineering lab; `meteor-near-connect` builds the NEAR
  Connect executor into `near-connect/meteor-near-connect.js`; `meteor-sdk-backend-test` is the
  demo's test backend.
- **Checks before handing back**: `bun run checks` (repo root) — types, transfer-key confinement and
  the SDK tests, as one CI-style panel.
- **Type-check all workspaces**: `bun run type-check-all` (repo root); a single workspace:
  `bun run type-check` (from its directory).
- **SDK tests**: `bun run test` (from `packages/meteor-sdk-v1`) — the key-confinement and
  public-surface checks, then `bun test`.
- **SDK build**: `bun run build` (from `packages/meteor-sdk-v1`) — fails when the published bundle is
  over its size budget.
- **Dev environment**: `bun run dev` (nice-commander; `commander.config.ts` lists the selections).

## Tests

- **Session-client doubles are built on `createSessionClientDoubleBase`**
  (`packages/meteor-sdk-v1/src/MeteorConnect/test/test_utils/sessionClientDouble.ts`). The real
  client publishes a verb's facts *before* the verb resolves; a double that only returns them moves
  every event to after the await, which has already hidden a real bug.

## Code Guide

### TypeScript

- Avoid `as` type-casting. Prefer actual inferred types. If inference fails, indicates different issue.
- For `null` or `undefined` conditional checks- always use `!=` when expecting to check against any of them (unless there is a reason to check exactly for one or the other). This ensure we catch both of these conditions (nullish), no matter what the return value might be.
- All "type" type definitions should start with a "T". E.g. "TNiceActionResult"
- All "interface" type definitions should start with an "I". E.g. "IUser"

### Errors

- Backend and transport failures are classified by type, through `describeSessionError` from
  `@meteorwallet/connect` — never by matching message text. The SDK's own flow endings are shared
  constants (`MOBILE_BRIDGE_ENDING`), so a thrower and its reader cannot drift apart.

## Doc guide (.md files for various uses)

Working docs such as `PLAN-x.md`, `REVIEW-x.md` and `FEEDBACK-x.md` live at the repo root **while
they are being worked on**, and only while. As elements of a doc are resolved, update its progress
in the doc itself.

Once a doc's work is complete, retire it to **`/docs/finished_updates/<area>/`** (for example
`meteor_connect/`) so the root only ever shows live work. Categorise by area, adding a sub-folder
when a new area needs one, and give the retired doc a short header saying it is a finished record,
not a to-do list.

- **Fix inbound links when you move a doc.** Search for the filename before and after the move.
- **Never retire a doc with unbuilt work still in it.** Move the unfinished work into the relevant
  live root plan first, and point the retired section at that plan.
