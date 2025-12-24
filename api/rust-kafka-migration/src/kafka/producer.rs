use rdkafka::{
    config::ClientConfig,
    producer::{FutureProducer, FutureRecord},
    util::Timeout,
};
use serde::Serialize;
use std::sync::Arc;
use std::time::Duration;
use crate::config::KafkaConfig;
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct KafkaProducer {
    producer: Arc<FutureProducer>,
    topics: KafkaTopics,
}

#[derive(Clone)]
pub struct KafkaTopics {
    pub order: String,
    pub payment: String,
    pub inventory: String,
    pub notification: String,
}

impl From<&crate::config::KafkaTopics> for KafkaTopics {
    fn from(config: &crate::config::KafkaTopics) -> Self {
        Self {
            order: config.order.clone(),
            payment: config.payment.clone(),
            inventory: config.inventory.clone(),
            notification: config.notification.clone(),
        }
    }
}

impl KafkaProducer {
    pub fn new(config: &KafkaConfig) -> AppResult<Arc<Self>> {
        tracing::info!("Initializing Kafka producer with brokers: {}", config.brokers);

        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", &config.brokers)
            .set("message.timeout.ms", "5000")
            .set("queue.buffering.max.messages", "100000")
            .set("queue.buffering.max.kbytes", "1048576")
            .set("batch.num.messages", "10000")
            .create()
            .map_err(|e| AppError::Kafka(format!("Failed to create Kafka producer: {}", e)))?;

        tracing::info!("Kafka producer initialized successfully");

        Ok(Arc::new(Self {
            producer: Arc::new(producer),
            topics: KafkaTopics::from(&config.topics),
        }))
    }

    /// Publish an event to a Kafka topic
    pub async fn publish<T: Serialize>(
        &self,
        topic: &str,
        key: Option<&str>,
        event: &T,
    ) -> AppResult<()> {
        let payload = serde_json::to_string(event)
            .map_err(|e| AppError::Kafka(format!("Failed to serialize event: {}", e)))?;

        let mut record = FutureRecord::to(topic).payload(&payload);

        if let Some(key) = key {
            record = record.key(key);
        }

        self.producer
            .send(record, Timeout::After(Duration::from_secs(5)))
            .await
            .map_err(|(e, _)| AppError::Kafka(format!("Failed to send event: {}", e)))?;

        tracing::debug!("Published event to topic: {}", topic);
        Ok(())
    }

    /// Publish order event
    pub async fn publish_order_event<T: Serialize>(
        &self,
        order_id: &str,
        event: &T,
    ) -> AppResult<()> {
        self.publish(&self.topics.order, Some(order_id), event).await
    }

    /// Publish payment event
    pub async fn publish_payment_event<T: Serialize>(
        &self,
        payment_id: &str,
        event: &T,
    ) -> AppResult<()> {
        self.publish(&self.topics.payment, Some(payment_id), event).await
    }

    /// Publish inventory event
    pub async fn publish_inventory_event<T: Serialize>(
        &self,
        item_id: &str,
        event: &T,
    ) -> AppResult<()> {
        self.publish(&self.topics.inventory, Some(item_id), event).await
    }

    /// Publish notification event
    pub async fn publish_notification_event<T: Serialize>(
        &self,
        user_id: &str,
        event: &T,
    ) -> AppResult<()> {
        self.publish(&self.topics.notification, Some(user_id), event).await
    }
}
