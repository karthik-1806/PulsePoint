param(
    [string]$Directory = "."
)

$secrets = @("GEMINI_API_KEY=", "JWT_SECRET=")
$found = $false

Write-Host "Scanning for hardcoded secrets in $Directory..."

# Search all files excluding node_modules, venv, and .env files
Get-ChildItem -Path $Directory -Recurse -File -Exclude "node_modules", "venv", ".env*" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -Path $file -ErrorAction SilentlyContinue
    if ($content) {
        foreach ($secret in $secrets) {
            $match = $content | Select-String -Pattern $secret -SimpleMatch
            if ($match) {
                Write-Host "WARNING: Potential secret '$secret' found in file: $file" -ForegroundColor Red
                $found = $true
            }
        }
    }
}

if ($found) {
    Write-Host "CI Scan Failed: Hardcoded secrets detected!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "CI Scan Passed: No hardcoded secrets found." -ForegroundColor Green
    exit 0
}
