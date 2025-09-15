# Release Checklist

Steps to release SDKs and tag the repo.

## Prep
- Ensure main is green: `node tools/test-fast.js` → ALL PASSED
- Update versions:
  - Node: `sdk/node/package.json` (bump semver)
  - Web:  `sdk/web/package.json` (bump semver)
- Update CHANGELOGs with date and summary

## Node SDK (@certnode/sdk)
From `sdk/node`:

1) Pack and verify contents
```
cmd /c npm pack --json
```
Expect only: `index.js`, `index.d.ts`, `README.md`, `package.json`.

2) Dry‑run publish
```
npm publish --dry-run --access public
```

3) Publish
```
npm publish --access public
```

## Web SDK (@certnode/sdk-web)
From `sdk/web`:

1) Pack and verify contents
```
cmd /c npm pack --json
```

2) Dry‑run publish
```
npm publish --dry-run --access public
```

3) Publish
```
npm publish --access public
```

4) CDN + SRI (jsDelivr)
- After publish, you can load the minified ESM bundle via jsDelivr:
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@certnode/sdk-web@A.B.C/dist/index.esm.min.js"></script>
```
- To generate Subresource Integrity (SRI):
```
npm run build:web-sdk
node tools/generate-sri.js
```
Then include:
```html
<script
  type="module"
  integrity="sha384-..."
  crossorigin="anonymous"
  src="https://cdn.jsdelivr.net/npm/@certnode/sdk-web@A.B.C/dist/index.esm.min.js"></script>
```

## Tagging
After publishing, tag the repo and push tags:
```
git tag sdk-node-vX.Y.Z
git tag sdk-web-vA.B.C
git push --tags
```

## Post‑release
- Verify on npmjs.com and test install in a sample app
- Announce changes and update docs if needed

## GitHub Actions Release (optional)

This repo includes `.github/workflows/release.yml` to publish SDKs on tags:

- For Node SDK: create a tag `sdk-node-vX.Y.Z`
- For Web SDK:  create a tag `sdk-web-vA.B.C`

Prerequisite:
- Add `NPM_TOKEN` (repo Settings → Secrets and variables → Actions → New repository secret)
- The workflow runs fast tests, packs the SDK, and publishes with `NODE_AUTH_TOKEN`.
- Provenance: CI uses `--provenance` to attach SLSA attestations. Workflows grant `id-token: write` permissions. If you need to disable this, remove `--provenance` from the publish step.

Note: You can still publish locally if you prefer.

## Troubleshooting

- Release failed with 401/403 or package not found on npm:
  - Ensure `NPM_TOKEN` is configured in repo secrets and has publish rights for the `@certnode` scope.
  - Re-run the workflow for the existing tag in Actions → Release SDKs → select the run → Rerun all jobs.
  - If you prefer a new version, bump the package version and create a new tag (e.g., `sdk-web-v0.1.4`).

- Web SDK bundle too large (>10KB):
  - CI enforces a size budget. Trim exports/comments, avoid adding prod deps; re-run `npm run build:web-sdk` and commit the updated bundle.

- Need a CDN snippet/SRI after publish:
  - Use jsDelivr with the published version: `<script type="module" src="https://cdn.jsdelivr.net/npm/@certnode/sdk-web@X.Y.Z/dist/index.esm.min.js"></script>`
  - Generate SRI: `node tools/generate-sri.js` (after `npm run build:web-sdk`).

## Maintainer Shortcuts

To automate publish via GitHub Actions with normalized package metadata and tagging:

- Web SDK:
  - PowerShell: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-web-sdk.ps1`
  - Requires `NPM_TOKEN` repo secret; script bumps version, tags `sdk-web-vX.Y.Z`, and prints CDN + SRI snippet once published.

- Node SDK:
  - PowerShell: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-node-sdk.ps1`
  - Requires `NPM_TOKEN` repo secret; script bumps version, tags `sdk-node-vX.Y.Z`, and prints the published version from npm.

