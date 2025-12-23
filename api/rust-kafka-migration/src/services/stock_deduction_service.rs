use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId};
use serde::{Deserialize, Serialize};

use crate::AppState;
use crate::error::{AppResult, AppError};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockReservation {
    pub menu_item_id: ObjectId,
    pub quantity: i32,
    pub warehouse_id: ObjectId,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockDeduction {
    pub menu_item_id: ObjectId,
    pub menu_item_name: String,
    pub quantity_deducted: i32,
    pub warehouse_id: ObjectId,
    pub previous_stock: f64,
    pub new_stock: f64,
}

pub struct StockDeductionService {
    state: Arc<AppState>,
}

impl StockDeductionService {
    pub fn new(state: Arc<AppState>) -> Self {
        Self { state }
    }

    /// Deduct stock with atomic locking for Web/App orders
    pub async fn deduct_stock_with_locking(
        &self,
        stock_reservations: Vec<StockReservation>,
    ) -> AppResult<Vec<StockDeduction>> {
        let mut deductions = Vec::new();

        for reservation in stock_reservations {
            let deduction = self.deduct_single_item_stock(
                reservation.menu_item_id,
                reservation.quantity,
                reservation.warehouse_id,
            ).await?;

            deductions.push(deduction);
        }

        Ok(deductions)
    }

    /// Deduct stock for a single menu item
    async fn deduct_single_item_stock(
        &self,
        menu_item_id: ObjectId,
        quantity: i32,
        warehouse_id: ObjectId,
    ) -> AppResult<StockDeduction> {
        // Get menu item
        let menu_collection: mongodb::Collection<mongodb::bson::Document> = 
            self.state.db.collection("menuitems");
        
        let menu_item = menu_collection
            .find_one(doc! { "_id": menu_item_id }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound("Menu item not found".to_string()))?;

        let menu_item_name = menu_item.get_str("name")
            .unwrap_or("Unknown")
            .to_string();

        // Get recipe to find products
        let recipe_collection: mongodb::Collection<mongodb::bson::Document> = 
            self.state.db.collection("recipes");
        
        let recipe = recipe_collection
            .find_one(doc! { "menuItemId": menu_item_id }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound(format!("Recipe not found for {}", menu_item_name)))?;

        // Get products from recipe
        let products = recipe.get_array("products")
            .map_err(|_| AppError::BadRequest("Recipe has no products".to_string()))?;

        // Deduct stock for each product in recipe
        for product_doc in products {
            if let Ok(product_obj) = product_doc.as_document() {
                let product_id = product_obj.get_object_id("productId")
                    .map_err(|_| AppError::BadRequest("Invalid product ID in recipe".to_string()))?;
                
                let quantity_per_item = product_obj.get_f64("quantity")
                    .unwrap_or(1.0);

                let total_quantity_needed = quantity_per_item * quantity as f64;

                // Deduct from product stock
                self.deduct_product_stock(
                    product_id,
                    total_quantity_needed,
                    warehouse_id,
                ).await?;
            }
        }

        // Update menu stock
        let menu_stock_collection: mongodb::Collection<mongodb::bson::Document> = 
            self.state.db.collection("menustocks");
        
        let menu_stock = menu_stock_collection
            .find_one(doc! {
                "menuItem": menu_item_id,
                "warehouse": warehouse_id
            }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound(format!("Menu stock not found for {}", menu_item_name)))?;

        let previous_stock = menu_stock.get_f64("quantity").unwrap_or(0.0);
        let new_stock = previous_stock - quantity as f64;

        if new_stock < 0.0 {
            return Err(AppError::BadRequest(format!(
                "Insufficient stock for {}. Available: {}, Requested: {}",
                menu_item_name, previous_stock, quantity
            )));
        }

        // Update menu stock with atomic operation
        menu_stock_collection
            .update_one(
                doc! {
                    "menuItem": menu_item_id,
                    "warehouse": warehouse_id
                },
                doc! {
                    "$inc": { "quantity": -(quantity as f64) },
                    "$set": { "updatedAt": chrono::Utc::now() }
                },
                None,
            )
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        tracing::info!(
            "✅ Stock deducted: {} x{} ({}→{})",
            menu_item_name,
            quantity,
            previous_stock,
            new_stock
        );

        Ok(StockDeduction {
            menu_item_id,
            menu_item_name,
            quantity_deducted: quantity,
            warehouse_id,
            previous_stock,
            new_stock,
        })
    }

    /// Deduct product stock
    async fn deduct_product_stock(
        &self,
        product_id: ObjectId,
        quantity: f64,
        warehouse_id: ObjectId,
    ) -> AppResult<()> {
        let product_stock_collection: mongodb::Collection<mongodb::bson::Document> = 
            self.state.db.collection("productstocks");
        
        // Check current stock
        let product_stock = product_stock_collection
            .find_one(doc! {
                "product": product_id,
                "warehouse": warehouse_id
            }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound("Product stock not found".to_string()))?;

        let current_stock = product_stock.get_f64("quantity").unwrap_or(0.0);

        if current_stock < quantity {
            let product_name = product_stock.get_str("productName").unwrap_or("Unknown");
            return Err(AppError::BadRequest(format!(
                "Insufficient product stock for {}. Available: {}, Needed: {}",
                product_name, current_stock, quantity
            )));
        }

        // Deduct with atomic operation
        product_stock_collection
            .update_one(
                doc! {
                    "product": product_id,
                    "warehouse": warehouse_id
                },
                doc! {
                    "$inc": { "quantity": -quantity },
                    "$set": { "updatedAt": chrono::Utc::now() }
                },
                None,
            )
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    /// Check if stock is available before order creation
    pub async fn check_stock_availability(
        &self,
        stock_reservations: Vec<StockReservation>,
    ) -> AppResult<bool> {
        for reservation in stock_reservations {
            // Check menu stock
            let menu_stock_collection: mongodb::Collection<mongodb::bson::Document> = 
                self.state.db.collection("menustocks");
            
            let menu_stock = menu_stock_collection
                .find_one(doc! {
                    "menuItem": reservation.menu_item_id,
                    "warehouse": reservation.warehouse_id
                }, None)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

            if let Some(stock) = menu_stock {
                let available = stock.get_f64("quantity").unwrap_or(0.0);
                if available < reservation.quantity as f64 {
                    return Ok(false);
                }
            } else {
                return Ok(false);
            }
        }

        Ok(true)
    }

    /// Restore stock (for order cancellation)
    pub async fn restore_stock(
        &self,
        stock_deductions: Vec<StockDeduction>,
    ) -> AppResult<()> {
        for deduction in stock_deductions {
            let menu_stock_collection: mongodb::Collection<mongodb::bson::Document> = 
                self.state.db.collection("menustocks");
            
            menu_stock_collection
                .update_one(
                    doc! {
                        "menuItem": deduction.menu_item_id,
                        "warehouse": deduction.warehouse_id
                    },
                    doc! {
                        "$inc": { "quantity": deduction.quantity_deducted as f64 },
                        "$set": { "updatedAt": chrono::Utc::now() }
                    },
                    None,
                )
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

            tracing::info!(
                "♻️ Stock restored: {} x{}",
                deduction.menu_item_name,
                deduction.quantity_deducted
            );
        }

        Ok(())
    }
}
