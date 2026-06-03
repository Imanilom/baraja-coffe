use std::sync::Arc;
use bson::oid::ObjectId;
use chrono::{DateTime, Utc};

use crate::db::models::{Attendance, AttendanceStatus, CheckInfo, CheckType, Company, ApprovalInfo};
use crate::db::repositories::{AttendanceRepository, CompanyRepository};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct AttendanceService {
    attendance_repo: AttendanceRepository,
    company_repo: CompanyRepository,
}

impl AttendanceService {
    pub fn new(attendance_repo: AttendanceRepository, company_repo: CompanyRepository) -> Self {
        Self {
            attendance_repo,
            company_repo,
        }
    }

    /// Process Check In
    pub async fn check_in(
        &self,
        employee_id: ObjectId,
        company_id: ObjectId,
        check_in_data: CheckInfo,
    ) -> AppResult<ObjectId> {
        // Get company settings for attendance rules (e.g. lateness)
        let company = self.company_repo.find_by_id(&company_id).await?
            .ok_or_else(|| AppError::NotFound("Company not found".to_string()))?;

        let _settings = company.settings.attendance; // Use for status determination logic later

        // Check if already checked in today
        let now = Utc::now();
        let start_of_day = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
        let end_of_day = now.date_naive().and_hms_opt(23, 59, 59).unwrap().and_utc();

        let existing = self.attendance_repo.find_today_attendance(
            &employee_id, 
            start_of_day.into(), 
            end_of_day.into()
        ).await?;

        if existing.is_some() {
            return Err(AppError::Validation("Already checked in today".to_string()));
        }

        // Determine status based on time (Simplified logic)
        // TODO: Compare check_in_data.time with shift start time + tolerance
        let status = AttendanceStatus::Present; 

        let attendance = Attendance {
            id: None,
            employee: employee_id,
            company: company_id,
            date: mongodb::bson::DateTime::from(now),
            check_in: check_in_data,
            check_out: CheckInfo::default(),
            break_start: None,
            break_end: None,
            work_hours: 0.0,
            overtime_hours: 0.0,
            overtime1_hours: 0.0,
            overtime2_hours: 0.0,
            status,
            tapping_count: 1,
            fingerprint_tapping: false, // Updated if source is fingerprint
            notes: None,
            overtime_approved: ApprovalInfo::default(),
            leave_approved: ApprovalInfo::default(),
            created_at: Some(mongodb::bson::DateTime::now()),
            updated_at: Some(mongodb::bson::DateTime::now()),
        };

        self.attendance_repo.create(attendance).await
    }

    /// Process Check Out
    pub async fn check_out(
        &self,
        employee_id: ObjectId,
        check_out_data: CheckInfo,
    ) -> AppResult<()> {
        let now = Utc::now();
        let start_of_day = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
        let end_of_day = now.date_naive().and_hms_opt(23, 59, 59).unwrap().and_utc();

        let attendance = self.attendance_repo.find_today_attendance(
            &employee_id, 
            start_of_day.into(), 
            end_of_day.into()
        ).await?
        .ok_or_else(|| AppError::NotFound("No check-in record found for today".to_string()))?;

        if attendance.check_out.time.is_some() {
            return Err(AppError::Validation("Already checked out".to_string()));
        }

        // Calculate hours
        // check_in.time is Option<DateTime>. We know it should exist if we are checking out, but handle gracefully.
        let check_in_time = attendance.check_in.time
            .ok_or_else(|| AppError::Validation("Missing check-in time".to_string()))?
            .to_chrono();
            
        let check_out_time = check_out_data.time
            .ok_or_else(|| AppError::Validation("Missing check-out time".to_string()))?
            .to_chrono();
        
        let duration = check_out_time.signed_duration_since(check_in_time);
        let hours = duration.num_minutes() as f64 / 60.0;

        // Basic calculation (TODO: Implement complex rules from Company settings)
        let work_hours = hours.min(8.0); // Cap regular hours at 8 (example)
        let overtime_hours = (hours - 8.0).max(0.0);

        let check_out_doc = bson::to_document(&check_out_data)
            .map_err(|e| AppError::BsonSerialization(e))?;

        self.attendance_repo.update_check_out(
            &attendance.id.unwrap(),
            check_out_doc,
            work_hours,
            overtime_hours,
            attendance.status // Keep existing status or update if early?
        ).await
    }
}
