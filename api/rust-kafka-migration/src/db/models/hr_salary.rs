use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

/// Salary status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SalaryStatus {
    Draft,
    Calculated,
    Approved,
    Paid,
    Cancelled,
}

impl Default for SalaryStatus {
    fn default() -> Self {
        Self::Draft
    }
}

/// Payment method enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PaymentMethod {
    Transfer,
    Cash,
    Other,
}

impl Default for PaymentMethod {
    fn default() -> Self {
        Self::Transfer
    }
}

/// Salary period
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalaryPeriod {
    pub month: i32, // 1-12
    pub year: i32,
}

/// Attendance summary for salary calculation
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AttendanceSummary {
    #[serde(default)]
    pub total_tapping_days: i32,
    
    #[serde(default)]
    pub fingerprint_tapping_days: i32,
    
    #[serde(default)]
    pub sick_days: i32,
    
    #[serde(default)]
    pub permission_days: i32,
    
    #[serde(default)]
    pub leave_days: i32,
    
    #[serde(default)]
    pub business_trip_days: i32,
    
    #[serde(default)]
    pub total_working_days: i32,
}

/// Salary earnings breakdown
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Earnings {
    #[serde(default)]
    pub basic_salary: f64,
    
    #[serde(default)]
    pub prorata_salary: f64, // Based on tapping days
    
    #[serde(default)]
    pub overtime1: f64, // Normal overtime
    
    #[serde(default)]
    pub overtime2: f64, // Holiday overtime
    
    #[serde(default)]
    pub departmental_allowance: f64,
    
    #[serde(default)]
    pub childcare_allowance: f64,
    
    #[serde(default)]
    pub transport_allowance: f64,
    
    #[serde(default)]
    pub meal_allowance: f64,

    #[serde(default)]
    pub health_allowance: f64,
    
    #[serde(default)]
    pub other_allowances: f64,
    
    #[serde(default)]
    pub total_earnings: f64,
}

impl Earnings {
    pub fn calculate_total(&mut self) {
        self.total_earnings = self.prorata_salary
            + self.overtime1
            + self.overtime2
            + self.departmental_allowance
            + self.childcare_allowance
            + self.transport_allowance
            + self.meal_allowance
            + self.health_allowance
            + self.other_allowances;
    }
}

/// Salary deductions breakdown
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SalaryDeductions {
    #[serde(default)]
    pub bpjs_kesehatan: f64,
    
    #[serde(default)]
    pub bpjs_ketenagakerjaan: f64,
    
    #[serde(default)]
    pub human_error: f64,
    
    #[serde(default)]
    pub absence: f64,
    
    #[serde(default)]
    pub loan: f64,
    
    #[serde(default)]
    pub other_deductions: f64,
    
    #[serde(default)]
    pub total_deductions: f64,
}

impl SalaryDeductions {
    pub fn calculate_total(&mut self) {
        self.total_deductions = self.bpjs_kesehatan
            + self.bpjs_ketenagakerjaan
            + self.human_error
            + self.absence
            + self.loan
            + self.other_deductions;
    }
}

/// Calculation rates used
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CalculationRates {
    #[serde(default)]
    pub prorata_per_session: f64,
    
    #[serde(default)]
    pub overtime_rate: f64,
}

/// Salary model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Salary {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    /// Reference to Employee
    pub employee: ObjectId,
    
    /// Reference to Company
    pub company: ObjectId,
    
    /// Salary period
    pub period: SalaryPeriod,
    
    /// Attendance summary
    #[serde(default)]
    pub attendance_summary: AttendanceSummary,
    
    /// Earnings breakdown
    #[serde(default)]
    pub earnings: Earnings,
    
    /// Deductions breakdown
    #[serde(default)]
    pub deductions: SalaryDeductions,
    
    /// Total salaries
    #[serde(rename = "grossSalary", default)]
    pub gross_salary: f64,
    
    #[serde(rename = "netSalary", default)]
    pub net_salary: f64,
    
    /// Calculation rates
    #[serde(rename = "calculationRates", default)]
    pub calculation_rates: CalculationRates,
    
    /// Status
    #[serde(default)]
    pub status: SalaryStatus,
    
    /// Payment information
    #[serde(rename = "paidAt", skip_serializing_if = "Option::is_none")]
    pub paid_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "paidBy", skip_serializing_if = "Option::is_none")]
    pub paid_by: Option<ObjectId>,
    
    #[serde(rename = "paymentMethod", default)]
    pub payment_method: PaymentMethod,
    
    /// Notes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

impl Salary {
    pub fn new(employee: ObjectId, company: ObjectId, month: i32, year: i32) -> Self {
        Self {
            id: None,
            employee,
            company,
            period: SalaryPeriod { month, year },
            attendance_summary: AttendanceSummary::default(),
            earnings: Earnings::default(),
            deductions: SalaryDeductions::default(),
            gross_salary: 0.0,
            net_salary: 0.0,
            calculation_rates: CalculationRates::default(),
            status: SalaryStatus::default(),
            paid_at: None,
            paid_by: None,
            payment_method: PaymentMethod::default(),
            notes: None,
            created_at: None,
            updated_at: None,
        }
    }
    
    /// Calculate gross and net salary
    pub fn calculate_totals(&mut self) {
        self.earnings.calculate_total();
        self.deductions.calculate_total();
        self.gross_salary = self.earnings.total_earnings;
        self.net_salary = self.gross_salary - self.deductions.total_deductions;
    }
}
