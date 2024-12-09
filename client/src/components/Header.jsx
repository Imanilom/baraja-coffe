import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [isProductDropdownOpen, setProductDropdownOpen] = useState(false);
  const [isVoucherDropdownOpen, setVoucherDropdownOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarProductDropdownOpen, setSidebarProductDropdownOpen] = useState(false);
  const [isSidebarVoucherDropdownOpen, setSidebarVoucherDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarProductDropdown = () => {
    setSidebarProductDropdownOpen(!isSidebarProductDropdownOpen);
  };

  const toggleSidebarVoucherDropdown = () => {
    setSidebarVoucherDropdownOpen(!isSidebarVoucherDropdownOpen);
  };

  return (
    <div className='bg-slate-200'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        <Link to='/'>
          <h1 className='font-bold'>Baraja Coffee</h1>
        </Link>
        <div className='md:hidden'>
          <button onClick={toggleSidebar} className='text-xl'>
            {isSidebarOpen ? '✖' : '☰'}
          </button>
        </div>
        <ul className='hidden md:flex gap-4 relative'>
          <Link to='/'>
            <li>Home</li>
          </Link>
          <Link to='/about'>
            <li>About</li>
          </Link>
          <Link to='/profile'>
            {currentUser ? (
              <img src={currentUser.profilePicture} alt='profile' className='h-7 w-7 rounded-full object-cover' />
            ) : (
              <li>Sign In</li>
            )}
          </Link>
        </ul>
      </div>

      {/* Sidebar for mobile and tablet views */}
      {isSidebarOpen && (
        <div className='fixed inset-0 bg-gray-800 bg-opacity-50 z-20 md:hidden' onClick={toggleSidebar}>
          <div
            className='fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-30 p-4'
            onClick={(e) => e.stopPropagation()} // Prevents sidebar from closing when clicking inside
          >
            <h2 className='font-bold text-xl mb-4'>Menu</h2>
            <ul className='flex flex-col gap-2'>
              <Link to='/'>
                <li>Home</li>
              </Link>
              <Link to='/about'>
                <li>About</li>
              </Link>
             
              
              <Link to='/profile'>
                {currentUser ? (
                  <li>Profile</li>
                ) : (
                  <li>Sign In</li>
                )}
              </Link>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
