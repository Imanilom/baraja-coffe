import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Header from "./components/Header";
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
import Vouchermanagement from "./pages/voucher/index";
import CreateVoucher from "./pages/voucher/create";
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



export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
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
                <Route path="menu" element={<Menumanagement />} />
                <Route path="menu-create" element={<Menucreate />} />
                <Route path="menu-update/:id" element={<MenuUpdate />} />
                <Route path="voucher" element={<Vouchermanagement />} />
                <Route path="voucher-create" element={<CreateVoucher />} />
                <Route path="promotion" element={<Promotionmanagement />} />
                <Route path="promo-khusus-create" element={<CreatePromoPage />} />
                <Route path="promo-khusus" element={<IndexPromoPage />} />
                <Route path="promo-otomatis-create" element={<CreateAutoPromoPage />} />
                <Route path="promo-otomatis" element={<RunningAutoPromos />} />
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
        <Footer />
      </div>
    </BrowserRouter>
  );
}
