pub mod user_repository;
pub mod menu_repository;
pub mod inventory_repository;
pub mod outlet_repository;
pub mod order_repository;
pub mod marketlist_repository;
pub mod payment_repository;

pub use user_repository::UserRepository;
pub use menu_repository::MenuRepository;
pub use inventory_repository::InventoryRepository;
pub use outlet_repository::OutletRepository;
pub use order_repository::*;
pub use marketlist_repository::MarketListRepository;
pub use payment_repository::PaymentRepository;

// HR Repositories
pub mod hr_company_repository;
pub mod hr_employee_repository;
pub mod hr_attendance_repository;
pub mod hr_salary_repository;
pub mod hr_setting_repository;
pub mod hr_fingerprint_repository;

pub use hr_company_repository::CompanyRepository;
pub use hr_employee_repository::EmployeeRepository;
pub use hr_attendance_repository::AttendanceRepository;
pub use hr_salary_repository::SalaryRepository;
pub use hr_setting_repository::HRSettingRepository;
pub use hr_fingerprint_repository::FingerprintRepository;
