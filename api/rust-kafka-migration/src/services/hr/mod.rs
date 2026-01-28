pub mod employee_service;
pub mod attendance_service;
pub mod bpjs_service;
pub mod salary_service;
pub mod fingerprint_service;

pub use employee_service::EmployeeService;
pub use attendance_service::AttendanceService;
pub use bpjs_service::BpjsService;
pub use salary_service::SalaryService;
pub use fingerprint_service::FingerprintService;
