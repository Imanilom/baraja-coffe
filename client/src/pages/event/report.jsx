import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Printer, CheckCircle, DollarSign, Users, Ticket, UserCheck, Clock, RefreshCw } from 'lucide-react';
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
    const [eventFilter, setEventFilter] = useState('all');
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [attendanceSearch, setAttendanceSearch] = useState('');
    const [attendanceDateRange, setAttendanceDateRange] = useState({
        startDate: '2025-11-21',
        endDate: '2025-11-21'
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
            setEvents(response.data.data ? response.data.data : response.data);
            // Auto-select first event if available
            if ((response.data.data ? response.data.data : response.data).length > 0) {
                setSelectedEvent((response.data.data ? response.data.data : response.data)[0]._id);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch events');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendees = async (eventId) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/event/${eventId}`);
            const eventData = response.data.data ? response.data.data : response.data;

            // Check if it's a free event or paid event
            let attendeesData = [];

            if (eventData.isFreeEvent && eventData.freeRegistrations) {
                // For free events, use freeRegistrations
                attendeesData = eventData.freeRegistrations.map(reg => ({
                    _id: reg._id,
                    bookingCode: reg.bookingCode || 'FREE-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    customerName: reg.fullName,
                    email: reg.email,
                    phone: reg.phone,
                    quantity: 1,
                    checkedIn: reg.checkInStatus === 'checked-in',
                    checkInStatus: reg.checkInStatus,
                    checkInTime: reg.checkInTime,
                    registrationDate: reg.registrationDate,
                    createdAt: reg.registrationDate,
                    notes: reg.notes
                }));
            } else if (eventData.attendees) {
                // For paid events, use attendees
                attendeesData = eventData.attendees;
            }

            setAttendanceData(attendeesData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch attendees');
            console.error('Error fetching attendees:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCheckInStats = async (eventId) => {
        try {
            const response = await axios.get(`/api/event/${eventId}`);
            const eventData = response.data.data ? response.data.data : response.data;

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
        console.log('Date range changed:', newValue);
        if (newValue && newValue.startDate && newValue.endDate) {
            const formattedRange = {
                startDate: typeof newValue.startDate === 'string' ? newValue.startDate : new Date(newValue.startDate).toISOString().split('T')[0],
                endDate: typeof newValue.endDate === 'string' ? newValue.endDate : new Date(newValue.endDate).toISOString().split('T')[0]
            };
            console.log('Formatted range:', formattedRange);
            setDateRange(formattedRange);
        } else {
            setDateRange(newValue);
        }
    };

    const handleAttendanceDateChange = (newValue) => {
        console.log('Attendance date changed:', newValue);
        if (newValue && newValue.startDate && newValue.endDate) {
            const formattedRange = {
                startDate: typeof newValue.startDate === 'string' ? newValue.startDate : new Date(newValue.startDate).toISOString().split('T')[0],
                endDate: typeof newValue.endDate === 'string' ? newValue.endDate : new Date(newValue.endDate).toISOString().split('T')[0]
            };
            console.log('Formatted attendance range:', formattedRange);
            setAttendanceDateRange(formattedRange);
        } else {
            setAttendanceDateRange(newValue);
        }
    };

    const filteredData = useMemo(() => {
        return salesData.filter(item => {
            const matchSearch =
                item.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.event.toLowerCase().includes(searchTerm.toLowerCase());

            const matchStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchEvent = eventFilter === 'all' || item.event === eventFilter;

            // Validate date
            if (!item.purchaseDate) return matchSearch && matchStatus && matchEvent;

            const date = new Date(item.purchaseDate);
            if (isNaN(date.getTime())) return matchSearch && matchStatus && matchEvent;

            const itemDate = date.toISOString().split('T')[0];
            const matchStartDate = !dateRange.startDate || itemDate >= dateRange.startDate;
            const matchEndDate = !dateRange.endDate || itemDate <= dateRange.endDate;

            return matchSearch && matchStatus && matchEvent && matchStartDate && matchEndDate;
        });
    }, [salesData, searchTerm, statusFilter, eventFilter, dateRange]);

    const stats = useMemo(() => {
        // If a specific event is selected, calculate stats from that event
        if (selectedEventData && !selectedEventData.isFreeEvent) {
            const totalTicketsSold = selectedEventData.soldTickets || 0;
            const totalRevenue = totalTicketsSold * selectedEventData.price;

            return {
                totalPurchases: filteredData.length,
                completed: filteredData.filter(d => d.status === 'completed').length,
                totalTickets: totalTicketsSold,
                totalRevenue: totalRevenue
            };
        }

        // Default calculation from filtered data
        return {
            totalPurchases: filteredData.length,
            completed: filteredData.filter(d => d.status === 'completed').length,
            totalTickets: filteredData.reduce((sum, d) => sum + d.quantity, 0),
            totalRevenue: filteredData.reduce((sum, d) => sum + d.revenue, 0)
        };
    }, [filteredData, selectedEventData]);

    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const uniqueEvents = ['all', ...new Set(salesData.map(d => d.event))];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredAttendanceData = useMemo(() => {
        return attendanceData.filter(item => {
            // Validate date
            const dateValue = item.purchaseDate || item.createdAt;
            if (!dateValue) return false;

            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return false; // Check if date is invalid

            const itemDate = date.toISOString().split('T')[0];
            const matchStartDate = !attendanceDateRange.startDate || itemDate >= attendanceDateRange.startDate;
            const matchEndDate = !attendanceDateRange.endDate || itemDate <= attendanceDateRange.endDate;
            const matchSearch =
                (item.bookingCode || '').toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                (item.customerName || item.customer || '').toLowerCase().includes(attendanceSearch.toLowerCase());
            return matchStartDate && matchEndDate && matchSearch;
        });
    }, [attendanceData, attendanceDateRange, attendanceSearch]);

    const selectedEventData = useMemo(() => {
        return events.find(e => e._id === selectedEvent);
    }, [events, selectedEvent]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Sistem Manajemen Tiket Event</h1>
                    <button
                        onClick={fetchEvents}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p className="font-medium">Error: {error}</p>
                    </div>
                )}

                {/* Event Selector */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Event</label>
                    <select
                        value={selectedEvent || ''}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">-- Pilih Event --</option>
                        {events.map(event => (
                            <option key={event._id} value={event._id}>
                                {event.name} - {new Date(event.date).toLocaleDateString('id-ID')}
                            </option>
                        ))}
                    </select>
                    {selectedEventData && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800">{selectedEventData.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedEventData.isFreeEvent
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {selectedEventData.isFreeEvent ? 'Event Gratis' : 'Event Berbayar'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Kapasitas:</span>
                                    <span className="font-medium ml-2">{selectedEventData.capacity}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">
                                        {selectedEventData.isFreeEvent ? 'Peserta Terdaftar:' : 'Tiket Terjual:'}
                                    </span>
                                    <span className="font-medium ml-2">
                                        {selectedEventData.isFreeEvent
                                            ? (selectedEventData.freeRegistrations?.length || 0)
                                            : selectedEventData.soldTickets}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Sisa Slot:</span>
                                    <span className="font-medium ml-2">
                                        {selectedEventData.isFreeEvent
                                            ? selectedEventData.capacity - (selectedEventData.freeRegistrations?.length || 0)
                                            : selectedEventData.availableTickets}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Harga:</span>
                                    <span className="font-medium ml-2">
                                        {selectedEventData.isFreeEvent ? 'Gratis' : formatCurrency(selectedEventData.price)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'sales'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Ticket className="inline-block w-5 h-5 mr-2" />
                        Laporan Penjualan
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'attendance'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <UserCheck className="inline-block w-5 h-5 mr-2" />
                        Registrasi Kedatangan
                    </button>
                </div>

                {activeTab === 'sales' && (
                    <>
                        {selectedEventData && selectedEventData.isFreeEvent ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                                <Ticket className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Event Gratis</h3>
                                <p className="text-gray-600 mb-4">
                                    Event "{selectedEventData.name}" adalah event gratis. Tidak ada data penjualan untuk ditampilkan.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Silakan lihat tab <strong>Registrasi Kedatangan</strong> untuk melihat daftar peserta yang mendaftar.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Total Pembelian</h3>
                                            <Users className="w-8 h-8 opacity-70" />
                                        </div>
                                        <p className="text-3xl font-bold">{stats.totalPurchases}</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Selesai</h3>
                                            <CheckCircle className="w-8 h-8 opacity-70" />
                                        </div>
                                        <p className="text-3xl font-bold">{stats.completed}</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Total Tiket</h3>
                                            <Ticket className="w-8 h-8 opacity-70" />
                                        </div>
                                        <p className="text-3xl font-bold">{stats.totalTickets}</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium opacity-90">Total Pendapatan</h3>
                                            <DollarSign className="w-8 h-8 opacity-70" />
                                        </div>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="all">Semua Status</option>
                                                <option value="pending">Pending</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
                                            <select
                                                value={eventFilter}
                                                onChange={(e) => setEventFilter(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {uniqueEvents.map(event => (
                                                    <option key={event} value={event}>
                                                        {event === 'all' ? 'Semua Event' : event}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Tanggal</label>
                                            <Datepicker
                                                value={dateRange}
                                                onChange={handleDateRangeChange}
                                                showShortcuts={true}
                                                placeholder="Pilih Rentang Tanggal"
                                                displayFormat="YYYY-MM-DD"
                                                separator="~"
                                                inputClassName="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                useRange={true}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            onClick={() => {
                                                setStatusFilter('all');
                                                setEventFilter('all');
                                                setDateRange({ startDate: null, endDate: null });
                                                setSearchTerm('');
                                            }}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            <Filter className="inline-block w-4 h-4 mr-2" />
                                            Reset Filter
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-bold text-gray-800">Semua Pembelian</h2>
                                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                                <Printer className="inline-block w-4 h-4 mr-2" />
                                                Cetak
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Tampilkan</span>
                                                <select
                                                    value={entriesPerPage}
                                                    onChange={(e) => {
                                                        setEntriesPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                                <span className="text-sm text-gray-600">entri</span>
                                            </div>

                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    placeholder="Pencarian..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Booking</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harga</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                            <p className="text-lg font-medium">Tidak ada data ditemukan</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedData.map((item) => (
                                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.bookingCode}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.event}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.customer}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.email}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">{item.quantity}</span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(item.purchaseDate)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {item.status === 'completed' ? 'Selesai' : 'Pending'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            Menampilkan {filteredData.length > 0 ? ((currentPage - 1) * entriesPerPage) + 1 : 0} sampai {Math.min(currentPage * entriesPerPage, filteredData.length)} dari {filteredData.length} entri
                                        </p>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Prev
                                            </button>

                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                                                {currentPage}
                                            </button>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages || filteredData.length === 0}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium opacity-90">Total Tiket Terdaftar</h3>
                                    <Ticket className="w-8 h-8 opacity-70" />
                                </div>
                                <p className="text-3xl font-bold">{filteredAttendanceData.length}</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium opacity-90">Total Customer</h3>
                                    <Users className="w-8 h-8 opacity-70" />
                                </div>
                                <p className="text-3xl font-bold">{filteredAttendanceData.reduce((sum, item) => sum + (item.quantity || 1), 0)}</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium opacity-90">Check-in Rate</h3>
                                    <CheckCircle className="w-8 h-8 opacity-70" />
                                </div>
                                <p className="text-3xl font-bold">
                                    {checkInStats ? `${checkInStats.checkedInPercentage || 0}%` : '0%'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Rentang Tanggal</label>
                                    <Datepicker
                                        value={attendanceDateRange}
                                        onChange={handleAttendanceDateChange}
                                        showShortcuts={true}
                                        placeholder="Pilih Rentang Tanggal"
                                        displayFormat="YYYY-MM-DD"
                                        separator="~"
                                        inputClassName="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        primaryColor="green"
                                        useRange={true}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cari Booking/Customer</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Kode booking atau nama customer..."
                                            value={attendanceSearch}
                                            onChange={(e) => setAttendanceSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Registrasi Kedatangan</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Daftar tiket {attendanceDateRange.startDate && attendanceDateRange.endDate &&
                                        `dari ${attendanceDateRange.startDate} sampai ${attendanceDateRange.endDate}`}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Booking</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Tiket</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Check-in</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Check-in</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredAttendanceData.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                    <p className="text-lg font-medium">Tidak ada data tiket ditemukan</p>
                                                    <p className="text-sm mt-2">Silakan pilih event atau ubah filter pencarian</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAttendanceData.map((item, index) => (
                                                <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.bookingCode || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {item.customerName || item.customer || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {item.email || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                                                            {item.quantity || 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.checkedIn || item.checkInStatus === 'checked-in'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {item.checkedIn || item.checkInStatus === 'checked-in' ? (
                                                                <><CheckCircle className="inline w-3 h-3 mr-1" />Sudah Check-in</>
                                                            ) : (
                                                                <><Clock className="inline w-3 h-3 mr-1" />Belum Check-in</>
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
                                    Total: {filteredAttendanceData.length} tiket
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