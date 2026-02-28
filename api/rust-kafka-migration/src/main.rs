mod common;
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
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;
use db::repositories::{
    AttendanceRepository, CompanyRepository, EmployeeRepository, EventRepository,
    FingerprintRepository, HRSettingRepository, InventoryRepository, MarketListRepository,
    MenuRepository, OrderRepository, OutletRepository, PaymentRepository, SalaryRepository,
    UserRepository,
};
use db::DbConnection;
use error::AppResult;
use kafka::KafkaProducer;
use services::{
    AttendanceService, BpjsService, EmployeeService, FingerprintService, InventoryService,
    LoyaltyService, MarketListService, MenuService, OutletService, PrintService, PromoService,
    SalaryService, TaxService,
};
use websocket::{ConnectionManager, WebSocketBroadcaster};

/// Application state shared across all handlers
/// HR Repositories container
#[derive(Clone)]
pub struct HRRepositories {
    pub company_repo: CompanyRepository,
    pub employee_repo: EmployeeRepository,
    pub attendance_repo: AttendanceRepository,
    pub salary_repo: SalaryRepository,
    pub hr_setting_repo: HRSettingRepository,
    pub fingerprint_repo: FingerprintRepository,
}

/// HR Services container
#[derive(Clone)]
pub struct HRServices {
    pub employee_service: EmployeeService,
    pub attendance_service: AttendanceService,
    pub bpjs_service: BpjsService,
    pub salary_service: SalaryService,
    pub fingerprint_service: FingerprintService,
}

/// Application state shared across all handlers
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: Arc<DbConnection>,
    pub kafka: Arc<KafkaProducer>,
    pub user_repo: UserRepository,
    pub menu_repo: MenuRepository,
    pub event_repo: EventRepository,
    pub order_repo: OrderRepository,
    pub payment_repo: PaymentRepository,

    // HR Modules
    pub hr_repositories: HRRepositories,
    pub hr_services: HRServices,

    pub menu_service: MenuService,
    pub inventory_service: InventoryService,
    pub outlet_service: OutletService,
    pub loyalty_service: LoyaltyService,
    pub tax_service: TaxService,
    pub promo_service: PromoService,
    pub market_list_service: MarketListService,
    pub print_service: PrintService,
    pub lock_util: crate::utils::LockUtil,

    // WebSocket
    pub ws_manager: Arc<ConnectionManager>,
    pub ws_broadcaster: Arc<WebSocketBroadcaster>,
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
    let market_list_repo = MarketListRepository::new(db.clone());
    let payment_repo = PaymentRepository::new(db.clone());
    let event_repo = EventRepository::new(db.clone());

    // Initialize HR Repositories
    let company_repo = CompanyRepository::new(db.clone());
    let employee_repo = EmployeeRepository::new(db.clone());
    let attendance_repo = AttendanceRepository::new(db.clone());
    let salary_repo = SalaryRepository::new(db.clone());
    let hr_setting_repo = HRSettingRepository::new(db.clone());
    let fingerprint_repo = FingerprintRepository::new(db.clone());

    let hr_repositories = HRRepositories {
        company_repo: company_repo.clone(),
        employee_repo: employee_repo.clone(),
        attendance_repo: attendance_repo.clone(),
        salary_repo: salary_repo.clone(),
        hr_setting_repo: hr_setting_repo.clone(),
        fingerprint_repo: fingerprint_repo.clone(),
    };

    // Initialize services
    let menu_service = MenuService::new(menu_repo.clone(), inventory_repo.clone(), kafka.clone());
    let inventory_service =
        InventoryService::new(inventory_repo.clone(), menu_repo.clone(), kafka.clone());
    let outlet_service = OutletService::new(outlet_repo.clone());
    let loyalty_service = LoyaltyService::new(db.database().clone());
    let tax_service = TaxService::new(db.database().clone());
    let promo_service = PromoService::new(db.database().clone());
    let market_list_service =
        MarketListService::new(market_list_repo.clone(), inventory_service.clone());

    // Initialize HR Services
    let employee_service = EmployeeService::new(
        employee_repo.clone(),
        company_repo.clone(),
        user_repo.clone(),
    );
    let attendance_service = AttendanceService::new(attendance_repo.clone(), company_repo.clone());
    let bpjs_service = BpjsService::new();
    let salary_service = SalaryService::new(
        salary_repo.clone(),
        employee_repo.clone(),
        attendance_repo.clone(),
        company_repo.clone(),
        bpjs_service.clone(),
    );
    let fingerprint_service =
        FingerprintService::new(fingerprint_repo.clone(), employee_repo.clone());

    let hr_services = HRServices {
        employee_service,
        attendance_service,
        bpjs_service,
        salary_service,
        fingerprint_service,
    };

    // Initialize Redis and LockUtil
    let redis_client =
        redis::Client::open(config.redis.url.as_str()).map_err(error::AppError::Redis)?;
    let lock_util = utils::LockUtil::new(redis_client);
    tracing::info!("Redis connection initialized");

    // Initialize WebSocket
    let ws_manager = Arc::new(ConnectionManager::new());
    let ws_broadcaster = Arc::new(WebSocketBroadcaster::new(ws_manager.clone()));
    let print_service = PrintService::new(ws_broadcaster.clone());
    tracing::info!("WebSocket and Print Service initialized");

    // Create application state
    let state = Arc::new(AppState {
        config: config.clone(),
        db,
        kafka,
        user_repo,
        menu_repo,
        event_repo,
        order_repo,
        payment_repo,
        hr_repositories,
        hr_services,
        menu_service,
        inventory_service,
        outlet_service,
        loyalty_service,
        tax_service,
        promo_service,
        market_list_service,
        print_service,
        lock_util,
        ws_manager,
        ws_broadcaster,
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
