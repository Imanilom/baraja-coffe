import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

// Product
import ProductList from './pages/product/ProductList';
import Productadd from './pages/product/ProductManagement';
import Productedit from './pages/product/ProductEdit';

export default function App() {
  return (
    <BrowserRouter>
      {/* header */}
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/sign-in' element={<SignIn />} />
        <Route path='/sign-up' element={<SignUp />} />
   
        <Route element={<PrivateRoute />}>
          <Route path='/profile' element={<Profile />} />
          <Route path='/product' element={<ProductList />} />
          <Route path='/add-product' element={<Productadd />} />
          <Route path='/edit-product/:id' element={<Productedit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
