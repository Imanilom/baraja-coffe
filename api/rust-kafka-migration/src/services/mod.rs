pub mod menu_service;
pub mod inventory_service;
pub mod outlet_service;
pub mod marketlist_service;

pub mod loyalty_service;
pub mod tax_service;
// pub mod market_list_service;
pub mod hr;
pub mod promo_service;
pub mod print_service;

pub use menu_service::MenuService;
pub use inventory_service::InventoryService;
pub use outlet_service::OutletService;
pub use loyalty_service::LoyaltyService;
pub use tax_service::TaxService;
pub use promo_service::PromoService;
pub use marketlist_service::MarketListService;
pub use hr::{EmployeeService, AttendanceService, BpjsService, SalaryService, FingerprintService};
pub use print_service::PrintService;
