param(
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$targetDir = Join-Path $backendDir "target"
$stagingDir = Join-Path $targetDir "elastic-beanstalk"
$bundlePath = Join-Path $targetDir "manabihub-elastic-beanstalk.zip"
$jarName = "manabihub-0.0.1-SNAPSHOT.jar"
$jarPath = Join-Path $targetDir $jarName

Push-Location $backendDir
try {
    $maven = if (Test-Path ".\mvnw.cmd") { ".\mvnw.cmd" } else { "mvn" }
    $arguments = @("clean", "package")
    if ($SkipTests) {
        $arguments += "-DskipTests"
    }

    & $maven @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $jarPath)) {
    throw "Expected JAR was not created: $jarPath"
}

if (Test-Path -LiteralPath $stagingDir) {
    Remove-Item -LiteralPath $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

Copy-Item -LiteralPath $jarPath -Destination (Join-Path $stagingDir $jarName)
Copy-Item -LiteralPath (Join-Path $backendDir "Procfile") -Destination (Join-Path $stagingDir "Procfile")

if (Test-Path -LiteralPath (Join-Path $backendDir ".platform")) {
    Copy-Item -LiteralPath (Join-Path $backendDir ".platform") -Destination (Join-Path $stagingDir ".platform") -Recurse
}

if (Test-Path -LiteralPath $bundlePath) {
    Remove-Item -LiteralPath $bundlePath -Force
}

Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $bundlePath -CompressionLevel Optimal

Write-Host "Elastic Beanstalk bundle created:" -ForegroundColor Green
Write-Host "  $bundlePath"
Write-Host "The ZIP root contains Procfile, .platform config, and $jarName."
