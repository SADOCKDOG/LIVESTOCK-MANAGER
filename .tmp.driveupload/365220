# ============================================================
#  sync-mirrors.ps1
#  Sincroniza www (FUENTE DE VERDAD) -> raíz, Android src, Android build
#  y valida la sintaxis de TODO el JS antes de copiar.
#  Uso:  .\sync-mirrors.ps1   (tras editar www\ y antes de compilar)
# ============================================================
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$www  = Join-Path $root 'www'
$dests = @(
  $root,
  (Join-Path $root 'android\app\src\main\assets\public'),
  (Join-Path $root 'android\app\build\intermediates\assets\debug\mergeDebugAssets\public')
)

Write-Host "[1/2] Validando sintaxis de www\js ..." -ForegroundColor Cyan
$rotos = @()
Get-ChildItem -Path (Join-Path $www 'js') -Recurse -Filter *.js | ForEach-Object {
  & node --check $_.FullName 2>$null
  if ($LASTEXITCODE -ne 0) { $rotos += $_.FullName.Replace("$root\", '') }
}
if ($rotos.Count -gt 0) {
  Write-Host "ABORTADO: $($rotos.Count) archivo(s) con error de sintaxis:" -ForegroundColor Red
  $rotos | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
  exit 1
}
Write-Host "      Sintaxis OK (0 errores)." -ForegroundColor Green

Write-Host "[2/2] Sincronizando www -> raíz, Android src, Android build ..." -ForegroundColor Cyan
foreach ($d in $dests) {
  Copy-Item "$www\js\*"  (Join-Path $d 'js')  -Recurse -Force
  Copy-Item "$www\css\*" (Join-Path $d 'css') -Recurse -Force
  if (Test-Path "$www\icons") { Copy-Item "$www\icons\*" (Join-Path $d 'icons') -Recurse -Force }
  if (Test-Path "$www\manual") {
    $mimg = Join-Path $d 'manual\img'
    if (-not (Test-Path $mimg)) { New-Item -ItemType Directory -Path $mimg -Force | Out-Null }
    Copy-Item "$www\manual\*" (Join-Path $d 'manual') -Recurse -Force
  }
  foreach ($f in @('index.html', 'sw.js', 'manifest.webmanifest')) {
    if (Test-Path "$www\$f") { Copy-Item "$www\$f" (Join-Path $d $f) -Force }
  }
}
Write-Host "      Listo: 4 ubicaciones idénticas a www." -ForegroundColor Green
Write-Host "RECORDATORIO: sube CACHE_NAME en sw.js si cambiaste JS (ahora: $(Select-String -Path "$www\sw.js" -Pattern 'CACHE_NAME' | Select-Object -First 1 | ForEach-Object { $_.Line.Trim() }))" -ForegroundColor Yellow
