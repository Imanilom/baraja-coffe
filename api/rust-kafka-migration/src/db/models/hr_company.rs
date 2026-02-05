use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

/// Company attendance settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttendanceSettings {
    #[serde(default = "default_tolerance_late")]
    pub tolerance_late: i32, // in minutes
    
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

/// Company salary calculation settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalaryCalculationSettings {
    #[serde(default = "default_prorata_formula")]
    pub prorata_formula: String,
    
    #[serde(default = "default_overtime1_rate")]
    pub overtime1_rate: f64, // Normal overtime rate (e.g., 1.5x)
    
    #[serde(default = "default_overtime2_rate")]
    pub overtime2_rate: f64, // Holiday overtime rate (e.g., 2.0x)
    
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

/// Company BPJS settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BpjsSettings {
    #[serde(default = "default_kesehatan_rate_employee")]
    pub kesehatan_rate_employee: f64, // 1% = 0.01
    
    #[serde(default = "default_kesehatan_rate_employer")]
    pub kesehatan_rate_employer: f64, // 4% = 0.04
    
    #[serde(default = "default_ketenagakerjaan_rate_employee")]
    pub ketenagakerjaan_rate_employee: f64, // 2% = 0.02
    
    #[serde(default = "default_ketenagakerjaan_rate_employer")]
    pub ketenagakerjaan_rate_employer: f64, // 3.7% = 0.037

    #[serde(default = "default_jht_rate_employee")]
    pub jht_rate_employee: f64,
    
    #[serde(default = "default_jht_rate_employer")]
    pub jht_rate_employer: f64,

    #[serde(default = "default_jp_rate_employee")]
    pub jp_rate_employee: f64,
    
    #[serde(default = "default_jp_rate_employer")]
    pub jp_rate_employer: f64,
    
    #[serde(default = "default_max_salary_bpjs")]
    pub max_salary_bpjs: f64, // Maximum salary for BPJS calculation

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

/// Company deduction settings
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

/// Company settings container
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CompanySettings {
    #[serde(default)]
    pub attendance: AttendanceSettings,
    
    #[serde(default)]
    pub salary_calculation: SalaryCalculationSettings,
    
    #[serde(default)]
    pub bpjs: BpjsSettings,
    
    #[serde(default)]
    pub deductions: DeductionSettings,
}

/// Company model for multi-company HR system
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Company {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub code: String, // Unique company code
    pub name: String,
    
    #[serde(default)]
    pub address: String,
    
    #[serde(default)]
    pub phone: String,
    
    #[serde(default)]
    pub email: String,
    
    #[serde(rename = "taxId", default)]
    pub tax_id: String,
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(default)]
    pub settings: CompanySettings,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_true() -> bool {
    true
}

impl Company {
    pub fn new(code: String, name: String) -> Self {
        Self {
            id: None,
            code,
            name,
            address: String::new(),
            phone: String::new(),
            email: String::new(),
            tax_id: String::new(),
            is_active: true,
            settings: CompanySettings::default(),
            created_at: None,
            updated_at: None,
        }
    }
}
