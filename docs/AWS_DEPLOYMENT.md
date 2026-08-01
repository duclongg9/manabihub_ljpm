# AWS Deployment

This setup deploys the Spring Boot API to Elastic Beanstalk, PostgreSQL to
RDS/Aurora, and the React application to Amplify.

## 1. Build the Elastic Beanstalk bundle

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-eb-bundle.ps1
```

The command runs backend tests and creates:

```text
backend/target/manabihub-elastic-beanstalk.zip
```

The ZIP root must contain exactly the executable JAR and `Procfile`. Do not zip
the `backend` or `target` directory itself.

## 2. Elastic Beanstalk environment properties

Configure these under **Configuration > Updates, monitoring, and logging >
Environment properties**:

```text
SERVER_PORT=5000
SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/postgres?sslmode=require
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
RDS_USERNAME=<database user>
RDS_PASSWORD=<database password>
GOOGLE_CLIENT_ID=<Google OAuth client id>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
JWT_SECRET=<random value with at least 32 bytes>
KYC_IDENTITY_SECRET=<stable random value with at least 32 bytes>
PAYOUT_SECURITY_SECRET=<stable random value with at least 32 bytes>
MAIL_USERNAME=<SMTP username used for OTP and internal-admin invitations>
MAIL_PASSWORD=<SMTP app password>
VNPAY_TMN_CODE=<VNPay merchant terminal code>
VNPAY_HASH_SECRET=<VNPay merchant hash secret>
VNPAY_RETURN_URL=https://develop.d1sbjmyazduh3v.amplifyapp.com/checkout/return
AI_CHAT_PROVIDER_BASE_URL=<OpenAI-compatible provider origin>
AI_CHAT_PROVIDER_API_KEY=<provider API key>
AI_CHAT_PROVIDER_MODEL=<provider-supported model>
FRONTEND_BASE_URL=https://develop.d1sbjmyazduh3v.amplifyapp.com
CORS_ALLOWED_ORIGINS=https://develop.d1sbjmyazduh3v.amplifyapp.com
```

For the `prod` profile, `VNPAY_RETURN_URL` is mandatory and the backend fails
startup unless it is an absolute HTTPS URL on the same origin as
`FRONTEND_BASE_URL`, with the exact path `/checkout/return` and no query string
or fragment. Register that browser return URL in the VNPay merchant portal.
Register the public server-to-server callback separately as:

```text
https://<api-domain>/api/v1/payments/vnpay/ipn
```

The browser return page only polls order status; the signed IPN remains the
authoritative payment confirmation. A copy-safe non-secret variable template is
available at `deploy/.env.production.example`.

Never commit real passwords, JWT secrets, or OAuth secrets to Git.

`PAYOUT_SECURITY_SECRET` is not supplied by VNPay, AWS, or a bank. Generate it
once for ManabiHub and store it as an Elastic Beanstalk environment property.
Generate `KYC_IDENTITY_SECRET` separately; do not reuse the same value:

```powershell
$secretBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
[Convert]::ToBase64String($secretBytes)
```

Run the command twice and copy each output directly into the corresponding
environment property. The command prints a newly generated secret, so do not
paste its output into chat, Jira, source code, screenshots, or logs.

Keep both secrets stable:

- changing `PAYOUT_SECURITY_SECRET` without a key-rotation migration makes
  existing encrypted bank-account numbers unreadable and changes OTP/account
  fingerprints;
- changing `KYC_IDENTITY_SECRET` changes identity fingerprints and can break
  duplicate-identity detection;
- changing `JWT_SECRET` invalidates active sessions, which is normally safe but
  should still be scheduled.

Before deployment, load the intended environment values in a secure terminal
and run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-release-config.ps1
```

The script reports only presence and length, never the secret values. AI
provider behavior and the live smoke procedure are documented in
`docs/AI_PROVIDER_RUNBOOK.md`.

Set the environment health check path to:

```text
/actuator/health/readiness
```

## 3. RDS network and authentication

- Prefer keeping Elastic Beanstalk and RDS in the same region and VPC.
- For a VPC database, allow PostgreSQL TCP `5432` from the Elastic Beanstalk
  EC2 security group instead of `0.0.0.0/0`.
- If the Aurora Internet access gateway is used, connect through its public RDS
  endpoint and set `iamHost` to the writer endpoint shown by the RDS console.
- IAM authentication requires an AWS RDS hostname and TLS (`sslmode=require`).

Flyway owns schema changes. The production profile uses
`spring.jpa.hibernate.ddl-auto=validate`; do not switch it back to `update`.

## 4. HTTPS between Amplify and the API

Amplify is HTTPS, while a single-instance Elastic Beanstalk environment exposes
HTTP by default. Browsers block direct HTTPS-to-HTTP API calls.

Put an API Gateway HTTP API in front of Elastic Beanstalk:

- Route: `ANY /{proxy+}`.
- Integration URL:
  `http://<elastic-beanstalk-domain>/{proxy}`.
- Stage: `$default` with auto-deploy enabled.
- Keep backend CORS allowed origins pointed at the Amplify domain.

Then configure the Amplify `develop` branch variable:

```text
VITE_API_BASE_URL=https://<api-gateway-id>.execute-api.<region>.amazonaws.com/api
```

Redeploy Amplify after changing a `VITE_*` variable because Vite embeds it at
build time. Do not use `https://example.com/api`.

## 5. Smoke checks

```powershell
curl.exe -i https://<api-domain>/actuator/health/readiness
curl.exe -i https://<api-domain>/api/v1/course-categories
```

Expected readiness response:

```json
{"status":"UP"}
```

If nginx returns `502`, inspect `/var/log/web.stdout.log` and
`/var/log/nginx/error.log` from the Elastic Beanstalk full logs. The common
causes are a missing production environment property, failed RDS connectivity,
or an incorrectly structured source bundle.

The three `@manabihub.local` demo administrators are disabled by migration in
every environment. Only the Spring `local` profile re-enables them. Never set a
production deployment to the `local` profile.

### Bootstrap the first production administrator

Production must never reuse the known local demo password. If the database has
no active `SYSTEM_ADMIN`, configure these Elastic Beanstalk environment
properties before deploying:

```text
ADMIN_BOOTSTRAP_EMAIL=<real administrator email>
ADMIN_BOOTSTRAP_PASSWORD=<20-72 byte strong random password>
ADMIN_BOOTSTRAP_FULL_NAME=<administrator display name>
```

The password must contain uppercase, lowercase, digit, and special characters
without whitespace. On startup, the application takes a PostgreSQL advisory
lock and creates or reactivates exactly one `SYSTEM_ADMIN`. The operation is
audited without storing the credential.

After the administrator has successfully logged in, remove all three bootstrap
properties from Elastic Beanstalk. Later restarts do not reset the password
when an active `SYSTEM_ADMIN` already exists. If every system administrator is
disabled in the future, startup fails closed until a deliberate bootstrap
credential is configured again.

### Invite later internal administrators

The bootstrap exists only to establish the first `SYSTEM_ADMIN`. Do not add
Course Manager or Finance Manager credentials as environment properties.
After the first login, use **Admin Portal > Internal accounts** to invite each
operator with exactly one role.

An invited account remains `DISABLED` until the recipient follows the
single-use password setup link. The backend stores only a SHA-256 token hash,
expires invitations after `ADMIN_INVITATION_TTL_HOURS` (24 hours by default),
and never sends a temporary password.

Before creating an invitation, configure and verify:

```text
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<SMTP account>
MAIL_PASSWORD=<SMTP app password or provider credential>
FRONTEND_BASE_URL=https://develop.d1sbjmyazduh3v.amplifyapp.com
ADMIN_INVITATION_TTL_HOURS=24
```

The invitation is persisted before email delivery is queued. If the mail
provider rejects delivery, fix SMTP configuration and use **Send again** in
the Admin Portal; this revokes every older open link for that account.
