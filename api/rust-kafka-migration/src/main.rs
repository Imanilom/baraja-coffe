mod config;
mod db;
mod error;
mod handlers;
mod kafka;
mod middleware;
mod routes;
mod services;
mod utils;
mod websocket;

use std::sync::Arc;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;
use db::DbConnection;
use db::repositories::{UserRepository, MenuRepository, InventoryRepository, OutletRepository, OrderRepository};
use error::AppResult;
use kafka::KafkaProducer;
use services::{MenuService, InventoryService, OutletService, LoyaltyService, TaxService, PromoService, SessionService, OrderService};
use websocket::SocketState;

/// Application state shared across all handlers
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: mongodb::Database,
    pub kafka: Arc<KafkaProducer>,
    pub user_repo: UserRepository,
    pub order_repo: OrderRepository,
    pub menu_service: MenuService,
    pub inventory_service: InventoryService,
    pub outlet_service: OutletService,
    pub loyalty_service: LoyaltyService,
    pub tax_service: TaxService,
    pub promo_service: PromoService,
    pub session_service: SessionService,
    pub order_service: OrderService,
    pub lock_util: crate::utils::LockUtil,
    pub socket_state: SocketState,
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
    let order_repo = OrderRepository::new(db.clone());

    // Initialize services
    let menu_service = MenuService::new(menu_repo.clone(), inventory_repo.clone(), kafka.clone());
    let inventory_service = InventoryService::new(inventory_repo.clone(), menu_repo.clone(), kafka.clone());
    let outlet_service = OutletService::new(outlet_repo.clone());
    let loyalty_service = LoyaltyService::new(db.database().clone());
    let tax_service = TaxService::new(db.database().clone());
    let promo_service = PromoService::new(db.database().clone());
    let order_service = OrderService::new(db.database().clone());

    // Initialize Redis and LockUtil
    let redis_client = redis::Client::open(config.redis.url.as_str())
        .map_err(|e| crate::error::AppError::Config(::config::ConfigError::Message(e.to_string())))?;
    let lock_util = utils::LockUtil::new(redis_client.clone());
    tracing::info!("Redis connection initialized");

    // Initialize session service
    let session_service = SessionService::new(redis_client);
    tracing::info!("Session service initialized");

    // Initialize WebSocket state
    let socket_state = SocketState::new();
    tracing::info!("WebSocket state initialized");

    // Create application state
    let state = Arc::new(AppState {
        config: config.clone(),
        db: db.database().clone(),
        kafka,
        user_repo,
        order_repo,
        menu_service,
        inventory_service,
        outlet_service,
        loyalty_service,
        tax_service,
        promo_service,
        session_service,
        order_service,
        lock_util,
        socket_state,
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
