import React, { useState, useEffect } from "react";
import { FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import dayjs from "dayjs";
import axios from "axios";
import Header from "../admin/header";
import ActivityLineChart from "./linechart";

const ActivityLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);

  // Fetch logs dari API
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/logs?page=${page}&limit=${pagination.limit}`);
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(logs.map((d) => d._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedItems((prev) => [...prev, id]);
    }
  };

  return (
    <>
      <Header />
      <div className="p-6 bg-white">
        <div className="flex justify-between items-center py-3 my-3">
          <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
            Logs
          </h1>
        </div>

        {/* Chart */}
        <ActivityLineChart logs={logs} />

        {/* Table */}
        <table className="min-w-full text-sm text-gray-700 shadow rounded">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="flex justify-start px-4 py-3">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedItems.length === logs.length && logs.length > 0}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Action</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">IP</th>
              <th className="px-6 py-3 text-left">User Agent</th>
              <th className="px-6 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(row._id)}
                      onChange={() => handleSelectItem(row._id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-6 py-3">
                    {row.userId ? (
                      <div>
                        <div className="font-semibold">{row.userId.username}</div>
                        <div className="text-gray-500 text-xs">{row.userId.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-3">{row.action}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === "SUCCESS"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{row.ip}</td>
                  <td className="px-6 py-3 truncate max-w-[200px]">{row.userAgent}</td>
                  <td className="px-6 py-3">
                    {dayjs(row.createdAt).format("DD-MM-YYYY HH:mm")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500 text-sm">
                  Tidak ada log ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              <FaChevronLeft /> Sebelumnya
            </button>

            <span>
              Halaman {currentPage} dari {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Selanjutnya <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ActivityLogTable;
