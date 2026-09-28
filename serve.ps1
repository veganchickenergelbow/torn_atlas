$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8935/")
$listener.Start()
Write-Host "Serving $root on http://localhost:8935/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $path = $req.Url.LocalPath
  if ($path -eq "/") { $path = "/index.html" }
  elseif ($path.EndsWith("/")) { $path = $path + "index.html" }
  $file = Join-Path $root $path.TrimStart('/')
  if (Test-Path $file -PathType Leaf) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file)
    $ct = switch ($ext) {
      ".html" { "text/html; charset=utf-8" }
      ".js"   { "text/javascript; charset=utf-8" }
      ".css"  { "text/css; charset=utf-8" }
      ".svg"  { "image/svg+xml" }
      ".jpg"  { "image/jpeg" }
      ".jpeg" { "image/jpeg" }
      ".png"  { "image/png" }
      ".json" { "application/json" }
      ".webmanifest" { "application/manifest+json" }
      default { "application/octet-stream" }
    }
    $res.ContentType = $ct
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
  }
  $res.OutputStream.Close()
}
