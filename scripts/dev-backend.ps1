$ErrorActionPreference = "Stop"

Write-Host "Checking Java version..." -ForegroundColor Cyan
try {
    $javaVersionOutput = java -version 2>&1
    $isJava21 = $false
    foreach ($line in $javaVersionOutput) {
        if ($line -match 'version "21\.') {
            $isJava21 = $true
            break
        }
    }
    if (-not $isJava21) {
        Write-Host "WARNING: ManabiHub requires JDK 21 for local development. Current Java appears to be different." -ForegroundColor Yellow
        Write-Host $javaVersionOutput -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "ERROR: Java not found. Please install JDK 21." -ForegroundColor Red
    exit 1
}

try {
    $null = Get-Command mvn -ErrorAction Stop
} catch {
    Write-Host "ERROR: Maven (mvn) not found in PATH. Please install Maven and add it to your PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Spring Boot backend..." -ForegroundColor Cyan
Set-Location -Path "backend"
mvn spring-boot:run -Dspring-boot.run.profiles=local
