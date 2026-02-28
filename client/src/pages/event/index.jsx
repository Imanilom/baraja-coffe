import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { FaTicketAlt, FaTrashAlt, FaPencilAlt, FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTag, FaExclamationTriangle, FaCheckCircle, FaTimes } from "react-icons/fa";
import Paginated from "../../components/paginated";
import { useSelector } from "react-redux";
import ConfirmModal from "../../components/modal/confirmmodal";
import SuccessModal from "../../components/modal/successmodal";
import ErrorModal from "../../components/modal/errormodal";

const EventManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [isDeleting, setIsDeleting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [event, setEvent] = useState([]);
    const [value, setValue] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [filteredData, setFilteredData] = useState([]);
    const [tempSearch, setTempSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Fetch event data
    const fetchEvent = async () => {
        try {
            const eventResponse = await axios.get('/api/event');
            const eventData = eventResponse.data.data || [];
            setEvent(eventData);
            setFilteredData(eventData);
        } catch (err) {
            console.error("Error fetching events:", err);
            setEvent([]);
            setFilteredData([]);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await fetchEvent();
        } catch (err) {
            console.error("General error:", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = date.getUTCDate();
        const month = months[date.getUTCMonth()];
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return { date: `${day} ${month} ${year}`, time: `${hours}:${minutes}` };
    };

    const applyFilter = () => {
        const filtered = event.filter(e => {
            const eventDate = dayjs(e.date);
            const startDate = value.startDate ? dayjs(value.startDate).startOf('day') : null;
            const endDate = value.endDate ? dayjs(value.endDate).endOf('day') : null;

            const inDateRange = (!startDate || eventDate.isAfter(startDate.subtract(1, 'second'))) &&
                (!endDate || eventDate.isBefore(endDate.add(1, 'second')));

            const matchSearch = !tempSearch ||
                e.name?.toLowerCase().includes(tempSearch.toLowerCase()) ||
                e.category?.toLowerCase().includes(tempSearch.toLowerCase()) ||
                e.location?.toLowerCase().includes(tempSearch.toLowerCase()) ||
                e.organizer?.toLowerCase().includes(tempSearch.toLowerCase());

            return inDateRange && matchSearch;
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    };

    const resetFilter = () => {
        setTempSearch("");
        setValue({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
        });
        setFilteredData(event);
        setCurrentPage(1);
    };

    // Handle delete click - show modal
    const handleDeleteClick = (eventId, eventName) => {
        setEventToDelete({ id: eventId, name: eventName });
        setShowDeleteModal(true);
    };

    // Confirm delete - actual API call
    const confirmDelete = async () => {
        if (!eventToDelete) return;

        setIsDeleting(eventToDelete.id);
        setShowDeleteModal(false);

        try {
            await axios.delete(`/api/event/${eventToDelete.id}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });

            // Update state tanpa reload
            const updatedEvents = event.filter(e => e._id !== eventToDelete.id);
            setEvent(updatedEvents);
            setFilteredData(filteredData.filter(e => e._id !== eventToDelete.id));

            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);

        } catch (error) {
            console.error('Error deleting event:', error);
            setErrorMessage(error.response?.data?.message || 'Gagal menghapus event. Silakan coba lagi.');
            setShowErrorModal(true);
        } finally {
            setIsDeleting(null);
            setEventToDelete(null);
        }
    };

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredData]);

    const getCategoryColor = (category) => {
        const colors = {
            'Technology': 'bg-blue-100 text-blue-700',
            'Music': 'bg-purple-100 text-purple-700',
            'Music Show': 'bg-purple-100 text-purple-700',
            'Business': 'bg-green-100 text-green-700',
            'Sports': 'bg-red-100 text-red-700',
            'Education': 'bg-yellow-100 text-yellow-700'
        };
        return colors[category] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Hapus Event?"
                message={
                    <>
                        Apakah Anda yakin ingin menghapus event{' '}
                        <span className="font-semibold text-gray-800">"{eventToDelete?.name}"</span>?
                        <br />
                        <span className="text-sm text-red-500 mt-2 inline-block">
                            Tindakan ini tidak dapat dibatalkan.
                        </span>
                    </>
                }
                confirmText="Ya, Hapus"
                cancelText="Batal"
            />

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Berhasil!"
                message="Event berhasil dihapus dari sistem!"
                autoClose={true}
                autoCloseDelay={3000}
            />

            <ErrorModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Gagal Menghapus"
                message={errorMessage}
                buttonText="Tutup"
            />

            {/* Header Section */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                                <FaTicketAlt size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Event Management</h1>
                                <p className="text-sm text-gray-500">Kelola semua event Anda</p>
                            </div>
                        </div>
                        <Link
                            to="/admin/event/create-event"
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            <span>+</span>
                            <span>Tambah Event Baru</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-6">
                {/* Filter Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        {/* Date Picker - FIXED VERSION */}
                        <div className="lg:col-span-3">
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                Rentang Tanggal
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Start Date */}
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={value.startDate}
                                        onChange={(e) => setValue({ ...value, startDate: e.target.value })}
                                        className="w-full px-3 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-sm"
                                    />
                                </div>
                                {/* End Date */}
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={value.endDate}
                                        onChange={(e) => setValue({ ...value, endDate: e.target.value })}
                                        className="w-full px-3 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="lg:col-span-4">
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                Cari Event
                            </label>
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan nama, kategori, atau lokasi..."
                                    value={tempSearch}
                                    onChange={(e) => setTempSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={applyFilter}
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Terapkan Filter
                            </button>
                            <button
                                onClick={resetFilter}
                                className="flex-1 border-2 border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-medium transition-all duration-300"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Event</p>
                                <h3 className="text-3xl font-bold mt-2">{filteredData.length}</h3>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <FaTicketAlt size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Kapasitas</p>
                                <h3 className="text-3xl font-bold mt-2">
                                    {filteredData.reduce((sum, e) => sum + (e.capacity || 0), 0).toLocaleString()}
                                </h3>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <FaUsers size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Tiket Terjual</p>
                                <h3 className="text-3xl font-bold mt-2">
                                    {filteredData.reduce((sum, e) => sum + (e.soldTickets || 0), 0).toLocaleString()}
                                </h3>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <FaCalendarAlt size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Event</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Waktu</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kategori</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Lokasi</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kapasitas</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Harga</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.map((event) => {
                                    const dateTime = formatDateTime(event.date);
                                    return (
                                        <tr
                                            key={event._id}
                                            className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{event.name}</p>
                                                    <p className="text-sm text-gray-500">{event.organizer}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <FaCalendarAlt className="text-green-600" size={14} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{dateTime.date}</p>
                                                        <p className="text-xs text-gray-500">{dateTime.time} WIB</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category)}`}>
                                                    <FaTag className="mr-1" size={10} />
                                                    {event.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <FaMapMarkerAlt className="text-red-500" size={14} />
                                                    <span className="text-sm text-gray-700">{event.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <FaUsers className="text-blue-600" size={14} />
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-800">{event.availableTickets?.toLocaleString() || 0}</span>
                                                        <span className="text-xs text-gray-500"> / {event.capacity?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-green-600">
                                                    {formatCurrency(event.price)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <Link
                                                        to={`/admin/event/edit-event/${event._id}`}
                                                        className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                                        title="Edit Event"
                                                    >
                                                        <FaPencilAlt size={14} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(event._id, event.name)}
                                                        disabled={isDeleting === event._id}
                                                        className={`group relative p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${isDeleting === event._id
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                                                            }`}
                                                        title="Hapus Event"
                                                    >
                                                        {isDeleting === event._id ? (
                                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                                                        ) : (
                                                            <FaTrashAlt size={14} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 lg:hidden">
                    {paginatedData.map((event) => {
                        const dateTime = formatDateTime(event.date);
                        return (
                            <div
                                key={event._id}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4">
                                    <h3 className="font-bold text-white text-lg mb-1">{event.name}</h3>
                                    <p className="text-green-50 text-sm">{event.organizer}</p>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <FaCalendarAlt className="text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium">{dateTime.date}</p>
                                                <p className="text-xs text-gray-500">{dateTime.time} WIB</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category)}`}>
                                            {event.category}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <FaMapMarkerAlt className="text-red-500" />
                                        <span className="text-sm">{event.location}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center space-x-2">
                                            <FaUsers className="text-blue-600" />
                                            <span className="text-sm font-medium">
                                                {event.availableTickets?.toLocaleString() || 0} / {event.capacity?.toLocaleString()}
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(event.price)}
                                        </span>
                                    </div>

                                    <div className="flex space-x-2 pt-3">
                                        <Link
                                            to={`/admin/event/edit-event/${event._id}`}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                                        >
                                            <FaPencilAlt size={14} />
                                            <span>Edit</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteClick(event._id, event.name)}
                                            disabled={isDeleting === event._id}
                                            className={`flex-1 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 ${isDeleting === event._id
                                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                                                }`}
                                        >
                                            {isDeleting === event._id ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    <span>Menghapus...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaTrashAlt size={14} />
                                                    <span>Hapus</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default EventManagement;