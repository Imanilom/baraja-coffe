import React from "react";
import Sidebar from "./sidebar";
import { Outlet } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
