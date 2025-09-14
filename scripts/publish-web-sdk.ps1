$ErrorActionPreference = 'Stop'

function Write-Step($msg){ Write-Host "[publish-web-sdk] $msg" }

# 0) Repo root sanity
Write-Step "Starting in $PWD"
if (-not (Test-Path .git)) { throw "Not a git repo at $PWD" }
if (-not (Test-Path sdk/web/package.json)) { throw 'Missing sdk/web/package.json' }

# 1) Normalize package fields
$pjPath = 'sdk/web/package.json'
$json = Get-Content $pjPath -Raw | ConvertFrom-Json
$changed = $false
if ($json.name -ne '@certnode/sdk-web') { $json.name = '@certnode/sdk-web'; $changed = $true }
if (-not ($json.PSObject.Properties.Name -contains 'license')) { $json | Add-Member -NotePropertyName license -NotePropertyValue 'MIT'; $changed = $true }
if (-not ($json.PSObject.Properties.Name -contains 'publishConfig')) { $json | Add-Member -NotePropertyName publishConfig -NotePropertyValue (@{ access = 'public' }); $changed = $true } elseif ($json.publishConfig.access -ne 'public') { $json.publishConfig.access='public'; $changed = $true }
# Ensure files list for npm
$desiredFiles = @('dist','README.md','LICENSE')
if (-not ($json.PSObject.Properties.Name -contains 'files')) { $json | Add-Member -NotePropertyName files -NotePropertyValue $desiredFiles; $changed = $true } elseif (@($json.files) -ne $desiredFiles) { $json.files = $desiredFiles; $changed = $true }
# Ensure build script for workflow
if (-not ($json.PSObject.Properties.Name -contains 'scripts')) { $json | Add-Member -NotePropertyName scripts -NotePropertyValue (@{}) }
if (-not ($json.scripts.PSObject.Properties.Name -contains 'build')) { $json.scripts.build = 'node ../../tools/build-web-sdk.js'; $changed = $true }

if ($changed) {
  ($json | ConvertTo-Json -Depth 32) | Set-Content $pjPath -Encoding UTF8
  git add $pjPath | Out-Null
  git commit -m 'chore(sdk-web): normalize package fields for publish' | Out-Null
  Write-Step 'package.json normalized and committed'
} else {
  Write-Step 'package.json already normalized'
}

# 2) Bump patch version (no tag here)
Push-Location sdk/web
try {
  $ver = (cmd /c npm version patch --no-git-tag-version | Select-Object -Last 1)
} finally { Pop-Location }
if (-not $ver) { throw 'Version bump failed' }
git add sdk/web/package.json | Out-Null
git commit -m ("chore(sdk-web): bump to {0}" -f $ver) | Out-Null
git push | Out-Null
Write-Step ("bumped to {0} and pushed" -f $ver)

# 3) Create tag sdk-web-vX.Y.Z and push
$tag = 'sdk-web-v'+$ver.Replace('v','')
if (git tag --list $tag) {
  git tag -f $tag | Out-Null
} else {
  git tag -a $tag -m $tag | Out-Null
}
git push -f origin $tag | Out-Null
Write-Step ("tagged and pushed {0}" -f $tag)

Write-Step "Actions → Release Web SDK → open run for $tag → Rerun all jobs if needed"

# 4) Poll npm for publish (best-effort)
$pkg='@certnode/sdk-web'
$published = ''
for ($i=0; $i -lt 30 -and -not $published; $i++) {
  Start-Sleep -Seconds 10
  try { $published = (cmd /c "npm view $pkg version" 2>$null) } catch {}
}
if (-not $published) {
  Write-Step "Publish not visible yet. Check the 'Release Web SDK' workflow run."
  exit 0
}

# 5) Print CDN URLs and SRI snippet
$cdn   = "https://cdn.jsdelivr.net/npm/@certnode/sdk-web@$published/dist/index.esm.min.js"
$unpkg = "https://unpkg.com/@certnode/sdk-web@$published/dist/index.esm.min.js"
Write-Host ("Published: {0}`njsDelivr: {1}`nUNPKG  : {2}" -f $published,$cdn,$unpkg)
if (Test-Path tools/generate-sri.js) {
  cmd /c node tools/generate-sri.js $cdn
}
