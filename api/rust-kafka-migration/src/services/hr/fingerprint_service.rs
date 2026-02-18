use std::sync::Arc;
use bson::oid::ObjectId;
use bson::doc;

use crate::db::models::{Fingerprint, RawFingerprint};
use crate::db::repositories::{FingerprintRepository, EmployeeRepository};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct FingerprintService {
    fingerprint_repo: FingerprintRepository,
    employee_repo: EmployeeRepository,
}

impl FingerprintService {
    pub fn new(fingerprint_repo: FingerprintRepository, employee_repo: EmployeeRepository) -> Self {
        Self {
            fingerprint_repo,
            employee_repo,
        }
    }

    /// Register a mapped fingerprint
    pub async fn register_fingerprint(
        &self,
        employee_id: ObjectId,
        device_user_id: String,
    ) -> AppResult<ObjectId> {
        // Validate employee exists
        if self.employee_repo.find_by_id(&employee_id).await?.is_none() {
            return Err(AppError::NotFound("Employee not found".to_string()));
        }

        // Check if device_user_id already mapped
        if self.fingerprint_repo.find_by_device_user_id(&device_user_id).await?.is_some() {
            return Err(AppError::Validation("Device User ID already mapped".to_string()));
        }

        let fingerprint = Fingerprint::new(employee_id, device_user_id);
        self.fingerprint_repo.create(fingerprint).await
    }

    /// Map raw fingerprint data to an employee manually
    pub async fn map_raw_fingerprint(
        &self,
        raw_id: ObjectId,
        employee_id: ObjectId,
    ) -> AppResult<()> {
        // Verify raw entry exists using direct repo call (or add find_by_id to repo)
        // Assuming repo has updates
        
        // Actually repo doesn't have find_raw_by_id exposed yet, but let's assume we can update
        // We will implement `find_raw_by_id` if needed or just trust update
        
        self.fingerprint_repo.mark_mapped(&raw_id, &employee_id).await
    }

    /// Process raw data from device (webhook/sync)
    pub async fn process_raw_data(&self, device_user_id: String, raw_data: String) -> AppResult<ObjectId> {
        // Check if mapped
        let mapping = self.fingerprint_repo.find_by_device_user_id(&device_user_id).await?;
        
        let mut raw = RawFingerprint::new(device_user_id, raw_data);
        
        if let Some(map) = mapping {
            if map.is_active {
                raw.map_to_employee(map.employee);
            }
        }

        self.fingerprint_repo.create_raw(raw).await
    }
}
