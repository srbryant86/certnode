$ErrorActionPreference = 'Stop'

function Write-Step($msg){ Write-Host "[publish-node-sdk] $msg" }

# 0) Repo root sanity
Write-Step "Starting in $PWD"
if (-not (Test-Path .git)) { throw "Not a git repo at $PWD" }
if (-not (Test-Path sdk/node/package.json)) { throw 'Missing sdk/node/package.json' }

# 1) Normalize package fields
$pjPath = 'sdk/node/package.json'
$json = Get-Content $pjPath -Raw | ConvertFrom-Json
$changed = $false
if ($json.name -ne '@certnode/sdk') { $json.name = '@certnode/sdk'; $changed = $true }
if (-not ($json.PSObject.Properties.Name -contains 'license')) { $json | Add-Member -NotePropertyName license -NotePropertyValue 'MIT'; $changed = $true }
if (-not ($json.PSObject.Properties.Name -contains 'publishConfig')) { $json | Add-Member -NotePropertyName publishConfig -NotePropertyValue (@{ access = 'public' }); $changed = $true } elseif ($json.publishConfig.access -ne 'public') { $json.publishConfig.access='public'; $changed = $true }
# Ensure files list for npm
$desiredFiles = @('index.js','index.d.ts','README.md')
if (-not ($json.PSObject.Properties.Name -contains 'files')) { $json | Add-Member -NotePropertyName files -NotePropertyValue $desiredFiles; $changed = $true } elseif (@($json.files) -ne $desiredFiles) { $json.files = $desiredFiles; $changed = $true }

if ($changed) {
  ($json | ConvertTo-Json -Depth 32) | Set-Content $pjPath -Encoding UTF8
  git add $pjPath | Out-Null
  git commit -m 'chore(sdk-node): normalize package fields for publish' | Out-Null
  Write-Step 'package.json normalized and committed'
} else {
  Write-Step 'package.json already normalized'
}

# 2) Bump patch version (no tag here)
Push-Location sdk/node
try {
  $ver = (cmd /c npm version patch --no-git-tag-version | Select-Object -Last 1)
} finally { Pop-Location }
if (-not $ver) { throw 'Version bump failed' }
git add sdk/node/package.json | Out-Null
git commit -m ("chore(sdk-node): bump to {0}" -f $ver) | Out-Null
git push | Out-Null
Write-Step ("bumped to {0} and pushed" -f $ver)

# 3) Create tag sdk-node-vX.Y.Z and push
$tag = 'sdk-node-v'+$ver.Replace('v','')
if (git tag --list $tag) {
  git tag -f $tag | Out-Null
} else {
  git tag -a $tag -m $tag | Out-Null
}
git push -f origin $tag | Out-Null
Write-Step ("tagged and pushed {0}" -f $tag)

Write-Step "Actions → Release SDKs → watch publish-node job for $tag"

# 4) Poll npm for publish (best-effort)
$pkg='@certnode/sdk'
$published = ''
for ($i=0; $i -lt 30 -and -not $published; $i++) {
  Start-Sleep -Seconds 10
  try { $published = (cmd /c "npm view $pkg version" 2>$null) } catch {}
}
if (-not $published) {
  Write-Step "Publish not visible yet. Check the 'Release SDKs' workflow run."
  exit 0
}

Write-Host ("Published: {0}`nInstall: npm install @certnode/sdk@{0}" -f $published)

