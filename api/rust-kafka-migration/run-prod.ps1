# Run in production mode
Write-Host "Starting Baraja Coffee API in PRODUCTION mode..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
cargo run --release
