import { FaBell, FaSearch } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();

    // Just a small helper to make the title dynamic based on path (optional)
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('dashboard')) return 'Dashboard Overview';
        if (path.includes('menu')) return 'Menu Management';
        if (path.includes('inventory')) return 'Inventory Management';
        if (path.includes('report')) return 'Reports';
        if (path.includes('profile')) return 'Profile Settings';
        if (path.includes('access-settings')) return 'Access Settings';
        if (path.includes('purchase')) return 'Purchase Orders';
        if (path.includes('promotion')) return 'Promotions';
        return 'Overview';
    };

    return (
        <header className="glass-header flex justify-between items-center px-6 sm:px-8 py-4 mb-6 mt-2 mx-4 sm:mx-6 lg:mx-8 rounded-2xl">
            {/* Left side */}
            <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-['Outfit',sans-serif] capitalize">
                    {getPageTitle()}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Welcome back, <span className="text-[#005429] font-semibold">{currentUser?.username || 'User'}</span> 👋
                </p>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Search Bar (Optional UI) */}
                <div className="hidden md:flex items-center bg-slate-100/50 border border-slate-200 rounded-full px-4 py-2 hover:bg-white hover:border-[#005429]/30 hover:shadow-sm transition-all focus-within:bg-white focus-within:border-[#005429] focus-within:ring-2 focus-within:ring-[#005429]/10">
                    <FaSearch className="text-slate-400 text-sm mr-2" />
                    <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-32 xl:w-48 placeholder:text-slate-400" />
                </div>

                <button className="relative p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-[#005429] border border-transparent hover:border-slate-200 hover:shadow-sm">
                    <FaBell className="text-sm" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

                <Link to="/profile" className="flex items-center gap-3 hover:bg-white p-1.5 pr-4 rounded-full transition-all border border-transparent hover:border-slate-200 hover:shadow-sm group">
                    <div className="relative">
                      <img
                          src={currentUser?.profilePicture || `https://ui-avatars.com/api/?name=${currentUser?.username || 'User'}&background=005429&color=fff`}
                          alt="Profile"
                          className="w-9 h-9 rounded-full shadow-sm object-cover border border-slate-200 group-hover:border-[#005429]/50 transition-colors"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="hidden lg:block text-left">
                        <p className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-[#005429] transition-colors">
                            {currentUser?.username || 'User'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                            {typeof currentUser?.role === 'object' ? currentUser.role.name : (currentUser?.role || 'Admin')}
                        </p>
                    </div>
                </Link>
            </div>
        </header>
    )
}