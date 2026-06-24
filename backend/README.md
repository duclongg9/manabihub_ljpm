# ManabiHub Backend

This is the initial Spring Boot backend skeleton for **ManabiHub** - a Japanese learning marketplace platform.

## Tech Stack
- **Language:** Java 21
- **Framework:** Spring Boot 3.3.1
- **Build Tool:** Maven
- **Database:** PostgreSQL
- **Migrations:** Flyway
- **APIs & Documentation:** Springdoc OpenAPI / Swagger

---

## Directory Structure

```text
backend/
├── pom.xml                               # Maven project configuration
├── README.md                             # Project setup and documentation
├── src/main/java/com/manabihub/
│   ├── ManabiHubApplication.java         # Application main runner
│   ├── common/                           # Cross-cutting concerns (responses, exceptions)
│   │   ├── response/                     # ApiResponse and ErrorResponse structures
│   │   ├── exception/                    # GlobalExceptionHandler and BusinessException
│   │   ├── constants/                    # Constant values and enums
│   │   └── util/                         # Common utility classes
│   ├── security/                         # Security models and configs
│   │   ├── config/                       # Security filter chain and JWT configurations
│   │   ├── jwt/                          # JWT logic and utility files
│   │   ├── oauth/                        # OAuth2 client integration
│   │   └── principal/                    # Security principals / UserDetails
│   └── [domain-packages]/                # Domain modules placeholders (e.g. identity, kyc, course, etc.)
└── src/main/resources/
    ├── application.yml                   # Common configurations
    ├── application-local.yml             # Local environment configurations (database defaults)
    └── db/migration/
        └── V001__init_placeholder.sql    # First Flyway migration script (placeholder)
```

---

## How to Build and Run

### Prerequisites
1. **Java Development Kit (JDK) 21** installed and configured on your system.
2. **Maven 3.x** installed.
3. A running **PostgreSQL** database (optional for compilation/testing, required for starting with `local` profile).

### Environment Variables (for local runtime)
When running the application with the `local` profile, the following environment variables are supported with default values:

| Variable Name | Description | Default Value |
| --- | --- | --- |
| `DB_HOST` | Database Hostname | `localhost` |
| `DB_PORT` | Database Port | `5432` |
| `DB_NAME` | Database Name | `manabihub` |
| `DB_USERNAME` | Database Username | `manabihub` |
| `DB_PASSWORD` | Database Password | `manabihub_dev_password` |

### Compile & Test
To build the project and execute automated tests, run:
```bash
mvn clean install
```
*(Tests are configured to bypass database connections during the initial context loading test).*

### Run the Application
To run the Spring Boot application locally with the `local` profile active:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

---

## Verify Endpoints

Once the application has successfully started on port `8080`:

- **Health Checks:**
  - URL: `http://localhost:8080/actuator/health`
  - Returns the health status of the application.
  
- **API Documentation & Swagger UI:**
  - Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
  - OpenAPI Spec JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)
