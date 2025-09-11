import { FaBell, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Header() {
    return (
        <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
            <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                {/* <FaIdBadge className="text-[#005429]" />
                            Manajemen Karyawan */}
            </h1>
            <div className="flex items-center space-x-4">
                <FaBell size={20} className="text-gray-400" />
                <span className="text-sm text-gray-600">Hi, Baraja</span>
                <Link to="/profile">
                    <FaUser size={22} className="text-gray-500" />
                </Link>
            </div>
        </header>
    )
}