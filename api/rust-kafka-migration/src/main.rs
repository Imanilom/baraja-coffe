mod config;
mod db;
mod error;
mod handlers;
mod kafka;
mod middleware;
mod routes;
mod utils;

use axum::Router;
use std::sync::Arc;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;
use db::DbConnection;
use error::AppResult;
use kafka::KafkaProducer;

/// Application state shared across all handlers
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: Arc<DbConnection>,
    pub kafka: Arc<KafkaProducer>,
}

#[tokio::main]
async fn main() -> AppResult<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,baraja_coffee_api=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Baraja Coffee API (Rust)");

    // Load configuration
    let config = Config::from_env()?;
    tracing::info!("Configuration loaded successfully");

    // Connect to MongoDB
    let db = DbConnection::new(&config.database).await?;
    tracing::info!("Database connection established");

    // Initialize Kafka producer
    let kafka = KafkaProducer::new(&config.kafka)?;
    tracing::info!("Kafka producer initialized");

    // Create application state
    let state = Arc::new(AppState {
        config: config.clone(),
        db,
        kafka,
    });

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build application router
    let app = routes::create_routes(state.clone())
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .layer(CompressionLayer::new())
        .with_state(state);

    // Start server
    let addr = format!("0.0.0.0:{}", config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    
    tracing::info!("🚀 Server listening on {}", addr);
    tracing::info!("Environment: {}", config.server.env);
    
    axum::serve(listener, app)
        .await
        .map_err(|e| error::AppError::Internal(format!("Server error: {}", e)))?;

    Ok(())
}
