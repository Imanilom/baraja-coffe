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
import Menuupdate from './pages/menu/update';

// Topping
import ToppingManagement from './pages/topping/index';
import CreateTopping from './pages/topping/create';
import UpdateTopping from './pages/topping/update';
import DeleteTopping from './pages/topping/delete';

// addons
import AddonManagement from './pages/addons/index';
import CreateAddon from './pages/addons/create';
import UpdateAddon from './pages/addons/update';
import DeleteAddon from './pages/addons/delete';

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
              <Route path='/menu' element={<CreateAddon />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
