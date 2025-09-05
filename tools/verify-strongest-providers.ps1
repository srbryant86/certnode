Stop = 'Stop'
 = @('infra/aws/terraform/0-providers.tf','infra/aws/terraform/1-variables.tf')

Write-Host "== Terraform sanity =="
terraform -chdir=infra/aws/terraform init -backend=false | Out-Null
terraform -chdir=infra/aws/terraform fmt -check
terraform -chdir=infra/aws/terraform validate

Write-Host "
== Show headers =="
foreach ( in ) {
  Write-Host ("===== HEAD of {0} =====" -f )
  Get-Content -TotalCount 30 -LiteralPath  | % {  }
}

Write-Host "
== SHA256 (WT vs HEAD) =="
foreach ( in ) {
   = (Get-FileHash -Algorithm SHA256 -LiteralPath ).Hash.ToLower()
   = [IO.Path]::Combine([IO.Path]::GetTempPath(), ([Guid]::NewGuid().ToString('N') + '.tmp'))
   = "git cat-file -p HEAD: > """
  cmd.exe /c  | Out-Null
   = (Get-FileHash -Algorithm SHA256 -LiteralPath ).Hash.ToLower()
  Remove-Item -Force 
  Write-Host ("{0}  WT_SHA256={1}  HEAD_SHA256={2}" -f , , )
}

Write-Host "
== Remote proof =="
 = (git rev-parse --abbrev-ref HEAD).Trim()
git fetch origin  | Out-Null
 = (git rev-parse HEAD).Trim()
 = (git rev-parse ("origin/" + )).Trim()
Write-Host ("Repo   : " + (git config --get remote.origin.url))
Write-Host ("Branch : " + )
Write-Host ("Local  : " + )
Write-Host ("Remote : " + )
if ( -eq ) { Write-Host 'Pushed & verified' } else { Write-Host 'Not pushed' }