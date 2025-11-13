import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import Download from "./components/download";
import AdminLayout from "./pages/admin/index"; // Gunakan Layout Admin

// Admin Pages
import AdminDashboard from "./pages/admin/index";
import OutletManagementPage from "./pages/outlet/index";
import Menumanagement from "./pages/menu/index";
import Menucreate from "./pages/menu/create";
import MenuUpdate from "./pages/menu/update";
import AddCategory from "./pages/menu/category/create";
import Vouchermanagement from "./pages/promotion/voucher/index";
import CreateVoucher from "./pages/promotion/voucher/create";

// Report
import Summary from "./pages/report/sales/summary";
import SalesTransaction from "./pages/report/sales/sales_transaction";
import SalesMenu from "./pages/report/sales/index";

// inventory
import Storagemanagement from "./pages/storage/index";
import CreateStrorage from "./pages/storage/newStock";
import CategoryIndex from "./pages/menu/category/index";
import CreateCategory from "./pages/menu/category/create";
import AssignMenuItemToCategory from "./pages/menu/category/assignmenu";

// content
import ContentManagement from "./pages/content/index";
import CreateContent from "./pages/content/create";
import UpdateContent from "./pages/content/update";
// promo
import Promotionmanagement from "./pages/promotion/index";
// promo khusus
import CreatePromoPage from "./pages/promotion/promo/create";
import PromoList from "./pages/promotion/promo/index";
// auto promo
import CreateAutoPromoPage from "./pages/promotion/autopromo/create";
import RunningAutoPromos from "./pages/promotion/autopromo/index";
// levels 
import LevelManagement from "./pages/promotion/loyaltylevels/index";

// Loyalty Program
import LoyaltyIndex from "./pages/promotion/loyaltyprograms/index";
import CreateLoyaltyProgram from "./pages/promotion/loyaltyprograms/create";
import EditLoyaltyProgram from "./pages/promotion/loyaltyprograms/update";

import ViewMenu from "./pages/menu/view";
import ProductSales from "./pages/report/sales/product_sales";
import CategorySales from "./pages/report/sales/category_sales";
import OutletSales from "./pages/report/sales/outlet_sales";
import DailySales from "./pages/report/sales/daily_sales";
import Example from "./pages/example";
import HourlySales from "./pages/report/sales/hourly_sales";
import PaymentMethodSales from "./pages/report/sales/payment_method_sales";
import TypeSales from "./pages/report/sales/type_sales";
import CustomerSales from "./pages/report/sales/customer_sales";
import DeviceSales from "./pages/report/sales/device_sales";
import DigitalPayment from "./pages/report/sales/digital_payment";
import CreateAddOns from "./pages/menu/add_ons/create";
import AddOns from "./pages/menu/add_ons";
import Dashboard from "./pages/dashboard";
import CreateOutlet from "./pages/outlet/create";
import TaxManagementPage from "./pages/tax";
import TargetSalesManagementPage from "./pages/target_sales";
import ReceiptDesign from "./pages/recepit_design";
import OperationalMenu from "./pages/report/operational";
import Reconciliation from "./pages/report/operational/reconciliation";
import StockManagement from "./pages/report/operational/stock";
import UserAttendancesManagement from "./pages/report/operational/user_attendances";
import ExpenditureManagement from "./pages/report/operational/expenditure";
import CommissionManagement from "./pages/report/operational/commission";
import InstallmentManagement from "./pages/report/operational/installment";
import TableManagement from "./pages/report/operational/table";
import InStockManagement from "./pages/inventory/in_stock";
import OutStockManagement from "./pages/inventory/out_stock";
import StockCardManagement from "./pages/inventory/stockcard";
import ProductionStockManagement from "./pages/inventory/production_stock";
import StockOpnameManagement from "./pages/inventory/stock_opname";
import TransferStockManagement from "./pages/inventory/transfer_stock";
import ProfitMenu from "./pages/report/profit";
import TaxRevenueManagement from "./pages/report/profit/tax_revenue";
import DiscountManagement from "./pages/report/profit/discount";
import DailyProfitManagement from "./pages/report/profit/daily-profit";
import ProfitByProductManagement from "./pages/report/profit/profit_by_product";
import ManageStock from "./pages/menu/managestock";
import ModifierManagement from "./pages/menu/modifier";
import PriceSellingStatusManagement from "./pages/menu/pricesellingstatus";
import SupplierManagement from "./pages/purchase/supplier";
import PurchaseOrderManagement from "./pages/purchase/purchaseorder";
import ShoppingList from "./pages/purchase/shoppinglist";
import Table from "./pages/table/tablemanagement";
import UpdateCategory from "./pages/menu/category/update";
import EmployeeManagement from "./pages/employee";
import CustomerManagement from "./pages/customer";
import CreateModifier from "./pages/menu/modifier/create";
import CreateTax from "./pages/tax/create_tax";
import CreateSupplier from "./pages/purchase/supplier/create";
import OutletCardManagement from "./pages/inventory/outletcard";
import CreateStock from "./pages/inventory/in_stock/create";
import CreateOutStock from "./pages/inventory/out_stock/create";
import CreateTransferStock from "./pages/inventory/transfer_stock/create";
import CreateStokOpname from "./pages/inventory/stock_opname/create";
import CreateProduction from "./pages/inventory/production_list/create";
import CreatePurchaseOrder from "./pages/purchase/purchaseorder/create";
import ExpenditureListManagement from "./pages/purchase/expenditurelist";
import CreateShoppingList from "./pages/purchase/shoppinglist/create";
import CreateExpenditureList from "./pages/purchase/expenditurelist/create";
import CreateEmployee from "./pages/employee/create";
import CreateCustomer from "./pages/customer/create";
import DeviceManagement from "./pages/device/maindevice";
import ExtraDeviceManagement from "./pages/device/extradevice";
import UpdateDevice from "./pages/device/maindevice/update";
import UpdateExtraDevice from "./pages/device/extradevice/update";
import CreateManageOutlet from "./pages/tax/manageoutlet";
import CreateService from "./pages/tax/create_service";
import UpdateOutlet from "./pages/outlet/update";
import Commission from "./pages/commission";
import CreateCommission from "./pages/commission/create";
import CreateArea from "./pages/table/tablemanagement/create";
import UpdateTable from "./pages/table/tablemanagement/update";
import TablePlanManagement from "./pages/table/tableplan";
import UpdateSupplier from "./pages/purchase/supplier/update";
import UpdatePromoPage from "./pages/promotion/promo/update";
import PointManagement from "./pages/promotion/points";
import UpdateAutoPromo from "./pages/promotion/autopromo/update";
import ReceiptMenu from "./pages/menu/receipt";
import AddSubCategory from "./pages/menu/category_sub/create";
import CreateTable from "./pages/table/tableplan/create";
import EventManagement from "./pages/event";
import CreateEvent from "./pages/event/create";
import UpdateTableForm from "./pages/table/tableplan/update";
import ProductionListManagement from "./pages/inventory/production_list";
import UpdateProduction from "./pages/inventory/production_list/update";
import UpdateEvent from "./pages/event/update";
import UpdateVoucher from "./pages/promotion/voucher/update";
import CurrentStockManagement from "./pages/inventory/current_stock_menu";
import SoManagement from "./pages/inventory/so";
import AccessMenu from "./pages/access";
import UserManagement from "./pages/access/user";
import RoleManagement from "./pages/access/role";
import CreateUser from "./pages/access/user/create";
import UpdateUser from "./pages/access/user/update";
import CreateRole from "./pages/access/role/create";
import UpdateRole from "./pages/access/role/update";
import DepartementTable from "./pages/access/departement";
import CreateDepartemen from "./pages/access/departement/create";
import UpdateDepartemen from "./pages/access/departement/update";
import ActivityLogTable from "./pages/activity_logs";
import UpdateTax from "./pages/tax/update_tax";
import BarMenu from "./pages/access/barmenu";
import CreateSidebarMenu from "./pages/access/barmenu/create";
import UpdateSidebarMenu from "./pages/access/barmenu/update";
import AnalyticsDashboard from "./pages/analytics";
import QRCodeGenerator from "./pages/table/generateQr";
import AssetManagement from "./pages/aset";
import CreateDevice from "./pages/device/maindevice/create";
import ReservationPage from "./pages/reservation";
import TypeTransaction from "./pages/report/sales/status_transaction";
import TicketManagement from "./pages/ticket";
import CreateTicket from "./pages/ticket/create";
import UpdateTicket from "./pages/ticket/update";
import StockReconciliation from "./pages/stock_reconciliation";

// HRD Routes
import HRDashboard from "./pages/hr";


export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            {/* Halaman Umum */}
            <Route path="/" element={<SignIn />} />
            <Route path="/about" element={<About />} />
            <Route path="example" element={<Example />} />
            <Route path="/download" element={<Download />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* Halaman Admin dengan Sidebar */}
            <Route element={<PrivateRoute allowedRoles={["admin", "superadmin", "qc", "inventory", "hrd", "operational", "marketing", "akuntan"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                {/* <Route index element={<AdminDashboard />} /> */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="restaurant-analytics" element={<AnalyticsDashboard />} />
                <Route path="example" element={<Example />} />
                <Route path="menu-receipt/:id" element={<ReceiptMenu />} />
                <Route path="menu" element={<Menumanagement />} />
                <Route path="menu-create" element={<Menucreate />} />
                <Route path="modifier-create" element={<CreateModifier />} />
                <Route path="menu/:id" element={<ViewMenu />} />
                <Route path="menu-update/:id" element={<MenuUpdate />} />
                <Route path="add-ons" element={<AddOns />} />
                <Route path="modifier" element={<ModifierManagement />} />
                <Route path="addons-create" element={<CreateAddOns />} />
                <Route path="category-create" element={<AddCategory />} />
                <Route path="category-update/:id" element={<UpdateCategory />} />
                <Route path="subcategory-create" element={<AddSubCategory />} />
                <Route path="manage-stock/:id" element={<ManageStock />} />
                <Route path="manage-price-and-selling-status/:id" element={<PriceSellingStatusManagement />} />

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

                {/* Ticket */}
                <Route path="ticket" element={<TicketManagement />} />
                <Route path="ticket/create-ticket" element={<CreateTicket />} />
                <Route path="ticket/edit-ticket/:id" element={<UpdateTicket />} />

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
                <Route path="categories-create" element={<CreateCategory />} />
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
        </main>
      </div>
    </BrowserRouter>
  );
}
