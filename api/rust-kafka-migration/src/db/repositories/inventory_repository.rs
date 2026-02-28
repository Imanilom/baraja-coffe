use bson::{doc, oid::ObjectId};
use mongodb::{Collection, options::FindOneAndUpdateOptions};
use std::sync::Arc;

use crate::db::DbConnection;
use crate::db::models::{Product, Recipe, MenuStock, ProductStock, ProductMovement};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct InventoryRepository {
    product_collection: Collection<Product>,
    recipe_collection: Collection<Recipe>,
    menu_stock_collection: Collection<MenuStock>,
    product_stock_collection: Collection<ProductStock>,
}

impl InventoryRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            product_collection: db.collection("products"),
            recipe_collection: db.collection("recipes"),
            menu_stock_collection: db.collection("menustocks"),
            product_stock_collection: db.collection("productstocks"),
        }
    }

    // --- Product Methods ---

    pub async fn find_product_by_id(&self, id: &ObjectId) -> AppResult<Option<Product>> {
        Ok(self.product_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn find_product_by_sku(&self, sku: &str) -> AppResult<Option<Product>> {
        Ok(self.product_collection.find_one(doc! { "sku": sku }, None).await?)
    }

    // --- Recipe Methods ---

    pub async fn find_recipe_by_menu_item(&self, menu_item_id: &ObjectId) -> AppResult<Option<Recipe>> {
        Ok(self.recipe_collection.find_one(doc! { "menuItemId": menu_item_id }, None).await?)
    }

    // --- MenuStock Methods ---

    pub async fn find_menu_stock(&self, menu_item_id: &ObjectId, warehouse_id: &ObjectId) -> AppResult<Option<MenuStock>> {
        Ok(self.menu_stock_collection.find_one(
            doc! { "menuItemId": menu_item_id, "warehouseId": warehouse_id },
            None
        ).await?)
    }

    pub async fn upsert_menu_stock(&self, stock: MenuStock) -> AppResult<()> {
        let menu_item_id = stock.menu_item_id;
        let warehouse_id = stock.warehouse_id;
        
        let update_doc = bson::to_document(&stock)
            .map_err(|e| AppError::BsonSerialization(e))?;

        self.menu_stock_collection.update_one(
            doc! { "menuItemId": menu_item_id, "warehouseId": warehouse_id },
            doc! { "$set": update_doc },
            mongodb::options::UpdateOptions::builder().upsert(true).build(),
        ).await?;
        Ok(())
    }

    // --- ProductStock Methods with Optimistic Concurrency ---

    pub async fn find_product_stock(&self, product_id: &ObjectId, warehouse_id: &ObjectId) -> AppResult<Option<ProductStock>> {
        Ok(self.product_stock_collection.find_one(
            doc! { "productId": product_id, "warehouse": warehouse_id },
            None
        ).await?)
    }

    pub async fn update_product_stock_atomic(
        &self,
        product_id: &ObjectId,
        warehouse_id: &ObjectId,
        quantity_change: f64,
        movement: ProductMovement,
        version: i32,
    ) -> AppResult<ProductStock> {
        let filter = doc! {
            "productId": product_id,
            "warehouse": warehouse_id,
            "version": version
        };

        let update = doc! {
            "$inc": { "currentStock": quantity_change, "version": 1 },
            "$push": { "movements": bson::to_bson(&movement).map_err(|e| AppError::BsonSerialization(e))? }
        };

        let options = FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build();

        let result = self.product_stock_collection.find_one_and_update(filter, update, options).await?;

        result.ok_or_else(|| AppError::Conflict("Product stock version mismatch or not found".to_string()))
    }
}
