use crate::error::{AppError, AppResult};
use redis::Client;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{info, warn};

#[derive(Clone)]
pub struct LockUtil {
    client: Client,
}

impl LockUtil {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    /// Tries to acquire a lock with retries.
    /// Returns true if lock acquired, false otherwise.
    pub async fn acquire_lock(
        &self,
        key: &str,
        owner: &str,
        ttl_ms: u64,
        max_retries: u32,
        retry_delay_ms: u64,
    ) -> AppResult<bool> {
        let mut con = self.client.get_multiplexed_async_connection().await
            .map_err(AppError::Redis)?;

        for attempt in 1..=max_retries {
            // SET key owner NX PX ttl_ms
            let result: Option<String> = redis::cmd("SET")
                .arg(key)
                .arg(owner)
                .arg("NX")
                .arg("PX")
                .arg(ttl_ms)
                .query_async(&mut con)
                .await
                .map_err(AppError::Redis)?;

            if result.is_some() {
                info!("Lock acquired for key: {} (attempt {})", key, attempt);
                return Ok(true);
            }

            if attempt < max_retries {
                warn!(
                    "Failed to acquire lock for key: {}. Retrying in {}ms (attempt {}/{})",
                    key, retry_delay_ms, attempt, max_retries
                );
                sleep(Duration::from_millis(retry_delay_ms)).await;
            }
        }

        warn!("Failed to acquire lock for key: {} after {} attempts", key, max_retries);
        Ok(false)
    }

    /// Releases the lock if the owner matches.
    pub async fn release_lock(&self, key: &str, owner: &str) -> AppResult<()> {
        let mut con = self.client.get_multiplexed_async_connection().await
            .map_err(AppError::Redis)?;

        // Lua script to safely release lock only if owner matches
        let script = redis::Script::new(r"
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end
        ");

        let _result: i32 = script
            .key(key)
            .arg(owner)
            .invoke_async(&mut con)
            .await
            .map_err(AppError::Redis)?;

        info!("Lock released for key: {}", key);
        Ok(())
    }

    /// Execute a closure with a locl
    pub async fn with_lock<F, Fut, T>(
        &self,
        resource_id: &str,
        owner: &str,
        ttl_ms: u64,
        max_retries: u32,
        retry_delay_ms: u64,
        task: F,
    ) -> AppResult<T>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = AppResult<T>>,
    {
        let lock_key = format!("lock:order:{}", resource_id);
        
        if self.acquire_lock(&lock_key, owner, ttl_ms, max_retries, retry_delay_ms).await? {
            // Execute task
            let result = task().await;
            
            // Release lock regardless of result
            let _ = self.release_lock(&lock_key, owner).await;
            
            result
        } else {
            Err(AppError::Lock(format!("Failed to acquire lock for resource {}", resource_id)))
        }
    }
}
