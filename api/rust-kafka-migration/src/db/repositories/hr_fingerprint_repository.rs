use bson::{doc, oid::ObjectId, Document};
use mongodb::{Collection, options::FindOptions};
use std::sync::Arc;
use futures::TryStreamExt;

use crate::db::DbConnection;
use crate::db::models::{Fingerprint, RawFingerprint};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct FingerprintRepository {
    collection: Collection<Fingerprint>,
    raw_collection: Collection<RawFingerprint>,
}

impl FingerprintRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("fingerprints"),
            raw_collection: db.collection("raw_fingerprints"),
        }
    }

    // --- Fingerprint Operations ---

    /// Find fingerprint by Device User ID
    pub async fn find_by_device_user_id(&self, device_user_id: &str) -> AppResult<Option<Fingerprint>> {
        Ok(self.collection.find_one(doc! { "deviceUserId": device_user_id }, None).await?)
    }

    /// Find fingerprints by Employee ID
    pub async fn find_by_employee(&self, employee_id: &ObjectId) -> AppResult<Vec<Fingerprint>> {
        let cursor = self.collection.find(doc! { "employee": employee_id }, None).await?;
        Ok(cursor.try_collect().await?)
    }

    /// Find all device users (for device initialization/sync)
    pub async fn find_all_device_users(&self) -> AppResult<Vec<String>> {
        let pipeline = vec![
            doc! { "$project": { "deviceUserId": 1, "_id": 0 } }
        ];
        
        let mut cursor = self.collection.aggregate(pipeline, None).await?;
        let mut users = Vec::new();
        
        while let Some(doc) = cursor.try_next().await? {
            if let Ok(user_id) = doc.get_str("deviceUserId") {
                users.push(user_id.to_string());
            }
        }
        
        Ok(users)
    }

    /// Create new fingerprint
    pub async fn create(&self, fingerprint: Fingerprint) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(fingerprint, None).await?;
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted fingerprint ID".to_string()))?)
    }

    /// Update fingerprint data/status
    pub async fn update(&self, id: &ObjectId, updates: Document) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": updates },
            None,
        ).await?;
        Ok(())
    }

    // --- Raw Fingerprint Operations ---

    /// Find unmapped raw fingerprints
    pub async fn find_unmapped_raw(&self, limit: Option<i64>) -> AppResult<Vec<RawFingerprint>> {
        let options = FindOptions::builder()
            .limit(limit)
            .sort(doc! { "capturedAt": -1 })
            .build();

        let cursor = self.raw_collection.find(doc! { "isMapped": false }, options).await?;
        Ok(cursor.try_collect().await?)
    }

    /// Create raw fingerprint entry
    pub async fn create_raw(&self, raw: RawFingerprint) -> AppResult<ObjectId> {
        let result = self.raw_collection.insert_one(raw, None).await?;
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted raw fingerprint ID".to_string()))?)
    }

    /// Mark raw fingerprint as mapped
    pub async fn mark_mapped(&self, id: &ObjectId, employee_id: &ObjectId) -> AppResult<()> {
        self.raw_collection.update_one(
            doc! { "_id": id },
            doc! { 
                "$set": { 
                    "isMapped": true,
                    "mappedToEmployee": employee_id,
                    "updatedAt": mongodb::bson::DateTime::now()
                } 
            },
            None,
        ).await?;
        Ok(())
    }
}
