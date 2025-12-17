# Run in development mode
Write-Host "Starting Baraja Coffee API in DEVELOPMENT mode..." -ForegroundColor Green
$env:NODE_ENV = "development"
cargo run
