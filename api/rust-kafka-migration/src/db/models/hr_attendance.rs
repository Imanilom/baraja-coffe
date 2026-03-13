use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

/// Attendance status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AttendanceStatus {
    Present,
    Absent,
    Late,
    Halfday,
    Holiday,
    Leave,
    Sick,
    Permission,
}

impl Default for AttendanceStatus {
    fn default() -> Self {
        Self::Present
    }
}

/// Check-in/out type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CheckType {
    Fingerprint,
    Mobile,
    Web,
    Manual,
}

impl Default for CheckType {
    fn default() -> Self {
        Self::Fingerprint
    }
}

/// Approval status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

impl Default for ApprovalStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// Check-in or check-out information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time: Option<mongodb::bson::DateTime>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub photo: Option<String>,
    
    #[serde(rename = "type", default)]
    pub check_type: CheckType,
}

impl Default for CheckInfo {
    fn default() -> Self {
        Self {
            time: None,
            location: None,
            device: None,
            photo: None,
            check_type: CheckType::default(),
        }
    }
}

/// Approval information
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub by: Option<ObjectId>, // Employee who approved
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub at: Option<mongodb::bson::DateTime>,
    
    #[serde(default)]
    pub status: ApprovalStatus,
}

/// Attendance model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attendance {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    /// Reference to Employee
    pub employee: ObjectId,

    /// Reference to Company
    pub company: ObjectId,
    
    /// Date of attendance (normalized to start of day)
    pub date: mongodb::bson::DateTime,
    
    /// Check-in information
    #[serde(rename = "checkIn", default)]
    pub check_in: CheckInfo,
    
    /// Check-out information
    #[serde(rename = "checkOut", default)]
    pub check_out: CheckInfo,
    
    /// Break times
    #[serde(rename = "breakStart", skip_serializing_if = "Option::is_none")]
    pub break_start: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "breakEnd", skip_serializing_if = "Option::is_none")]
    pub break_end: Option<mongodb::bson::DateTime>,
    
    /// Work hours calculation
    #[serde(rename = "workHours", default)]
    pub work_hours: f64, // Regular work hours
    
    #[serde(rename = "overtimeHours", default)]
    pub overtime_hours: f64, // Total overtime
    
    #[serde(rename = "overtime1Hours", default)]
    pub overtime1_hours: f64, // Normal overtime
    
    #[serde(rename = "overtime2Hours", default)]
    pub overtime2_hours: f64, // Holiday overtime
    
    /// Attendance status
    #[serde(default)]
    pub status: AttendanceStatus,
    
    /// Tapping information
    #[serde(rename = "tappingCount", default)]
    pub tapping_count: i32,
    
    #[serde(rename = "fingerprintTapping", default)]
    pub fingerprint_tapping: bool,
    
    /// Notes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    
    /// Approvals
    #[serde(rename = "overtimeApproved", default)]
    pub overtime_approved: ApprovalInfo,
    
    #[serde(rename = "leaveApproved", default)]
    pub leave_approved: ApprovalInfo,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

impl Attendance {
    pub fn new(employee: ObjectId, company: ObjectId, date: mongodb::bson::DateTime) -> Self {
        Self {
            id: None,
            employee,
            company,
            date,
            check_in: CheckInfo::default(),
            check_out: CheckInfo::default(),
            break_start: None,
            break_end: None,
            work_hours: 0.0,
            overtime_hours: 0.0,
            overtime1_hours: 0.0,
            overtime2_hours: 0.0,
            status: AttendanceStatus::default(),
            tapping_count: 0,
            fingerprint_tapping: false,
            notes: None,
            overtime_approved: ApprovalInfo::default(),
            leave_approved: ApprovalInfo::default(),
            created_at: None,
            updated_at: None,
        }
    }
    
    /// Calculate work hours based on check-in and check-out times
    pub fn calculate_work_hours(&mut self, max_regular_hours: f64) {
        if let (Some(check_in_time), Some(check_out_time)) = 
            (&self.check_in.time, &self.check_out.time) {
            
            let duration_ms = check_out_time.timestamp_millis() - check_in_time.timestamp_millis();
            let total_hours = duration_ms as f64 / (1000.0 * 60.0 * 60.0);
            
            // Calculate regular and overtime hours
            self.work_hours = total_hours.min(max_regular_hours);
            self.overtime_hours = (total_hours - max_regular_hours).max(0.0);
        }
    }
}
