param(
  [string]$SupabaseUrl = "https://ysaydbefzncsiovevlag.supabase.co",
  [string]$AnonKey = "sb_publishable_YzO-RFWZauh6seSMRRutrg_rKaFW1x9",
  [string]$Email = "admin@pixelstore.bi",
  [string]$Password,
  [string]$ImageId,
  [int]$MaxWidth = 1000,
  [int]$Quality = 82
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

if (-not $Password) {
  Write-Host "Usage : .\scripts\compact-image.ps1 -Email admin@pixelstore.bi -Password '<mdp>' -ImageId 181" -ForegroundColor Yellow
  exit 1
}
if (-not $ImageId) {
  Write-Host "Parametre -ImageId requis (id dans product_images)." -ForegroundColor Yellow
  exit 1
}

# 1) Login admin
$login = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
$resp = Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/auth/v1/token?grant_type=password" `
  -Headers @{ apikey = $AnonKey } `
  -Body $login -ContentType 'application/json'
$token = $resp.access_token
$headers = @{ apikey = $AnonKey; Authorization = "Bearer $token" }
Write-Host "Login OK (user: $($resp.user.email))"

# 2) Lire l'image
$img = Invoke-RestMethod -Method Get -Uri "$SupabaseUrl/rest/v1/product_images?select=id,product_id,image_url&id=eq.$ImageId" `
  -Headers $headers
if (-not $img -or -not $img[0]) { Write-Host "Image $ImageId introuvable." -ForegroundColor Yellow; exit 1 }
$row = $img[0]
$dataUrl = $row.image_url
$isData = $dataUrl.StartsWith("data:")
Write-Host "Image $ImageId (produit $($row.product_id)) : $($dataUrl.Length) caracteres, data URI: $isData"

if (-not $isData) { Write-Host "Deja une URL legere, rien a faire."; exit 0 }

$comma = $dataUrl.IndexOf(',')
$mime = $dataUrl.Substring(5, $comma - 5).Split(';')[0]
$b64 = $dataUrl.Substring($comma + 1)
$src = [System.Convert]::FromBase64String($b64)
Write-Host "Base64 decode : $($src.Length) octets ($mime)"

# 3) Charger et redimensionner
$ms = New-Object System.IO.MemoryStream(,$src)
$bitmap = [System.Drawing.Image]::FromStream($ms)
$w = $bitmap.Width; $h = $bitmap.Height
$ratio = [Math]::Min(1, $MaxWidth / [Math]::Max($w, 1))
$nw = [Math]::Max(1, [Math]::Round($w * $ratio))
$nh = [Math]::Max(1, [Math]::Round($h * $ratio))
$bmp = New-Object System.Drawing.Bitmap($nw, $nh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.SmoothingMode = 'HighQuality'
$g.DrawImage($bitmap, 0, 0, $nw, $nh)
Write-Host "Redimensionne : $w x $h -> $nw x $nh"

$out = New-Object System.IO.MemoryStream
try {
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
  $bmp.Save($out, $enc, $ep)
} finally {
  $g.Dispose(); $bmp.Dispose(); $bitmap.Dispose(); $ms.Dispose()
}
$newBytes = $out.ToArray(); $out.Dispose()
$newB64 = [System.Convert]::ToBase64String($newBytes)
$newDataUrl = "data:image/jpeg;base64,$newB64"
Write-Host "Compresse : $($src.Length) -> $($newBytes.Length) octets ($([Math]::Round($newBytes.Length/1024)) Ko)"

# 4) Mettre a jour la ligne
$payload = @{ image_url = $newDataUrl } | ConvertTo-Json -Compress
$update = Invoke-WebRequest -Method Patch -Uri "$SupabaseUrl/rest/v1/product_images?id=eq.$ImageId" `
  -Headers @{ apikey = $AnonKey; Authorization = "Bearer $token"; Prefer = 'return=representation' } `
  -Body $payload -ContentType 'application/json'
Write-Host "Mise a jour HTTP $($update.StatusCode)"
Write-Host "Termine : image $ImageId compactee."
