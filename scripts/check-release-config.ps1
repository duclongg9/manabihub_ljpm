$ErrorActionPreference = 'Stop'

$requiredVariables = @(
    'SPRING_PROFILES_ACTIVE',
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
    'CORS_ALLOWED_ORIGINS',
    'PHONE_VERIFICATION_SMS_MODE'
)

$profile = [Environment]::GetEnvironmentVariable('SPRING_PROFILES_ACTIVE')
if ($profile -ne 'prod') {
    Write-Error 'Release configuration is not ready. SPRING_PROFILES_ACTIVE must be prod.'
}

$smsMode = [Environment]::GetEnvironmentVariable('PHONE_VERIFICATION_SMS_MODE')
if ($smsMode -eq 'esms') {
    $requiredVariables += @(
        'PHONE_VERIFICATION_ESMS_API_KEY',
        'PHONE_VERIFICATION_ESMS_SECRET_KEY',
        'PHONE_VERIFICATION_ESMS_BRANDNAME',
        'PHONE_VERIFICATION_ESMS_SANDBOX'
    )
} elseif ($smsMode -eq 'webhook') {
    $requiredVariables += @(
        'PHONE_VERIFICATION_SMS_WEBHOOK_URL',
        'PHONE_VERIFICATION_SMS_API_KEY'
    )
} else {
    Write-Error 'Release configuration is not ready. PHONE_VERIFICATION_SMS_MODE must be esms or webhook.'
}

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

$placeholderPattern = '^(<.*>|replace-with.*|changeme|your[-_].*)$'
$placeholderSmsVariables = @(
    $states | Where-Object {
        $_.Name -like 'PHONE_VERIFICATION_*' -and
        [Environment]::GetEnvironmentVariable($_.Name) -match $placeholderPattern
    }
)

if ($smsMode -eq 'esms') {
    $sandbox = [Environment]::GetEnvironmentVariable('PHONE_VERIFICATION_ESMS_SANDBOX')
    if ($sandbox -ne '0') {
        Write-Error 'Release configuration is not ready. PHONE_VERIFICATION_ESMS_SANDBOX must be 0 for real SMS delivery.'
    }
}

if ($invalid.Count -gt 0) {
    $errorMessage = 'Release configuration is not ready. Missing or too-short variables: ' +
        ($invalid.Name -join ', ')
    Write-Error $errorMessage
}

if ($placeholderSmsVariables.Count -gt 0) {
    Write-Error ('Release configuration is not ready. Placeholder SMS variables: ' +
        ($placeholderSmsVariables.Name -join ', '))
}

Write-Host 'Release configuration is present. Values were intentionally not printed.'
