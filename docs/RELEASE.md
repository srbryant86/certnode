# Release Checklist

Steps to release SDKs and tag the repo.

## Prep
- Ensure main is green: `node tools/test-fast.js` → ALL PASSED
- Update versions:
  - Node: `sdk/node/package.json` (bump semver)
  - Web: `sdk/web/package.json` (bump semver)
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
- The workflow runs fast tests, packs the SDK, and publishes with `NODE_AUTH_TOKEN`

Note: You can still publish locally if you prefer.
