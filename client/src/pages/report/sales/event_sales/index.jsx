import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, MapPin, Mail, Phone, User, Download, Share2, X, Clock, Users, Loader } from 'lucide-react';
import axios from 'axios';
import QRCode from 'qrcode';

export default function EventSalesManagement() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        gender: '',
        currentCity: '',
        notes: ''
    });
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const response = await axios.get('/api/event');
            if (response.data.success) {
                const freeEvents = response.data.data.filter(event => event.isFreeEvent);
                setEvents(freeEvents);
            }
        } catch (err) {
            console.error('Failed to fetch events:', err);
            setError('Failed to load events');
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.email || !formData.phone || !formData.gender || !formData.currentCity) {
            setError('Mohon isi semua field yang wajib');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Email tidak valid');
            return;
        }

        if (formData.gender.trim() === '') {
            setError('Mohon pilih jenis kelamin');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const requestData = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                gender: formData.gender.trim(),
                currentCity: formData.currentCity.trim(),
                notes: formData.notes ? formData.notes.trim() : ''
            };

            const response = await axios.post(
                `/api/event/${selectedEvent._id}/register`,
                requestData
            );

            if (response.data.success) {
                setRegistrationData(response.data.data);
                setRegistrationSuccess(true);
                setShowModal(false);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const downloadTicket = async () => {
        if (!registrationData?.bookingCode) {
            alert('Booking code tidak tersedia');
            return;
        }

        try {
            // Generate QR code as data URL
            const qrDataUrl = await QRCode.toDataURL(registrationData.bookingCode, {
                width: 400,
                margin: 2,
                errorCorrectionLevel: 'M'
            });

            // Create ticket canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 800;
            canvas.height = 1000;

            // Draw background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw header
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, '#4F46E5');
            gradient.addColorStop(1, '#7C3AED');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, 200);

            // Event name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(selectedEvent.name, canvas.width / 2, 80);

            // Event date
            ctx.font = '20px Arial';
            ctx.fillText(formatDate(selectedEvent.date), canvas.width / 2, 120);
            ctx.fillText(`${formatTime(selectedEvent.date)} - ${formatTime(selectedEvent.endDate)}`, canvas.width / 2, 150);

            // Load QR image
            const qrImage = new Image();

            qrImage.onload = () => {
                const qrSize = 400;
                const qrX = (canvas.width - qrSize) / 2;
                const qrY = 250;

                // Draw QR
                ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

                // QR border
                ctx.strokeStyle = '#E5E7EB';
                ctx.lineWidth = 4;
                ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

                // Booking code
                ctx.fillStyle = '#1F2937';
                ctx.font = 'bold 36px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(registrationData.bookingCode, canvas.width / 2, qrY + qrSize + 70);

                // Attendee name
                ctx.font = 'bold 24px Arial';
                ctx.fillText(formData.fullName, canvas.width / 2, qrY + qrSize + 130);

                // Email
                ctx.font = '20px Arial';
                ctx.fillStyle = '#6B7280';
                ctx.fillText(formData.email, canvas.width / 2, qrY + qrSize + 165);

                // Footer
                ctx.fillStyle = '#9CA3AF';
                ctx.font = '18px Arial';
                ctx.fillText('Tunjukkan QR code ini di pintu masuk event', canvas.width / 2, canvas.height - 80);
                ctx.fillText(selectedEvent.location, canvas.width / 2, canvas.height - 50);

                // Download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `ticket-${registrationData.bookingCode}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                });
            };

            qrImage.onerror = () => {
                alert('Gagal memuat QR code');
            };

            qrImage.src = qrDataUrl;

        } catch (error) {
            console.error('Error:', error);
            alert('Gagal generate tiket');
        }
    };

    const shareEvent = () => {
        if (navigator.share) {
            navigator.share({
                title: selectedEvent.name,
                text: `Saya sudah daftar ${selectedEvent.name}!`,
                url: window.location.href
            });
        }
    };

    const openRegistrationModal = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
        setError('');
        setFormData({
            fullName: '',
            email: '',
            phone: '',
            gender: '',
            currentCity: '',
            notes: ''
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedEvent(null);
    };

    // Modal Form
    if (showModal && selectedEvent && !registrationSuccess) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
                    <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Daftar Event Gratis</h2>
                        <p className="text-gray-600">{selectedEvent.name}</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="+62 812 3456 7890"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin *</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">Pilih Jenis Kelamin</option>
                                <option value="male">Laki-laki</option>
                                <option value="female">Perempuan</option>
                                <option value="other">Lainnya</option>
                                <option value="prefer-not-to-say">Tidak ingin menyebutkan</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kota Saat Ini *</label>
                            <input
                                type="text"
                                name="currentCity"
                                value={formData.currentCity}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Jakarta, Bandung, Surabaya"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ada kebutuhan khusus?"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success Page
    if (registrationSuccess && selectedEvent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h1>
                        <p className="text-lg text-gray-600">Konfirmasi telah dikirim ke email Anda</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                        <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                            <img src={selectedEvent.imageUrl} alt={selectedEvent.name} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-6 right-6">
                                <h2 className="text-2xl font-bold text-white mb-1">{selectedEvent.name}</h2>
                                <p className="text-indigo-100">oleh {selectedEvent.organizer}</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-start space-x-3">
                                <Calendar className="w-5 h-5 text-indigo-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-gray-900">{formatDate(selectedEvent.date)}</p>
                                    <p className="text-gray-600">{formatTime(selectedEvent.date)} - {formatTime(selectedEvent.endDate)} WIB</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-indigo-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-gray-900">Lokasi</p>
                                    <p className="text-gray-600">{selectedEvent.location}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Detail Pendaftaran</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-3">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{formData.fullName}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{formData.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{formData.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button onClick={downloadTicket} className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700">
                            <Download className="w-5 h-5" />
                            <span>Download Tiket</span>
                        </button>
                        <button onClick={shareEvent} className="flex items-center justify-center space-x-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50">
                            <Share2 className="w-5 h-5" />
                            <span>Bagikan</span>
                        </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">Informasi Penting</h3>
                        <ul className="space-y-2 text-blue-800 text-sm">
                            <li>• Cek email untuk konfirmasi</li>
                            <li>• Bawa identitas saat event</li>
                            <li>• Datang 15 menit lebih awal</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <button onClick={() => { setRegistrationSuccess(false); setSelectedEvent(null); }} className="text-indigo-600 hover:text-indigo-700 font-medium">
                            ← Kembali ke Event
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Events List
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Gratis</h1>
                    <p className="text-lg text-gray-600">Daftar event gratis menarik</p>
                </div>

                {loadingEvents ? (
                    <div className="flex justify-center py-20">
                        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Belum ada event gratis</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => {
                            const registeredCount = event.freeRegistrations?.length || 0;
                            const availableSpots = event.capacity - registeredCount;

                            return (
                                <div key={event._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="relative h-48">
                                        <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            GRATIS
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.name}</h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-indigo-600" />
                                                <span>{formatDate(event.date)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Clock className="w-4 h-4 text-indigo-600" />
                                                <span>{formatTime(event.date)} - {formatTime(event.endDate)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <MapPin className="w-4 h-4 text-indigo-600" />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Users className="w-4 h-4 text-indigo-600" />
                                                <span>{availableSpots} tempat tersisa</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => openRegistrationModal(event)}
                                            disabled={availableSpots === 0}
                                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300"
                                        >
                                            {availableSpots === 0 ? 'Event Penuh' : 'Daftar Sekarang'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}