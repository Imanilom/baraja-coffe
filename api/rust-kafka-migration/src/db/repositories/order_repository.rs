use bson::{doc, oid::ObjectId};
use mongodb::Collection;
use std::sync::Arc;

use crate::db::DbConnection;
use crate::db::models::order::Order;
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct OrderRepository {
    collection: Collection<Order>,
}

impl OrderRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("orders"),
        }
    }

    /// Create a new order
    pub async fn create(&self, order: Order) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(order, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted order ID".to_string()))?)
    }

    /// Find order by ID
    pub async fn find_by_id(&self, id: &ObjectId) -> AppResult<Option<Order>> {
        Ok(self.collection.find_one(doc! { "_id": id }, None).await?)
    }

    /// Find by order_id
    pub async fn find_by_order_id(&self, order_id: &str) -> AppResult<Option<Order>> {
        Ok(self.collection.find_one(doc! { "order_id": order_id }, None).await?)
    }

    /// Find by order_id and outlet
    pub async fn find_by_order_id_and_outlet(&self, order_id: &str, outlet_id: &ObjectId) -> AppResult<Option<Order>> {
        Ok(self.collection.find_one(
            doc! { 
                "order_id": order_id,
                "outlet": outlet_id
            }, 
            None
        ).await?)
    }
}
