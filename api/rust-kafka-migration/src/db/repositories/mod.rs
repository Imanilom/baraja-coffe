pub mod event_repository;
pub mod inventory_repository;
pub mod marketlist_repository;
pub mod menu_repository;
pub mod order_repository;
pub mod outlet_repository;
pub mod payment_repository;
pub mod user_repository;

pub use event_repository::EventRepository;
pub use inventory_repository::InventoryRepository;
pub use marketlist_repository::MarketListRepository;
pub use menu_repository::MenuRepository;
pub use order_repository::*;
pub use outlet_repository::OutletRepository;
pub use payment_repository::PaymentRepository;
pub use user_repository::UserRepository;

// HR Repositories
pub mod hr_attendance_repository;
pub mod hr_company_repository;
pub mod hr_employee_repository;
pub mod hr_fingerprint_repository;
pub mod hr_salary_repository;
pub mod hr_setting_repository;

pub use hr_attendance_repository::AttendanceRepository;
pub use hr_company_repository::CompanyRepository;
pub use hr_employee_repository::EmployeeRepository;
pub use hr_fingerprint_repository::FingerprintRepository;
pub use hr_salary_repository::SalaryRepository;
pub use hr_setting_repository::HRSettingRepository;
