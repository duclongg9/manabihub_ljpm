# ManabiHub Database

This directory is reserved for database related configurations and migrations (e.g., Flyway scripts, seed data).

## Local Development Setup

We use Docker Compose to run a local PostgreSQL database. The setup provides an isolated, persistent local database for development.

### Connection Details
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `manabihub`
- **Username**: `manabihub`
- **Password**: `manabihub_dev_password`

> **Note**: These credentials are only for local development. Never use them for production.

### Starting the Database

From the root of the project, run:
```bash
docker compose -f deploy/docker-compose.local.yml up -d
```

### Stopping the Database

To stop the database container without losing data:
```bash
docker compose -f deploy/docker-compose.local.yml down
```

### Resetting the Database

To completely remove the database and its data volume (WARNING: this will delete all local data):
```bash
docker compose -f deploy/docker-compose.local.yml down -v
```

### pgAdmin (Optional)

An optional pgAdmin service is included in the `docker-compose.local.yml` file. If you'd like a web UI to interact with your database, uncomment the `pgadmin` service in `deploy/docker-compose.local.yml` before starting it. 
It will be available at `http://localhost:5050` with the following credentials:
- **Email**: `admin@manabihub.local`
- **Password**: `admin123`
