$env:VCPKG_ROOT="C:\Users\memer\vcpkg"
$env:VCPKG_DEFAULT_TRIPLET="x64-windows-static-md"

$env:CMAKE_TOOLCHAIN_FILE="$env:VCPKG_ROOT\scripts\buildsystems\vcpkg.cmake"

$env:OPENSSL_ROOT_DIR="$env:VCPKG_ROOT\installed\x64-windows-static-md"
$env:OPENSSL_INCLUDE_DIR="$env:OPENSSL_ROOT_DIR\include"
$env:OPENSSL_LIB_DIR="$env:OPENSSL_ROOT_DIR\lib"


# Run in development mode
Write-Host "Starting Baraja Coffee API in DEVELOPMENT mode..." -ForegroundColor Green
$env:NODE_ENV = "development"
cargo run
