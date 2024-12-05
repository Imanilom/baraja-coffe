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
import CreateMenu from './pages/menu/CreateMenu';
import UpdateMenu from './pages/menu/UpdateMenu';
import DeleteMenu from './pages/menu/DeleteMenu';

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
            <Route path="/create-menu" element={<CreateMenu />} />
            <Route path="/update-menu/:id" element={<UpdateMenu />} />
            <Route path="/delete-menu/:id" element={<DeleteMenu />} />
            <Route element={<PrivateRoute />}>
              <Route path='/profile' element={<Profile />} />

            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
