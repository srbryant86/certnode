# === CertNode: create full repo directory layout (no placeholder files) ===
$ErrorActionPreference='Stop'; $dirs=@(
'.github\workflows','infra\aws\terraform','infra\aws\terraform\org','scripts',
'tools\policy\opa','tools\fuzz','tools\vectors\jcs','tools\vectors\ecdsa',
'api\src\plugins','api\src\util','api\jobs','api\enclave',
'sdk\node\src','sdk\python\certnode','sdk\go',
'examples\webhooks','examples\docs',
'web\assets','web\css','web\js','web\transparency','docs'
); $dirs|%{New-Item -ItemType Directory -Force -Path $_|Out-Null}; 
Write-Host "Created/ensured $($dirs.Count) folders." -ForegroundColor Green
