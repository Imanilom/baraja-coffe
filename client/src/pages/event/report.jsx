import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Printer, CheckCircle, DollarSign, Users, Ticket, UserCheck, Clock, RefreshCw, Calendar } from 'lucide-react';
import Datepicker from "react-tailwindcss-datepicker";
import axios from 'axios';

const ReportEvent = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [checkInStats, setCheckInStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [attendanceSearch, setAttendanceSearch] = useState('');
    const [attendanceDateRange, setAttendanceDateRange] = useState({
        startDate: null,
        endDate: null
    });

    // Fetch events on component mount
    useEffect(() => {
        fetchEvents();
    }, []);

    // Fetch data when event is selected or tab changes
    useEffect(() => {
        if (selectedEvent) {
            if (activeTab === 'attendance') {
                fetchAttendees(selectedEvent);
                fetchCheckInStats(selectedEvent);
            } else if (activeTab === 'sales') {
                fetchSalesData(selectedEvent);
            }
        }
    }, [selectedEvent, activeTab]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/event');
            const eventsData = response.data.data || response.data;
            setEvents(eventsData);

            if (eventsData.length > 0) {
                setSelectedEvent(eventsData[0]._id);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch events');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesData = async (eventId) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/api/event/${eventId}`);
            const eventData = response.data.data || response.data;

            // Only fetch sales data for paid events
            if (!eventData.isFreeEvent && eventData.attendees && eventData.attendees.length > 0) {
                const formattedSalesData = eventData.attendees.map(attendee => ({
                    id: attendee._id,
                    bookingCode: attendee.bookingCode || 'N/A',
                    event: eventData.name,
                    customer: attendee.customerName || attendee.name || 'N/A',
                    email: attendee.email || 'N/A',
                    quantity: attendee.quantity || 1,
                    totalPrice: attendee.totalPrice || (eventData.price * (attendee.quantity || 1)),
                    revenue: attendee.totalPrice || (eventData.price * (attendee.quantity || 1)),
                    purchaseDate: attendee.purchaseDate || attendee.createdAt,
                    status: attendee.paymentStatus || attendee.status || 'completed'
                }));
                setSalesData(formattedSalesData);
            } else {
                setSalesData([]);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch sales data');
            console.error('Error fetching sales data:', err);
            setSalesData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendees = async (eventId) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/api/event/${eventId}`);
            const eventData = response.data.data || response.data;

            let attendeesData = [];

            if (eventData.isFreeEvent && eventData.freeRegistrations) {
                attendeesData = eventData.freeRegistrations.map(reg => ({
                    _id: reg._id,
                    bookingCode: reg.bookingCode || 'FREE-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    customerName: reg.fullName || reg.name,
                    email: reg.email,
                    phone: reg.phone,
                    quantity: 1,
                    checkedIn: reg.checkInStatus === 'checked-in',
                    checkInStatus: reg.checkInStatus,
                    checkInTime: reg.checkInTime,
                    registrationDate: reg.registrationDate,
                    createdAt: reg.registrationDate || reg.createdAt,
                    notes: reg.notes
                }));
            } else if (eventData.attendees) {
                attendeesData = eventData.attendees.map(att => ({
                    ...att,
                    customerName: att.customerName || att.name,
                    createdAt: att.purchaseDate || att.createdAt
                }));
            }

            setAttendanceData(attendeesData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch attendees');
            console.error('Error fetching attendees:', err);
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCheckInStats = async (eventId) => {
        try {
            const response = await axios.get(`/api/event/${eventId}`);
            const eventData = response.data.data || response.data;

            let stats = {
                totalRegistered: 0,
                checkedIn: 0,
                checkedInPercentage: 0
            };

            if (eventData.isFreeEvent && eventData.freeRegistrations) {
                stats.totalRegistered = eventData.freeRegistrations.length;
                stats.checkedIn = eventData.freeRegistrations.filter(r => r.checkInStatus === 'checked-in').length;
            } else if (eventData.attendees) {
                stats.totalRegistered = eventData.attendees.length;
                stats.checkedIn = eventData.attendees.filter(a => a.checkedIn || a.checkInStatus === 'checked-in').length;
            }

            if (stats.totalRegistered > 0) {
                stats.checkedInPercentage = Math.round((stats.checkedIn / stats.totalRegistered) * 100);
            }

            setCheckInStats(stats);
        } catch (err) {
            console.error('Error fetching check-in stats:', err);
        }
    };

    const handleDateRangeChange = (newValue) => {
        if (newValue && newValue.startDate && newValue.endDate) {
            const formattedRange = {
                startDate: typeof newValue.startDate === 'string' ? newValue.startDate : new Date(newValue.startDate).toISOString().split('T')[0],
                endDate: typeof newValue.endDate === 'string' ? newValue.endDate : new Date(newValue.endDate).toISOString().split('T')[0]
            };
            setDateRange(formattedRange);
        } else {
            setDateRange({ startDate: null, endDate: null });
        }
    };

    const handleAttendanceDateChange = (newValue) => {
        if (newValue && newValue.startDate && newValue.endDate) {
            const formattedRange = {
                startDate: typeof newValue.startDate === 'string' ? newValue.startDate : new Date(newValue.startDate).toISOString().split('T')[0],
                endDate: typeof newValue.endDate === 'string' ? newValue.endDate : new Date(newValue.endDate).toISOString().split('T')[0]
            };
            setAttendanceDateRange(formattedRange);
        } else {
            setAttendanceDateRange({ startDate: null, endDate: null });
        }
    };

    // Compute selectedEventData first
    const selectedEventData = useMemo(() => {
        return events.find(e => e._id === selectedEvent);
    }, [events, selectedEvent]);

    const filteredData = useMemo(() => {
        if (!salesData || salesData.length === 0) return [];

        return salesData.filter(item => {
            const matchSearch =
                (item.bookingCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.event || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchStatus = statusFilter === 'all' || item.status === statusFilter;

            if (!item.purchaseDate) return matchSearch && matchStatus;

            const date = new Date(item.purchaseDate);
            if (isNaN(date.getTime())) return matchSearch && matchStatus;

            const itemDate = date.toISOString().split('T')[0];
            const matchStartDate = !dateRange.startDate || itemDate >= dateRange.startDate;
            const matchEndDate = !dateRange.endDate || itemDate <= dateRange.endDate;

            return matchSearch && matchStatus && matchStartDate && matchEndDate;
        });
    }, [salesData, searchTerm, statusFilter, dateRange]);

    const stats = useMemo(() => {
        if (selectedEventData && !selectedEventData.isFreeEvent) {
            const totalTicketsSold = selectedEventData.soldTickets || 0;
            const totalRevenue = totalTicketsSold * (selectedEventData.price || 0);

            return {
                totalPurchases: filteredData.length,
                completed: filteredData.filter(d => d.status === 'completed').length,
                totalTickets: totalTicketsSold,
                totalRevenue: totalRevenue
            };
        }

        return {
            totalPurchases: filteredData.length,
            completed: filteredData.filter(d => d.status === 'completed').length,
            totalTickets: filteredData.reduce((sum, d) => sum + (d.quantity || 0), 0),
            totalRevenue: filteredData.reduce((sum, d) => sum + (d.revenue || 0), 0)
        };
    }, [filteredData, selectedEventData]);

    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '-';
        }
    };

    const filteredAttendanceData = useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) return [];

        return attendanceData.filter(item => {
            const dateValue = item.purchaseDate || item.createdAt || item.registrationDate;
            if (!dateValue) return false;

            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return false;

            const itemDate = date.toISOString().split('T')[0];
            const matchStartDate = !attendanceDateRange.startDate || itemDate >= attendanceDateRange.startDate;
            const matchEndDate = !attendanceDateRange.endDate || itemDate <= attendanceDateRange.endDate;
            const matchSearch =
                (item.bookingCode || '').toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                (item.customerName || item.customer || '').toLowerCase().includes(attendanceSearch.toLowerCase());
            return matchStartDate && matchEndDate && matchSearch;
        });
    }, [attendanceData, attendanceDateRange, attendanceSearch]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                                Sistem Manajemen Tiket Event
                            </h1>
                            <p className="text-gray-600 text-sm">Kelola dan pantau penjualan serta kehadiran event Anda</p>
                        </div>
                        <button
                            onClick={fetchEvents}
                            disabled={loading}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Selector */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Pilih Event
                    </label>
                    <select
                        value={selectedEvent || ''}
                        onChange={(e) => {
                            setSelectedEvent(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                    >
                        <option value="">-- Pilih Event --</option>
                        {events.map(event => (
                            <option key={event._id} value={event._id}>
                                {event.name} - {new Date(event.date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </option>
                        ))}
                    </select>

                    {selectedEventData && (
                        <div className="mt-5 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                                <h3 className="font-bold text-gray-800 text-lg">{selectedEventData.name}</h3>
                                <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${selectedEventData.isFreeEvent
                                    ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                                    : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                                    }`}>
                                    {selectedEventData.isFreeEvent ? '🎉 Event Gratis' : '💰 Event Berbayar'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <span className="text-gray-600 block mb-1">Kapasitas</span>
                                    <span className="font-bold text-lg text-gray-800">{selectedEventData.capacity}</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <span className="text-gray-600 block mb-1">
                                        {selectedEventData.isFreeEvent ? 'Terdaftar' : 'Terjual'}
                                    </span>
                                    <span className="font-bold text-lg text-blue-600">
                                        {selectedEventData.isFreeEvent
                                            ? (selectedEventData.freeRegistrations?.length || 0)
                                            : (selectedEventData.soldTickets || 0)}
                                    </span>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <span className="text-gray-600 block mb-1">Sisa Slot</span>
                                    <span className="font-bold text-lg text-green-600">
                                        {selectedEventData.isFreeEvent
                                            ? selectedEventData.capacity - (selectedEventData.freeRegistrations?.length || 0)
                                            : (selectedEventData.availableTickets || 0)}
                                    </span>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <span className="text-gray-600 block mb-1">Harga</span>
                                    <span className="font-bold text-lg text-orange-600">
                                        {selectedEventData.isFreeEvent ? 'Gratis' : formatCurrency(selectedEventData.price)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-3 mb-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`flex-1 min-w-fit px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'sales'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
                            }`}
                    >
                        <Ticket className="w-5 h-5" />
                        <span>Laporan Penjualan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`flex-1 min-w-fit px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'attendance'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
                            }`}
                    >
                        <UserCheck className="w-5 h-5" />
                        <span>Registrasi Kedatangan</span>
                    </button>
                </div>

                {activeTab === 'sales' && (
                    <>
                        {selectedEventData && selectedEventData.isFreeEvent ? (
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-10 text-center shadow-lg">
                                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
                                    <Ticket className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">Event Gratis</h3>
                                <p className="text-gray-600 mb-2 text-lg">
                                    Event <span className="font-semibold">"{selectedEventData.name}"</span> adalah event gratis.
                                </p>
                                <p className="text-gray-600 mb-6">
                                    Tidak ada data penjualan untuk ditampilkan.
                                </p>
                                <div className="inline-block px-6 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium">
                                    💡 Silakan lihat tab <strong>Registrasi Kedatangan</strong> untuk melihat peserta
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Total Pembelian</h3>
                                            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                                <Users className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold mb-1">{stats.totalPurchases}</p>
                                        <p className="text-xs opacity-80">Transaksi</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Selesai</h3>
                                            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold mb-1">{stats.completed}</p>
                                        <p className="text-xs opacity-80">Pembayaran Sukses</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Total Tiket</h3>
                                            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                                <Ticket className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold mb-1">{stats.totalTickets}</p>
                                        <p className="text-xs opacity-80">Tiket Terjual</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Total Pendapatan</h3>
                                            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</p>
                                        <p className="text-xs opacity-80">Revenue</p>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Filter className="w-5 h-5" />
                                        Filter Data
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            >
                                                <option value="all">Semua Status</option>
                                                <option value="pending">Pending</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Tanggal</label>
                                            <Datepicker
                                                value={dateRange}
                                                onChange={handleDateRangeChange}
                                                showShortcuts={true}
                                                placeholder="Pilih Rentang Tanggal"
                                                displayFormat="DD/MM/YYYY"
                                                separator=" ~ "
                                                inputClassName="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                useRange={true}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            onClick={() => {
                                                setStatusFilter('all');
                                                setDateRange({ startDate: null, endDate: null });
                                                setSearchTerm('');
                                                setCurrentPage(1);
                                            }}
                                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Reset Filter
                                        </button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
                                            <h2 className="text-xl font-bold text-gray-800">Data Pembelian Tiket</h2>
                                            <button className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-medium flex items-center gap-2 shadow-md">
                                                <Printer className="w-4 h-4" />
                                                Cetak Laporan
                                            </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Tampilkan</span>
                                                <select
                                                    value={entriesPerPage}
                                                    onChange={(e) => {
                                                        setEntriesPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                                <span className="text-sm text-gray-600">entri</span>
                                            </div>

                                            <div className="relative w-full md:w-auto">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari booking, customer, email..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full md:w-80 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kode Booking</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Customer</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Jumlah</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Harga</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="7" className="px-6 py-12 text-center">
                                                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                                                            <p className="text-gray-500">Memuat data...</p>
                                                        </td>
                                                    </tr>
                                                ) : paginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                                            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                                            <p className="text-lg font-medium">Tidak ada data ditemukan</p>
                                                            <p className="text-sm mt-1">Coba ubah filter atau pilih event lain</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedData.map((item) => (
                                                        <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="text-sm font-bold text-gray-900">{item.bookingCode}</span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{item.customer}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.email}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-bold text-sm">
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(item.totalPrice)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(item.purchaseDate)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${item.status === 'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {item.status === 'completed' ? '✓ Selesai' : '⏳ Pending'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <p className="text-sm text-gray-600">
                                            Menampilkan <span className="font-semibold">{filteredData.length > 0 ? ((currentPage - 1) * entriesPerPage) + 1 : 0}</span> sampai <span className="font-semibold">{Math.min(currentPage * entriesPerPage, filteredData.length)}</span> dari <span className="font-semibold">{filteredData.length}</span> entri
                                        </p>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                ← Prev
                                            </button>

                                            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">
                                                {currentPage} / {totalPages || 1}
                                            </div>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages || filteredData.length === 0}
                                                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {activeTab === 'attendance' && selectedEvent && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium opacity-90">Total Terdaftar</h3>
                                    <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-4xl font-bold mb-1">{checkInStats?.totalRegistered || 0}</p>
                                <p className="text-xs opacity-80">Peserta Terdaftar</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium opacity-90">Sudah Check-in</h3>
                                    <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-4xl font-bold mb-1">{checkInStats?.checkedIn || 0}</p>
                                <p className="text-xs opacity-80">Peserta Hadir</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium opacity-90">Tingkat Kehadiran</h3>
                                    <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                        <Users className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-4xl font-bold mb-1">
                                    {checkInStats?.checkedInPercentage || 0}%
                                </p>
                                <p className="text-xs opacity-80">Check-in Rate</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                Filter Pencarian
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Tanggal</label>
                                    <Datepicker
                                        value={attendanceDateRange}
                                        onChange={handleAttendanceDateChange}
                                        showShortcuts={true}
                                        placeholder="Pilih Rentang Tanggal"
                                        displayFormat="DD/MM/YYYY"
                                        separator=" ~ "
                                        inputClassName="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        primaryColor="green"
                                        useRange={true}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cari Peserta</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Kode booking atau nama customer..."
                                            value={attendanceSearch}
                                            onChange={(e) => setAttendanceSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Data Registrasi Kedatangan</h2>
                                <p className="text-sm text-gray-600">
                                    {attendanceDateRange.startDate && attendanceDateRange.endDate
                                        ? `Menampilkan data dari ${attendanceDateRange.startDate} sampai ${attendanceDateRange.endDate}`
                                        : 'Menampilkan semua data'}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kode Booking</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Jumlah</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Waktu Check-in</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center">
                                                    <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
                                                    <p className="text-gray-500">Memuat data...</p>
                                                </td>
                                            </tr>
                                        ) : filteredAttendanceData.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-lg font-medium">Tidak ada data peserta</p>
                                                    <p className="text-sm mt-1">Silakan pilih event atau ubah filter pencarian</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAttendanceData.map((item, index) => (
                                                <tr key={item._id || index} className="hover:bg-green-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-gray-900">{item.bookingCode || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                        {item.customerName || item.customer || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {item.email || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-bold text-sm">
                                                            {item.quantity || 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${item.checkedIn || item.checkInStatus === 'checked-in'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {item.checkedIn || item.checkInStatus === 'checked-in' ? (
                                                                <>
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Sudah Check-in
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="w-3 h-3" />
                                                                    Belum Check-in
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {item.checkInTime ? formatDate(item.checkInTime) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Total: <span className="font-bold">{filteredAttendanceData.length}</span> peserta
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportEvent;