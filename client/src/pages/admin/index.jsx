import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "../../redux/user/userSlice";
import { jwtDecode } from "jwt-decode";

const AdminDashboard = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        console.error("Invalid token:", err);
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
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: gray;
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-button {
            display: none;
          }
        `}
      </style>

      {/* Tombol Toggle di luar sidebar */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-0 z-40 bg-gray-800 text-white p-2 rounded-r-full transition-all duration-300
          ${isSidebarOpen ? "left-64" : "left-0"}`}
      >
        {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      <div className="flex">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div
          className={`transition-all duration-300 w-full max-w-full box-border overflow-y-auto overflow-x-hidden h-screen ${isSidebarOpen ? "lg:ml-64" : "ml-0"
            }`}
        >
          <Outlet context={{ isSidebarOpen }} />
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
