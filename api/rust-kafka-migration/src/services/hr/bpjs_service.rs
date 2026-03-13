use crate::db::models::hr_setting::BpjsSettings;

#[derive(Clone)]
pub struct BpjsService;

impl BpjsService {
    pub fn new() -> Self {
        Self
    }

    /// Calculate BPJS Kesehatan
    /// Returns (employee_share, employer_share)
    pub fn calculate_bpjs_kesehatan(
        &self,
        basic_salary: f64,
        settings: &BpjsSettings,
    ) -> (f64, f64) {
        let salary_base = basic_salary.min(settings.max_salary_bpjs);

        let employee_share = salary_base * settings.kesehatan_rate_employee;
        let employer_share = salary_base * settings.kesehatan_rate_employer;

        (employee_share, employer_share)
    }

    /// Calculate BPJS Ketenagakerjaan
    /// Returns (employee_share, employer_share)
    pub fn calculate_bpjs_ketenagakerjaan(
        &self,
        basic_salary: f64,
        settings: &BpjsSettings,
    ) -> (f64, f64) {
        // JHT + JP + JKK + JKM (Simplified, usually these are separate rates)
        // Assuming settings.ketenagakerjaan_*_rate is the total rate or we need to break it down.
        // For now, using the single rate provided in settings model.
        
        let salary_base = basic_salary.min(settings.max_salary_bpjs);

        let employee_share = salary_base * settings.ketenagakerjaan_rate_employee;
        let employer_share = salary_base * settings.ketenagakerjaan_rate_employer;

        (employee_share, employer_share)
    }

    /// Get preview of BPJS calculations
    pub fn get_preview(&self, basic_salary: f64, settings: &BpjsSettings) -> serde_json::Value {
        let (kes_emp, kes_cmp) = self.calculate_bpjs_kesehatan(basic_salary, settings);
        let (tk_emp, tk_cmp) = self.calculate_bpjs_ketenagakerjaan(basic_salary, settings);

        serde_json::json!({
            "basic_salary": basic_salary,
            "kesehatan": {
                "employee": kes_emp,
                "employer": kes_cmp,
                "total": kes_emp + kes_cmp
            },
            "ketenagakerjaan": {
                "employee": tk_emp,
                "employer": tk_cmp,
                "total": tk_emp + tk_cmp
            },
            "total_deduction_employee": kes_emp + tk_emp,
            "total_contribution_employer": kes_cmp + tk_cmp
        })
    }
}
