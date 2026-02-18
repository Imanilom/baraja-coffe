use bson::{doc, oid::ObjectId, Document};
use mongodb::Collection;
use std::sync::Arc;

use crate::db::DbConnection;
use crate::db::models::{HRSetting, CompanySettings, AttendanceSettings, SalaryCalculationSettings, BpjsSettings, DeductionSettings};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct HRSettingRepository {
    collection: Collection<HRSetting>,
}

impl HRSettingRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("hr_settings"),
        }
    }

    /// Find settings by Company ID
    pub async fn find_by_company_id(&self, company_id: &ObjectId) -> AppResult<Option<HRSetting>> {
        Ok(self.collection.find_one(doc! { "company": company_id }, None).await?)
    }

    /// Create new settings for a company
    pub async fn create(&self, settings: HRSetting) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(settings, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted settings ID".to_string()))?)
    }

    /// Update entire settings
    pub async fn update(&self, company_id: &ObjectId, settings: HRSetting) -> AppResult<()> {
        let settings_doc = bson::to_document(&settings)
            .map_err(|e| AppError::BsonSerialization(e))?;

        self.collection.update_one(
            doc! { "company": company_id },
            doc! { "$set": settings_doc },
            None,
        ).await?;

        Ok(())
    }

    /// Update specific section: Attendance
    pub async fn update_attendance_settings(
        &self,
        company_id: &ObjectId,
        settings: AttendanceSettings,
    ) -> AppResult<()> {
        let doc = bson::to_document(&settings)
            .map_err(|e| AppError::BsonSerialization(e))?;

        self.collection.update_one(
            doc! { "company": company_id },
            doc! { "$set": { "settings.attendance": doc } }, // Note: assuming structure matches model
            None,
        ).await?;

        Ok(())
    }

    /// Reset settings to defaults (delete and re-create handled by service, here just delete)
    pub async fn delete_by_company_id(&self, company_id: &ObjectId) -> AppResult<()> {
        self.collection.delete_one(doc! { "company": company_id }, None).await?;
        Ok(())
    }
}
