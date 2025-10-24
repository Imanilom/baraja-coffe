import React, { useState, useEffect } from 'react';
import { Search, Calendar, Users, Clock, MapPin, Phone, Filter } from 'lucide-react';

export default function ReservationPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/reservations');
            const result = await response.json();

            if (result.success) {
                setReservations(result.data);
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
            'checked-in': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Checked In' }
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        return timeString || '-';
    };

    const filteredReservations = reservations.filter(reservation => {
        const matchesSearch =
            reservation.reservation_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reservation.guest_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reservation.area_id.area_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;

        const reservationDate = new Date(reservation.reservation_date).toDateString();
        const today = new Date().toDateString();
        const matchesDate = dateFilter === 'all' ||
            (dateFilter === 'today' && reservationDate === today) ||
            (dateFilter === 'upcoming' && new Date(reservation.reservation_date) >= new Date());

        return matchesSearch && matchesStatus && matchesDate;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading reservations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Reservasi</h1>
                            <p className="text-gray-600 mt-1">Kelola semua reservasi restoran</p>
                        </div>
                        {/* <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            + Tambah Reservasi
                        </button> */}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari kode, nomor tamu, atau area..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">Semua Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">Semua Tanggal</option>
                                <option value="today">Hari Ini</option>
                                <option value="upcoming">Mendatang</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Reservation Cards */}
                <div className="space-y-4">
                    {filteredReservations.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                            <p className="text-gray-500 text-lg">Tidak ada reservasi ditemukan</p>
                        </div>
                    ) : (
                        filteredReservations.map((reservation) => (
                            <div key={reservation._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {reservation.reservation_code}
                                                </h3>
                                                {getStatusBadge(reservation.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span className="font-medium">Created by:</span>
                                                <span>{reservation.created_by.employee_name || 'Guest'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Date & Time */}
                                        <div className="flex items-start gap-3">
                                            <div className="bg-blue-50 p-2 rounded-lg">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Tanggal & Waktu</p>
                                                <p className="font-semibold text-gray-900">{formatDate(reservation.reservation_date)}</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatTime(reservation.reservation_time)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-start gap-3">
                                            <div className="bg-green-50 p-2 rounded-lg">
                                                <MapPin className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Lokasi</p>
                                                <p className="font-semibold text-gray-900">{reservation.area_id.area_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    Meja: {reservation.table_id.map(t => t.table_number).join(', ')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Guest Info */}
                                        <div className="flex items-start gap-3">
                                            <div className="bg-purple-50 p-2 rounded-lg">
                                                <Users className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Tamu</p>
                                                <p className="font-semibold text-gray-900">{reservation.guest_count} Orang</p>
                                                {reservation.guest_number && (
                                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        {reservation.guest_number}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>
                                                <span className="font-medium">Kapasitas:</span>{' '}
                                                {reservation.table_id.reduce((sum, t) => sum + t.seats, 0)} kursi
                                            </span>
                                            <span>
                                                <span className="font-medium">Tipe:</span>{' '}
                                                {reservation.reservation_type === 'nonBlocking' ? 'Non-Blocking' : 'Blocking'}
                                            </span>
                                            <span>
                                                <span className="font-medium">Order ID:</span>{' '}
                                                {reservation.order_id}
                                            </span>
                                        </div>
                                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                            Lihat Detail →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Info */}
                {filteredReservations.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Menampilkan {filteredReservations.length} dari {reservations.length} reservasi
                    </div>
                )}
            </div>
        </div>
    );
}