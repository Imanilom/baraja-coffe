import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Download from './components/download';
import Sidebar from './components/Sidebar';
// menu
import Menumanagement from './pages/menu/index';
import Menucreate from './pages/menu/create';
import MenuUpdate from './pages/menu/update';

// Topping
import ToppingManagement from './pages/topping/index';
import CreateTopping from './pages/topping/create';

// addons
import AddonManagement from './pages/addons/index';
import CreateAddon from './pages/addons/create';

// Voucher
import Vouchermanagement from './pages/voucher/index';
import CreateVoucher from './pages/voucher/create';

// promotion
import Promotionmanagement from './pages/promotion/index';
import CreatePromotion from './pages/promotion/create';

// order
import Order from './pages/order/index';
import Outlet from './pages/Outlet';

// storage
import Storagemanagement from './pages/storage/index';
import CreateStrorage from './pages/storage/RawMaterial';

// Admin
import AdminDashboard from './pages/admin/index';
import OutletManagementPage from './pages/outlet/index';

// Report
import ReportDashboard from './pages/report';
import TransactionSalesManagement from './pages/sales/sales_transaction/index';
import ProductSalesManagement from './pages/sales/sales_product/index';
import SalesOutlateManagement from './pages/sales/sales_outlate/index';
import CategoryOutlateManagement from './pages/sales/sales_category/index';

// content
import ContentManagement from './pages/content/index';
import CreateContent from './pages/content/create';
import UpdateContent from './pages/content/update';

export default function App() {

  return (


    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/download" element={<Download />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/order" element={<Order />} />
            <Route path="/outlet" element={<Outlet />} />
            {/* Routes with restricted access */}
            <Route element={<PrivateRoute allowedRoles={['cashier', 'superadmin']} />}>
              {/* <div className="flex"> */}
              {/* <Sidebar /> */}
              {/* <div className="flex-1"> */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/toko" element={<OutletManagementPage />} />
              <Route path="/menu" element={<Menumanagement />} />
              <Route path="/menu-create" element={<Menucreate />} />
              <Route path="/menu-update/:id" element={<MenuUpdate />} />
              <Route path="/voucher" element={<Vouchermanagement />} />
              <Route path="/voucher-create" element={<CreateVoucher />} />
              <Route path="/toppings" element={<ToppingManagement />} />
              <Route path="/topping-create" element={<CreateTopping />} />
              <Route path="/addons" element={<AddonManagement />} />
              <Route path="/addons-create" element={<CreateAddon />} />
              <Route path="/promotion" element={<Promotionmanagement />} />
              <Route path="/promotion-create" element={<CreatePromotion />} />
              <Route path="/storage" element={<Storagemanagement />} />
              <Route path="/storage-create" element={<CreateStrorage />} />
              <Route path="/content" element={<ContentManagement />} />
              <Route path="/content-create" element={<CreateContent />} />
              <Route path="/content-update/:id" element={<UpdateContent />} />
              {/* </div> */}
              {/* </div> */}

            </Route>

            {/* Routes for authenticated users */}
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
