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
import Vouchermanagement from "./pages/voucher/index";
import CreateVoucher from "./pages/voucher/create";

// Report
import ReportDashboard from "./pages/report/index";
import Summary from "./pages/report/summary";
import SalesTransaction from "./pages/report/sales_transaction";

// inventory
import Storagemanagement from "./pages/storage/index";
import CreateStrorage from "./pages/storage/RawMaterial";
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
// point
import PointManagement from "./pages/promotion/points/index";

import ViewMenu from "./pages/menu/view";
import ProductSales from "./pages/report/product_sales";
import CategorySales from "./pages/report/category_sales";
import OutletSales from "./pages/report/outlet_sales";
import DailySales from "./pages/report/daily_sales";
import Example from "./pages/example";
import HourlySales from "./pages/report/hourly_sales";
import PaymentMethodSales from "./pages/report/payment_method_sales";
import TypeSales from "./pages/report/type_sales";
import CustomerSales from "./pages/report/customer_sales";
import DeviceSales from "./pages/report/device_sales";
import DigitalPayment from "./pages/report/digital_payment";
import CreateAddOns from "./pages/menu/add_ons/create";
import AddOns from "./pages/menu/add_ons";



export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            {/* Halaman Umum */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/download" element={<Download />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* Halaman Admin dengan Sidebar */}
            <Route element={<PrivateRoute allowedRoles={["admin", "superadmin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="toko" element={<OutletManagementPage />} />
                <Route path="example" element={<Example />} />
                <Route path="menu" element={<Menumanagement />} />
                <Route path="menu-create" element={<Menucreate />} />
                <Route path="menu/:id" element={<ViewMenu />} />
                <Route path="menu-update/:id" element={<MenuUpdate />} />
                <Route path="add-ons" element={<AddOns />} />
                <Route path="create-addons" element={<CreateAddOns />} />
                <Route path="category-create" element={<AddCategory />} />
                <Route path="report" element={<ReportDashboard />} />
                <Route path="digital-payment" element={<DigitalPayment />} />
                <Route path="transaction-sales" element={<SalesTransaction />} />
                <Route path="product-sales" element={<ProductSales />} />
                <Route path="device-sales" element={<DeviceSales />} />
                <Route path="daily-sales" element={<DailySales />} />
                <Route path="hourly-sales" element={<HourlySales />} />
                <Route path="outlet-sales" element={<OutletSales />} />
                <Route path="customer-sales" element={<CustomerSales />} />
                <Route path="payment-method-sales" element={<PaymentMethodSales />} />
                <Route path="type-sales" element={<TypeSales />} />
                <Route path="category-sales" element={<CategorySales />} />
                <Route path="summary" element={<Summary />} />
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
                 <Route path="poin" element={<PointManagement />} />
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
