use bson::{doc, oid::ObjectId};
use mongodb::Collection;
use std::sync::Arc;
use futures::stream::TryStreamExt;

use crate::db::DbConnection;
use crate::db::models::payment::Payment;
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct PaymentRepository {
    collection: Collection<Payment>,
}

impl PaymentRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("payments"),
        }
    }

    pub async fn create(&self, payment: Payment) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(payment, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted payment ID".to_string()))?)
    }

    pub async fn find_by_order_id(&self, order_id: &str) -> AppResult<Vec<Payment>> {
        let mut cursor = self.collection.find(doc! { "order_id": order_id }, None).await?;
        let mut payments = Vec::new();
        while let Some(payment) = cursor.try_next().await? {
            payments.push(payment);
        }
        Ok(payments)
    }

    pub async fn find_one_by_order_id(&self, order_id: &str) -> AppResult<Option<Payment>> {
        Ok(self.collection.find_one(doc! { "order_id": order_id }, None).await?)
    }
}
