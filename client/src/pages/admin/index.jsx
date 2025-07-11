import React, { useState } from "react";
import Sidebar from "./sidebar";
// import Header from "./header";
import { Outlet } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <>
      {/* Tombol Toggle di luar sidebar */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-0 z-50 bg-gray-800 text-white p-2 rounded-r-full transition-all duration-300
          ${isSidebarOpen ? "left-64" : "left-0"}`}
      >
        {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      <div className="flex">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div
          className={`transition-all duration-300 w-full ${isSidebarOpen ? "ml-64" : "ml-0"
            }`}
        >
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
