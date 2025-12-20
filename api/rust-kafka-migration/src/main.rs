mod config;
mod db;
mod error;
mod handlers;
mod kafka;
mod middleware;
mod routes;
mod services;
mod utils;

use std::sync::Arc;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;
use db::DbConnection;
use db::repositories::{UserRepository, MenuRepository, InventoryRepository, OutletRepository};
use error::AppResult;
use kafka::KafkaProducer;
use services::{MenuService, InventoryService, OutletService};

/// Application state shared across all handlers
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: Arc<DbConnection>,
    pub kafka: Arc<KafkaProducer>,
    pub user_repo: UserRepository,
    pub menu_service: MenuService,
    pub inventory_service: InventoryService,
    pub outlet_service: OutletService,
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

    // Initialize repositories
    let user_repo = UserRepository::new(db.clone());
    let menu_repo = MenuRepository::new(db.clone());
    let inventory_repo = InventoryRepository::new(db.clone());
    let outlet_repo = OutletRepository::new(db.clone());

    // Initialize services
    let menu_service = MenuService::new(menu_repo.clone(), inventory_repo.clone(), kafka.clone());
    let inventory_service = InventoryService::new(inventory_repo.clone(), menu_repo.clone(), kafka.clone());
    let outlet_service = OutletService::new(outlet_repo.clone());

    // Create application state
    let state = Arc::new(AppState {
        config: config.clone(),
        db,
        kafka,
        user_repo,
        menu_service,
        inventory_service,
        outlet_service,
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
