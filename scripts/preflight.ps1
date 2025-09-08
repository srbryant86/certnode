Param(
  [ValidateSet('dev','staging','prod')] [string]$Env = 'staging',
  [string]$Profile = $null
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root '..')

Write-Host "== Preflight for $Env ==" -ForegroundColor Cyan

# Tools
foreach ($t in @("terraform","aws")) {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) { throw "$t not found on PATH" }
}

# AWS auth
if ($Profile) { $env:AWS_PROFILE = $Profile; $env:AWS_SDK_LOAD_CONFIG = "1" }
aws sts get-caller-identity | Out-Null

# Remote state sanity (optional)
$bucket = (git config --get certnode.tfstate.bucket)
$table  = (git config --get certnode.tfstate.table)
$region = (git config --get certnode.aws.region)
if (-not $bucket) { $bucket = Read-Host "TF state bucket (e.g., certnode-tfstate-dev)" }
if (-not $table)  { $table  = Read-Host "TF lock table (e.g., certnode-tflock)" }
if (-not $region) { $region = "us-east-1" }

Write-Host "Bucket=$bucket  Table=$table  Region=$region"
aws s3 ls "s3://$bucket" | Out-Null
aws dynamodb describe-table --table-name $table --region $region | Out-Null

Write-Host "Preflight OK." -ForegroundColor Green

