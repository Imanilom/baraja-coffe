import { FaBell, FaPoll, FaSearch } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function Header() {
    const { currentUser } = useSelector((state) => state.user);
    return (
        <header className="flex justify-end items-center px-6 py-3 border-b bg-green-900">
            <div className="flex items-center gap-3">
                {/* <div className="relative">
                    <FaSearch className="absolute top-3 left-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring"
                    />
                </div> */}
                <FaBell className="text-white cursor-pointer" />
                <Link to="/profile">
                    <img
                        src={`https://ui-avatars.com/api/?name=${currentUser.username}`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-white"
                    />
                </Link>
            </div>
        </header>
    )
}