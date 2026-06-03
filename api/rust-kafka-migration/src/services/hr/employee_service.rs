use std::sync::Arc;
use bson::oid::ObjectId;
use bson::doc;

use crate::db::models::Employee;
use crate::db::repositories::{EmployeeRepository, CompanyRepository, UserRepository};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct EmployeeService {
    employee_repo: EmployeeRepository,
    company_repo: CompanyRepository,
    user_repo: UserRepository,
}

impl EmployeeService {
    pub fn new(
        employee_repo: EmployeeRepository,
        company_repo: CompanyRepository,
        user_repo: UserRepository,
    ) -> Self {
        Self {
            employee_repo,
            company_repo,
            user_repo,
        }
    }

    /// Create a new employee
    pub async fn create_employee(&self, mut employee: Employee) -> AppResult<ObjectId> {
        // Validate company exists
        if self.company_repo.find_by_id(&employee.company).await?.is_none() {
            return Err(AppError::NotFound("Company not found".to_string()));
        }

        // Validate user exists (if linked)
        if self.user_repo.find_by_id(&employee.user).await?.is_none() {
            return Err(AppError::NotFound("User not found".to_string()));
        }

        // Check if employee ID or NIK already exists
        if self.employee_repo.find_by_employee_id(&employee.employee_id).await?.is_some() {
            return Err(AppError::Validation("Employee ID already exists".to_string()));
        }

        // Ensure is_active is true by default if not set (handled by serde default but good to ensure logic)
        employee.is_active = true;

        self.employee_repo.create(employee).await
    }

    /// Get detailed salary summary (components)
    /// This is simplified; actual calculation involves attendance which is in SalaryService
    /// This returns the *configured* components
    pub async fn get_salary_components(&self, employee_id: &ObjectId) -> AppResult<Option<serde_json::Value>> {
        let employee = self.employee_repo.find_by_id(employee_id).await?;
        
        if let Some(emp) = employee {
            let summary = serde_json::json!({
                "basic_salary": emp.basic_salary,
                "allowances": emp.allowances,
                "deductions": emp.deductions,
                "bank_account": emp.bank_account
            });
            Ok(Some(summary))
        } else {
            Ok(None)
        }
    }

    /// Validate employee data integrity
    pub async fn validate_employee(&self, employee: &Employee) -> AppResult<()> {
        if employee.basic_salary < 0.0 {
            return Err(AppError::Validation("Basic salary cannot be negative".to_string()));
        }
        
        // Add more validations as needed
        Ok(())
    }
    /// Find employee by User ID and Company ID
    pub async fn find_by_user_id_and_company(&self, user_id: &ObjectId, company_id: &ObjectId) -> AppResult<Option<Employee>> {
        // We can use the repository's filtered find or specialized method.
        // Since there is no specialized method for this combination yet, 
        // and find_all returns a list, let's assume we might need to add a specialized find or check logic.
        // Actually, let's check if find_all supports filtering by both? 
        // Repos usually accept dedicated filters.
        // For now, let's assume we can fetch by User ID (unique-ish) and check Company.
        // Or fetch by Company and filter by User.
        // Better: Add find_one logic in Repo or use what's available.
        // EmployeeRepository has find_by_user_id. Let's use that and filter by company.
        if let Some(employee) = self.employee_repo.find_by_user_id(user_id).await? {
            if &employee.company == company_id {
                return Ok(Some(employee));
            }
        }
        Ok(None)
    }
}
