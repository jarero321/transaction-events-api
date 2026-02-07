<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,5,30&height=180&section=header&text=transaction-events-api&fontSize=32&fontColor=fff&animation=fadeIn&fontAlignY=32" />

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![License](https://img.shields.io/github/license/jarero321/transaction-events-api?style=for-the-badge)

**Event-driven transaction processing with ACID guarantees, Outbox Pattern, and full observability.**

<a href="https://github.com/jarero321/transaction-events-api">
  <img src="https://img.shields.io/badge/CODE-2ea44f?style=for-the-badge&logo=github&logoColor=white" alt="code" />
</a>

[Quick Start](#quick-start) •
[API Reference](#api-reference) •
[Architecture](#architecture) •
[Observability](#observability)

</div>

---

## Features

| Feature | Description |
|:--------|:------------|
| **ACID Transactions** | PostgreSQL with full rollback on failure |
| **Outbox Pattern** | Guaranteed at-least-once Kafka delivery |
| **Idempotency** | `Idempotency-Key` header prevents duplicate processing |
| **Event Sourcing** | Complete transaction history via event log |
| **Full Observability** | Prometheus metrics, Grafana dashboards, Loki logs |
| **Hexagonal Architecture** | Clean separation of domain, application, and infrastructure |
| **Docker Compose** | One command to spin up the entire stack |
| **Simulated Processing** | Kafka consumer with configurable failure rates |

## Tech Stack

<div align="center">

**Languages & Frameworks**

<img src="https://skillicons.dev/icons?i=ts,nestjs,nodejs&perline=8" alt="languages" />

**Infrastructure & Tools**

<img src="https://skillicons.dev/icons?i=postgres,kafka,docker,prometheus,grafana&perline=8" alt="infra" />

</div>

## Why I Built This

Every fintech project needs:
- ACID transactions that don't lose data
- Events that actually get delivered
- Observability to debug at 3am

I built this as a reference implementation with all the patterns I use in production.

---

## Quick Start

```bash
git clone https://github.com/jarero321/transaction-events-api.git
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

| Method | Endpoint | Description | Status |
|:-------|:---------|:------------|:-------|
| `POST` | `/api/v1/transactions` | Create transaction | 201 / 200 (cached) |
| `GET` | `/api/v1/transactions` | List (paginated) | 200 |
| `GET` | `/api/v1/transactions/:id` | Get by ID | 200 / 404 |
| `GET` | `/health` | Health check | 200 |
| `GET` | `/metrics` | Prometheus metrics | 200 |

### Query Parameters

| Param | Default | Description |
|:------|:--------|:------------|
| `limit` | `20` | Page size |
| `offset` | `0` | Page offset |

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

### Project Structure

```
src/
├── domain/                  # Entities, enums
│   ├── entities/            # Transaction, TransactionEvent
│   └── enums/               # TransactionStatus, EventType
├── application/             # Use cases, ports
│   ├── ports/               # Repository, Idempotency, Logger, Metrics
│   └── use-cases/           # Create, Get, List, Process transaction
└── infrastructure/          # Concrete implementations
    ├── database/
    │   ├── entities/        # ORM entities (Transaction, Event, Outbox, Idempotency)
    │   ├── repositories/    # TypeORM repositories
    │   └── workers/         # Outbox polling worker
    ├── kafka/               # Producer, Consumer, EventPublisher
    ├── http/                # Controllers, DTOs, AppModule
    └── observability/       # Prometheus metrics, Structured logging
```

| Aspect | Choice |
|:-------|:-------|
| **Architecture** | Hexagonal (Ports & Adapters) |
| **Framework** | NestJS 11 |
| **Database** | PostgreSQL 16 + TypeORM |
| **Events** | Kafka (KafkaJS) with Outbox Pattern |
| **Metrics** | Prometheus + prom-client |
| **Dashboards** | Grafana 10.2 |
| **Logs** | Loki + Promtail |

---

## Outbox Pattern

Guarantees at-least-once delivery:

1. Transaction + outbox event saved in **same DB transaction** (ACID)
2. Worker polls every 1s for pending events
3. Events published to Kafka with retry logic
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
|:--------|:-----|:----|
| API | 8080 | http://localhost:8080 |
| Grafana | 3000 | http://localhost:3000 |
| Prometheus | 9090 | http://localhost:9090 |
| Loki | 3100 | http://localhost:3100 |

### Metrics

| Metric | Type | Labels |
|:-------|:-----|:-------|
| `transactions_created_total` | Counter | currency |
| `transactions_completed_total` | Counter | currency |
| `transactions_failed_total` | Counter | currency, reason |
| `transaction_amount` | Histogram | currency |
| `transaction_processing_duration_ms` | Histogram | status |

---

## Configuration

| Variable | Description | Default |
|:---------|:------------|:--------|
| `PORT` | API port | `8080` |
| `DATABASE_HOST` | PostgreSQL host | `postgres` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | DB username | `transaction_user` |
| `DATABASE_PASSWORD` | DB password | `transaction_pass` |
| `DATABASE_NAME` | DB name | `transaction_db` |
| `KAFKA_BROKERS` | Kafka brokers | `kafka:9092` |

---

## Make Commands

| Command | Description |
|:--------|:------------|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make dev` | Infrastructure only (for local dev) |
| `make logs s=api` | View service logs |
| `make restart s=api` | Restart a service |
| `make test` | Run tests |
| `make lint` | Run ESLint |
| `make clean` | Remove containers and volumes |
| `make ps` | Show running containers |
| `make shell` | Open container shell |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[Report Bug](https://github.com/jarero321/transaction-events-api/issues)** · **[Request Feature](https://github.com/jarero321/transaction-events-api/issues)**

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,5,30&height=120&section=footer" />
