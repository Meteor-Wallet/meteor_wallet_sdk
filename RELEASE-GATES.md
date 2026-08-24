# `@meteorwallet/sdk` release gates

The live list of what must be true before a release is treated as a canonical consumer example.
Everything here is outstanding; everything already delivered lives in the archived plans under
[`docs/finished_updates/meteor_connect/`](docs/finished_updates/meteor_connect/).

This file exists because those plans did not distinguish the two. They still carried unchecked boxes
for work that shipped in `3.2.0`, so a consumer reading them could not tell which requirements were
real (REVIEW-consumer-implementation M-07).

**Source of truth for the current gates:** `../meteor-connect-bridge/REVIEW-consumer-implementation.md`.

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

- [ ] **Coordinated release order.** `@meteorwallet/connect-shared` and `@meteorwallet/connect` must
      be published with the promoted public exports and the `internal/` legacy-resolution shim
      *before* this package's dependency pins can move off `0.13.0` and
      `check-package-consumable` can run without `--local`.
- [ ] **Downstream patch removal.** `my-near-wallet` must drop
      `patches/@meteorwallet+sdk+3.2.0.patch` once it consumes the fixed release. Until it does, the
      published artifacts are still being rewritten byte-for-byte downstream.
- [ ] **Released-artifact end-to-end matrix.** Section 9 of
      `REVIEW-consumer-implementation.md` — real backend, real devices, every crash cut. Nothing in
      this repository can stand in for it.
- [ ] **Reference sample vs. lab.** `packages/meteor-sdk-v1-test-web` is a deliberately destructive
      engineering lab. The minimal consumer example lives in
      [`examples/minimal-consumer/`](examples/minimal-consumer/); keep the README's claims about
      which is which accurate as both change.
