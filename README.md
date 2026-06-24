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
