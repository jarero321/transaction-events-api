<div align="center">

```
 _                                  _   _
| |_ _ __ __ _ _ __  ___  __ _  ___| |_(_) ___  _ __  ___
| __| '__/ _` | '_ \/ __|/ _` |/ __| __| |/ _ \| '_ \/ __|
| |_| | | (_| | | | \__ \ (_| | (__| |_| | (_) | | | \__ \
 \__|_|  \__,_|_| |_|___/\__,_|\___|\__|_|\___/|_| |_|___/
```

### I needed a reference for event-driven architecture. So I built one.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?logo=apachekafka&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

**Event-driven transactions with ACID guarantees and full observability**

[Features](#features) · [Quick Start](#quick-start) · [API](#api-reference) · [Architecture](#architecture)

</div>

---

## Why I Built This

Every fintech project needs:
- ACID transactions that don't lose data
- Events that actually get delivered
- Observability to debug at 3am

I built this as a reference implementation with all the patterns I use in production.

---

## Features

| Feature | What it does |
|---------|--------------|
| ACID Transactions | PostgreSQL with full rollback |
| Outbox Pattern | Guaranteed Kafka delivery |
| Idempotency | `Idempotency-Key` header |
| Event Sourcing | Complete transaction history |
| Observability | Prometheus, Grafana, Loki |
| Hexagonal Architecture | Clean separation |

---

## Quick Start

```bash
git clone https://github.com/jarero321/transaction-events-api
cd transaction-events-api
cp .env.example .env
make up
```

Check health: `curl http://localhost:8080/health`

---

## API Reference

### Create Transaction

```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-123" \
  -d '{
    "amount": 100.50,
    "currency": "USD",
    "sourceAccount": "ACC-001",
    "destinationAccount": "ACC-002"
  }'
```

### Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| `POST` | `/api/v1/transactions` | Create transaction |
| `GET` | `/api/v1/transactions` | List (paginated) |
| `GET` | `/api/v1/transactions/:id` | Get by ID |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                       HTTP Request                        │
│                 Idempotency-Key header                    │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│  CreateTransaction · GetTransaction · ProcessTransaction  │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                    │
│        PostgreSQL (TypeORM) · Kafka · Outbox Worker       │
└───────────────────────────────────────────────────────────┘
```

### Transaction Flow

```
PENDING ──→ PROCESSING ──→ COMPLETED
                       ╲
                        ╲──→ FAILED
```

---

## Outbox Pattern

Guarantees at-least-once delivery:

1. Transaction + outbox event saved in same DB transaction
2. Worker polls every 1s
3. Events published to Kafka
4. Failed events retry automatically

```typescript
await queryRunner.startTransaction();
try {
  await queryRunner.manager.save(transaction);
  await queryRunner.manager.save(event);
  await queryRunner.manager.save(outboxEvent);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
}
```

---

## Observability

| Service | Port | URL |
|---------|------|-----|
| API | 8080 | http://localhost:8080 |
| Grafana | 3000 | http://localhost:3000 |
| Prometheus | 9090 | http://localhost:9090 |
| Loki | 3100 | http://localhost:3100 |

### Metrics

| Metric | Type |
|--------|------|
| `transactions_created_total` | Counter |
| `transactions_completed_total` | Counter |
| `transactions_failed_total` | Counter |
| `transaction_amount` | Histogram |
| `transaction_processing_duration_ms` | Histogram |

---

## Project Structure

```
src/
├── domain/           # Entities, enums
├── application/      # Use cases, ports
└── infrastructure/   # DB, Kafka, HTTP
    ├── database/
    │   ├── entities/
    │   ├── repositories/
    │   └── workers/      # Outbox worker
    ├── kafka/
    └── observability/
```

---

## Make Commands

| Command | What it does |
|---------|--------------|
| `make up` | Start all services |
| `make down` | Stop all |
| `make dev` | Infrastructure only |
| `make logs s=api` | View logs |
| `make test` | Run tests |

---

## License

MIT

---

<div align="center">

**Production patterns for event-driven systems**

</div>
