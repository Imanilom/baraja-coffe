use bson::{doc, oid::ObjectId, Document};
use mongodb::{Collection, options::FindOptions};
use std::sync::Arc;
use futures::TryStreamExt;

use crate::db::DbConnection;
use crate::db::models::{Salary, SalaryStatus};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct SalaryRepository {
    collection: Collection<Salary>,
}

impl SalaryRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("salaries"),
        }
    }

    /// Find salary by ID
    pub async fn find_by_id(&self, id: &ObjectId) -> AppResult<Option<Salary>> {
        Ok(self.collection.find_one(doc! { "_id": id }, None).await?)
    }

    /// Find salaries by company and period
    pub async fn find_by_period(
        &self,
        company_id: &ObjectId,
        start_date: mongodb::bson::DateTime,
        end_date: mongodb::bson::DateTime,
    ) -> AppResult<Vec<Salary>> {
        let filter = doc! {
            "company": company_id,
            "period.startDate": { "$gte": start_date },
            "period.endDate": { "$lte": end_date }
        };

        let cursor = self.collection.find(filter, None).await?;
        Ok(cursor.try_collect().await?)
    }

    /// Find employee salary history
    pub async fn find_by_employee(
        &self,
        employee_id: &ObjectId,
        page: Option<i64>,
        limit: Option<i64>,
    ) -> AppResult<Vec<Salary>> {
        let options = FindOptions::builder()
            .skip(page.map(|p| ((p - 1) * limit.unwrap_or(1)) as u64))
            .limit(limit)
            .sort(doc! { "period.startDate": -1 })
            .build();

        let cursor = self.collection.find(doc! { "employee": employee_id }, options).await?;
        Ok(cursor.try_collect().await?)
    }

    /// Create new salary record
    pub async fn create(&self, salary: Salary) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(salary, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted salary ID".to_string()))?)
    }

    /// Update salary status (e.g., Approve, Paid)
    pub async fn update_status(
        &self,
        id: &ObjectId,
        status: SalaryStatus,
        payment_date: Option<mongodb::bson::DateTime>,
    ) -> AppResult<()> {
        let mut set_doc = doc! {
            "status": bson::to_bson(&status).unwrap_or(bson::Bson::String("Draft".to_string())),
            "updatedAt": mongodb::bson::DateTime::now()
        };

        if let Some(date) = payment_date {
            set_doc.insert("paymentDate", date);
        }

        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": set_doc },
            None
        ).await?;

        Ok(())
    }

    /// Check if salary already exists for employee in period
    pub async fn exists(
        &self,
        employee_id: &ObjectId,
        start_date: mongodb::bson::DateTime,
        end_date: mongodb::bson::DateTime,
    ) -> AppResult<bool> {
        let filter = doc! {
            "employee": employee_id,
            "period.startDate": start_date,
            "period.endDate": end_date
        };

        Ok(self.collection.count_documents(filter, None).await? > 0)
    }

    /// Bulk delete pending/draft salaries for re-calculation
    pub async fn delete_drafts(
        &self,
        company_id: &ObjectId,
        start_date: mongodb::bson::DateTime,
        end_date: mongodb::bson::DateTime,
    ) -> AppResult<u64> {
        let filter = doc! {
            "company": company_id,
            "status": "Draft",
            "period.startDate": start_date,
            "period.endDate": end_date
        };

        let result = self.collection.delete_many(filter, None).await?;
        Ok(result.deleted_count)
    }
}
