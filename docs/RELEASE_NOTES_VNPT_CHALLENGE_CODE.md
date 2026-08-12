# Release Note: VNPT eKYC Challenge Code (VITE_VNPT_EKYC_CHALLENGE_CODE)

## Summary

Starting with this release, `VITE_VNPT_EKYC_CHALLENGE_CODE` is a **required**
build-time environment variable when `VITE_VNPT_EKYC_ENABLED=true`.

If the challenge code is missing or empty, the VNPT eKYC SDK will refuse to
launch and throw an error:

```
Thiếu VITE_VNPT_EKYC_CHALLENGE_CODE. Challenge code là bắt buộc khi VNPT eKYC được bật.
```

## What Is the Challenge Code?

The VNPT eKYC Web SDK 3.2.1+ requires a liveness `CHALLENGE_CODE` parameter
during `SDK.launch()`. This value is issued by VNPT and is specific to your
merchant/integration configuration.

## Where to Obtain It

1. Log in to the **VNPT eKYC Partner Portal**.
2. Navigate to your application configuration.
3. Copy the **Challenge Code** value.

> ⚠️ This is a secret value. **Do not commit it to source control.**

## How to Provision at Build Time

### AWS Amplify (Current Deployment)

1. Open the Amplify Console → App → Environment variables.
2. Add: `VITE_VNPT_EKYC_CHALLENGE_CODE` = `<value from VNPT portal>`.
3. Scope to the appropriate branch (e.g., `develop`, `main`).
4. Trigger a new build.

### Local Development

Add to your local `frontend/.env` file (which is gitignored):

```env
VITE_VNPT_EKYC_CHALLENGE_CODE=<value from VNPT portal>
```

### CI/CD (GitHub Actions)

Add `VITE_VNPT_EKYC_CHALLENGE_CODE` as a repository or environment secret.
Reference it in the frontend build step:

```yaml
env:
  VITE_VNPT_EKYC_CHALLENGE_CODE: ${{ secrets.VITE_VNPT_EKYC_CHALLENGE_CODE }}
```

## Failure Mode

If the variable is not set:

- `launchVnptIdentitySdk()` throws immediately (before loading vendor scripts).
- The KYC flow will not start.
- No data is sent to VNPT.

## Affected Files

| File | Change |
|------|--------|
| `frontend/.env.example` | Added placeholder |
| `deploy/.env.production.example` | Added `<managed-secret>` placeholder |
| `frontend/src/features/kyc/vnptIdentitySdk.ts` | Validation + `dataConfig.CHALLENGE_CODE` |
