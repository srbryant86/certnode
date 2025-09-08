# CertNode: create full repo directory layout (idempotent)
$ErrorActionPreference='Stop'
$dirs=@(
  '.github\workflows',
  'infra\aws\terraform','infra\aws\terraform\org',
  'scripts',
  'tools\policy\opa','tools\fuzz','tools\vectors\jcs','tools\vectors\ecdsa',
  'api\src\plugins','api\src\util','api\jobs','api\enclave',
  'sdk\node\src','sdk\python\certnode','sdk\go',
  'examples\webhooks','examples\docs',
  'web\assets','web\css','web\js','web\transparency',
  'docs'
)
$created=0
foreach($d in $dirs){ New-Item -ItemType Directory -Force -Path $d | Out-Null; $created++ }
Write-Host "Created/ensured $created folders under $(Get-Location)." -ForegroundColor Green
$dirs | ForEach-Object {
  if(Test-Path $_){ Write-Host ("   " + $_) -ForegroundColor DarkGray }
}

