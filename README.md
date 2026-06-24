# ManabiHub

Japanese learning platform - SEP490 ManabiHub

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js & npm (for frontend)
- Java 17+ (for backend)

### Starting the Local Database

We use Docker Compose for the local PostgreSQL database. To start it, run:

```bash
docker compose -f deploy/docker-compose.local.yml up -d
```

For more details on the database setup (including stopping, resetting, and connection details), please see the [Database Documentation](database/README.md).

---

## Continuous Integration

CI runs automatically via GitHub Actions (`.github/workflows/ci.yml`).

| Trigger | Condition |
|---------|-----------|
| `pull_request` | Targeting `develop` |
| `push` | To `develop` |

### Jobs

| Job | Command | Environment |
|-----|---------|-------------|
| **Backend Tests** | `./mvnw clean test` | Java 21, Ubuntu |
| **Frontend Build** | `npm ci && npm run build` | Node.js 20, Ubuntu |

Both jobs run in parallel. No database is required — backend tests exclude DataSource auto-configuration.

### Branch Naming

Feature branches must include the Jira issue key:
```
feature/MHB-<number>-<short-description>
```

