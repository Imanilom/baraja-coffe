# Environment Configuration Guide

## Overview

The Baraja Coffee API supports multiple environments (development, production) with separate MongoDB databases and configurations.

## Environment Files

### Available Files:
- `.env.development` - Development environment configuration
- `.env.production` - Production environment configuration
- `.env.example` - Template for creating custom .env files

### How It Works:

The application loads configuration based on the `NODE_ENV` environment variable:

1. **Development Mode** (`NODE_ENV=development`):
   - Loads `.env.development`
   - Uses development MongoDB database
   - Debug logging enabled
   - Payment gateways in sandbox mode

2. **Production Mode** (`NODE_ENV=production`):
   - Loads `.env.production`
   - Uses production MongoDB database
   - Info-level logging
   - Payment gateways in live mode

3. **Default** (no `NODE_ENV` set):
   - Loads `.env` if it exists
   - Falls back to development mode

## Quick Start

### Option 1: Using Scripts (Recommended)

**Windows (PowerShell):**
```powershell
# Development
.\run-dev.ps1

# Production
.\run-prod.ps1
```

**Linux/Mac:**
```bash
# Development
chmod +x run-dev.sh
./run-dev.sh

# Production
chmod +x run-prod.sh
./run-prod.sh
```

### Option 2: Manual Commands

**Development:**
```bash
# Windows PowerShell
$env:NODE_ENV = "development"
cargo run

# Linux/Mac/Git Bash
export NODE_ENV=development
cargo run

# One-liner (Linux/Mac)
NODE_ENV=development cargo run
```

**Production:**
```bash
# Windows PowerShell
$env:NODE_ENV = "production"
cargo run --release

# Linux/Mac/Git Bash
export NODE_ENV=production
cargo run --release

# One-liner (Linux/Mac)
NODE_ENV=production cargo run --release
```

## Configuration Differences

### Development (.env.development)
```env
MONGODB_URI=mongodb://localhost:27017/baraja-coffee-dev
MONGODB_DATABASE=baraja-coffee-dev
KAFKA_TOPICS_ORDER=order-events-dev
MIDTRANS_IS_PRODUCTION=false
RUST_LOG=info,baraja_coffee_api=debug
```

### Production (.env.production)
```env
MONGODB_URI=mongodb://production-host:27017/baraja-coffee-prod
MONGODB_DATABASE=baraja-coffee-prod
KAFKA_TOPICS_ORDER=order-events
MIDTRANS_IS_PRODUCTION=true
RUST_LOG=info,baraja_coffee_api=info
```

## Environment Variables Reference

### Required Variables:

#### Server
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 8080)

#### Database
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DATABASE` - Database name

#### Kafka
- `KAFKA_BROKERS` - Kafka broker addresses
- `KAFKA_GROUP_ID` - Consumer group ID
- `KAFKA_TOPICS_ORDER` - Order events topic
- `KAFKA_TOPICS_PAYMENT` - Payment events topic
- `KAFKA_TOPICS_INVENTORY` - Inventory events topic
- `KAFKA_TOPICS_NOTIFICATION` - Notification events topic

#### Security
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRATION` - Token expiration in seconds (default: 604800 = 7 days)

#### Payment Gateways
- `MIDTRANS_SERVER_KEY` - Midtrans server key
- `MIDTRANS_CLIENT_KEY` - Midtrans client key
- `MIDTRANS_IS_PRODUCTION` - true/false
- `XENDIT_SECRET_KEY` - Xendit secret key
- `XENDIT_IS_PRODUCTION` - true/false

#### External Services
- `FCM_SERVER_KEY` - Firebase Cloud Messaging key
- `GOSEND_API_KEY` - GoSend API key
- `GOSEND_BASE_URL` - GoSend API base URL

#### Redis
- `REDIS_URL` - Redis connection URL

#### Logging
- `RUST_LOG` - Log level (e.g., "info,baraja_coffee_api=debug")
- `LOG_FILE_PATH` - Log file directory

#### CORS
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins

#### Rate Limiting
- `RATE_LIMIT_REQUESTS_PER_MINUTE` - Max requests per minute

## Best Practices

### 1. Never Commit Sensitive Data
```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### 2. Use Different Databases
- Development: `baraja-coffee-dev`
- Production: `baraja-coffee-prod`
- Testing: `baraja-coffee-test`

### 3. Separate Kafka Topics
- Development: `order-events-dev`, `payment-events-dev`
- Production: `order-events`, `payment-events`

### 4. Strong Secrets in Production
```bash
# Generate secure JWT secret
openssl rand -base64 64
```

### 5. Environment-Specific Logging
- Development: Debug level for troubleshooting
- Production: Info level to reduce noise

## Troubleshooting

### Issue: Wrong environment loaded
**Solution:** Check `NODE_ENV` is set correctly
```bash
# Windows
echo $env:NODE_ENV

# Linux/Mac
echo $NODE_ENV
```

### Issue: Can't find .env file
**Solution:** Ensure file exists and has correct name
```bash
ls -la .env*
```

### Issue: MongoDB connection failed
**Solution:** Verify MongoDB URI in environment file
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/baraja-coffee-dev"
```

### Issue: Environment variables not loading
**Solution:** Check file encoding (should be UTF-8) and format
```bash
# View file contents
cat .env.development
```

## Docker Support (Future)

For containerized deployments:

```dockerfile
# Development
docker run -e NODE_ENV=development baraja-coffee-api

# Production
docker run -e NODE_ENV=production baraja-coffee-api
```

## CI/CD Integration

### GitHub Actions Example:
```yaml
- name: Run tests (development)
  env:
    NODE_ENV: development
  run: cargo test

- name: Build (production)
  env:
    NODE_ENV: production
  run: cargo build --release
```

## Summary

- ✅ Use `.env.development` for local development
- ✅ Use `.env.production` for production deployment
- ✅ Set `NODE_ENV` to switch between environments
- ✅ Use provided scripts for easy switching
- ✅ Keep sensitive data out of version control
- ✅ Use different databases for each environment
