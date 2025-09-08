Param(
  [Parameter(Mandatory=$true)][string]$Name,   # e.g., pr-123 or demo-foo
  [string]$Profile = $null
)
$ErrorActionPreference = 'Stop'
$tfdir = "infra/aws/terraform"
$region = (git config --get certnode.aws.region); if(-not $region){$region="us-east-1"}
$bucket = (git config --get certnode.tfstate.bucket)
$table  = (git config --get certnode.tfstate.table)
$key    = "envs/$Name/terraform.tfstate"

if ($Profile) { $env:AWS_PROFILE = $Profile; $env:AWS_SDK_LOAD_CONFIG = "1" }

terraform -chdir=$tfdir init `
  -backend-config="bucket=$bucket" `
  -backend-config="key=$key" `
  -backend-config="region=$region" `
  -backend-config="dynamodb_table=$table" `
  -backend-config="encrypt=true"

# optional: prefix resources
$env:TF_VAR_name_prefix = $Name

terraform -chdir=$tfdir plan -out plan.bin -input=false
terraform -chdir=$tfdir apply -input=false -auto-approve plan.bin

Write-Host "Ephemeral stack '$Name' created. To destroy:"
Write-Host "terraform -chdir=$tfdir destroy -auto-approve"

