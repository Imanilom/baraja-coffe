import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "../../redux/user/userSlice";
import { fetchOutlets } from "../../redux/outlet/outletSlice";
import { jwtDecode } from "jwt-decode";
import { FaHome, FaShoppingCart, FaCog, FaUser } from "react-icons/fa";
import Header from "./header";

const AdminDashboard = () => {

  const [isOpen, setIsOpen] = useState(true);
  const { currentUser } = useSelector((state) => state.user);
  const { outlets, lastFetched } = useSelector((state) => state.outlet);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Responsive sidebar init
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Fetch outlets if not fetched in the last hour
    if (!lastFetched || Date.now() - lastFetched > 3600000) {
      dispatch(fetchOutlets());
    }
  }, [dispatch, lastFetched]);

  useEffect(() => {
    if (currentUser?.token) {
      try {
        const decoded = jwtDecode(currentUser.token);
        const now = Date.now() / 1000; // detik
        if (decoded.exp < now) {
          dispatch(signOut());
          navigate("/sign-in", { replace: true });
        }
      } catch (err) {
        console.error("Invalid token:", err.message || err);
        dispatch(signOut());
        navigate("/sign-in", { replace: true });
      }
    }
  }, [currentUser, dispatch, navigate]);

  return (
    <>
      <style>
        {`
          .custom-scrollbar {
            scrollbar-gutter: stable;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px; /* Tweak scrollbar */
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(0, 84, 41, 0.3);
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-button {
            display: none;
          }
        `}
      </style>

      <div className="flex bg-[#F8FAFC]">
        {/* Toggle Button for Mobile/Desktop */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed top-4 z-[60] bg-white/90 backdrop-blur text-[#005429] p-1.5 rounded-full shadow-md transition-all duration-300 border border-slate-200 hover:bg-[#005429] hover:text-white
            ${isSidebarOpen ? "left-[13.5rem]" : "left-4"}`}
        >
          {isSidebarOpen ? <FaChevronLeft className="text-sm" /> : <FaChevronRight className="text-sm" />}
        </button>
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div
          className={`relative w-full h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 bg-[#F8FAFC] font-["Inter",sans-serif] selection:bg-[#005429] selection:text-white
            ${isSidebarOpen ? "lg:ml-56" : "ml-0"}`}
        >
          <Header />
          <div className="p-4 sm:p-6 lg:p-8 pt-0 lg:pt-0 max-w-[1600px] mx-auto">
            <Outlet context={{ isSidebarOpen }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

