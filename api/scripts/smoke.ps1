param([int]$Port = 3000)
# Kill any old servers quietly
try { taskkill /IM node.exe /F 2>$null | Out-Null } catch {}
# Start server
Start-Process -WindowStyle Hidden -FilePath node -ArgumentList "src/index.js"
Start-Sleep -Seconds 1
try {
  $body = '{"payload":{"hello":"world","n":42}}'
  $r = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/v1/sign" -Method POST -ContentType 'application/json' -Body $body
  $j = $r.Content | ConvertFrom-Json
  if ($j.protected -and $j.signature -and $j.payload -and $j.kid -and $j.payload_jcs_sha256 -and $j.receipt_id) {
    Write-Host "RECEIPT OK"
    exit 0
  } else {
    Write-Host "RECEIPT MISSING FIELDS"
    exit 2
  }
}
finally {
  try { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force } catch {}
}