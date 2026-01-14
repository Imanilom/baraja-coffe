use bson::{doc, oid::ObjectId, Document};
use mongodb::{Collection, options::FindOptions};
use std::sync::Arc;
use futures::TryStreamExt;

use crate::db::DbConnection;
use crate::db::models::{Attendance, AttendanceStatus};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct AttendanceRepository {
    collection: Collection<Attendance>,
}

impl AttendanceRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("attendances"),
        }
    }

    /// Find attendance by ID
    pub async fn find_by_id(&self, id: &ObjectId) -> AppResult<Option<Attendance>> {
        Ok(self.collection.find_one(doc! { "_id": id }, None).await?)
    }

    /// Find existing attendance for employee on a specific date (start of day)
    pub async fn find_today_attendance(
        &self,
        employee_id: &ObjectId,
        start_of_day: mongodb::bson::DateTime,
        end_of_day: mongodb::bson::DateTime,
    ) -> AppResult<Option<Attendance>> {
        let filter = doc! {
            "employee": employee_id,
            "date": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        };

        Ok(self.collection.find_one(filter, None).await?)
    }

    /// Find attendances by company and date range
    pub async fn find_by_range(
        &self,
        company_id: &ObjectId,
        start_date: mongodb::bson::DateTime,
        end_date: mongodb::bson::DateTime,
        employee_id: Option<&ObjectId>,
    ) -> AppResult<Vec<Attendance>> {
        let mut filter = doc! {
            "company": company_id,
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        };

        if let Some(emp_id) = employee_id {
            filter.insert("employee", emp_id);
        }

        let options = FindOptions::builder()
            .sort(doc! { "date": 1 })
            .build();

        let cursor = self.collection.find(filter, options).await?;
        let attendances: Vec<Attendance> = cursor.try_collect().await?;
        
        Ok(attendances)
    }

    /// Create new attendance (Check In)
    pub async fn create(&self, attendance: Attendance) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(attendance, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted attendance ID".to_string()))?)
    }

    /// Update check out
    pub async fn update_check_out(
        &self,
        id: &ObjectId,
        check_out: Document,
        work_hours: f64,
        overtime_hours: f64,
        status: AttendanceStatus,
    ) -> AppResult<()> {
        let update = doc! {
            "$set": {
                "checkOut": check_out,
                "workHours": work_hours,
                "overtimeHours": overtime_hours,
                "status": bson::to_bson(&status).unwrap_or(bson::Bson::String("Present".to_string())),
                "updatedAt": mongodb::bson::DateTime::now()
            }
        };

        self.collection.update_one(doc! { "_id": id }, update, None).await?;
        Ok(())
    }

    /// Update status and correction approval
    pub async fn update_status(
        &self,
        id: &ObjectId,
        status: AttendanceStatus,
        approval_info: Option<Document>,
    ) -> AppResult<()> {
        let mut set_doc = doc! {
            "status": bson::to_bson(&status).unwrap_or(bson::Bson::String("Present".to_string())),
            "updatedAt": mongodb::bson::DateTime::now()
        };

        if let Some(approval) = approval_info {
            set_doc.insert("approval", approval);
        }

        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": set_doc },
            None
        ).await?;

        Ok(())
    }

    /// Find missing checkouts (Present status but no check out time provided it's past shift end)
    /// This is simplified; usually requires checking shift times. 
    /// Here we just find 'Present' status where created_at is strictly before today (meaning potential missing checkout from yesterday)
    pub async fn find_pending_checkouts(
        &self,
        company_id: &ObjectId,
        before_date: mongodb::bson::DateTime,
    ) -> AppResult<Vec<Attendance>> {
        let filter = doc! {
            "company": company_id,
            "status": "Present",
            "checkOut": { "$exists": false },
            "date": { "$lt": before_date }
        };

        let cursor = self.collection.find(filter, None).await?;
        Ok(cursor.try_collect().await?)
    }
}
