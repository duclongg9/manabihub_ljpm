$ErrorActionPreference = 'Stop'

$requiredVariables = @(
    'SPRING_DATASOURCE_URL',
    'RDS_USERNAME',
    'RDS_PASSWORD',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'KYC_IDENTITY_SECRET',
    'PAYOUT_SECURITY_SECRET',
    'MAIL_USERNAME',
    'MAIL_PASSWORD',
    'VNPAY_TMN_CODE',
    'VNPAY_HASH_SECRET',
    'VNPAY_RETURN_URL',
    'AI_CHAT_PROVIDER_BASE_URL',
    'AI_CHAT_PROVIDER_API_KEY',
    'AI_CHAT_PROVIDER_MODEL',
    'FRONTEND_BASE_URL',
    'CORS_ALLOWED_ORIGINS'
)

$minimumLengthVariables = @{
    JWT_SECRET = 32
    KYC_IDENTITY_SECRET = 32
    PAYOUT_SECURITY_SECRET = 32
}

$states = foreach ($name in $requiredVariables) {
    $value = [Environment]::GetEnvironmentVariable($name)
    $length = if ($null -eq $value) { 0 } else { $value.Length }
    $minimumLength = if ($minimumLengthVariables.ContainsKey($name)) {
        $minimumLengthVariables[$name]
    } else {
        1
    }

    [PSCustomObject]@{
        Name = $name
        Configured = -not [string]::IsNullOrWhiteSpace($value)
        CharacterCount = $length
        MinimumLength = $minimumLength
        ValidLength = $length -ge $minimumLength
    }
}

$states | Format-Table -AutoSize

$invalid = @(
    $states | Where-Object {
        -not $_.Configured -or -not $_.ValidLength
    }
)

if ($invalid.Count -gt 0) {
    $errorMessage = 'Release configuration is not ready. Missing or too-short variables: ' +
        ($invalid.Name -join ', ')
    Write-Error $errorMessage
}

Write-Host 'Release configuration is present. Values were intentionally not printed.'
