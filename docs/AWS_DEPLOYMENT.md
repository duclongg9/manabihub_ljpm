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
FRONTEND_BASE_URL=https://develop.d1sbjmyazduh3v.amplifyapp.com
CORS_ALLOWED_ORIGINS=https://develop.d1sbjmyazduh3v.amplifyapp.com
```

Never commit real passwords, JWT secrets, or OAuth secrets to Git.

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
