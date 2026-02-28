use bson::{doc, oid::ObjectId};
use mongodb::Collection;
use std::sync::Arc;

use crate::db::DbConnection;
use crate::db::models::{MenuItem, Category};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct MenuRepository {
    menu_collection: Collection<MenuItem>,
    category_collection: Collection<Category>,
}

impl MenuRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            menu_collection: db.collection("menuitems"),
            category_collection: db.collection("categories"),
        }
    }

    // --- Category Methods ---

    pub async fn create_category(&self, category: Category) -> AppResult<ObjectId> {
        let result = self.category_collection.insert_one(category, None).await?;
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted category ID".to_string()))?)
    }

    pub async fn find_category_by_id(&self, id: &ObjectId) -> AppResult<Option<Category>> {
        Ok(self.category_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn find_all_categories(&self) -> AppResult<Vec<Category>> {
        let mut cursor = self.category_collection.find(None, None).await?;
        let mut categories = Vec::new();
        while cursor.advance().await? {
            categories.push(cursor.deserialize_current()?);
        }
        Ok(categories)
    }

    pub async fn update_category(&self, id: &ObjectId, category: Category) -> AppResult<()> {
        let update_doc = bson::to_document(&category)
            .map_err(|e| AppError::BsonSerialization(e))?;

        self.category_collection.update_one(
            doc! { "_id": id },
            doc! { "$set": update_doc },
            None,
        ).await?;
        Ok(())
    }

    pub async fn delete_category(&self, id: &ObjectId) -> AppResult<()> {
        self.category_collection.delete_one(doc! { "_id": id }, None).await?;
        Ok(())
    }

    // --- MenuItem Methods ---

    pub async fn create_menu_item(&self, item: MenuItem) -> AppResult<ObjectId> {
        let result = self.menu_collection.insert_one(item, None).await?;
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted menu item ID".to_string()))?)
    }

    pub async fn find_menu_item_by_id(&self, id: &ObjectId) -> AppResult<Option<MenuItem>> {
        Ok(self.menu_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn find_all_menu_items(&self, active_only: bool) -> AppResult<Vec<MenuItem>> {
        let filter = if active_only {
            doc! { "isActive": true }
        } else {
            doc! {}
        };
        tracing::debug!("Finding all menu items with filter: {:?}", filter);
        let mut cursor = self.menu_collection.clone_with_type::<bson::Document>().find(filter, None).await?;
        let mut items = Vec::new();
        while cursor.advance().await? {
            let doc = cursor.deserialize_current();
            let doc = match doc {
                Ok(doc) => doc,
                Err(e) => {
                    tracing::error!("Failed to get document from cursor: {:?}", e);
                    return Err(AppError::Database(e));
                }
            };
            
            let item: Result<MenuItem, _> = bson::from_document(doc.clone());
            match item {
                Ok(item) => items.push(item),
                Err(e) => {
                    let id = doc.get("_id")
                        .and_then(|id| id.as_object_id())
                        .map(|id| id.to_string())
                        .unwrap_or_else(|| "unknown".to_string());
                    tracing::error!("Failed to deserialize menu item ID {}: {:?}. Doc: {:?}", id, e, doc);
                    return Err(AppError::BsonDeserialization(e));
                }
            }
        }
        tracing::debug!("Found {} menu items", items.len());
        Ok(items)
    }

    pub async fn update_menu_item(&self, id: &ObjectId, item: MenuItem) -> AppResult<()> {
        let update_doc = bson::to_document(&item)
            .map_err(|e| AppError::BsonSerialization(e))?;

        self.menu_collection.update_one(
            doc! { "_id": id },
            doc! { "$set": update_doc },
            None,
        ).await?;
        Ok(())
    }

    pub async fn delete_menu_item(&self, id: &ObjectId) -> AppResult<()> {
        self.menu_collection.delete_one(doc! { "_id": id }, None).await?;
        Ok(())
    }

    pub async fn update_stock_for_warehouse(
        &self,
        menu_item_id: &ObjectId,
        warehouse_id: &ObjectId,
        new_stock: f64,
    ) -> AppResult<()> {
        // Find if warehouse stock exists
        let filter = doc! {
            "_id": menu_item_id,
            "warehouseStocks.warehouseId": warehouse_id
        };

        let exists = self.menu_collection.find_one(filter.clone(), None).await?.is_some();

        if exists {
            // Update existing
            self.menu_collection.update_one(
                filter,
                doc! { "$set": { "warehouseStocks.$.stock": new_stock } },
                None,
            ).await?;
        } else {
            // Push new
            self.menu_collection.update_one(
                doc! { "_id": menu_item_id },
                doc! { "$push": { "warehouseStocks": { "warehouseId": warehouse_id, "stock": new_stock } } },
                None,
            ).await?;
        }

        // Re-calculate total available stock (sum of all warehouse stocks)
        let pipeline = vec![
            doc! { "$match": { "_id": menu_item_id } },
            doc! { "$project": {
                "total": { "$sum": "$warehouseStocks.stock" }
            } }
        ];

        let mut cursor = self.menu_collection.aggregate(pipeline, None).await?;
        if cursor.advance().await? {
            let doc = cursor.deserialize_current()?;
            let total: f64 = doc.get_f64("total").unwrap_or(0.0);
            
            let mut update_data = doc! { "availableStock": total };
            if total > 0.0 {
                update_data.insert("isActive", true);
            }

            self.menu_collection.update_one(
                doc! { "_id": menu_item_id },
                doc! { "$set": update_data },
                None,
            ).await?;
        }

        Ok(())
    }

    /// Optimized query for customer-facing menu (filtered by stock availability)
    /// Prefers manual_stock over calculated_stock from menustocks collection
    pub async fn find_customer_menu_items(&self) -> AppResult<Vec<MenuItem>> {
        let pipeline = vec![
            // Only active items
            doc! { "$match": { "isActive": true } },
            
            // Lookup menu stocks
            doc! {
                "$lookup": {
                    "from": "menustocks",
                    "localField": "_id",
                    "foreignField": "menuItemId",
                    "as": "stockRecords"
                }
            },
            
            // Add computed field for effective stock
            doc! {
                "$addFields": {
                    "effectiveStock": {
                        "$sum": {
                            "$map": {
                                "input": "$stockRecords",
                                "as": "stock",
                                "in": {
                                    "$cond": [
                                        { "$gt": ["$$stock.manualStock", null] },
                                        "$$stock.manualStock",
                                        "$$stock.calculatedStock"
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            
            // Filter by stock > 0 OR fallback to availableStock > 0
            doc! {
                "$match": {
                    "$or": [
                        { "effectiveStock": { "$gt": 0.0 } },
                        { "availableStock": { "$gt": 0.0 } }
                    ]
                }
            },
            
            // Remove stockRecords from output
            doc! {
                "$project": {
                    "stockRecords": 0,
                    "effectiveStock": 0
                }
            }
        ];

        let mut cursor = self.menu_collection.aggregate(pipeline, None).await?;
        let mut items = Vec::new();
        
        while cursor.advance().await? {
            let doc = cursor.deserialize_current()?;
            let item: MenuItem = bson::from_document(doc)?;
            items.push(item);
        }
        
        Ok(items)
    }

    /// Optimized query for cashier (all active items, minimal projection)
    pub async fn find_cashier_menu_items(&self) -> AppResult<Vec<MenuItem>> {
        let filter = doc! { "isActive": true };
        
        // Use find with options for better performance
        let mut cursor = self.menu_collection.find(filter, None).await?;
        let mut items = Vec::new();
        
        while cursor.advance().await? {
            items.push(cursor.deserialize_current()?);
        }
        
        Ok(items)
    }

    /// Optimized query for backoffice (all items, sorted by creation date)
    pub async fn find_backoffice_menu_items(&self) -> AppResult<Vec<MenuItem>> {
        let options = mongodb::options::FindOptions::builder()
            .sort(doc! { "createdAt": -1 })
            .build();
        
        let mut cursor = self.menu_collection.find(None, options).await?;
        let mut items = Vec::new();
        
        while cursor.advance().await? {
            items.push(cursor.deserialize_current()?);
        }
        
        Ok(items)
    }
}

