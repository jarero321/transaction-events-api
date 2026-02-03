# ADR-001: Hexagonal Architecture with Event-Driven Design

## Status

Accepted

## Date

2024-01-15

## Context

This project aims to demonstrate a **production-grade transaction processing system** that showcases enterprise patterns and best practices. The goal is to build a portfolio piece that illustrates how to design complex, scalable, and maintainable distributed systems.

### Requirements

1. **Extensibility**: Easy to add new features without modifying existing code
2. **Testability**: Business logic must be testable without infrastructure dependencies
3. **Reliability**: Guaranteed message delivery and data consistency
4. **Observability**: Full visibility into system behavior
5. **Scalability**: Ability to handle high transaction volumes

### Challenges

- Dual-write problem: Writing to database AND message broker is not atomic
- Duplicate requests: Network issues can cause clients to retry
- Distributed tracing: Understanding flow across async boundaries
- Framework coupling: Avoiding lock-in to specific technologies

## Decision

We adopt a **Hexagonal Architecture (Ports & Adapters)** combined with **Event-Driven patterns** and the **Outbox Pattern** for guaranteed delivery.

### Architecture Layers

```
+--------------------------------------------------+
|                 INFRASTRUCTURE                    |
|  +-----------+  +-----------+  +---------------+ |
|  |   HTTP    |  |   Kafka   |  |   Database    | |
|  | Controllers|  | Consumer  |  |   TypeORM    | |
|  +-----------+  +-----------+  +---------------+ |
+--------------------------------------------------+
                        |
                        | Adapters implement Ports
                        v
+--------------------------------------------------+
|                  APPLICATION                      |
|  +----------------+  +-------------------------+ |
|  |   Use Cases    |  |         Ports           | |
|  | CreateTx       |  | TransactionRepository   | |
|  | ProcessTx      |  | IdempotencyService      | |
|  | GetTx          |  | MetricsPort             | |
|  | ListTx         |  | LoggerPort              | |
|  +----------------+  +-------------------------+ |
+--------------------------------------------------+
                        |
                        | Uses domain entities
                        v
+--------------------------------------------------+
|                    DOMAIN                         |
|  +----------------+  +-------------------------+ |
|  |   Entities     |  |         Enums           | |
|  | Transaction    |  | TransactionStatus       | |
|  | TransactionEvt |  | TransactionEventType    | |
|  +----------------+  +-------------------------+ |
+--------------------------------------------------+
```

### Key Patterns

#### 1. Outbox Pattern

Solves the dual-write problem by making database and event publishing atomic:

```
HTTP Request
    |
    v
[DB Transaction]
    ├── INSERT transaction
    ├── INSERT transaction_event
    └── INSERT outbox_event (status: PENDING)
    |
    v
[OutboxWorker] (polls every 1s)
    ├── SELECT pending events
    ├── Publish to Kafka
    └── UPDATE status = COMPLETED
```

**Guarantees**: At-least-once delivery with idempotent consumers.

#### 2. Idempotency

Protects against duplicate requests using `Idempotency-Key` header:

- Client sends unique key per operation
- System caches result for 24 hours
- Duplicate requests return cached response

#### 3. Event Sourcing (Partial)

All state changes are captured as events in `transaction_events` table:

- CREATE_TRANSACTION
- TRANSACTION_COMPLETED
- TRANSACTION_FAILED

Enables audit trails and potential event replay.

### Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | NestJS | DI, modularity, TypeScript native |
| Database | PostgreSQL | ACID, JSONB for events, mature |
| ORM | TypeORM | Transactions API, migrations |
| Messaging | Kafka | Durability, ordering, scalability |
| Metrics | Prometheus | Industry standard, Grafana integration |
| Logs | Loki + Promtail | Log aggregation, Grafana integration |

## Consequences

### Positive

- **Clear separation of concerns**: Each layer has a single responsibility
- **Framework independence**: Domain logic has zero framework dependencies
- **Testability**: Use cases can be tested with mock ports
- **Reliability**: Outbox pattern guarantees event delivery
- **Flexibility**: Easy to swap implementations (e.g., PostgreSQL to MongoDB)
- **Observability**: Complete visibility via metrics and structured logs

### Negative

- **Complexity**: More layers and abstractions than a simple CRUD
- **Learning curve**: Team must understand hexagonal architecture
- **Eventual consistency**: Events are processed asynchronously
- **Operational overhead**: More services to manage (Kafka, monitoring stack)

### Neutral

- **Performance**: Slight overhead from abstraction layers (negligible in practice)
- **Code volume**: More interfaces and mappers, but better organization

## Alternatives Considered

### 1. Simple Layered Architecture (Controller → Service → Repository)

**Rejected**: Tight coupling between layers, hard to test, framework lock-in.

### 2. Direct Kafka Publishing (No Outbox)

**Rejected**: Dual-write problem. If Kafka publish fails after DB commit, data is inconsistent.

### 3. Saga Pattern

**Considered for future**: Useful for multi-service transactions. Current scope is single service.

### 4. CDC (Change Data Capture) with Debezium

**Considered**: Would eliminate outbox table but adds operational complexity (Debezium, Kafka Connect). Outbox is simpler for this scope.

## References

- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Outbox Pattern - microservices.io](https://microservices.io/patterns/data/transactional-outbox.html)
- [Idempotency Patterns - Stripe](https://stripe.com/docs/api/idempotent_requests)
- [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
