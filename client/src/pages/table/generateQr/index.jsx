import React, { useState, useRef } from 'react';
import { FaCopy, FaDownload, FaSpinner } from 'react-icons/fa';

const QRCodeGenerator = () => {
    const [text, setText] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [size, setSize] = useState('300');
    const [foregroundColor, setForegroundColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const canvasRef = useRef(null);

    // Fungsi untuk generate QR code menggunakan API external
    const generateQRCode = async () => {
        if (!text.trim()) {
            alert('Mohon masukkan teks atau URL terlebih dahulu!');
            return;
        }

        setIsLoading(true);
        try {
            // Menggunakan API QR Server untuk generate QR code dengan customization
            const encodedText = encodeURIComponent(text);
            const fgColor = foregroundColor.replace('#', '');
            const bgColor = backgroundColor.replace('#', '');
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&color=${fgColor}&bgcolor=${bgColor}`;
            setQrCode(qrUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Gagal membuat QR code. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi untuk download QR code
    const downloadQRCode = async () => {
        if (!qrCode) return;

        setIsLoading(true);
        try {
            const response = await fetch(qrCode);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'qr-code.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading QR code:', error);
            alert('Gagal mengunduh QR code.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi untuk copy text ke clipboard
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Teks berhasil disalin ke clipboard!');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Gagal menyalin teks.');
        }
    };

    // Fungsi untuk clear semua
    const clearAll = () => {
        setText('');
        setQrCode('');
        setSize('300');
        setForegroundColor('#000000');
        setBackgroundColor('#ffffff');
    };

    return (
        <div className="p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            QR Code Generator
                        </h1>
                        <p className="text-gray-600">
                            Buat QR code untuk teks, URL, atau data apapun
                        </p>
                    </div>

                    {/* Main Content - Side by Side Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Side - Input Section */}
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
                                    Masukkan teks atau URL:
                                </label>
                                <textarea
                                    id="text-input"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Contoh: https://www.example.com atau teks apapun..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows="4"
                                />
                            </div>

                            {/* Customization Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Size Selection */}
                                <div>
                                    <label htmlFor="size-select" className="block text-sm font-medium text-gray-700 mb-2">
                                        Ukuran QR Code:
                                    </label>
                                    <select
                                        id="size-select"
                                        value={size}
                                        onChange={(e) => setSize(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="150">150x150 px (Kecil)</option>
                                        <option value="200">200x200 px</option>
                                        <option value="300">300x300 px (Sedang)</option>
                                        <option value="400">400x400 px</option>
                                        <option value="500">500x500 px (Besar)</option>
                                        <option value="600">600x600 px</option>
                                        <option value="800">800x800 px (Ekstra Besar)</option>
                                    </select>
                                </div>

                                {/* Foreground Color */}
                                <div>
                                    <label htmlFor="fg-color" className="block text-sm font-medium text-gray-700 mb-2">
                                        Warna QR Code:
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id="fg-color"
                                            type="color"
                                            value={foregroundColor}
                                            onChange={(e) => setForegroundColor(e.target.value)}
                                            className="w-12 h-11 border border-gray-300 rounded-lg cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={foregroundColor}
                                            onChange={(e) => setForegroundColor(e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Background Color */}
                                <div className="md:col-span-2">
                                    <label htmlFor="bg-color" className="block text-sm font-medium text-gray-700 mb-2">
                                        Warna Latar Belakang:
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id="bg-color"
                                            type="color"
                                            value={backgroundColor}
                                            onChange={(e) => setBackgroundColor(e.target.value)}
                                            className="w-12 h-11 border border-gray-300 rounded-lg cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={backgroundColor}
                                            onChange={(e) => setBackgroundColor(e.target.value)}
                                            placeholder="#ffffff"
                                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color Presets */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preset Warna:
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        onClick={() => {
                                            setForegroundColor('#000000');
                                            setBackgroundColor('#ffffff');
                                        }}
                                        className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-4 h-4 bg-black border"></div>
                                        <span className="text-xs">Klasik</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setForegroundColor('#1e40af');
                                            setBackgroundColor('#eff6ff');
                                        }}
                                        className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-4 h-4 bg-blue-700 border"></div>
                                        <span className="text-xs">Biru</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setForegroundColor('#dc2626');
                                            setBackgroundColor('#fef2f2');
                                        }}
                                        className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-4 h-4 bg-red-600 border"></div>
                                        <span className="text-xs">Merah</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setForegroundColor('#16a34a');
                                            setBackgroundColor('#f0fdf4');
                                        }}
                                        className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-4 h-4 bg-green-600 border"></div>
                                        <span className="text-xs">Hijau</span>
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={generateQRCode}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    Generate QR Code
                                </button>

                                <button
                                    onClick={copyToClipboard}
                                    disabled={!text.trim()}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                >
                                    <FaCopy className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={clearAll}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                >
                                    <FaSpinner className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Info Section */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-medium text-blue-800 mb-2">Tips Penggunaan:</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Untuk URL, pastikan menggunakan format lengkap (https://...)</li>
                                    <li>• Pilih ukuran sesuai kebutuhan (150px untuk web, 400px+ untuk print)</li>
                                    <li>• Hindari kontras warna yang terlalu rendah agar mudah dipindai</li>
                                    <li>• Warna gelap pada latar terang memberikan hasil scan terbaik</li>
                                    <li>• QR code yang dihasilkan dapat dipindai oleh aplikasi kamera smartphone</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Side - QR Code Display */}
                        <div className="flex flex-col items-center justify-center">
                            {qrCode ? (
                                <div className="text-center">
                                    <div className="inline-block p-6 bg-gray-50 rounded-xl mb-6 shadow-md">
                                        <img
                                            src={qrCode}
                                            alt="Generated QR Code"
                                            className="max-w-full h-auto mx-auto"
                                            style={{ maxWidth: `${Math.min(parseInt(size), 400)}px` }}
                                        />
                                    </div>

                                    <div className="text-sm text-gray-600 mb-4">
                                        Ukuran: {size}x{size} px | Warna: {foregroundColor.toUpperCase()} pada {backgroundColor.toUpperCase()}
                                    </div>

                                    <button
                                        onClick={downloadQRCode}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Download PNG'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="w-80 h-80 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mb-4">
                                        <div className="text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM18 13h2v2h-2zM16 15h2v2h-2zM18 17h2v2h-2zM20 15h2v2h-2z" />
                                                </svg>
                                            </div>
                                            <p className="text-lg font-medium">QR Code akan muncul di sini</p>
                                            <p className="text-sm">Masukkan teks dan klik Generate</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeGenerator;