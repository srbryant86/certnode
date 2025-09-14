param(
  [Parameter(Mandatory = $true)]
  [string]$Tag
)

$ErrorActionPreference = 'Stop'

function Say($m){ Write-Host "[retag-web-sdk] $m" }

Set-Location (Resolve-Path ".")
if (-not (Test-Path .git)) { throw "Not a git repo at $PWD" }

Say "Retagging $Tag to current HEAD on main"

git fetch origin | Out-Null
git checkout main | Out-Null
git pull --ff-only origin main | Out-Null

if (git tag --list $Tag) {
  Say "Deleting local tag $Tag"
  git tag -d $Tag | Out-Null
}
Say "Creating tag $Tag at HEAD"
git tag -a $Tag -m $Tag | Out-Null

Say "Pushing tag $Tag (force)"
git push -f origin $Tag | Out-Null

Say "Done. Next: Actions -> Release Web SDK -> open run for $Tag -> Rerun all jobs (if not started)"
