# ============================================================================
# PIXELSTORE — MIGRATION IMAGES : data URI base64 → bucket Storage
#
# Convertit les image_url stockées en data URI base64 (lourds) en fichiers du
# bucket Storage « product-images » et met à jour la base avec l'URL publique.
#
# PRÉREQUIS :
#   1. Avoir créé le bucket « product-images » (PUBLIC) dans le dashboard
#      Supabase (Storage → New bucket).
#   2. Avoir exécuté les policies Storage (fin de supabase_schema.sql).
#
# USAGE (dans PowerShell) :
#   .\scripts\migrate-images.ps1 -Email admin@pixelstore.bi -Password "AdminPixel2026!"
#
# Les images déjà en chemin relatif (img/...) ou URL https sont laissées telles.
# ============================================================================
param(
  [string]$Email = "admin@pixelstore.bi",
  [string]$Password
)

if (-not $Password) {
  Write-Host "Usage : .\scripts\migrate-images.ps1 -Email admin@pixelstore.bi -Password '<mot de passe>'" -ForegroundColor Yellow
  exit 1
}

$ErrorActionPreference = 'Stop'
$url   = "https://ysaydbefzncsiovevlag.supabase.co"
$anon  = "sb_publishable_YzO-RFWZauh6seSMRRutrg_rKaFW1x9"
$bucket = "product-images"

function Invoke-Json($Method, $Uri, $Headers, $Body) {
  return curl.exe -s -X $Method $Uri -H @($Headers | ForEach-Object { "$_" }) -H "Content-Type: application/json" --data-binary $Body
}

Write-Host "== Connexion admin ==" -ForegroundColor Cyan
$login = '{"email":"' + $Email + '","password":"' + $Password + '"}'
$loginFile = Join-Path $env:TEMP "ps_login.json"
[System.IO.File]::WriteAllText($loginFile, $login, (New-Object System.Text.UTF8Encoding($false)))
$resp = curl.exe -s -X POST "$url/auth/v1/token?grant_type=password" -H "apikey: $anon" -H "Content-Type: application/json" --data-binary "@$loginFile"
$tok = $resp | ConvertFrom-Json
if (-not $tok.access_token) { Write-Host "ÉCHEC connexion : $resp" -ForegroundColor Red; exit 1 }
$token = $tok.access_token
$auth = "Authorization: Bearer $token"
Write-Host "Connecté." -ForegroundColor Green

Write-Host "== Récupération des images ==" -ForegroundColor Cyan
$imgs = @()
$file = Join-Path $env:TEMP "ps_imgs.csv"
# PostgREST : on reçoit id + product_id seulement (léger) puis on traite les urls par lot.
$json = curl.exe -s "$url/rest/v1/product_images?select=id,product_id,sort_order,is_main&order=id" -H "apikey: $anon" -H $auth
$rows = $json | ConvertFrom-Json
Write-Host "Total images : $($rows.Count)"

$converted = 0
foreach ($row in $rows) {
  # Récupère l'url de cette image (une seule ligne => payload limité)
  $one = curl.exe -s "$url/rest/v1/product_images?select=image_url&id=eq.$($row.id)" -H "apikey: $anon" -H $auth
  $obj = $one | ConvertFrom-Json
  $imageUrl = $obj[0].image_url

  if ([string]::IsNullOrEmpty($imageUrl)) { continue }
  if ($imageUrl -notlike "data:image*") { continue }  # déjà locale ou URL publique

  # Parse le data URI : data:image/<type>;base64,<data>
  if ($imageUrl -notmatch '^data:image/([a-zA-Z0-9+]+);base64,(.+)$') {
    Write-Host "  (skip) image $($row.id) : data URI non base64 reconnu" -ForegroundColor DarkYellow
    continue
  }
  $ext = $Matches[1]
  $b64Data = $Matches[2].Replace("`n", "").Replace("`r", "")
  $bytes = [System.Convert]::FromBase64String($b64Data)
  Write-Host "  Convertit image $($row.id) ($([Math]::Round($bytes.Length/1KB,1)) Ko)..." -ForegroundColor Yellow

  $path = "products/$($row.product_id)-$($row.id).$ext"
  $imgFile = Join-Path $env:TEMP "ps_img_$($row.id).$ext"
  [System.IO.File]::WriteAllBytes($imgFile, $bytes)

  # Upload dans le bucket Storage
  $upResp = curl.exe -s -X POST "$url/storage/v1/object/$bucket/$path" `
    -H "apikey: $anon" -H $auth -H "Content-Type: image/$ext" -H "x-upsert: true" `
    --data-binary "@$imgFile"
  $up = $upResp | ConvertFrom-Json
  if ($up -and $up.Key) {
    $publicUrl = "$url/storage/v1/object/public/$bucket/$path"
    # Met à jour la ligne en base
    $patch = '{"image_url":"' + $publicUrl + '"}'
    $pf = Join-Path $env:TEMP "ps_patch.json"
    [System.IO.File]::WriteAllText($pf, $patch, (New-Object System.Text.UTF8Encoding($false)))
    $paResp = curl.exe -s -o NUL -w "%{http_code}" -X PATCH "$url/rest/v1/product_images?id=eq.$($row.id)" -H "apikey: $anon" -H $auth -H "Content-Type: application/json" -H "Prefer: return=minimal" --data-binary "@$pf"
    if ($paResp -eq "204") {
      Write-Host "    -> OK, mise à jour ligne id=$($row.id)" -ForegroundColor Green
      $converted++
    } else {
      Write-Host "    -> Uploadé mais mise à jour base échouée (HTTP $paResp)" -ForegroundColor Red
    }
    Remove-Item $imgFile -ErrorAction SilentlyContinue
  } else {
    Write-Host "    -> ÉCHEC upload : $upResp" -ForegroundColor Red
    Remove-Item $imgFile -ErrorAction SilentlyContinue
  }
}

Write-Host ""
Write-Host "Migration terminée : $converted image(s) convertie(s) vers Storage." -ForegroundColor Cyan
