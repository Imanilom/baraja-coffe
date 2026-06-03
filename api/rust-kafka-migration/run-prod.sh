#!/bin/bash

# Run in production mode
echo "Starting Baraja Coffee API in PRODUCTION mode..."
export NODE_ENV=production
cargo run --release
