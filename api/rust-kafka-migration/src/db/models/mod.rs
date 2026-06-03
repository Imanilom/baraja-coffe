pub mod area;
pub mod category;
pub mod event;
pub mod loyalty;
pub mod marketlist;
pub mod menu_item;
pub mod menu_stock;
pub mod order;
pub mod outlet;
pub mod payment;
pub mod product;
pub mod product_stock;
pub mod promo;
pub mod recipe;
pub mod request;
pub mod reservation;
pub mod role;
pub mod supplier;
pub mod table;
pub mod tax;
pub mod user;
pub mod voucher;
pub mod warehouse;

// HR modules
pub mod hr_attendance;
pub mod hr_company;
pub mod hr_employee;
pub mod hr_fingerprint;
pub mod hr_salary;
pub mod hr_setting;

pub use area::Area;
pub use category::Category;
pub use event::{CheckInStatus, Event, EventStatus, FreeRegistration};
pub use loyalty::{CustomerLoyalty, LoyaltyLevel, LoyaltyProgram};
pub use marketlist::{MarketList, MarketListItem, MarketListPurpose, Payment as MarketListPayment};
pub use menu_item::MenuItem;
pub use menu_stock::{MenuStock, StockReason, StockUpdateType};
pub use order::{
    CustomAmountItem, MenuItemData, Order, OrderItem, PaymentAction, SplitPayment, VaNumber,
};
pub use outlet::Outlet;
pub use payment::Payment as OrderPayment;
pub use product::Product;
pub use product_stock::{ProductMovement, ProductMovementType, ProductStock};
pub use promo::{AutoPromo, Promo};
pub use recipe::Recipe;
pub use request::{
    FulfillmentStatus, Request, RequestItem, RequestItemStatus, RequestStatus, RequestType,
};
pub use reservation::{
    EmployeeInfo, FoodServingOption, Reservation, ReservationStatus, ReservationType, ServingType,
    TableType as ReservationTableType,
};
pub use role::{Permission, Role};
pub use supplier::Supplier;
pub use table::{StatusHistoryEntry, Table, TableStatus};
pub use tax::TaxAndService;
pub use user::{AuthType, User, UserResponse};
pub use voucher::{Voucher, VoucherUsage};
pub use warehouse::Warehouse;

// HR exports
pub use hr_attendance::{
    ApprovalInfo, ApprovalStatus, Attendance, AttendanceStatus, CheckInfo, CheckType,
};
pub use hr_company::{
    AttendanceSettings as CompanyAttendanceSettings, BpjsSettings as CompanyBpjsSettings, Company,
    CompanySettings, DeductionSettings as CompanyDeductionSettings,
    SalaryCalculationSettings as CompanySalarySettings,
};
pub use hr_employee::{
    Allowances, BankAccount, Deductions as EmployeeDeductions, Employee, EmploymentStatus,
    EmploymentType,
};
pub use hr_fingerprint::{Fingerprint, RawFingerprint};
pub use hr_salary::{
    AttendanceSummary, CalculationRates, Earnings, PaymentMethod, Salary, SalaryDeductions,
    SalaryPeriod, SalaryStatus,
};
pub use hr_setting::{
    AttendanceSettings, BpjsSettings, DeductionSettings, HRSetting, SalaryCalculationSettings,
};
