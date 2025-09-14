$ErrorActionPreference = 'Stop'

param(
  [Parameter(Mandatory = $true)]
  [string]$Tag
)

function Say($m){ Write-Host "[retag-web-sdk] $m" }

Set-Location (Resolve-Path ".")
if (-not (Test-Path .git)) { throw "Not a git repo at $PWD" }

Say "Retagging $Tag to current HEAD on main"

# Ensure we are on main and up to date
git fetch origin | Out-Null
git checkout main | Out-Null
git pull --ff-only origin main | Out-Null

# Delete local/remote tag if exists, then create at HEAD and push
if (git tag --list $Tag) {
  Say "Deleting local tag $Tag"
  git tag -d $Tag | Out-Null
}
Say "Creating tag $Tag at HEAD"
git tag -a $Tag -m $Tag | Out-Null

Say "Pushing tag $Tag (force)"
git push -f origin $Tag | Out-Null

Say "Done. Next: Actions -> Release Web SDK -> open run for $Tag -> Rerun all jobs (if not started)"

