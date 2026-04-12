use bson::{doc, oid::ObjectId, Document};
use mongodb::{Collection, options::FindOptions};
use std::sync::Arc;
use futures::TryStreamExt;

use crate::db::DbConnection;
use crate::db::models::Employee;
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct EmployeeRepository {
    collection: Collection<Employee>,
}

impl EmployeeRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("employees"),
        }
    }

    /// Find all employees with filters and pagination
    pub async fn find_all(
        &self,
        company_id: Option<&ObjectId>,
        department: Option<&str>,
        is_active: Option<bool>,
        page: Option<i64>,
        limit: Option<i64>,
    ) -> AppResult<Vec<Employee>> {
        let mut filter = Document::new();
        
        if let Some(company) = company_id {
            filter.insert("company", company);
        }
        if let Some(dept) = department {
            filter.insert("department", dept);
        }
        if let Some(active) = is_active {
            filter.insert("isActive", active);
        }

        let options = FindOptions::builder()
            .skip(page.map(|p| ((p - 1) * limit.unwrap_or(1)) as u64))
            .limit(limit)
            .sort(doc! { "createdAt": -1 })
            .build();

        let cursor = self.collection.find(filter, options).await?;
        let employees: Vec<Employee> = cursor.try_collect().await?;
        
        Ok(employees)
    }

    /// Find employee by ID
    pub async fn find_by_id(&self, id: &ObjectId) -> AppResult<Option<Employee>> {
        Ok(self.collection.find_one(doc! { "_id": id }, None).await?)
    }

    /// Find employee by user ID
    pub async fn find_by_user_id(&self, user_id: &ObjectId) -> AppResult<Option<Employee>> {
        Ok(self.collection.find_one(doc! { "user": user_id }, None).await?)
    }

    /// Find employee by employee ID
    pub async fn find_by_employee_id(&self, employee_id: &str) -> AppResult<Option<Employee>> {
        Ok(self.collection.find_one(doc! { "employeeId": employee_id }, None).await?)
    }

    /// Find employees by company
    pub async fn find_by_company(
        &self,
        company_id: &ObjectId,
        is_active: Option<bool>,
        page: Option<i64>,
        limit: Option<i64>,
    ) -> AppResult<Vec<Employee>> {
        self.find_all(Some(company_id), None, is_active, page, limit).await
    }

    /// Find employees by department
    pub async fn find_by_department(
        &self,
        company_id: &ObjectId,
        department: &str,
    ) -> AppResult<Vec<Employee>> {
        let filter = doc! {
            "company": company_id,
            "department": department,
            "isActive": true
        };

        let cursor = self.collection.find(filter, None).await?;
        let employees: Vec<Employee> = cursor.try_collect().await?;
        
        Ok(employees)
    }

    /// Find supervisors in a company
    pub async fn find_supervisors(&self, company_id: &ObjectId) -> AppResult<Vec<Employee>> {
        // Supervisors are employees who have at least one subordinate
        let pipeline = vec![
            doc! {
                "$match": {
                    "company": company_id,
                    "isActive": true
                }
            },
            doc! {
                "$lookup": {
                    "from": "employees",
                    "localField": "_id",
                    "foreignField": "supervisor",
                    "as": "subordinates"
                }
            },
            doc! {
                "$match": {
                    "subordinates.0": { "$exists": true }
                }
            },
            doc! {
                "$project": {
                    "subordinates": 0
                }
            }
        ];

        let mut cursor = self.collection.aggregate(pipeline, None).await?;
        let mut supervisors = Vec::new();

        while let Some(doc) = cursor.try_next().await? {
            if let Ok(employee) = bson::from_document::<Employee>(doc) {
                supervisors.push(employee);
            }
        }

        Ok(supervisors)
    }

    /// Create a new employee
    pub async fn create(&self, employee: Employee) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(employee, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted employee ID".to_string()))?)
    }

    /// Update employee
    pub async fn update(&self, id: &ObjectId, updates: Document) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": updates },
            None,
        ).await?;

        Ok(())
    }

    /// Update employee deductions
    pub async fn update_deductions(&self, id: &ObjectId, deductions: Document) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "deductions": deductions } },
            None,
        ).await?;

        Ok(())
    }

    /// Update employee allowances
    pub async fn update_allowances(&self, id: &ObjectId, allowances: Document) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "allowances": allowances } },
            None,
        ).await?;

        Ok(())
    }

    /// Deactivate employee
    pub async fn deactivate(&self, id: &ObjectId) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "isActive": false } },
            None,
        ).await?;

        Ok(())
    }

    /// Reactivate employee
    pub async fn reactivate(&self, id: &ObjectId) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "isActive": true } },
            None,
        ).await?;

        Ok(())
    }

    /// Count employees
    pub async fn count(
        &self,
        company_id: Option<&ObjectId>,
        is_active: Option<bool>,
    ) -> AppResult<u64> {
        let mut filter = Document::new();
        
        if let Some(company) = company_id {
            filter.insert("company", company);
        }
        if let Some(active) = is_active {
            filter.insert("isActive", active);
        }

        Ok(self.collection.count_documents(filter, None).await?)
    }
}
