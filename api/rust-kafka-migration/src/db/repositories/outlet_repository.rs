use bson::{doc, oid::ObjectId};
use mongodb::Collection;
use std::sync::Arc;

use crate::db::DbConnection;
use crate::db::models::{Outlet, Warehouse, Supplier};
use crate::error::AppResult;

#[derive(Clone)]
pub struct OutletRepository {
    outlet_collection: Collection<Outlet>,
    warehouse_collection: Collection<Warehouse>,
    supplier_collection: Collection<Supplier>,
}

impl OutletRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            outlet_collection: db.collection("outlets"),
            warehouse_collection: db.collection("warehouses"),
            supplier_collection: db.collection("suppliers"),
        }
    }

    // --- Outlet Methods ---

    pub async fn find_outlet_by_id(&self, id: &ObjectId) -> AppResult<Option<Outlet>> {
        Ok(self.outlet_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn find_all_outlets(&self) -> AppResult<Vec<Outlet>> {
        let mut cursor = self.outlet_collection.find(None, None).await?;
        let mut outlets = Vec::new();
        while cursor.advance().await? {
            outlets.push(cursor.deserialize_current()?);
        }
        Ok(outlets)
    }

    // --- Warehouse Methods ---

    pub async fn find_warehouse_by_id(&self, id: &ObjectId) -> AppResult<Option<Warehouse>> {
        Ok(self.warehouse_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn find_warehouse_by_code(&self, code: &str) -> AppResult<Option<Warehouse>> {
        Ok(self.warehouse_collection.find_one(doc! { "code": code.to_lowercase() }, None).await?)
    }

    pub async fn find_all_warehouses(&self) -> AppResult<Vec<Warehouse>> {
        let mut cursor = self.warehouse_collection.find(None, None).await?;
        let mut warehouses = Vec::new();
        while cursor.advance().await? {
            warehouses.push(cursor.deserialize_current()?);
        }
        Ok(warehouses)
    }

    // --- Supplier Methods ---

    pub async fn find_supplier_by_id(&self, id: &ObjectId) -> AppResult<Option<Supplier>> {
        Ok(self.supplier_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn find_all_suppliers(&self) -> AppResult<Vec<Supplier>> {
        let mut cursor = self.supplier_collection.find(None, None).await?;
        let mut suppliers = Vec::new();
        while cursor.advance().await? {
            suppliers.push(cursor.deserialize_current()?);
        }
        Ok(suppliers)
    }
}
