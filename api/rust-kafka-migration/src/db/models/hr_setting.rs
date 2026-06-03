use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

/// HR Settings model (per company)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HRSetting {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    /// Reference to Company (unique - one setting per company)
    pub company: ObjectId,
    
    /// Attendance settings
    #[serde(default)]
    pub attendance: AttendanceSettings,
    
    /// Salary calculation settings
    #[serde(rename = "salaryCalculation", default)]
    pub salary_calculation: SalaryCalculationSettings,
    
    /// BPJS settings
    #[serde(default)]
    pub bpjs: BpjsSettings,
    
    /// Deduction settings
    #[serde(default)]
    pub deductions: DeductionSettings,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

/// Attendance settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttendanceSettings {
    #[serde(default = "default_tolerance_late")]
    pub tolerance_late: i32,
    
    #[serde(default = "default_work_hours_per_day")]
    pub work_hours_per_day: i32,
    
    #[serde(default = "default_work_days_per_week")]
    pub work_days_per_week: i32,
    
    #[serde(default = "default_required_tapping_per_day")]
    pub required_tapping_per_day: i32,
}

fn default_tolerance_late() -> i32 { 15 }
fn default_work_hours_per_day() -> i32 { 8 }
fn default_work_days_per_week() -> i32 { 6 }
fn default_required_tapping_per_day() -> i32 { 1 }

impl Default for AttendanceSettings {
    fn default() -> Self {
        Self {
            tolerance_late: default_tolerance_late(),
            work_hours_per_day: default_work_hours_per_day(),
            work_days_per_week: default_work_days_per_week(),
            required_tapping_per_day: default_required_tapping_per_day(),
        }
    }
}

/// Salary calculation settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalaryCalculationSettings {
    #[serde(default = "default_prorata_formula")]
    pub prorata_formula: String,
    
    #[serde(default = "default_overtime1_rate")]
    pub overtime1_rate: f64,
    
    #[serde(default = "default_overtime2_rate")]
    pub overtime2_rate: f64,
    
    #[serde(default = "default_max_overtime_hours")]
    pub max_overtime_hours: i32,
}

fn default_prorata_formula() -> String {
    "basicSalary / totalWorkingDays".to_string()
}
fn default_overtime1_rate() -> f64 { 1.5 }
fn default_overtime2_rate() -> f64 { 2.0 }
fn default_max_overtime_hours() -> i32 { 4 }

impl Default for SalaryCalculationSettings {
    fn default() -> Self {
        Self {
            prorata_formula: default_prorata_formula(),
            overtime1_rate: default_overtime1_rate(),
            overtime2_rate: default_overtime2_rate(),
            max_overtime_hours: default_max_overtime_hours(),
        }
    }
}

/// BPJS settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BpjsSettings {
    #[serde(default = "default_kesehatan_rate_employee")]
    pub kesehatan_rate_employee: f64,
    
    #[serde(default = "default_kesehatan_rate_employer")]
    pub kesehatan_rate_employer: f64,
    
    #[serde(default = "default_ketenagakerjaan_rate_employee")]
    pub ketenagakerjaan_rate_employee: f64,
    
    #[serde(default = "default_ketenagakerjaan_rate_employer")]
    pub ketenagakerjaan_rate_employer: f64,

    #[serde(default = "default_jht_rate_employee")]
    pub jht_rate_employee: f64,
    
    #[serde(default = "default_jht_rate_employer")]
    pub jht_rate_employer: f64,

    #[serde(default = "default_jp_rate_employee")]
    pub jp_rate_employee: f64,
    
    #[serde(default = "default_jp_rate_employer")]
    pub jp_rate_employer: f64,
    
    #[serde(default = "default_max_salary_bpjs")]
    pub max_salary_bpjs: f64,

    #[serde(default = "default_min_salary_bpjs")]
    pub min_salary_bpjs: f64,
}

fn default_min_salary_bpjs() -> f64 { 0.0 }

fn default_kesehatan_rate_employee() -> f64 { 0.01 }
fn default_kesehatan_rate_employer() -> f64 { 0.04 }
fn default_ketenagakerjaan_rate_employee() -> f64 { 0.02 }
fn default_ketenagakerjaan_rate_employer() -> f64 { 0.037 }
fn default_jht_rate_employee() -> f64 { 0.02 }
fn default_jht_rate_employer() -> f64 { 0.037 }
fn default_jp_rate_employee() -> f64 { 0.01 }
fn default_jp_rate_employer() -> f64 { 0.02 }

fn default_max_salary_bpjs() -> f64 { 12_000_000.0 }

impl Default for BpjsSettings {
    fn default() -> Self {
        Self {
            kesehatan_rate_employee: default_kesehatan_rate_employee(),
            kesehatan_rate_employer: default_kesehatan_rate_employer(),
            ketenagakerjaan_rate_employee: default_ketenagakerjaan_rate_employee(),
            ketenagakerjaan_rate_employer: default_ketenagakerjaan_rate_employer(),
            jht_rate_employee: default_jht_rate_employee(),
            jht_rate_employer: default_jht_rate_employer(),
            jp_rate_employee: default_jp_rate_employee(),
            jp_rate_employer: default_jp_rate_employer(),
            max_salary_bpjs: default_max_salary_bpjs(),
            min_salary_bpjs: default_min_salary_bpjs(),
        }
    }
}

/// Deduction settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeductionSettings {
    #[serde(default)]
    pub human_error_deduction: f64,
    
    #[serde(default = "default_absence_deduction_rate")]
    pub absence_deduction_rate: f64,
}

fn default_absence_deduction_rate() -> f64 { 1.0 }

impl Default for DeductionSettings {
    fn default() -> Self {
        Self {
            human_error_deduction: 0.0,
            absence_deduction_rate: default_absence_deduction_rate(),
        }
    }
}

impl HRSetting {
    pub fn new(company: ObjectId) -> Self {
        Self {
            id: None,
            company,
            attendance: AttendanceSettings::default(),
            salary_calculation: SalaryCalculationSettings::default(),
            bpjs: BpjsSettings::default(),
            deductions: DeductionSettings::default(),
            created_at: None,
            updated_at: None,
        }
    }
}
