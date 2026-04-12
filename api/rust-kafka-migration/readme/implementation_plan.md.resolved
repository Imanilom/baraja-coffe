# Migrate Node.js Express Backend to Rust with Kafka

## Overview

This plan outlines the migration of the entire Baraja Coffee backend from Node.js/Express to Rust with Kafka integration. The current system is a comprehensive restaurant management platform with ~2.5M lines of code across 55 controllers, 41+ models, and complex business logic for orders, inventory, HR, payments, and real-time features.

### Current Architecture Analysis

**Controllers (55 files):**
- Core: Order (9,322 lines), Recipe (74KB), Analytics (95KB), GRO (170KB), Marketlist (80KB)
- Payment: Webhook, Refund, Payment processing (Midtrans/Xendit)
- Operations: Inventory, Stock Opname, Warehouse, Product Stock
- HR: Attendance, Payroll, Employee management
- Customer: Loyalty, Reservations, Events, Tickets
- Real-time: Open Bill, Table Management, POS

**Models (41+ files):**
- Complex schemas: Order (915 lines), Payment, MenuItem, Reservation
- Supporting: User, Device, Location, Outlet, Table, Promo, Voucher
- Specialized modules: HR, Market, Menu, Wedding, Catering

**Services (12 files):**
- Order processing, Payment expiry monitoring, Lock management
- Print logging, FCM notifications, GoSend delivery integration
- Menu pricing, Refund processing

**Background Jobs (5 files):**
- Stock calibration (atomic locks), Order checker, Lock cleanup, Backup jobs

**Queues (4 processors):**
- Order queue, Reservation payment queue

**External Dependencies:**
- Database: MongoDB (Mongoose ODM)
- Payment Gateways: Midtrans, Xendit
- Messaging: FCM (Firebase Cloud Messaging)
- Delivery: GoSend API
- Real-time: WebSocket (Socket.io)
- Queue: Bull (Redis-based)

## User Review Required

> [!IMPORTANT]
> **Migration Scope Confirmation**
> 
> This is a **massive migration** involving:
> - ~2.5M lines of production code
> - Complex business logic with financial transactions
> - Real-time features and WebSocket connections
> - Multiple payment gateway integrations
> - Background job processing
> - Multi-tenant architecture (outlets, warehouses)
> 
> **Questions for you:**
> 1. Do you want to migrate the **entire backend at once** or use a **phased approach** (e.g., start with specific modules)?
> 2. Should we maintain **backward compatibility** with existing clients during migration?
> 3. Do you have a **test environment** for validating the Rust implementation?
> 4. What's your **timeline** for this migration?
> 5. Do you want to keep MongoDB or migrate to a different database (PostgreSQL with SQLx/Diesel)?

> [!WARNING]
> **Breaking Changes**
> 
> This migration will introduce:
> - Different API response formats (Rust serialization vs Node.js)
> - Stricter type checking (may expose hidden bugs)
> - Different error handling patterns
> - Potential performance characteristics changes
> - New deployment requirements (compiled binaries vs Node.js runtime)

> [!CAUTION]
> **High-Risk Areas**
> 
> - **Payment Processing**: Critical financial logic in order.controller.js (9,322 lines)
> - **Stock Management**: Atomic lock mechanisms for inventory
> - **Real-time Features**: WebSocket connections for kitchen displays, table management
> - **Background Jobs**: Stock calibration, payment expiry monitoring
> - **Multi-payment Support**: Split payments, partial payments, refunds

## Proposed Migration Strategy

### Phase 1: Foundation & Infrastructure (Weeks 1-2)

#### Project Setup
- Initialize Rust workspace with Cargo
- Choose web framework: **Axum** (recommended for async performance) or Actix-web
- Set up database layer: **MongoDB driver** (mongodb crate) to maintain compatibility
- Configure Kafka: **rdkafka** for event streaming
- Set up async runtime: **Tokio**

#### Core Infrastructure
- Configuration management (environment variables, multi-tenant config)
- Error handling framework (custom error types, Result patterns)
- Logging and observability (tracing, metrics)
- Database connection pooling
- Middleware: Authentication, CORS, rate limiting, company/tenant isolation

---

### Phase 2: Data Layer Migration (Weeks 3-4)

#### Database Models
Migrate all Mongoose schemas to Rust structs with MongoDB BSON serialization:

**Priority Models:**
- [MIGRATE] Order model (915 lines) - Complex schema with virtuals, middleware
- [MIGRATE] Payment model - Split payments, partial payments
- [MIGRATE] MenuItem model - Inventory tracking, addons, toppings
- [MIGRATE] User model - Authentication, roles, permissions
- [MIGRATE] Reservation model - Table management, open bills
- [MIGRATE] MenuStock & ProductStock - Inventory management

**Supporting Models:**
- [MIGRATE] All 41+ models in `models/` directory
- [MIGRATE] Subdirectories: model_hr, modul_market, modul_menu, modul_wedding, model_catering

#### Database Utilities
- [NEW] `src/db/mod.rs` - Database connection and pooling
- [NEW] `src/db/models/` - All model definitions
- [NEW] `src/db/repositories/` - Repository pattern for data access
- [NEW] `src/db/transactions.rs` - Transaction management

---

### Phase 3: Business Logic Migration (Weeks 5-8)

#### Services Layer
Migrate core business logic to Rust services:

- [NEW] `src/services/order_service.rs` - Order creation, modification, cancellation
- [NEW] `src/services/payment_service.rs` - Payment processing, validation, refunds
- [NEW] `src/services/inventory_service.rs` - Stock management, calibration
- [NEW] `src/services/lock_service.rs` - Distributed locking (Redis-based)
- [NEW] `src/services/notification_service.rs` - FCM integration
- [NEW] `src/services/delivery_service.rs` - GoSend integration
- [NEW] `src/services/loyalty_service.rs` - Customer loyalty programs
- [NEW] `src/services/pricing_service.rs` - Menu pricing, promotions, discounts

#### Utilities Migration
- [NEW] `src/utils/stock_calculator.rs` - Stock calculation logic
- [NEW] `src/utils/payment_utils.rs` - Payment validation and normalization
- [NEW] `src/utils/date_utils.rs` - WIB timezone handling
- [NEW] `src/utils/lock_util.rs` - Atomic locking mechanisms
- [NEW] `src/utils/id_generator.rs` - Order ID generation

---

### Phase 4: API Layer Migration (Weeks 9-12)

#### Controllers to Handlers
Migrate all 55 controllers to Axum handlers:

**Critical Controllers (Priority 1):**
- [NEW] `src/handlers/order.rs` - Order management (9,322 lines → optimized)
- [NEW] `src/handlers/payment.rs` - Payment processing
- [NEW] `src/handlers/menu.rs` - Menu management
- [NEW] `src/handlers/inventory.rs` - Stock management
- [NEW] `src/handlers/reservation.rs` - Reservation & open bills

**Business Operations (Priority 2):**
- [NEW] `src/handlers/analytics.rs` - Analytics and reporting
- [NEW] `src/handlers/cashier_report.rs` - Cashier reports
- [NEW] `src/handlers/gro.rs` - GRO operations
- [NEW] `src/handlers/marketlist.rs` - Market list management
- [NEW] `src/handlers/recipe.rs` - Recipe management

**Supporting Features (Priority 3):**
- [NEW] `src/handlers/auth.rs` - Authentication
- [NEW] `src/handlers/customer.rs` - Customer management
- [NEW] `src/handlers/hr/` - HR module (8 files)
- [NEW] `src/handlers/promo.rs` - Promotions and vouchers
- [NEW] `src/handlers/event.rs` - Events and tickets
- [NEW] All remaining 40+ controllers

#### Routes
- [NEW] `src/routes/mod.rs` - Route registration
- [NEW] Individual route modules matching current structure

---

### Phase 5: Real-time & Background Jobs (Weeks 13-14)

#### WebSocket Integration
- [NEW] `src/websocket/mod.rs` - WebSocket server setup
- [NEW] `src/websocket/handlers/` - Socket event handlers
- [NEW] `src/websocket/rooms.rs` - Room management for kitchen displays

#### Kafka Integration
- [NEW] `src/kafka/producer.rs` - Event publishing
- [NEW] `src/kafka/consumer.rs` - Event consumption
- [NEW] `src/kafka/events/` - Event type definitions
- [NEW] `src/kafka/topics.rs` - Topic management

**Event Streams:**
- Order events (created, updated, completed, cancelled)
- Payment events (processed, failed, refunded)
- Inventory events (stock updated, calibrated)
- Notification events (FCM, WebSocket broadcasts)

#### Background Jobs
- [NEW] `src/jobs/stock_calibration.rs` - Stock calibration with atomic locks
- [NEW] `src/jobs/order_checker.rs` - Order validation and cleanup
- [NEW] `src/jobs/payment_expiry.rs` - Payment expiry monitoring
- [NEW] `src/jobs/lock_cleanup.rs` - Lock cleanup
- [NEW] `src/jobs/scheduler.rs` - Job scheduling (using tokio-cron-scheduler)

---

### Phase 6: External Integrations (Weeks 15-16)

#### Payment Gateways
- [NEW] `src/integrations/midtrans/` - Midtrans API client
- [NEW] `src/integrations/xendit/` - Xendit API client
- [NEW] `src/integrations/payment_gateway.rs` - Unified payment interface

#### Third-party Services
- [NEW] `src/integrations/fcm.rs` - Firebase Cloud Messaging
- [NEW] `src/integrations/gosend.rs` - GoSend delivery API
- [NEW] `src/integrations/printer.rs` - Printer integration

---

### Phase 7: Testing & Optimization (Weeks 17-18)

#### Testing
- [NEW] Unit tests for all services and utilities
- [NEW] Integration tests for API endpoints
- [NEW] Load testing for critical paths (order creation, payment processing)
- [NEW] Database migration scripts and validation

#### Optimization
- Implement connection pooling (database, Redis, HTTP clients)
- Add caching layers (Redis for frequently accessed data)
- Optimize database queries (indexes, aggregations)
- Implement request batching for Kafka events
- Profile and optimize hot paths (order processing, stock calculations)

---

## Rust Technology Stack

### Core Framework
- **Web Framework**: Axum 0.7 (built on Tokio, hyper)
- **Async Runtime**: Tokio 1.x
- **Serialization**: Serde with serde_json, bson

### Database
- **MongoDB**: mongodb 2.x (official driver)
- **Connection Pool**: Built-in pooling
- **Migrations**: Custom migration scripts

### Messaging & Events
- **Kafka**: rdkafka 0.36
- **WebSocket**: axum-tungstenite or tokio-tungstenite
- **Queue**: Custom implementation with Kafka or Redis

### External Services
- **HTTP Client**: reqwest 0.11 (async)
- **Redis**: redis 0.24 (for locks, caching)
- **FCM**: Custom implementation with reqwest

### Utilities
- **Date/Time**: chrono 0.4 (WIB timezone handling)
- **UUID**: uuid 1.x
- **Logging**: tracing + tracing-subscriber
- **Config**: config 0.13 or dotenvy
- **Error Handling**: thiserror, anyhow

### Testing
- **Unit Tests**: Built-in Rust testing
- **Integration Tests**: Custom test harness
- **Load Testing**: External tool (k6, wrk)

---

## Project Structure

```
rust-kafka-migration/
├── Cargo.toml
├── Cargo.lock
├── .env.example
├── README.md
│
├── src/
│   ├── main.rs                 # Application entry point
│   ├── config.rs               # Configuration management
│   ├── error.rs                # Error types and handling
│   │
│   ├── db/
│   │   ├── mod.rs
│   │   ├── connection.rs       # Database connection
│   │   ├── models/             # All data models
│   │   └── repositories/       # Data access layer
│   │
│   ├── handlers/               # API handlers (controllers)
│   │   ├── mod.rs
│   │   ├── order.rs
│   │   ├── payment.rs
│   │   └── ... (55 handlers)
│   │
│   ├── services/               # Business logic
│   │   ├── mod.rs
│   │   ├── order_service.rs
│   │   └── ...
│   │
│   ├── middleware/             # HTTP middleware
│   │   ├── auth.rs
│   │   ├── company.rs
│   │   └── ...
│   │
│   ├── routes/                 # Route definitions
│   │   └── mod.rs
│   │
│   ├── kafka/                  # Kafka integration
│   │   ├── producer.rs
│   │   ├── consumer.rs
│   │   └── events/
│   │
│   ├── websocket/              # WebSocket server
│   │   ├── mod.rs
│   │   └── handlers/
│   │
│   ├── jobs/                   # Background jobs
│   │   ├── mod.rs
│   │   └── ...
│   │
│   ├── integrations/           # External APIs
│   │   ├── midtrans/
│   │   ├── xendit/
│   │   ├── fcm.rs
│   │   └── gosend.rs
│   │
│   └── utils/                  # Utilities
│       ├── mod.rs
│       ├── date_utils.rs
│       └── ...
│
├── tests/                      # Integration tests
│   ├── order_tests.rs
│   └── ...
│
└── migrations/                 # Database migrations
    └── ...
```

---

## Key Optimizations in Rust

### 1. **Type Safety**
- Eliminate runtime type errors with Rust's strong type system
- Use enums for status fields (Order status, Payment status, etc.)
- Leverage Option<T> and Result<T, E> for null safety

### 2. **Performance**
- Zero-cost abstractions (no runtime overhead)
- Efficient memory management (no garbage collection)
- Parallel processing with Tokio async runtime
- Connection pooling for database and HTTP clients

### 3. **Concurrency**
- Safe concurrent access with Rust's ownership system
- Async/await for non-blocking I/O
- Lock-free data structures where possible
- Atomic operations for stock management

### 4. **Error Handling**
- Explicit error handling with Result types
- Custom error types with thiserror
- Structured error responses for API clients

### 5. **Code Organization**
- Modular architecture with clear separation of concerns
- Repository pattern for data access
- Service layer for business logic
- Dependency injection for testability

---

## Verification Plan

### Automated Tests

#### Unit Tests
```bash
# Run all unit tests
cd rust-kafka-migration
cargo test --lib

# Run specific module tests
cargo test services::order_service
cargo test utils::stock_calculator
```

#### Integration Tests
```bash
# Run integration tests
cargo test --test '*'

# Run with logging
RUST_LOG=debug cargo test --test order_tests -- --nocapture
```

#### Load Testing
```bash
# Build release binary
cargo build --release

# Run the server
./target/release/baraja-coffee-api

# In another terminal, run load tests (using k6)
k6 run tests/load/order_creation.js
k6 run tests/load/payment_processing.js
```

### Manual Verification

#### 1. **Order Flow Testing**
- Create a new order via API
- Add items to open bill
- Process split payment
- Verify stock deduction
- Check Kafka events published
- Validate WebSocket notifications

#### 2. **Payment Integration Testing**
- Test Midtrans payment flow
- Test Xendit payment flow
- Verify webhook handling
- Test refund processing

#### 3. **Background Jobs Testing**
- Verify stock calibration runs correctly
- Check order expiry monitoring
- Validate lock cleanup

#### 4. **Real-time Features Testing**
- Connect to WebSocket server
- Verify kitchen display updates
- Test table status updates

### Database Migration Validation
```bash
# Run migration script to validate data integrity
cargo run --bin validate_migration

# Compare record counts
# Compare sample data between Node.js and Rust APIs
```

### Performance Benchmarking
```bash
# Benchmark critical endpoints
cargo bench

# Compare with Node.js baseline
# - Order creation latency
# - Payment processing throughput
# - Stock calculation performance
```

---

## Migration Checklist

- [ ] Set up Rust project structure
- [ ] Implement database connection and models
- [ ] Migrate core services (order, payment, inventory)
- [ ] Migrate all API handlers
- [ ] Implement Kafka integration
- [ ] Migrate background jobs
- [ ] Implement WebSocket server
- [ ] Integrate payment gateways
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment preparation
