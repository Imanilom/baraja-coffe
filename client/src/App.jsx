import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

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
// import Promotionmanagement from './pages/promotion/index';
// import CreatePromotion from './pages/promotion/create';

// // order
// import Order from './pages/order/index';

// // storage
// import Storagemanagement from './pages/storage/index';
// import CreateStrorage from './pages/storage/create';


export default function App() {
  return (
    <BrowserRouter>
    <div className="flex flex-col min-h-screen">
      {/* header */}
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/about' element={<About />} />
            <Route path='/sign-in' element={<SignIn />} />
            <Route path='/sign-up' element={<SignUp />} />
            <Route element={<PrivateRoute />}>
            <Route path='/profile' element={<Profile />} />
              <Route path='/menu' element={<Menumanagement />} />
              <Route path='/menu-create' element={<Menucreate />} />
              <Route path='/menu-update/:id' element={<MenuUpdate />} />
              <Route path='/voucher' element={<Vouchermanagement />} />
              <Route path='/voucher-create' element={<CreateVoucher />} />
              <Route path='/toppings' element={<ToppingManagement />} />
              <Route path='/topping-create' element={<CreateTopping />} />
              <Route path='/addons' element={<AddonManagement />} />
              <Route path='/addons-create' element={<CreateAddon />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
