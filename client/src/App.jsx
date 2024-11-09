import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

// Product
import ProductList from './pages/product/ProductList';
import Productadd from './pages/product/ProductManagement';
import Productedit from './pages/product/ProductEdit';

// Voucher 
import VoucherList from './pages/voucher/VoucherList';
import Voucheradd from './pages/voucher/VoucherManagement';
import Voucheredit from './pages/voucher/VoucherEdit';

// Order
import Order from './pages/order/Order';
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
              {/* Routes Product manajement */}
              <Route path='/product' element={<ProductList />} />
              <Route path='/add-product' element={<Productadd />} />
              <Route path='/edit-product/:id' element={<Productedit />} />
              {/* Routes Voucher manajement */}
              <Route path='/voucher' element={<VoucherList />} />
              <Route path='/add-voucher' element={<Voucheradd />} />
              <Route path='/edit-voucher/:id' element={<Voucheredit />} />
              {/* Order */}
              <Route path='/order' element={<Order />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
