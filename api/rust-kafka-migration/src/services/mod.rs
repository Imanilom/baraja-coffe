pub mod event_service;
pub mod inventory_service;
pub mod marketlist_service;
pub mod menu_service;
pub mod outlet_service;

pub mod loyalty_service;
pub mod tax_service;
// pub mod market_list_service;
pub mod hr;
pub mod print_service;
pub mod promo_service;

pub use event_service::EventService;
pub use hr::{AttendanceService, BpjsService, EmployeeService, FingerprintService, SalaryService};
pub use inventory_service::InventoryService;
pub use loyalty_service::LoyaltyService;
pub use marketlist_service::MarketListService;
pub use menu_service::MenuService;
pub use outlet_service::OutletService;
pub use print_service::PrintService;
pub use promo_service::PromoService;
pub use tax_service::TaxService;
