Param(
  [ValidateSet('staging','prod')] [string]$Env = 'staging',
  [string]$ApiDomain = "api.certnode.io",
  [string]$JwksDomain = "jwks.certnode.io"
)
$ErrorActionPreference = 'Stop'

Write-Host "== Smoke: DNS resolves ==" -ForegroundColor Cyan
Resolve-DnsName $ApiDomain  | Out-Null
Resolve-DnsName $JwksDomain | Out-Null

Write-Host "== Smoke: TLS handshakes ==" -ForegroundColor Cyan
# Requires OpenSSL (Git for Windows has one under usr/bin)
$openssl = Join-Path $env:ProgramFiles 'Git\usr\bin\openssl.exe'
if (-not (Test-Path $openssl)) { throw "OpenSSL not found at $openssl" }
$ssl = & $openssl s_client -connect "$ApiDomain`:443" -servername "$ApiDomain" -tls1_2 <NUL
if ($LASTEXITCODE -ne 0) { throw "TLS handshake failed for $ApiDomain" }

Write-Host "== Smoke: JWKS path reachable (may 403 until CloudFront+S3 exist) ==" -ForegroundColor Cyan
try {
  $r = Invoke-WebRequest "https://$JwksDomain/.well-known/certnode-jwks.json" -UseBasicParsing -TimeoutSec 10
  if ($r.StatusCode -ge 400) { throw "JWKS returned $($r.StatusCode)" }
  Write-Host "JWKS reachable (HTTP $($r.StatusCode))"
} catch {
  Write-Host "JWKS not ready yet; continuing." -ForegroundColor Yellow
}

Write-Host "Smoke checks done." -ForegroundColor Green

