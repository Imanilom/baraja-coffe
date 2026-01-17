use bson::{doc, oid::ObjectId, Document};
use mongodb::{Collection, options::FindOptions};
use std::sync::Arc;
use futures::TryStreamExt;

use crate::db::DbConnection;
use crate::db::models::Company;
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct CompanyRepository {
    collection: Collection<Company>,
}

impl CompanyRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("companies"),
        }
    }

    /// Find all companies with optional filters and pagination
    pub async fn find_all(
        &self,
        is_active: Option<bool>,
        page: Option<i64>,
        limit: Option<i64>,
    ) -> AppResult<Vec<Company>> {
        let mut filter = Document::new();
        
        if let Some(active) = is_active {
            filter.insert("isActive", active);
        }

        let options = FindOptions::builder()
            .skip(page.map(|p| ((p - 1) * limit.unwrap_or(1)) as u64))
            .limit(limit)
            .sort(doc! { "createdAt": -1 })
            .build();

        let cursor = self.collection.find(filter, options).await?;
        let companies: Vec<Company> = cursor.try_collect().await?;
        
        Ok(companies)
    }

    /// Find company by ID
    pub async fn find_by_id(&self, id: &ObjectId) -> AppResult<Option<Company>> {
        Ok(self.collection.find_one(doc! { "_id": id }, None).await?)
    }

    /// Find company by code
    pub async fn find_by_code(&self, code: &str) -> AppResult<Option<Company>> {
        Ok(self.collection.find_one(doc! { "code": code }, None).await?)
    }

    /// Create a new company
    pub async fn create(&self, company: Company) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(company, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted company ID".to_string()))?)
    }

    /// Update company
    pub async fn update(&self, id: &ObjectId, updates: Document) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": updates },
            None,
        ).await?;

        Ok(())
    }

    /// Activate company
    pub async fn activate(&self, id: &ObjectId) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "isActive": true } },
            None,
        ).await?;

        Ok(())
    }

    /// Deactivate company
    pub async fn deactivate(&self, id: &ObjectId) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "isActive": false } },
            None,
        ).await?;

        Ok(())
    }

    /// Count companies
    pub async fn count(&self, is_active: Option<bool>) -> AppResult<u64> {
        let mut filter = Document::new();
        
        if let Some(active) = is_active {
            filter.insert("isActive", active);
        }

        Ok(self.collection.count_documents(filter, None).await?)
    }
}
