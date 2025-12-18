use serde::Deserialize;
use std::sync::Arc;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub kafka: KafkaConfig,
    pub jwt: JwtConfig,
    pub payment: PaymentConfig,
    pub fcm: FcmConfig,
    pub gosend: GoSendConfig,
    pub logging: LoggingConfig,
    pub cors: CorsConfig,
    pub rate_limit: RateLimitConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub port: u16,
    pub env: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub uri: String,
    pub database: String,
    pub max_pool_size: Option<u32>,
    pub min_pool_size: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct KafkaConfig {
    pub brokers: String,
    pub group_id: String,
    pub topics: KafkaTopics,
}

#[derive(Debug, Clone, Deserialize)]
pub struct KafkaTopics {
    pub order: String,
    pub payment: String,
    pub inventory: String,
    pub notification: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PaymentConfig {
    pub midtrans: MidtransConfig,
    pub xendit: XenditConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MidtransConfig {
    pub server_key: String,
    pub client_key: String,
    pub is_production: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct XenditConfig {
    pub secret_key: String,
    pub is_production: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct FcmConfig {
    pub server_key: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GoSendConfig {
    pub api_key: String,
    pub base_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub file_path: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RateLimitConfig {
    pub requests_per_minute: u32,
}

impl Config {
    /// Load configuration from environment
    /// Supports .env.development and .env.production based on NODE_ENV
    pub fn from_env() -> Result<Arc<Self>, config::ConfigError> {
        // Determine environment from NODE_ENV or default to development
        let env = std::env::var("NODE_ENV").unwrap_or_else(|_| "development".to_string());
        
        // Load environment-specific .env file
        let env_file = match env.as_str() {
            "production" | "prod" => ".env.production",
            "development" | "dev" => ".env.development",
            _ => ".env",
        };

        // Try to load environment-specific file first, fallback to .env
        if let Err(e) = dotenvy::from_filename(env_file) {
            tracing::warn!("Could not load {}: {}. Trying .env", env_file, e);
            dotenvy::dotenv().ok();
        } else {
            tracing::info!("Loaded configuration from {}", env_file);
        }

        let config = config::Config::builder()
            .add_source(config::Environment::default().separator("_"))
            .set_default("server.port", 8080)?
            .set_default("server.env", env.as_str())?
            .set_default("database.max_pool_size", 10)?
            .set_default("database.min_pool_size", 2)?
            .set_default("logging.level", "info")?
            .set_default("logging.file_path", "./logs")?
            .set_default("rate_limit.requests_per_minute", 100)?
            .build()?;

        let app_config: Config = config.try_deserialize()?;
        
        // Log configuration summary (without sensitive data)
        tracing::info!("Environment: {}", app_config.server.env);
        tracing::info!("Database: {}", app_config.database.database);
        tracing::info!("Port: {}", app_config.server.port);
        
        Ok(Arc::new(app_config))
    }

    /// Load configuration for specific environment
    pub fn from_env_with_mode(mode: &str) -> Result<Arc<Self>, config::ConfigError> {
        std::env::set_var("NODE_ENV", mode);
        Self::from_env()
    }
}
