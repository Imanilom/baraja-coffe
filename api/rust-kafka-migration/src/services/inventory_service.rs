use std::sync::Arc;
use bson::oid::ObjectId;

use crate::db::repositories::{InventoryRepository, MenuRepository};
use crate::db::models::{ProductStock, ProductMovement, MenuStock, StockUpdateType, StockReason};
use crate::kafka::{KafkaProducer, events::InventoryEvent};
use crate::error::AppResult;

#[derive(Clone)]
pub struct InventoryService {
    inventory_repo: InventoryRepository,
    menu_repo: MenuRepository,
    kafka: Arc<KafkaProducer>,
}

impl InventoryService {
    pub fn new(
        inventory_repo: InventoryRepository,
        menu_repo: MenuRepository,
        kafka: Arc<KafkaProducer>,
    ) -> Self {
        Self {
            inventory_repo,
            menu_repo,
            kafka,
        }
    }

    pub async fn update_product_stock(
        &self,
        product_id: &ObjectId,
        warehouse_id: &ObjectId,
        quantity_change: f64,
        movement: ProductMovement,
    ) -> AppResult<ProductStock> {
        // Implementation of atomic update with retry for optimistic concurrency
        let mut retries = 3;
        while retries > 0 {
            let current_stock = self.inventory_repo.find_product_stock(product_id, warehouse_id).await?;
            let (version, _) = match current_stock {
                Some(s) => (s.version, s.current_stock),
                None => (0, 0.0), // Should probably handle initial stock creation if needed
            };

            match self.inventory_repo.update_product_stock_atomic(
                product_id,
                warehouse_id,
                quantity_change,
                movement.clone(),
                version
            ).await {
                Ok(updated) => {
                    // Publish Kafka event
                    let _ = self.kafka.publish_inventory_event(
                        &product_id.to_hex(),
                        &InventoryEvent::StockUpdated {
                            item_id: product_id.to_hex(),
                            warehouse_id: warehouse_id.to_hex(),
                            old_quantity: (updated.current_stock - quantity_change) as i32,
                            new_quantity: updated.current_stock as i32,
                            timestamp: chrono::Utc::now(),
                        }
                    ).await;

                    return Ok(updated);
                }
                Err(crate::error::AppError::Conflict(_)) => {
                    retries -= 1;
                    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
                }
                Err(e) => return Err(e),
            }
        }
        Err(crate::error::AppError::Conflict("Failed to update stock after retries".to_string()))
    }

    pub async fn adjust_menu_stock(
        &self,
        menu_item_id: &ObjectId,
        warehouse_id: &ObjectId,
        quantity: f64,
        reason: StockReason,
        adjusted_by: Option<String>,
    ) -> AppResult<()> {
        let current = self.inventory_repo.find_menu_stock(menu_item_id, warehouse_id).await?;
        let prev_stock = current.as_ref().map(|s| s.get_effective_stock()).unwrap_or(0.0);
        
        let stock = MenuStock {
            id: current.as_ref().and_then(|s| s.id),
            menu_item_id: *menu_item_id,
            warehouse_id: *warehouse_id,
            update_type: StockUpdateType::Adjustment,
            quantity,
            reason,
            previous_stock: prev_stock,
            current_stock: quantity,
            calculated_stock: quantity,
            manual_stock: Some(quantity),
            adjustment_note: None,
            adjusted_by,
            handled_by: "system".to_string(),
            notes: None,
            related_warehouse: None,
            transfer_id: None,
            last_calculated_at: mongodb::bson::DateTime::now(),
            last_adjusted_at: mongodb::bson::DateTime::now(),
            created_at: None,
            updated_at: None,
        };

        self.inventory_repo.upsert_menu_stock(stock).await?;
        
        // Update total available stock in MenuItem
        self.menu_repo.update_stock_for_warehouse(menu_item_id, warehouse_id, quantity).await?;

        Ok(())
    }
}
