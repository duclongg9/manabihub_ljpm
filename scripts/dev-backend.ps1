$ErrorActionPreference = "Stop"

# Auto-detect and configure JDK 21 if installed but not set as default
$jdkPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "$env:USERPROFILE\.jdks"
)
$jdk21Folder = $null
foreach ($path in $jdkPaths) {
    if (Test-Path $path) {
        $subfolders = Get-ChildItem -Path $path -Directory -Filter "*21*" -ErrorAction SilentlyContinue
        if ($subfolders) {
            $jdk21Folder = $subfolders[0].FullName
            break
        }
    }
}

if ($jdk21Folder) {
    Write-Host "Auto-detected JDK 21 at: $jdk21Folder" -ForegroundColor Green
    Write-Host "Configuring JAVA_HOME and PATH for this session..." -ForegroundColor Green
    $env:JAVA_HOME = $jdk21Folder
    $env:PATH = "$jdk21Folder\bin;$env:PATH"
}

Write-Host "Checking Java version..." -ForegroundColor Cyan

$javaCheck = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCheck) {
    Write-Host "ERROR: Java not found. Please install JDK 21." -ForegroundColor Red
    exit 1
}

# Run java -version and capture stderr (where Java prints version info) using a temp file
$tempFile = [System.IO.Path]::GetTempFileName()
try {
    cmd /c "java -version 2> `"$tempFile`""
    $javaVersionOutput = Get-Content $tempFile
} finally {
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}

$isJava21 = $false
foreach ($line in $javaVersionOutput) {
    if ($line -match 'version "21\.') {
        $isJava21 = $true
        break
    }
}

if (-not $isJava21) {
    Write-Host "WARNING: ManabiHub requires JDK 21 for local development. Current Java appears to be different." -ForegroundColor Yellow
    foreach ($line in $javaVersionOutput) {
        Write-Host $line -ForegroundColor Yellow
    }
    Write-Host ""
}


try {
    $null = Get-Command mvn -ErrorAction Stop
} catch {
    Write-Host "ERROR: Maven (mvn) not found in PATH. Please install Maven and add it to your PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Spring Boot backend..." -ForegroundColor Cyan
Set-Location -Path "backend"
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
