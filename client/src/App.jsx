import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import PageLoader from "./components/PageLoader";

// Static Imports (Critical path only)
import SignIn from "./pages/SignIn";
import PrivateRoute from "./components/PrivateRoute";

// Lazy Load Pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Profile = lazy(() => import("./pages/Profile"));
const Download = lazy(() => import("./components/download"));
const AdminLayout = lazy(() => import("./pages/admin/index"));
const Example = lazy(() => import("./pages/example"));

// Admin Pages
const Dashboard = lazy(() => import("./pages/dashboard"));
const AnalyticsDashboard = lazy(() => import("./pages/analytics"));
const OutletManagementPage = lazy(() => import("./pages/outlet/index"));
const Menumanagement = lazy(() => import("./pages/menu/index"));
const Menucreate = lazy(() => import("./pages/menu/product/create"));
const MenuUpdate = lazy(() => import("./pages/menu/product/update"));
const AddCategory = lazy(() => import("./pages/menu/category/create"));
const UpdateCategory = lazy(() => import("./pages/menu/category/update"));
const CategoryIndex = lazy(() => import("./pages/menu/category/index"));
const AssignMenuItemToCategory = lazy(() => import("./pages/menu/category/assignmenu"));
const DeviceMenuManager = lazy(() => import("./pages/menuondevice"));
const ReceiptMenu = lazy(() => import("./pages/menu/receipt"));

// Storage & Inventory
const Storagemanagement = lazy(() => import("./pages/storage/index"));
const CreateStrorage = lazy(() => import("./pages/storage/newStock"));
const InStockManagement = lazy(() => import("./pages/inventory/in_stock"));
const CreateStock = lazy(() => import("./pages/inventory/in_stock/create"));
const OutStockManagement = lazy(() => import("./pages/inventory/out_stock"));
const CreateOutStock = lazy(() => import("./pages/inventory/out_stock/create"));
const StockCardManagement = lazy(() => import("./pages/inventory/stockcard"));
const ProductionStockManagement = lazy(() => import("./pages/inventory/production_stock"));
const StockOpnameManagement = lazy(() => import("./pages/inventory/stock_opname"));
const CreateStokOpname = lazy(() => import("./pages/inventory/stock_opname/create"));
const TransferStockManagement = lazy(() => import("./pages/inventory/transfer_stock"));
const CreateTransferStock = lazy(() => import("./pages/inventory/transfer_stock/create"));
const OutletCardManagement = lazy(() => import("./pages/inventory/outletcard"));
const CurrentStockManagement = lazy(() => import("./pages/inventory/current_stock_menu"));
const SoManagement = lazy(() => import("./pages/inventory/so"));
const ProductionListManagement = lazy(() => import("./pages/inventory/production_list"));
const UpdateProduction = lazy(() => import("./pages/inventory/production_list/update"));
const CreateProduction = lazy(() => import("./pages/inventory/production_list/create"));

// Table Management
const Table = lazy(() => import("./pages/table/tablemanagement"));
const CreateArea = lazy(() => import("./pages/table/tablemanagement/create"));
const UpdateTable = lazy(() => import("./pages/table/tablemanagement/update"));
const TablePlanManagement = lazy(() => import("./pages/table/tableplan"));
const CreateTable = lazy(() => import("./pages/table/tableplan/create"));
const UpdateTableForm = lazy(() => import("./pages/table/tableplan/update"));
const QRCodeGenerator = lazy(() => import("./pages/table/generateQr"));
const ReservationPage = lazy(() => import("./pages/reservation"));

// Purchase
const SupplierManagement = lazy(() => import("./pages/purchase/supplier"));
const CreateSupplier = lazy(() => import("./pages/purchase/supplier/create"));
const UpdateSupplier = lazy(() => import("./pages/purchase/supplier/update"));
const PurchaseOrderManagement = lazy(() => import("./pages/purchase/purchaseorder"));
const CreatePurchaseOrder = lazy(() => import("./pages/purchase/purchaseorder/create"));
const ShoppingList = lazy(() => import("./pages/purchase/shoppinglist"));
const CreateShoppingList = lazy(() => import("./pages/purchase/shoppinglist/create"));
const ExpenditureListManagement = lazy(() => import("./pages/purchase/expenditurelist"));
const CreateExpenditureList = lazy(() => import("./pages/purchase/expenditurelist/create"));

// Report
const Summary = lazy(() => import("./pages/report/sales/summary"));
const SalesTransaction = lazy(() => import("./pages/report/sales/sales_transaction"));
const SalesMenu = lazy(() => import("./pages/report/sales/index"));
const OperationalMenu = lazy(() => import("./pages/report/operational"));
const ProfitMenu = lazy(() => import("./pages/report/profit"));
const DigitalPayment = lazy(() => import("./pages/report/sales/digital_payment"));
const ProductSales = lazy(() => import("./pages/report/sales/product_sales"));
const DeviceSales = lazy(() => import("./pages/report/sales/device_sales"));
const DailySales = lazy(() => import("./pages/report/sales/daily_sales"));
const HourlySales = lazy(() => import("./pages/report/sales/hourly_sales"));
const CustomerSales = lazy(() => import("./pages/report/sales/customer_sales"));
const PaymentMethodSales = lazy(() => import("./pages/report/sales/payment_method_sales"));
const TypeSales = lazy(() => import("./pages/report/sales/type_sales"));
const CategorySales = lazy(() => import("./pages/report/sales/category_sales"));
const OutletSales = lazy(() => import("./pages/report/sales/outlet_sales"));
const EventSalesManagement = lazy(() => import("./pages/report/sales/event_sales"));
const TypeTransaction = lazy(() => import("./pages/report/sales/status_transaction"));

// Operational Reports
const Reconciliation = lazy(() => import("./pages/report/operational/reconciliation"));
const StockManagement = lazy(() => import("./pages/report/operational/stock"));
const UserAttendancesManagement = lazy(() => import("./pages/report/operational/user_attendances"));
const InstallmentManagement = lazy(() => import("./pages/report/operational/installment"));
const ExpenditureManagement = lazy(() => import("./pages/report/operational/expenditure"));
const CommissionManagement = lazy(() => import("./pages/report/operational/commission"));
const TableManagement = lazy(() => import("./pages/report/operational/table"));
const StockReconciliation = lazy(() => import("./pages/stock_reconciliation"));

// Profit Reports
const TaxRevenueManagement = lazy(() => import("./pages/report/profit/tax_revenue"));
const DiscountManagement = lazy(() => import("./pages/report/profit/discount"));
const DailyProfitManagement = lazy(() => import("./pages/report/profit/daily-profit"));
const ProfitByProductManagement = lazy(() => import("./pages/report/profit/profit_by_product"));

// Promotion & Voucher
const Vouchermanagement = lazy(() => import("./pages/promotion/voucher/index"));
const CreateVoucher = lazy(() => import("./pages/promotion/voucher/create"));
const UpdateVoucher = lazy(() => import("./pages/promotion/voucher/update"));
const Promotionmanagement = lazy(() => import("./pages/promotion/index"));
const PromoList = lazy(() => import("./pages/promotion/promo/index"));
const CreatePromoPage = lazy(() => import("./pages/promotion/promo/create"));
const UpdatePromoPage = lazy(() => import("./pages/promotion/promo/update"));
const RunningAutoPromos = lazy(() => import("./pages/promotion/autopromo/index"));
const CreateAutoPromoPage = lazy(() => import("./pages/promotion/autopromo/create"));
const UpdateAutoPromo = lazy(() => import("./pages/promotion/autopromo/update"));
const PointManagement = lazy(() => import("./pages/promotion/points"));
const LevelManagement = lazy(() => import("./pages/promotion/loyaltylevels/index"));
const LoyaltyIndex = lazy(() => import("./pages/promotion/loyaltyprograms/index"));
const CreateLoyaltyProgram = lazy(() => import("./pages/promotion/loyaltyprograms/create"));
const EditLoyaltyProgram = lazy(() => import("./pages/promotion/loyaltyprograms/update"));

// Content & Event
const ContentManagement = lazy(() => import("./pages/content/index"));
const CreateContent = lazy(() => import("./pages/content/create"));
const UpdateContent = lazy(() => import("./pages/content/update"));
const EventManagement = lazy(() => import("./pages/event"));
const CreateEvent = lazy(() => import("./pages/event/create"));
const UpdateEvent = lazy(() => import("./pages/event/update"));
const ReportEvent = lazy(() => import("./pages/event/report"));

// Settings & Access
const AccessMenu = lazy(() => import("./pages/access"));
const RoleManagement = lazy(() => import("./pages/access/role"));
const CreateRole = lazy(() => import("./pages/access/role/create"));
const UpdateRole = lazy(() => import("./pages/access/role/update"));
const UserManagement = lazy(() => import("./pages/access/user"));
const CreateUser = lazy(() => import("./pages/access/user/create"));
const UpdateUser = lazy(() => import("./pages/access/user/update"));
const DepartementTable = lazy(() => import("./pages/access/departement"));
const CreateDepartemen = lazy(() => import("./pages/access/departement/create"));
const UpdateDepartemen = lazy(() => import("./pages/access/departement/update"));
const BarMenu = lazy(() => import("./pages/access/barmenu"));
const CreateSidebarMenu = lazy(() => import("./pages/access/barmenu/create"));
const UpdateSidebarMenu = lazy(() => import("./pages/access/barmenu/update"));
const ActivityLogTable = lazy(() => import("./pages/activity_logs"));
const AssetManagement = lazy(() => import("./pages/aset"));

// Other
const EmployeeManagement = lazy(() => import("./pages/employee"));
const CreateEmployee = lazy(() => import("./pages/employee/create"));
const CustomerManagement = lazy(() => import("./pages/customer"));
const CreateCustomer = lazy(() => import("./pages/customer/create"));
const UpdateCustomer = lazy(() => import("./pages/customer/update"));
const CreateTax = lazy(() => import("./pages/tax/create_tax"));
const UpdateTax = lazy(() => import("./pages/tax/update_tax"));
const CreateManageOutlet = lazy(() => import("./pages/tax/manageoutlet"));
const CreateService = lazy(() => import("./pages/tax/create_service"));
const DeviceManagement = lazy(() => import("./pages/device/maindevice"));
const CreateDevice = lazy(() => import("./pages/device/maindevice/create"));
const UpdateDevice = lazy(() => import("./pages/device/maindevice/update"));
const ExtraDeviceManagement = lazy(() => import("./pages/device/extradevice"));
const UpdateExtraDevice = lazy(() => import("./pages/device/extradevice/update"));
const CreateOutlet = lazy(() => import("./pages/outlet/create"));
const UpdateOutlet = lazy(() => import("./pages/outlet/update"));
const Commission = lazy(() => import("./pages/commission"));
const CreateCommission = lazy(() => import("./pages/commission/create"));
const HRDashboard = lazy(() => import("./pages/hr"));
const TaxManagementPage = lazy(() => import("./pages/tax"));
const TargetSalesManagementPage = lazy(() => import("./pages/target_sales"));
const ReceiptDesign = lazy(() => import("./pages/recepit_design"));


export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Halaman Umum - Non Lazy (untuk SEO/Performance awal) */}
              <Route path="/" element={<SignIn />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />

              <Route path="/about" element={<About />} />
              <Route path="/example" element={<Example />} />
              <Route path="/download" element={<Download />} />

              {/* Halaman Admin dengan Sidebar */}
              <Route element={<PrivateRoute allowedRoles={["admin", "superadmin", "qc", "inventory", "hrd", "operational", "marketing", "akuntan", "cashier senior", "super kasir"]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  {/* <Route index element={<AdminDashboard />} /> */}
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="restaurant-analytics" element={<AnalyticsDashboard />} />
                  <Route path="example" element={<Example />} />
                  <Route path="menu-receipt/:id" element={<ReceiptMenu />} />
                  <Route path="menu" element={<Menumanagement />} />
                  <Route path="menu-create" element={<Menucreate />} />
                  <Route path="menu-update/:id" element={<MenuUpdate />} />
                  <Route path="category-create" element={<AddCategory />} />
                  <Route path="category-update/:id" element={<UpdateCategory />} />

                  {/* Menu On Device */}
                  <Route path="menu-on-device" element={<DeviceMenuManager />} />

                  {/* Table */}
                  <Route path="table-management" element={<Table />} />
                  <Route path="table-management/table-create" element={<CreateArea />} />
                  <Route path="table-management/table-update/:id" element={<UpdateTable />} />
                  <Route path="table-plan" element={<TablePlanManagement />} />
                  <Route path="table-plan/create" element={<CreateTable />} />
                  <Route path="table-plan/update/:id" element={<UpdateTableForm />} />
                  <Route path="generate-qr" element={<QRCodeGenerator />} />
                  {/* Purchase */}

                  {/* supplier */}
                  <Route path="purchase/supplier" element={<SupplierManagement />} />
                  <Route path="purchase/supplier-create" element={<CreateSupplier />} />
                  <Route path="purchase/supplier-update/:id" element={<UpdateSupplier />} />

                  {/* Purchase Order */}
                  <Route path="purchase/purchase-order" element={<PurchaseOrderManagement />} />
                  <Route path="purchase/purchase-order-create" element={<CreatePurchaseOrder />} />

                  {/* Shopping List */}
                  <Route path="purchase/shopping-list" element={<ShoppingList />} />
                  <Route path="purchase/shopping-list-create" element={<CreateShoppingList />} />

                  {/* Expenditure List */}
                  <Route path="purchase/expenditure-list" element={<ExpenditureListManagement />} />
                  <Route path="purchase/expenditure-list-create" element={<CreateExpenditureList />} />

                  {/* Report */}
                  <Route path="sales-menu" element={<SalesMenu />} />
                  <Route path="operational-menu" element={<OperationalMenu />} />
                  <Route path="profit-menu" element={<ProfitMenu />} />

                  {/* Sales */}
                  <Route path="digital-payment" element={<DigitalPayment />} />
                  <Route path="transaction-sales" element={<SalesTransaction />} />
                  <Route path="type-transaction" element={<TypeTransaction />} />
                  <Route path="product-sales" element={<ProductSales />} />
                  <Route path="device-sales" element={<DeviceSales />} />
                  <Route path="daily-sales" element={<DailySales />} />
                  <Route path="hourly-sales" element={<HourlySales />} />
                  <Route path="customer-sales" element={<CustomerSales />} />
                  <Route path="payment-method-sales" element={<PaymentMethodSales />} />
                  <Route path="type-sales" element={<TypeSales />} />
                  <Route path="category-sales" element={<CategorySales />} />
                  <Route path="summary" element={<Summary />} />
                  <Route path="outlet-sales" element={<OutletSales />} />
                  <Route path="event-sales" element={<EventSalesManagement />} />

                  {/* Operational */}
                  <Route path="operational/reconciliation" element={<Reconciliation />} />
                  <Route path="operational/stock" element={<StockManagement />} />
                  <Route path="operational/user-attendances" element={<UserAttendancesManagement />} />
                  <Route path="operational/installment" element={<InstallmentManagement />} />
                  <Route path="operational/expenditure" element={<ExpenditureManagement />} />
                  <Route path="operational/commission" element={<CommissionManagement />} />
                  <Route path="operational/table" element={<TableManagement />} />

                  {/* HR */}
                  <Route path="hrdDashboard" element={<HRDashboard />} />

                  {/* Profit */}
                  <Route path="tax-revenue" element={<TaxRevenueManagement />} />
                  <Route path="discount" element={<DiscountManagement />} />
                  <Route path="daily-profit" element={<DailyProfitManagement />} />
                  <Route path="profit-by-product" element={<ProfitByProductManagement />} />

                  {/* Asset */}
                  <Route path="assets" element={<AssetManagement />} />

                  {/* Inventory */}
                  <Route path="inventory/stockcard" element={<StockCardManagement />} />
                  <Route path="inventory/in" element={<CurrentStockManagement />} />
                  <Route path="inventory/cardoutlet" element={<OutletCardManagement />} />
                  {/* <Route path="inventory/in" element={<InStockManagement />} /> */}
                  <Route path="inventory/instock-create" element={<CreateStock />} />
                  <Route path="inventory/out" element={<OutStockManagement />} />
                  <Route path="inventory/outstock-create" element={<CreateOutStock />} />
                  <Route path="inventory/stockopname" element={<StockOpnameManagement />} />
                  <Route path="inventory/stockopname-create" element={<CreateStokOpname />} />
                  <Route path="inventory/transfer" element={<TransferStockManagement />} />
                  <Route path="inventory/transfer-stock-create" element={<CreateTransferStock />} />
                  <Route path="inventory/production-stock" element={<ProductionStockManagement />} />
                  <Route path="inventory/production-list" element={<ProductionListManagement />} />
                  <Route path="inventory/production-update/:id" element={<UpdateProduction />} />
                  <Route path="inventory/production-create" element={<CreateProduction />} />
                  <Route path="inventory/so" element={<SoManagement />} />

                  {/* Tax And Service */}
                  {/* Tax */}
                  <Route path="tax-create" element={<CreateTax />} />
                  <Route path="tax-update/:id" element={<UpdateTax />} />
                  <Route path="tax-and-service/:id/manage-to-outlet" element={<CreateManageOutlet />} />

                  {/* Service */}
                  <Route path="service-create" element={<CreateService />} />

                  {/* Employee */}
                  <Route path="employee" element={<EmployeeManagement />} />
                  <Route path="employee-create" element={<CreateEmployee />} />

                  {/* Customer */}
                  <Route path="customers" element={<CustomerManagement />} />
                  <Route path="customer-create" element={<CreateCustomer />} />
                  <Route path="customer-update/:id" element={<UpdateCustomer />} />

                  {/* Device */}
                  <Route path="billing/device" element={<DeviceManagement />} />
                  <Route path="billing/device/create" element={<CreateDevice />} />
                  <Route path="billing/extra-device" element={<ExtraDeviceManagement />} />
                  <Route path="billing/extra-device/:id" element={<UpdateExtraDevice />} />
                  <Route path="billing/device/:id" element={<UpdateDevice />} />

                  {/* Outlet */}
                  <Route path="outlet" element={<OutletManagementPage />} />
                  <Route path="outlet-create" element={<CreateOutlet />} />
                  <Route path="update-outlet/:id" element={<UpdateOutlet />} />
                  <Route path="tax-and-service" element={<TaxManagementPage />} />
                  <Route path="target-sales" element={<TargetSalesManagementPage />} />
                  <Route path="receipt-design" element={<ReceiptDesign />} />

                  {/* Reconciliation */}
                  <Route path="reconciliation" element={<StockReconciliation />} />

                  {/* Event */}
                  <Route path="event" element={<EventManagement />} />
                  <Route path="event/create-event" element={<CreateEvent />} />
                  <Route path="event/edit-event/:id" element={<UpdateEvent />} />
                  <Route path="event/report" element={<ReportEvent />} />

                  {/* Voucher */}
                  <Route path="voucher" element={<Vouchermanagement />} />
                  <Route path="voucher-create" element={<CreateVoucher />} />
                  <Route path="voucher-update/:id" element={<UpdateVoucher />} />

                  {/* promosi */}
                  <Route path="promotion" element={<Promotionmanagement />} />
                  <Route path="promo-khusus" element={<PromoList />} />
                  <Route path="promo-khusus-create" element={<CreatePromoPage />} />
                  <Route path="promo-khusus-update/:id" element={<UpdatePromoPage />} />
                  <Route path="promo-otomatis" element={<RunningAutoPromos />} />
                  <Route path="promo-otomatis-create" element={<CreateAutoPromoPage />} />
                  <Route path="promo-otomatis-update/:id" element={<UpdateAutoPromo />} />
                  <Route path="poin" element={<PointManagement />} />

                  {/* point */}
                  <Route path="loyalty-levels" element={<LevelManagement />} />

                  {/* Loyalty Programs */}
                  <Route path="loyalty" element={<LoyaltyIndex />} />
                  <Route path="loyalty/create" element={<CreateLoyaltyProgram />} />
                  <Route path="loyalty/edit/:id" element={<EditLoyaltyProgram />} />

                  {/* Storage */}
                  <Route path="storage" element={<Storagemanagement />} />
                  <Route path="storage-create" element={<CreateStrorage />} />
                  <Route path="categories" element={<CategoryIndex />} />
                  <Route path="categories-create" element={<AddCategory />} />
                  <Route path="categories-assign" element={<AssignMenuItemToCategory />} />

                  <Route path="reservation" element={<ReservationPage />} />

                  <Route path="content" element={<ContentManagement />} />
                  <Route path="content-create" element={<CreateContent />} />
                  <Route path="content-update/:id" element={<UpdateContent />} />

                  {/* Commission */}
                  <Route path="commission" element={<Commission />} />
                  <Route path="commission-create" element={<CreateCommission />} />

                  {/* Access */}
                  <Route path="access-settings" element={<AccessMenu />} />

                  {/* Role */}
                  <Route path="access-settings/role" element={<RoleManagement />} />
                  <Route path="access-settings/role-create" element={<CreateRole />} />
                  <Route path="access-settings/role-update/:id" element={<UpdateRole />} />

                  {/* User */}
                  <Route path="access-settings/user" element={<UserManagement />} />
                  <Route path="access-settings/user-create" element={<CreateUser />} />
                  <Route path="access-settings/user-update/:id" element={<UpdateUser />} />

                  {/* Department */}
                  <Route path="access-settings/departement" element={<DepartementTable />} />
                  <Route path="access-settings/departemen-create" element={<CreateDepartemen />} />
                  <Route path="access-settings/departemen-update/:id" element={<UpdateDepartemen />} />

                  {/* Sidebar */}
                  <Route path="access-settings/bar-menu" element={<BarMenu />} />
                  <Route path="access-settings/bar-menu/create-bar-menu" element={<CreateSidebarMenu />} />
                  <Route path="access-settings/bar-menu/update-bar-menu/:id" element={<UpdateSidebarMenu />} />

                  {/* Logs */}
                  <Route path="logs" element={<ActivityLogTable />} />
                </Route>
              </Route>

              {/* Halaman Profil untuk Pengguna Login */}
              <Route element={<PrivateRoute />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
