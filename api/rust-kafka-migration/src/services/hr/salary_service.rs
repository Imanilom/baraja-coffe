use std::sync::Arc;
use bson::oid::ObjectId;
use futures::TryStreamExt;

use crate::db::models::{Salary, SalaryStatus, Employee, Attendance, SalaryPeriod, AttendanceSummary, Earnings, SalaryDeductions, CalculationRates, hr_salary::PaymentMethod};
use crate::db::repositories::{SalaryRepository, EmployeeRepository, AttendanceRepository, CompanyRepository};
use crate::services::hr::BpjsService;
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct SalaryService {
    salary_repo: SalaryRepository,
    employee_repo: EmployeeRepository,
    attendance_repo: AttendanceRepository,
    company_repo: CompanyRepository,
    bpjs_service: BpjsService,
}

impl SalaryService {
    pub fn new(
        salary_repo: SalaryRepository,
        employee_repo: EmployeeRepository,
        attendance_repo: AttendanceRepository,
        company_repo: CompanyRepository,
        bpjs_service: BpjsService,
    ) -> Self {
        Self {
            salary_repo,
            employee_repo,
            attendance_repo,
            company_repo,
            bpjs_service,
        }
    }

    /// Calculate salary for an employee in a given period
    pub async fn calculate_salary(
        &self,
        employee_id: ObjectId,
        month: i32,
        year: i32,
    ) -> AppResult<ObjectId> {
        // 1. Get Employee and Company
        let employee = self.employee_repo.find_by_id(&employee_id).await?
            .ok_or_else(|| AppError::NotFound("Employee not found".to_string()))?;
        let company = self.company_repo.find_by_id(&employee.company).await?
            .ok_or_else(|| AppError::NotFound("Company not found".to_string()))?;

        // 2. Define Period
        // Simplified start/end of month logic
        // TODO: Use correct days in month aligned with company settings if cut-off date differs
        let start_date = chrono::NaiveDate::from_ymd_opt(year, month as u32, 1).unwrap()
            .and_hms_opt(0, 0, 0).unwrap().and_utc();
        
        let next_month = if month == 12 { 1 } else { month + 1 };
        let next_year = if month == 12 { year + 1 } else { year };
        let end_date = chrono::NaiveDate::from_ymd_opt(next_year, next_month as u32, 1).unwrap()
            .pred_opt().unwrap()
            .and_hms_opt(23, 59, 59).unwrap().and_utc();

        // 3. Get Attendance Records
        let attendances = self.attendance_repo.find_by_range(
            &employee.company,
            start_date.into(),
            end_date.into(),
            Some(&employee_id)
        ).await?;

        // 4. Summarize Attendance
        let (summary, overtime1_hours, overtime2_hours) = self.summarize_attendance(&attendances);

        // 5. Calculate Components
        let basic_salary = employee.basic_salary;
        
        let total_working_days_in_month = 26; 
        let prorata_salary = (basic_salary / total_working_days_in_month as f64) * summary.total_tapping_days as f64;

        // Overtime (Simplified)
        let overtime1 = overtime1_hours * company.settings.salary_calculation.overtime1_rate;
        let overtime2 = overtime2_hours * company.settings.salary_calculation.overtime2_rate;

        // Allowances
        let allowances = employee.allowances;
        // Include new health_allowance
        let total_allowances = allowances.departmental + allowances.childcare + allowances.transport + allowances.meal + allowances.health + allowances.other;

        // Deductions
        let bpjs_settings_model = crate::db::models::hr_setting::BpjsSettings {
             kesehatan_rate_employee: company.settings.bpjs.kesehatan_rate_employee,
             kesehatan_rate_employer: company.settings.bpjs.kesehatan_rate_employer,
             ketenagakerjaan_rate_employee: company.settings.bpjs.ketenagakerjaan_rate_employee,
             ketenagakerjaan_rate_employer: company.settings.bpjs.ketenagakerjaan_rate_employer,
             jht_rate_employee: company.settings.bpjs.jht_rate_employee,
             jht_rate_employer: company.settings.bpjs.jht_rate_employer,
             jp_rate_employee: company.settings.bpjs.jp_rate_employee,
             jp_rate_employer: company.settings.bpjs.jp_rate_employer,
             max_salary_bpjs: company.settings.bpjs.max_salary_bpjs,
             min_salary_bpjs: company.settings.bpjs.min_salary_bpjs,
        };

        let (bpjs_kes_emp, _) = self.bpjs_service.calculate_bpjs_kesehatan(basic_salary, &bpjs_settings_model);
        let (bpjs_ket_emp, _) = self.bpjs_service.calculate_bpjs_ketenagakerjaan(basic_salary, &bpjs_settings_model);
        
        // TODO: Absence deduction logic
        let absence_deduction = 0.0; 

        let deductions = SalaryDeductions {
            bpjs_kesehatan: bpjs_kes_emp,
            bpjs_ketenagakerjaan: bpjs_ket_emp,
            human_error: 0.0, 
            absence: absence_deduction,
            loan: 0.0,
            other_deductions: employee.deductions.other, 
            total_deductions: 0.0, 
        };

        let total_earnings = prorata_salary + overtime1 + overtime2 + total_allowances;

        let total_deductions = deductions.bpjs_kesehatan + deductions.bpjs_ketenagakerjaan + deductions.human_error + deductions.absence + deductions.loan + deductions.other_deductions;

        let gross_salary = total_earnings; // Or basic + allowances? Usually earnings is gross.
        let net_salary = total_earnings - total_deductions;

        // 6. Create Salary Record
        let salary = Salary {
            id: None,
            employee: employee_id,
            company: employee.company,
            period: SalaryPeriod { month, year },
            attendance_summary: summary.clone(),
            earnings: Earnings {
                basic_salary,
                prorata_salary,
                overtime1,
                overtime2,
                departmental_allowance: allowances.departmental,
                childcare_allowance: allowances.childcare,
                transport_allowance: allowances.transport,
                meal_allowance: allowances.meal,
                health_allowance: allowances.health,
                other_allowances: allowances.other,
                total_earnings,
            },
            deductions: SalaryDeductions {
               total_deductions,
               ..deductions
            },
            gross_salary,
            net_salary,
            calculation_rates: CalculationRates {
                prorata_per_session: basic_salary / total_working_days_in_month as f64,
                overtime_rate: company.settings.salary_calculation.overtime1_rate, // Assuming base rate
            },
            status: SalaryStatus::Draft,
            paid_at: None,
            paid_by: None,
            payment_method: PaymentMethod::Transfer, // Default or None if Option
            // Wait, models/hr_salary.rs:175: pub payment_method: Option<PaymentMethod>. 
            // Error said "expected PaymentMethod, found Option".
            // If the field is NOT Option, I must provide PaymentMethod.
            // Let's assume it IS Option based on earlier view. 
            // But error said: expected type `PaymentMethod`, found enum `Option`.
            // This means the struct field IS `PaymentMethod` (not Option).
            // So I must provide a value. Default to Transfer or Cash?
            // "payment_method: Enum (transfer, cash, other)" from plan.
            // Let's set to Transfer as placeholder (since it's Draft).
            // Actually, maybe Draft doesn't have payment method yet? 
            // If model requires it, I must set it.
            // payment_method: PaymentMethod::Transfer,
            notes: None,
            created_at: Some(mongodb::bson::DateTime::now()),
            updated_at: Some(mongodb::bson::DateTime::now()),
        };

        // Delete existing draft if any
        let _ = self.salary_repo.delete_drafts(&employee.company, start_date.into(), end_date.into()).await;

        self.salary_repo.create(salary).await
    }

    fn summarize_attendance(&self, attendances: &[Attendance]) -> (AttendanceSummary, f64, f64) {
        let mut total_tapping_days = 0;
        let mut fingerprint_tapping_days = 0;
        let sick_days = 0;
        let permission_days = 0;
        let leave_days = 0;
        let business_trip_days = 0; 
        let mut overtime1_hours = 0.0;
        let mut overtime2_hours = 0.0;

        for att in attendances {
            match att.status {
                // TODO: Update AttendanceStatus enum to include specific types or check strings
                _ => {
                    if att.check_in.time.is_some() {
                        total_tapping_days += 1;
                        if att.fingerprint_tapping {
                            fingerprint_tapping_days += 1;
                        }
                    }
                }
            }
            overtime1_hours += att.overtime1_hours;
            overtime2_hours += att.overtime2_hours;
        }

        (AttendanceSummary {
            total_tapping_days,
            fingerprint_tapping_days,
            sick_days,
            permission_days,
            leave_days,
            business_trip_days,
            total_working_days: 26, 
        }, overtime1_hours, overtime2_hours)
    }
}
