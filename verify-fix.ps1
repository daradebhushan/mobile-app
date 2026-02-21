$ErrorActionPreference = "Continue"

Write-Host "--- A GENT VERIFICATION SCRIPT ---"

# 1. Kill any existing node/ionic processes to free port 8100
# (Optional, might be aggressive, but ensures clean slate)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "Ionic" } | Stop-Process -Force

# 2. Start Ionic Server (Background)
Write-Host "Starting Ionic Server..."
$ionicProc = Start-Process -FilePath "npx.cmd" -ArgumentList "ionic", "serve", "--no-open", "--port", "8100" -PassThru -NoNewWindow

Write-Host "Ionic started with PID: $($ionicProc.Id)"

# 3. Wait for Server to be Healthy
$url = "http://localhost:8100"
$serverReady = $false

for ($i = 1; $i -le 30; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 1 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "`nServer is READY!"
            break
        }
    }
    catch {
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 2
    }
}

if (-not $serverReady) {
    Write-Error "Server failed to start within 60 seconds."
    Stop-Process -Id $ionicProc.Id -Force
    exit 1
}

# 4. Run Playwright Test
Write-Host "Running Playwright Tests..."
try {
    # Using Call Operator & for executing commands
    & npx.cmd playwright test e2e/verify-image.spec.ts --headed
}
catch {
    Write-Error "Test execution failed: $_"
}
finally {
    # 5. Cleanup
    Write-Host "Stopping Ionic Server..."
    Stop-Process -Id $ionicProc.Id -Force -ErrorAction SilentlyContinue
}
