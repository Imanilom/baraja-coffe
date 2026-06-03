use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

/// Employment status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum EmploymentStatus {
    Probation,
    Permanent,
    Contract,
    Intern,
}

impl Default for EmploymentStatus {
    fn default() -> Self {
        Self::Probation
    }
}

/// Employment type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum EmploymentType {
    Fulltime,
    Parttime,
    Freelance,
}

impl Default for EmploymentType {
    fn default() -> Self {
        Self::Fulltime
    }
}

/// Employee allowances
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Allowances {
    #[serde(default)]
    pub departmental: f64,
    
    #[serde(default)]
    pub childcare: f64,
    
    #[serde(default)]
    pub transport: f64,
    
    #[serde(default)]
    pub meal: f64,
    
    #[serde(default)]
    pub health: f64,
    
    #[serde(default)]
    pub other: f64,
}

impl Allowances {
    pub fn total(&self) -> f64 {
        self.departmental + self.childcare + self.transport + self.meal + self.health + self.other
    }
}

/// Employee deductions
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Deductions {
    #[serde(default)]
    pub bpjs_kesehatan_employee: f64,
    
    #[serde(default)]
    pub bpjs_kesehatan_employer: f64,
    
    #[serde(default)]
    pub bpjs_ketenagakerjaan_employee: f64,
    
    #[serde(default)]
    pub bpjs_ketenagakerjaan_employer: f64,
    
    #[serde(default)]
    pub tax: f64,
    
    #[serde(default)]
    pub other: f64,
}

impl Deductions {
    pub fn total_employee(&self) -> f64 {
        self.bpjs_kesehatan_employee + self.bpjs_ketenagakerjaan_employee + self.tax + self.other
    }
    
    pub fn total_employer(&self) -> f64 {
        self.bpjs_kesehatan_employer + self.bpjs_ketenagakerjaan_employer
    }
}

/// Bank account information
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BankAccount {
    #[serde(default)]
    pub bank_name: String,
    
    #[serde(default)]
    pub account_number: String,
    
    #[serde(default)]
    pub account_holder: String,
}

/// Employee model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Employee {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    /// Reference to User model
    pub user: ObjectId,
    
    /// Reference to Company model
    pub company: ObjectId,
    
    /// Employee ID (unique)
    #[serde(rename = "employeeId")]
    pub employee_id: String,
    
    /// NIK (Nomor Induk Kependudukan) - unique
    pub nik: String,
    
    #[serde(default)]
    pub npwp: String,
    
    #[serde(rename = "bpjsKesehatan", default)]
    pub bpjs_kesehatan: String,
    
    #[serde(rename = "bpjsKetenagakerjaan", default)]
    pub bpjs_ketenagakerjaan: String,
    
    /// Job information
    pub position: String,
    pub department: String,
    
    #[serde(rename = "joinDate")]
    pub join_date: mongodb::bson::DateTime,
    
    #[serde(rename = "employmentStatus", default)]
    pub employment_status: EmploymentStatus,
    
    #[serde(rename = "employmentType", default)]
    pub employment_type: EmploymentType,
    
    /// Salary information
    #[serde(rename = "basicSalary")]
    pub basic_salary: f64,
    
    #[serde(default)]
    pub allowances: Allowances,
    
    #[serde(default)]
    pub deductions: Deductions,
    
    #[serde(rename = "bankAccount", default)]
    pub bank_account: BankAccount,
    
    /// Supervisor reference (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supervisor: Option<ObjectId>,
    
    /// Status
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "resignationDate", skip_serializing_if = "Option::is_none")]
    pub resignation_date: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "resignationReason", default)]
    pub resignation_reason: String,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_true() -> bool {
    true
}

impl Employee {
    pub fn new(
        user: ObjectId,
        company: ObjectId,
        employee_id: String,
        nik: String,
        position: String,
        department: String,
        join_date: mongodb::bson::DateTime,
        basic_salary: f64,
    ) -> Self {
        Self {
            id: None,
            user,
            company,
            employee_id,
            nik,
            npwp: String::new(),
            bpjs_kesehatan: String::new(),
            bpjs_ketenagakerjaan: String::new(),
            position,
            department,
            join_date,
            employment_status: EmploymentStatus::default(),
            employment_type: EmploymentType::default(),
            basic_salary,
            allowances: Allowances::default(),
            deductions: Deductions::default(),
            bank_account: BankAccount::default(),
            supervisor: None,
            is_active: true,
            resignation_date: None,
            resignation_reason: String::new(),
            created_at: None,
            updated_at: None,
        }
    }
    
    /// Calculate total gross salary (basic + allowances)
    pub fn gross_salary(&self) -> f64 {
        self.basic_salary + self.allowances.total()
    }
    
    /// Calculate net salary (gross - employee deductions)
    pub fn net_salary(&self) -> f64 {
        self.gross_salary() - self.deductions.total_employee()
    }
}
