use bson::oid::ObjectId;

use crate::db::repositories::OutletRepository;
use crate::db::models::{Outlet, Warehouse, Supplier};
use crate::error::AppResult;

#[derive(Clone)]
pub struct OutletService {
    outlet_repo: OutletRepository,
}

impl OutletService {
    pub fn new(outlet_repo: OutletRepository) -> Self {
        Self { outlet_repo }
    }

    pub async fn get_all_outlets(&self) -> AppResult<Vec<Outlet>> {
        self.outlet_repo.find_all_outlets().await
    }

    pub async fn get_outlet(&self, id: &ObjectId) -> AppResult<Option<Outlet>> {
        self.outlet_repo.find_outlet_by_id(id).await
    }

    pub async fn get_all_warehouses(&self) -> AppResult<Vec<Warehouse>> {
        self.outlet_repo.find_all_warehouses().await
    }

    pub async fn get_warehouse(&self, id: &ObjectId) -> AppResult<Option<Warehouse>> {
        self.outlet_repo.find_warehouse_by_id(id).await
    }

    pub async fn get_all_suppliers(&self) -> AppResult<Vec<Supplier>> {
        self.outlet_repo.find_all_suppliers().await
    }
}
