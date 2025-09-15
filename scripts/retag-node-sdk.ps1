$ErrorActionPreference = 'Stop'

function Write-Step($msg){ Write-Host "[retag-node-sdk] $msg" }

Write-Step "Starting in $PWD"
if (-not (Test-Path .git)) { throw "Not a git repo at $PWD" }
if (-not (Test-Path sdk/node/package.json)) { throw 'Missing sdk/node/package.json' }

# Determine version
$ver = ''
if ($args.Length -gt 0 -and $args[0]) {
  $ver = $args[0]
  if ($ver -notmatch '^v?\d+\.\d+\.\d+$') { throw "Invalid version format: $ver" }
  if ($ver[0] -ne 'v') { $ver = 'v'+$ver }
} else {
  $ver = (Get-Content sdk/node/package.json -Raw | ConvertFrom-Json).version
  if (-not $ver) { throw 'Unable to read version from sdk/node/package.json' }
  if ($ver[0] -ne 'v') { $ver = 'v'+$ver }
}

$tag = 'sdk-node-'+$ver
Write-Step ("Retagging {0} to current HEAD" -f $tag)

try { git tag -d $tag | Out-Null } catch {}
git tag -a $tag -m $tag | Out-Null
git push -f origin $tag | Out-Null
Write-Step ("Pushed {0} to origin (force)" -f $tag)

Write-Step "This will retrigger the 'Release SDKs' workflow for the Node SDK tag."

