use std::sync::Arc;
use bson::oid::ObjectId;

use crate::db::repositories::{MenuRepository, InventoryRepository};
use crate::db::models::{MenuItem, Category};
use crate::kafka::{KafkaProducer, events::OrderEvent};
use crate::error::AppResult;

#[derive(Clone)]
pub struct MenuService {
    menu_repo: MenuRepository,
    inventory_repo: InventoryRepository,
    kafka: Arc<KafkaProducer>,
}

impl MenuService {
    pub fn new(
        menu_repo: MenuRepository,
        inventory_repo: InventoryRepository,
        kafka: Arc<KafkaProducer>,
    ) -> Self {
        Self {
            menu_repo,
            inventory_repo,
            kafka,
        }
    }

    pub async fn get_all_menu_items(&self, active_only: bool) -> AppResult<Vec<MenuItem>> {
        self.menu_repo.find_all_menu_items(active_only).await
    }

    pub async fn get_menu_item(&self, id: &ObjectId) -> AppResult<Option<MenuItem>> {
        self.menu_repo.find_menu_item_by_id(id).await
    }

    pub async fn create_menu_item(&self, mut item: MenuItem) -> AppResult<ObjectId> {
        // Auto-calculate cost price if recipe exists
        self.calculate_cost_price(&mut item).await?;
        
        let id = self.menu_repo.create_menu_item(item.clone()).await?;
        item.id = Some(id);
        
        // Publish event
        let _ = self.kafka.publish_order_event(
            &id.to_hex(),
            &OrderEvent::Created {
                order_id: id.to_hex(),
                user_id: "system".to_string(),
                order_type: "menu_item_created".to_string(),
                total: item.price,
                timestamp: chrono::Utc::now(),
            }
        ).await;

        Ok(id)
    }

    pub async fn update_menu_item(&self, id: &ObjectId, mut item: MenuItem) -> AppResult<()> {
        self.calculate_cost_price(&mut item).await?;
        
        self.menu_repo.update_menu_item(id, item.clone()).await?;
        
        // Publish event
        let _ = self.kafka.publish_order_event(
            &id.to_hex(),
            &OrderEvent::Updated {
                order_id: id.to_hex(),
                status: if item.is_active { "active" } else { "inactive" }.to_string(),
                timestamp: chrono::Utc::now(),
            }
        ).await;

        Ok(())
    }

    pub async fn delete_menu_item(&self, id: &ObjectId) -> AppResult<()> {
        self.menu_repo.delete_menu_item(id).await
    }

    pub async fn get_categories(&self) -> AppResult<Vec<Category>> {
        self.menu_repo.find_all_categories().await
    }

    async fn calculate_cost_price(&self, item: &mut MenuItem) -> AppResult<()> {
        if item.is_event_item {
            return Ok(());
        }

        if let Some(id) = item.id {
            if let Some(recipe) = self.inventory_repo.find_recipe_by_menu_item(&id).await? {
                let mut total_cost = 0.0;
                for ing in recipe.base_ingredients {
                    if let Some(product) = self.inventory_repo.find_product_by_id(&ing.product_id).await? {
                        let price = product.suppliers.first().map(|s| s.price.unwrap_or(0.0)).unwrap_or(0.0);
                        total_cost += price * ing.quantity;
                    }
                }
                item.cost_price = total_cost;
            }
        }
        Ok(())
    }
}
