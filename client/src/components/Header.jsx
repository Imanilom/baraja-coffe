import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        {/* Logo */}
         <Link to="/">
          <div className="flex items-center space-x-2">
            <img src="https://placehold.co/600x400/png" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-semibold text-green-700">Baraja Coffee</span>
          </div>
        </Link>
        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/about" className="text-green-700 hover:underline">
            Tentang
          </Link>
          <Link to="/menu" className="text-green-700 hover:underline">
            Menu
          </Link>
          <Link to="/collaboration" className="text-green-700 hover:underline">
            Kolaborasi
          </Link>
          <Link to="/store" className="text-green-700 hover:underline">
            Store
          </Link>
          <Link to="/news" className="text-green-700 hover:underline">
            News
          </Link>
          <Link to="/career" className="text-green-700 hover:underline">
            Karir
          </Link>
          <Link to="/contact" className="text-green-700 hover:underline">
            Hubungi Kami
          </Link>
        
        </nav>

        {/* Call to Action Button */}
        <Link
          to="/download"
          className="hidden md:block px-4 py-2 border border-green-700 text-green-700 rounded-full hover:bg-green-700 hover:text-white transition"
        >
          Download App
        </Link>

        {/* Mobile Menu Toggle */}
        <button onClick={toggleSidebar} className="md:hidden text-green-700 text-xl">
          {isSidebarOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* Sidebar for Mobile View */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 md:hidden">
          <div
            className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-30 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex flex-col gap-4">
              <Link to="/" className="text-green-700 hover:underline">
                Tentang
              </Link>
              <Link to="/menu" className="text-green-700 hover:underline">
                Menu
              </Link>
              <Link to="/collaboration" className="text-green-700 hover:underline">
                Kolaborasi
              </Link>
              <Link to="/store" className="text-green-700 hover:underline">
                Store
              </Link>
              <Link to="/news" className="text-green-700 hover:underline">
                News
              </Link>
              <Link to="/career" className="text-green-700 hover:underline">
                Karir
              </Link>
              <Link to="/contact" className="text-green-700 hover:underline">
                Hubungi Kami
              </Link>
              <Link
                to="/download"
                className="block px-4 py-2 border border-green-700 text-green-700 rounded-full hover:bg-green-700 hover:text-white transition"
              >
                Download App
              </Link>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
