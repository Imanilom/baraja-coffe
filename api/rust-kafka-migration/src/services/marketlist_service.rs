use std::sync::Arc;
use bson::{doc, oid::ObjectId};
use chrono::Utc;

use crate::db::repositories::MarketListRepository;
use crate::db::models::{
    Request, RequestItem, RequestStatus, FulfillmentStatus, RequestType, RequestItemStatus,
    MarketList, MarketListItem, MarketListPurpose, ProductMovement, ProductMovementType
};
use crate::error::{AppResult, AppError};
use crate::services::InventoryService;

#[derive(Clone)]
pub struct MarketListService {
    repo: MarketListRepository,
    inventory_service: InventoryService,
}

impl MarketListService {
    pub fn new(repo: MarketListRepository, inventory_service: InventoryService) -> Self {
        Self { repo, inventory_service }
    }

    pub async fn create_request(&self, mut request: Request) -> AppResult<Request> {
        request.created_at = Some(mongodb::bson::DateTime::now());
        request.updated_at = Some(mongodb::bson::DateTime::now());
        
        // Auto-approve if transfer items exist (matching Node.js behavior in some controllers)
        request.status = RequestStatus::Approved;
        
        let id = self.repo.create_request(request.clone()).await?;
        request.id = Some(id);
        Ok(request)
    }

    pub async fn get_request_by_id(&self, id: &ObjectId) -> AppResult<Option<Request>> {
        self.repo.find_request_by_id(id).await
    }

    pub async fn approve_request_items(
        &self,
        request_id: ObjectId,
        items_to_approve: Vec<ObjectId>, // List of item IDs within the request
        source_warehouse_id: ObjectId,
        destination_warehouse_id: ObjectId,
        reviewed_by: String,
    ) -> AppResult<Request> {
        let mut request = self.repo.find_request_by_id(&request_id).await?
            .ok_or_else(|| AppError::NotFound("Request not found".to_string()))?;

        for item_id in items_to_approve {
            // Find item in transfer_items or purchase_items
            let item = request.transfer_items.iter_mut()
                .find(|i| i.id == Some(item_id))
                .or_else(|| request.purchase_items.iter_mut().find(|i| i.id == Some(item_id)));

            if let Some(item) = item {
                let quantity = item.quantity;
                
                // Record stock movement (transfer from source to destination)
                let movement = ProductMovement {
                    quantity,
                    movement_type: ProductMovementType::Transfer,
                    reference_id: Some(request_id),
                    notes: Some(format!("Request approval - {}", item.product_name)),
                    source_warehouse: Some(source_warehouse_id),
                    destination_warehouse: Some(destination_warehouse_id),
                    handled_by: Some(reviewed_by.clone()),
                    date: mongodb::bson::DateTime::now(),
                };

                // Perform the stock update via InventoryService
                self.inventory_service.update_product_stock(
                    &item.product_id,
                    &source_warehouse_id,
                    -quantity, // Out from source
                    movement.clone()
                ).await?;

                self.inventory_service.update_product_stock(
                    &item.product_id,
                    &destination_warehouse_id,
                    quantity, // In to destination
                    movement
                ).await?;

                item.status = RequestItemStatus::Approved;
                item.fulfilled_quantity = quantity;
                item.processed_at = Some(mongodb::bson::DateTime::now());
                item.processed_by = Some(reviewed_by.clone());
            }
        }

        request.reviewed_at = Some(mongodb::bson::DateTime::now());
        request.reviewed_by = Some(reviewed_by);
        request.fulfillment_status = FulfillmentStatus::Partial; // Simplified update
        request.updated_at = Some(mongodb::bson::DateTime::now());

        // Update in DB
        let update_doc = doc! {
            "$set": {
                "transferItems": bson::to_bson(&request.transfer_items).unwrap(),
                "purchaseItems": bson::to_bson(&request.purchase_items).unwrap(),
                "fulfillmentStatus": bson::to_bson(&request.fulfillment_status).unwrap(),
                "reviewedAt": mongodb::bson::DateTime::now(),
                "reviewedBy": request.reviewed_by.clone(),
                "updatedAt": mongodb::bson::DateTime::now()
            }
        };
        self.repo.update_request(&request_id, update_doc).await?;

        Ok(request)
    }

    pub async fn record_purchase(
        &self,
        mut market_list: MarketList,
        handled_by: String,
    ) -> AppResult<MarketList> {
        market_list.created_at = Some(mongodb::bson::DateTime::now());
        market_list.updated_at = Some(mongodb::bson::DateTime::now());
        market_list.created_by = handled_by.clone();

        for item in &mut market_list.items {
            // Calculate totals
            item.amount_charged = item.quantity_purchased * item.price_per_unit;
            item.remaining_balance = (item.amount_charged - item.amount_paid).max(0.0);

            // Record stock In
            let movement = ProductMovement {
                quantity: item.quantity_purchased,
                movement_type: ProductMovementType::In,
                reference_id: None, // Will be set after market list creation if needed
                notes: Some(format!("Purchase from {} - {}", item.supplier_name, item.product_name)),
                source_warehouse: None,
                destination_warehouse: Some(item.warehouse),
                handled_by: Some(handled_by.clone()),
                date: mongodb::bson::DateTime::now(),
            };

            self.inventory_service.update_product_stock(
                &item.product_id,
                &item.warehouse,
                item.quantity_purchased,
                movement
            ).await?;
        }

        // Calculate MarketList totals
        market_list.total_charged = market_list.items.iter().map(|i| i.amount_charged).sum();
        market_list.total_paid = market_list.items.iter().map(|i| i.amount_paid).sum();
        
        // Simplified physical/non-physical split for now (matching Node.js logic)
        market_list.total_physical = market_list.total_paid; 

        let id = self.repo.create_market_list(market_list.clone()).await?;
        market_list.id = Some(id);

        Ok(market_list)
    }
}
