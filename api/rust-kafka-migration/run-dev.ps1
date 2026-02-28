# First, set vcpkg environment variables
$env:VCPKG_ROOT = "C:\Users\memer\vcpkg"
$env:VCPKG_DEFAULT_TRIPLET = "x64-windows"
$env:VCPKG_TARGET_TRIPLET = "x64-windows"

# Set search path for DLLs at runtime
$vcpkg_bin = "$env:VCPKG_ROOT\installed\x64-windows\bin"
$env:PATH = "$vcpkg_bin;$env:PATH"

# Set OpenSSL environment variables for compilation
$env:OPENSSL_DIR = "$env:VCPKG_ROOT\installed\x64-windows"
$env:OPENSSL_LIB_DIR = "$env:OPENSSL_DIR\lib"
$env:OPENSSL_INCLUDE_DIR = "$env:OPENSSL_DIR\include"
$env:OPENSSL_ROOT_DIR = $env:OPENSSL_DIR

# Set Zlib environment variables
$env:ZLIB_ROOT = "$env:VCPKG_ROOT\installed\x64-windows"
$env:ZLIB_LIB_DIR = "$env:ZLIB_ROOT\lib"
$env:ZLIB_INCLUDE_DIR = "$env:ZLIB_ROOT\include"

# Set LIB and INCLUDE for the MSVC linker/compiler
$env:LIB = "$env:VCPKG_ROOT\installed\x64-windows\lib;$env:LIB"
$env:INCLUDE = "$env:VCPKG_ROOT\installed\x64-windows\include;$env:INCLUDE"

# Help rdkafka-sys build script
$env:RDKAFKA_BUILD_STATIC = "0"

# Global linker flags
$env:RUSTFLAGS = "-L native=$env:VCPKG_ROOT\installed\x64-windows\lib"

# Toolchain
$env:CMAKE_TOOLCHAIN_FILE = "$env:VCPKG_ROOT\scripts\buildsystems\vcpkg.cmake"

# Aggressively kill any process that might be locking the target folder
Write-Host "Releasing file locks..." -ForegroundColor Cyan
Get-Process | Where-Object { $_.Path -like "*rust-kafka-migration*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Ensure DLLs are in the target directory (workaround for PATH issues)
Write-Host "Syncing vcpkg DLLs..." -ForegroundColor Cyan
if (!(Test-Path "target\debug")) { New-Item -ItemType Directory "target\debug" -Force | Out-Null }
Copy-Item "$vcpkg_bin\*.dll" "target\debug\" -Force -ErrorAction SilentlyContinue

# Clear cargo build cache
Write-Host "Cleaning build cache..." -ForegroundColor Yellow
try {
    cargo clean
}
catch {
    Write-Host "Warning: Cargo clean failed. Attempting build anyway..." -ForegroundColor Gray
}

# Run in development mode
Write-Host "Starting Baraja Coffee API in DEVELOPMENT mode..." -ForegroundColor Green
$env:RUST_LOG = "info,baraja_coffee_api=debug"
$env:NODE_ENV = "development"
cargo run