# `@meteorwallet/sdk` release gates

The live list of what must be true before a release is treated as a canonical consumer example.
Items are ticked as they land; everything already delivered lives in the archived plans under
[`docs/finished_updates/meteor_connect/`](docs/finished_updates/meteor_connect/).

This file exists because those plans did not distinguish the two. They still carried unchecked boxes
for work that shipped in `3.2.0`, so a consumer reading them could not tell which requirements were
real (REVIEW-consumer-implementation M-07).

**Source of truth for the current gates:** `../meteor-connect-bridge/PLAN-new-key-transfer.md` §13.
The review those gates came from was remediated and retired to
`../meteor-connect-bridge/docs/finished_updates/account-transfer/REVIEW-consumer-implementation.md`;
read it for the reasoning behind a fix, not for what is left to do.

## Automated, and green

These run in the package and fail the build:

| Gate | Command |
| --- | --- |
| Transfer-key confinement | `bun run check-key-confinement` |
| No `/internal` or deprecated-lifecycle use in published code | `bun run check-public-surface` |
| Published bundle within its size budget | `bun run check-bundle-size` |
| The **tarball** loads, type-checks and bundles in a clean consumer | `bun run check-package-consumable` |
| Unit tests | `bun run test` |
| Types | `bun run type-check` |

`check-package-consumable` is the one that matters most before a release: it packs, installs into an
empty project from the real registry, audits every module specifier in every shipped artifact, loads
both `require()` and `import()`, type-checks against the shipped `.d.ts`, and bundles with Vite and
stock Parcel. A green `bun run build` is not evidence of any of that — `3.2.0` built cleanly while
both entry points threw `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Outstanding

- [x] **Coordinated release order.** Done 2026-08-24. `@meteorwallet/connect-shared` and
      `@meteorwallet/connect` `0.14.0` carry the promoted public exports and the `internal/`
      legacy-resolution shim; this package's pins moved to them and released as `3.3.0`.
      `check-package-consumable` is green with **no `--local`**.
- [x] **Downstream patch removal.** Done 2026-08-24. `my-near-wallet` pins `3.3.0` and
      `patches/@meteorwallet+sdk+3.2.0.patch` is deleted; the `near-api-js` alias and both
      `@noble/hashes` subpaths it rewrote are absent from the published build. (MNW still patches
      *nanoid's own* `sideEffects` field inside this package's tree — a third-party bundler
      workaround it already applies to its top-level copy, not a rewrite of anything we generate.)
- [ ] **Released-artifact end-to-end matrix.** `../meteor-connect-bridge/PLAN-new-key-transfer.md`
      §13 — real backend, real devices, every crash cut, recorded with browser/device/backend
      versions. Nothing in this repository can stand in for it, and informal interaction testing is
      not a substitute.
- [ ] **Reference sample vs. lab.** `packages/meteor-sdk-v1-test-web` is a deliberately destructive
      engineering lab. The minimal consumer example lives in
      [`examples/minimal-consumer/`](examples/minimal-consumer/); keep the README's claims about
      which is which accurate as both change.
