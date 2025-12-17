# Baraja Coffee API - Rust Migration

A high-performance Rust implementation of the Baraja Coffee backend API with Kafka event streaming.

## Features

- **Web Framework**: Axum (async, high-performance)
- **Database**: MongoDB with connection pooling
- **Event Streaming**: Kafka (rdkafka)
- **Async Runtime**: Tokio
- **API Compatibility**: Maintains same routes and JSON response format as Node.js version

## Project Structure

```
src/
├── main.rs              # Application entry point
├── config/              # Configuration management
├── db/                  # Database layer
│   ├── connection.rs    # MongoDB connection
│   ├── models/          # Data models
│   └── repositories/    # Data access layer
├── handlers/            # API route handlers
├── services/            # Business logic
├── middleware/          # HTTP middleware (auth, CORS, etc.)
├── routes/              # Route definitions
├── kafka/               # Kafka integration
│   ├── producer.rs      # Event publishing
│   └── events.rs        # Event type definitions
├── utils/               # Utility functions
└── error/               # Error handling
```

## Setup

### Prerequisites

- Rust 1.75+ (install from https://rustup.rs/)
- MongoDB
- Kafka (optional for development)
- Redis (for locks and caching)

### Installation

1. Clone the repository
2. Choose your environment configuration:

**For Development:**
```bash
cp .env.development .env
# Or on Windows:
copy .env.development .env
```

**For Production:**
```bash
cp .env.production .env
# Or on Windows:
copy .env.production .env
```

3. Update `.env` with your configuration:
   - MongoDB connection string
   - Kafka brokers
   - Payment gateway credentials
   - External API keys

### Running

#### Development Mode

**Linux/Mac:**
```bash
./run-dev.sh
# Or manually:
export NODE_ENV=development
cargo run
```

**Windows (PowerShell):**
```powershell
.\run-dev.ps1
# Or manually:
$env:NODE_ENV = "development"
cargo run
```

**Direct command:**
```bash
NODE_ENV=development cargo run
```

#### Production Mode

**Linux/Mac:**
```bash
./run-prod.sh
# Or manually:
export NODE_ENV=production
cargo run --release
```

**Windows (PowerShell):**
```powershell
.\run-prod.ps1
# Or manually:
$env:NODE_ENV = "production"
cargo run --release
```

**Direct command:**
```bash
NODE_ENV=production cargo run --release
```

#### Environment Files

The application automatically loads the correct environment file based on `NODE_ENV`:

- `NODE_ENV=development` → loads `.env.development`
- `NODE_ENV=production` → loads `.env.production`
- No `NODE_ENV` set → loads `.env` (defaults to development)

**Environment Variables:**
- `MONGODB_URI` - MongoDB connection string (different for dev/prod)
- `MONGODB_DATABASE` - Database name
- `KAFKA_BROKERS` - Kafka broker addresses
- `JWT_SECRET` - Secret key for JWT tokens
- `MIDTRANS_IS_PRODUCTION` - Payment gateway mode
- `RUST_LOG` - Logging level

### Testing

```bash
# Run all tests
cargo test

# Run with logging
RUST_LOG=debug cargo test -- --nocapture
```

## API Compatibility

This Rust implementation maintains **100% API compatibility** with the Node.js version:

- Same route paths (e.g., `/api/orders`, `/api/payments`)
- Same JSON response format:
  ```json
  {
    "success": true,
    "message": "Optional message",
    "data": { ... }
  }
  ```
- Same error response format:
  ```json
  {
    "success": false,
    "message": "Error message",
    "error": "Error message"
  }
  ```

## Environment Variables

See `.env.example` for all available configuration options.

## Development

### Adding New Routes

1. Create handler in `src/handlers/`
2. Add route in `src/routes/mod.rs`
3. Implement business logic in `src/services/`

### Database Models

Models are defined in `src/db/models/` using MongoDB BSON serialization.

### Kafka Events

Event types are defined in `src/kafka/events.rs`. Publish events using the `KafkaProducer`.

## Performance

Expected improvements over Node.js:
- 3-5x faster order creation
- 5-8x higher payment processing throughput
- 3-4x faster stock calibration
- 3-5x lower memory usage

## License

Proprietary - Baraja Coffee
