# Quick Reference: Running with Different Environments

## Windows (PowerShell)

### Development
```powershell
.\run-dev.ps1
```

### Production
```powershell
.\run-prod.ps1
```

### Manual
```powershell
# Development
$env:NODE_ENV = "development"
cargo run

# Production
$env:NODE_ENV = "production"
cargo run --release
```

## Linux/Mac/Git Bash

### Development
```bash
./run-dev.sh
```

### Production
```bash
./run-prod.sh
```

### Manual
```bash
# Development
export NODE_ENV=development
cargo run

# Production
export NODE_ENV=production
cargo run --release
```

## One-Liners

```bash
# Development (Linux/Mac)
NODE_ENV=development cargo run

# Production (Linux/Mac)
NODE_ENV=production cargo run --release
```

## What Gets Loaded

| NODE_ENV | File Loaded | Database | Kafka Topics | Payment Mode |
|----------|-------------|----------|--------------|--------------|
| `development` | `.env.development` | `baraja-coffee-dev` | `*-dev` | Sandbox |
| `production` | `.env.production` | `baraja-coffee-prod` | Production topics | Live |
| (not set) | `.env` | Fallback | Fallback | Fallback |

## Verify Environment

After starting, check the logs:
```
Loaded configuration from .env.development
Environment: development
Database: baraja-coffee-dev
Port: 8080
```
