# SDK Publishing (Node)

This guides publishing `@certnode/sdk` to npm and keeping it tidy.

## Versioning
- Semantic Versioning (semver): MAJOR.MINOR.PATCH
- Breaking changes → MAJOR; additive backwards‑compatible → MINOR; fixes → PATCH
- Keep `CHANGELOG.md` updated for every release.

## Pre‑publish Checklist
- Update `version` in `sdk/node/package.json`
- Update `CHANGELOG.md` with a dated entry
- Validate pack contents:
  - From `sdk/node`: `cmd /c npm pack --json` and verify files list is minimal
  - Should include: `index.js`, `index.d.ts`, `README.md`
- Dry‑run publish: `npm run publish:dry-run` (PowerShell may require `cmd /c`)

## Publish
From `sdk/node`:

- Login (once): `npm login` (enable 2FA)
- Publish: `npm publish --access public`

## Post‑publish
- Tag repo: `git tag sdk-node-vX.Y.Z && git push --tags`
- Verify on npmjs.com and test install in a sample project

## Browser Distribution (Plan)
- Current browser SDK is `sdk/web` (zero‑dep, WebCrypto). Distribution options:
  - Publish a separate `@certnode/sdk-web` with ESM entry
  - Or provide a UMD/ESM bundle in this package under `dist/` and document usage
- CDN strategy: host minified bundle via jsDelivr or unpkg once published

## Notes
- If PowerShell blocks npm scripts (`npm.ps1`), use `cmd /c` prefix: `cmd /c npm pack`
- Keep `files` whitelist minimal to reduce package size

