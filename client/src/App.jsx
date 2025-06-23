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
import IndexPromoPage from "./pages/promotion/promo/index";
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
import CreateProduction from "./pages/inventory/production_stock/create";



export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            {/* Halaman Umum */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="example" element={<Example />} />
            <Route path="/download" element={<Download />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* Halaman Admin dengan Sidebar */}
            <Route element={<PrivateRoute allowedRoles={["admin", "superadmin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="example" element={<Example />} />
                <Route path="menu" element={<Menumanagement />} />
                <Route path="menu-create" element={<Menucreate />} />
                <Route path="modifier-create" element={<CreateModifier />} />
                <Route path="menu/:id" element={<ViewMenu />} />
                <Route path="menu-update/:id" element={<MenuUpdate />} />
                <Route path="add-ons" element={<AddOns />} />
                <Route path="modifier" element={<ModifierManagement />} />
                <Route path="create-addons" element={<CreateAddOns />} />
                <Route path="category-create" element={<AddCategory />} />
                <Route path="category-update/:id" element={<UpdateCategory />} />
                <Route path="manage-stock/:id" element={<ManageStock />} />
                <Route path="manage-price-and-selling-status/:id" element={<PriceSellingStatusManagement />} />
                <Route path="shopping-list" element={<ShoppingList />} />
                <Route path="table-management" element={<Table />} />

                {/* Purchase */}

                {/* supplier */}
                <Route path="supplier" element={<SupplierManagement />} />
                <Route path="create-supplier" element={<CreateSupplier />} />

                {/* Purchase Order */}
                <Route path="purchase-order" element={<PurchaseOrderManagement />} />

                {/* Report */}
                <Route path="sales-menu" element={<SalesMenu />} />
                <Route path="operational-menu" element={<OperationalMenu />} />
                <Route path="profit-menu" element={<ProfitMenu />} />
                {/* Sales */}
                <Route path="digital-payment" element={<DigitalPayment />} />
                <Route path="transaction-sales" element={<SalesTransaction />} />
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
                <Route path="reconciliation" element={<Reconciliation />} />
                <Route path="stock" element={<StockManagement />} />
                <Route path="user-attendances" element={<UserAttendancesManagement />} />
                <Route path="installment" element={<InstallmentManagement />} />
                <Route path="expenditure" element={<ExpenditureManagement />} />
                <Route path="commission" element={<CommissionManagement />} />
                <Route path="table" element={<TableManagement />} />
                {/* Profit */}
                <Route path="tax-revenue" element={<TaxRevenueManagement />} />
                <Route path="discount" element={<DiscountManagement />} />
                <Route path="daily-profit" element={<DailyProfitManagement />} />
                <Route path="profit-by-product" element={<ProfitByProductManagement />} />

                {/* Inventory */}
                <Route path="inventory/stockcard" element={<StockCardManagement />} />
                <Route path="inventory/cardoutlet" element={<OutletCardManagement />} />
                <Route path="inventory/in" element={<InStockManagement />} />
                <Route path="inventory/create-instock" element={<CreateStock />} />
                <Route path="inventory/out" element={<OutStockManagement />} />
                <Route path="inventory/create-outstock" element={<CreateOutStock />} />
                <Route path="inventory/stockopname" element={<StockOpnameManagement />} />
                <Route path="inventory/create-stockopname" element={<CreateStokOpname />} />
                <Route path="inventory/transfer" element={<TransferStockManagement />} />
                <Route path="inventory/create-transfer-stock" element={<CreateTransferStock />} />
                <Route path="inventory/production" element={<ProductionStockManagement />} />
                <Route path="inventory/create-production" element={<CreateProduction />} />

                {/* Tax And Service */}
                <Route path="tax-create" element={<CreateTax />} />


                {/* Employee */}
                <Route path="employee" element={<EmployeeManagement />} />

                {/* Customer */}
                <Route path="customer" element={<CustomerManagement />} />

                {/* Outlet */}
                <Route path="outlet" element={<OutletManagementPage />} />
                <Route path="create-outlet" element={<CreateOutlet />} />
                <Route path="tax-and-service" element={<TaxManagementPage />} />
                <Route path="target-sales" element={<TargetSalesManagementPage />} />
                <Route path="receipt-design" element={<ReceiptDesign />} />
                {/* Voucher */}
                <Route path="voucher" element={<Vouchermanagement />} />
                <Route path="voucher-create" element={<CreateVoucher />} />
                {/* promosi */}
                <Route path="promotion" element={<Promotionmanagement />} />
                <Route path="promo-khusus-create" element={<CreatePromoPage />} />
                <Route path="promo-khusus" element={<IndexPromoPage />} />
                <Route path="promo-otomatis-create" element={<CreateAutoPromoPage />} />
                <Route path="promo-otomatis" element={<RunningAutoPromos />} />
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

                <Route path="content" element={<ContentManagement />} />
                <Route path="content-create" element={<CreateContent />} />
                <Route path="content-update/:id" element={<UpdateContent />} />

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
