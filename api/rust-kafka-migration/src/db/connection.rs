use mongodb::{Client, Database};
use std::sync::Arc;
use crate::config::DatabaseConfig;
use crate::error::AppResult;

#[derive(Clone)]
pub struct DbConnection {
    client: Client,
    database: Database,
}

impl DbConnection {
    pub async fn new(config: &DatabaseConfig) -> AppResult<Arc<Self>> {
        tracing::info!("Connecting to MongoDB at {}", config.uri);

        let mut client_options = mongodb::options::ClientOptions::parse(&config.uri).await?;
        
        // Configure connection pool
        if let Some(max_pool_size) = config.max_pool_size {
            client_options.max_pool_size = Some(max_pool_size);
        }
        if let Some(min_pool_size) = config.min_pool_size {
            client_options.min_pool_size = Some(min_pool_size);
        }

        // Set app name for monitoring
        client_options.app_name = Some("baraja-coffee-api-rust".to_string());

        let client = Client::with_options(client_options)?;
        let database = client.database(&config.database);

        // Test connection
        database.run_command(bson::doc! { "ping": 1 }, None).await?;
        tracing::info!("Successfully connected to MongoDB database: {}", config.database);

        Ok(Arc::new(Self { client, database }))
    }

    pub fn database(&self) -> &Database {
        &self.database
    }

    pub fn client(&self) -> &Client {
        &self.client
    }

    /// Get a collection with proper typing
    pub fn collection<T>(&self, name: &str) -> mongodb::Collection<T>
    where
        T: Send + Sync,
    {
        self.database.collection(name)
    }
}
