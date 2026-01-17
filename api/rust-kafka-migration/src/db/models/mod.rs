pub mod user;
pub mod role;
pub mod category;
pub mod warehouse;
pub mod order;
pub mod supplier;
pub mod outlet;
pub mod product;
pub mod recipe;
pub mod menu_item;
pub mod menu_stock;
pub mod product_stock;
pub mod loyalty;
pub mod tax;
pub mod marketlist;
pub mod request;
pub mod promo;
pub mod voucher;
pub mod payment;

// HR modules
pub mod hr_company;
pub mod hr_employee;
pub mod hr_attendance;
pub mod hr_salary;
pub mod hr_setting;
pub mod hr_fingerprint;

pub use user::{User, UserResponse, AuthType};
pub use role::{Role, Permission};
pub use category::Category;
pub use warehouse::Warehouse;
pub use supplier::Supplier;
pub use outlet::Outlet;
pub use product::Product;
pub use recipe::Recipe;
pub use menu_item::MenuItem;
pub use menu_stock::{MenuStock, StockUpdateType, StockReason};
pub use product_stock::{ProductStock, ProductMovement, ProductMovementType};
pub use loyalty::{LoyaltyProgram, LoyaltyLevel, CustomerLoyalty};
pub use tax::TaxAndService;
pub use promo::{Promo, AutoPromo};
pub use voucher::{Voucher, VoucherUsage};
pub use marketlist::{MarketList, MarketListItem, MarketListPurpose, Payment as MarketListPayment};
pub use payment::Payment as OrderPayment;
pub use request::{Request, RequestItem, RequestStatus, FulfillmentStatus, RequestType, RequestItemStatus};
pub use order::{Order, OrderItem, SplitPayment, CustomAmountItem, MenuItemData, VaNumber, PaymentAction};

// HR exports
pub use hr_company::{Company, CompanySettings, AttendanceSettings as CompanyAttendanceSettings, 
                     SalaryCalculationSettings as CompanySalarySettings, BpjsSettings as CompanyBpjsSettings,
                     DeductionSettings as CompanyDeductionSettings};
pub use hr_employee::{Employee, EmploymentStatus, EmploymentType, Allowances, 
                      Deductions as EmployeeDeductions, BankAccount};
pub use hr_attendance::{Attendance, AttendanceStatus, CheckType, CheckInfo, ApprovalInfo, ApprovalStatus};
pub use hr_salary::{Salary, SalaryStatus, PaymentMethod, SalaryPeriod, AttendanceSummary, 
                    Earnings, SalaryDeductions, CalculationRates};
pub use hr_setting::{HRSetting, AttendanceSettings, SalaryCalculationSettings, 
                     BpjsSettings, DeductionSettings};
pub use hr_fingerprint::{Fingerprint, RawFingerprint};
