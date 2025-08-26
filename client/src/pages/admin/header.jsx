import { FaBell, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Header() {
    return (
        <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
            <FaBell size={23} className="text-gray-400" />
            <span className="text-[14px]">Hi Baraja</span>
            <Link to="/profile" className="text-gray-400 inline-block text-2xl">
                <FaUser size={30} />
            </Link>
        </div>
    )
}