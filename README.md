<div align="center">

# Transaction Events API

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Kafka-231F20?logo=apachekafka&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

**Event-driven transaction processing API with ACID guarantees, Outbox pattern, and full observability stack.**

[Features](#features) •
[Architecture](#architecture) •
[Getting Started](#getting-started) •
[API Reference](#api-reference) •
[Observability](#observability)

</div>

---

## Features

| Feature | Description |
|---------|-------------|
| **ACID Transactions** | All operations use PostgreSQL transactions with full rollback support |
| **Outbox Pattern** | Guaranteed event delivery to Kafka with automatic retry |
| **Idempotency** | Duplicate request protection via `Idempotency-Key` header |
| **Event Sourcing** | Complete transaction history with domain events |
| **Observability** | Prometheus metrics, Grafana dashboards, Loki logs |
| **Hexagonal Architecture** | Clean separation between domain, application, and infrastructure |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           HTTP Request                              │
│                      (Idempotency-Key header)                       │
└─────────────────────────────┬───────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ CreateTransaction│  │ GetTransaction  │  │ ProcessTransaction │ │
│  │    UseCase      │  │    UseCase      │  │     UseCase        │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘ │
└───────────┼────────────────────┼─────────────────────┼─────────────┘
            ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  PostgreSQL  │  │    Kafka     │  │    Outbox Worker         │  │
│  │  (TypeORM)   │  │  (KafkaJS)   │  │  (Background polling)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
src/
├── domain/                    # Business logic (entities, enums)
│   ├── entities/
│   │   ├── transaction.entity.ts
│   │   └── transaction-event.entity.ts
│   └── enums/
│       ├── transaction-status.enum.ts
│       └── transaction-event-type.enum.ts
│
├── application/               # Use cases and ports (interfaces)
│   ├── use-cases/
│   │   ├── create-transaction.use-case.ts
│   │   ├── get-transaction.use-case.ts
│   │   ├── list-transactions.use-case.ts
│   │   └── process-transaction.use-case.ts
│   └── ports/
│       ├── transaction-repository.port.ts
│       ├── idempotency.port.ts
│       ├── outbox.port.ts
│       └── ...
│
└── infrastructure/            # External concerns (DB, Kafka, HTTP)
    ├── database/
    │   ├── entities/          # ORM entities
    │   ├── repositories/      # Port implementations
    │   └── workers/           # Outbox worker
    ├── kafka/
    │   ├── kafka-producer.service.ts
    │   └── transaction-event.consumer.ts
    ├── http/
    │   ├── controllers/
    │   └── dtos/
    └── observability/
        ├── metrics/
        └── logging/
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/transaction-events-api.git
cd transaction-events-api

# Start all services
docker-compose up -d

# Check service health
curl http://localhost:8080/health
```

### Local Development

```bash
# Install dependencies
npm install

# Start infrastructure only
docker-compose up -d postgres kafka zookeeper

# Run in development mode
npm run start:dev
```

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/transactions` | Create a new transaction |
| `GET` | `/api/v1/transactions` | List transactions (paginated) |
| `GET` | `/api/v1/transactions/:id` | Get transaction by ID |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |

### Create Transaction

```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-123" \
  -d '{
    "amount": 100.50,
    "currency": "USD",
    "sourceAccount": "ACC-001",
    "destinationAccount": "ACC-002"
  }'
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 100.50,
  "currency": "USD",
  "sourceAccount": "ACC-001",
  "destinationAccount": "ACC-002",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### List Transactions

```bash
curl "http://localhost:8080/api/v1/transactions?limit=10&offset=0"
```

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

### Idempotency

Requests with the same `Idempotency-Key` header return cached results:

| Request | Status Code | Behavior |
|---------|-------------|----------|
| First request | `201 Created` | Transaction created |
| Duplicate request | `200 OK` | Cached response returned |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `8080` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | PostgreSQL user | `transaction_user` |
| `DATABASE_PASSWORD` | PostgreSQL password | `transaction_pass` |
| `DATABASE_NAME` | PostgreSQL database | `transaction_db` |
| `KAFKA_BROKERS` | Kafka broker list | `localhost:9092` |

## Observability

### Services

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| API | 8080 | http://localhost:8080 | - |
| Grafana | 3000 | http://localhost:3000 | admin / admin |
| Prometheus | 9090 | http://localhost:9090 | - |
| Loki | 3100 | http://localhost:3100 | - |
| Kafka | 29092 | localhost:29092 | - |
| PostgreSQL | 5432 | localhost:5432 | transaction_user / transaction_pass |

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `transactions_created_total` | Counter | Total transactions created by currency |
| `transactions_completed_total` | Counter | Total transactions completed |
| `transactions_failed_total` | Counter | Total transactions failed |
| `transaction_amount` | Histogram | Transaction amounts by currency |
| `transaction_processing_duration_ms` | Histogram | Processing duration |

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `transactions` | Main transaction records |
| `transaction_events` | Event history per transaction |
| `outbox_events` | Pending events for Kafka delivery |
| `idempotency_keys` | Request deduplication (24h TTL) |

### Transaction States

```
PENDING → PROCESSING → COMPLETED
                   ↘ FAILED
```

## Patterns Implemented

### Outbox Pattern

Guarantees at-least-once delivery to Kafka:

1. Transaction and outbox event saved in same DB transaction
2. Background worker polls outbox every 1 second
3. Events published to Kafka, marked as completed
4. Failed events retry automatically

### ACID Guarantees

All mutations use PostgreSQL transactions:

```typescript
await queryRunner.startTransaction();
try {
  await queryRunner.manager.save(transaction);
  await queryRunner.manager.save(event);
  await queryRunner.manager.save(outboxEvent);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run start:dev` | Start with hot reload |
| `npm run start:prod` | Start from dist/ |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## License

MIT

