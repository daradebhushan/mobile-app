$url = "https://103.243.232.204"
$webRequest = [System.Net.HttpWebRequest]::Create($url)
$webRequest.ServerCertificateValidationCallback = { $true }
try { $webRequest.GetResponse() } catch {}
$cert = $webRequest.ServicePoint.Certificate
if ($cert) {
    $certData = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $path = "d:\anti gravity\mobile\android\app\src\main\res\raw\server_cert.crt"
    [System.IO.File]::WriteAllBytes($path, $certData)
    Write-Host "Certificate saved to $path"
}
else {
    Write-Error "Could not retrieve certificate."
}
