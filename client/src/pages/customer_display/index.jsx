import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { FaCheckCircle, FaCoffee, FaShoppingCart } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export default function CustomerDisplay() {
    const { deviceId } = useParams();
    const [cartItems, setCartItems] = useState([]);
    const [totals, setTotals] = useState({ subTotal: 0, tax: 0, discount: 0, grandTotal: 0 });
    const [qrisData, setQrisData] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [message, setMessage] = useState('');
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        AOS.init({ duration: 800 });

        // Connect to the backend socket
        // Adjust the URL if backend runs on a different port/host
        const newSocket = io(window.location.origin.replace('5173', '3000'), {
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            newSocket.emit('join_customer_display', deviceId, (response) => {
                console.log('Join room response:', response);
            });
        });

        newSocket.on('cart_updated', (data) => {
            setCartItems(data.cartItems || []);
            setTotals({
                subTotal: data.subTotal || 0,
                tax: data.tax || 0,
                discount: data.discount || 0,
                grandTotal: data.grandTotal || 0
            });
            setQrisData(null);
            setPaymentSuccess(false);
            setMessage('');
        });

        newSocket.on('qris_generated', (data) => {
            setQrisData(data);
            setPaymentSuccess(false);
            setMessage('');
        });

        newSocket.on('payment_success', (data) => {
            setPaymentSuccess(true);
            setQrisData(null);
        });

        newSocket.on('display_cleared', (data) => {
            setCartItems([]);
            setTotals({ subTotal: 0, tax: 0, discount: 0, grandTotal: 0 });
            setQrisData(null);
            setPaymentSuccess(false);
            setMessage(data?.message || 'Terima kasih atas pesanan Anda!');
        });

        return () => {
            newSocket.disconnect();
        };
    }, [deviceId]);

    return (
        <div className="flex h-screen w-full bg-black text-white font-sans overflow-hidden relative">
            {/* Fullscreen Video Background */}
            <div className="absolute inset-0 w-full h-full z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
                >
                    <source src="https://barajacoffee.com/display2/banner.mp4" type="video/mp4" />
                </video>
                {/* Dark Gradient Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
            </div>

            {/* Left Side - Promo/Branding (Floating over video) */}
            <div className="w-[55%] h-full relative z-10 flex flex-col justify-end p-16 pb-24">
                <div data-aos="fade-up" data-aos-duration="1000">
                    <div className="flex items-center space-x-4 mb-4">
                        <FaCoffee className="text-5xl text-[#E8C27A] drop-shadow-[0_0_20px_rgba(232,194,122,0.8)]" />
                        <h1 className="text-6xl font-extrabold tracking-tight text-white drop-shadow-2xl">Baraja Coffee</h1>
                    </div>

                </div>
            </div>

            {/* Right Side - Glassmorphism Panel */}
            <div className="w-[45%] h-full relative z-20 flex flex-col backdrop-blur-2xl bg-black/40 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <div>
                        <h2 className="text-4xl font-bold text-white tracking-wide">Pesanan Anda</h2>
                        <p className="text-[#E8C27A] text-sm mt-1 uppercase tracking-widest font-semibold">Silakan periksa kembali pesanan</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Terminal</span>
                        <span className="text-sm px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white font-medium shadow-inner">{deviceId}</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar relative">
                    {paymentSuccess ? (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in" data-aos="zoom-in" data-aos-duration="600">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                                <FaCheckCircle className="text-9xl text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.6)] relative z-10" />
                            </div>
                            <h2 className="text-5xl font-extrabold mb-4 text-white">Pembayaran Berhasil!</h2>
                            <p className="text-2xl text-gray-300 font-light">Silakan tunggu, pesanan Anda segera disiapkan.</p>
                        </div>
                    ) : qrisData ? (
                        <div className="h-full flex flex-col items-center justify-center text-center" data-aos="zoom-in" data-aos-duration="500">
                            <div className="inline-block px-4 py-1.5 rounded-full bg-[#E8C27A]/20 border border-[#E8C27A]/50 text-[#E8C27A] font-semibold text-sm tracking-widest mb-6 uppercase">
                                Scan QRIS
                            </div>

                            <div className="relative mb-10 group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-[#E8C27A] to-[#D4A853] rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <div className="relative bg-white p-6 rounded-3xl shadow-2xl transform transition hover:scale-105 duration-300">
                                    <QRCodeSVG
                                        value={qrisData.qrString}
                                        size={320}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                            </div>

                            <div className="text-center w-full bg-black/30 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <p className="text-lg text-gray-300 mb-2 font-light">Total Pembayaran</p>
                                <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#E8C27A] to-[#FDF3DA] drop-shadow-sm">{formatRupiah(qrisData.amount)}</p>
                            </div>
                        </div>
                    ) : message ? (
                        <div className="h-full flex flex-col items-center justify-center text-center" data-aos="fade-in">
                            <h2 className="text-4xl font-light text-gray-200">{message}</h2>
                        </div>
                    ) : cartItems.length > 0 ? (
                        <div className="space-y-4">
                            {cartItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/10 transition-all hover:bg-white/10 hover:border-[#E8C27A]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group"
                                    data-aos="fade-left"
                                    data-aos-delay={index * 50}
                                    data-aos-duration="400"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-semibold text-white group-hover:text-[#E8C27A] transition-colors">{item.name}</h3>
                                        <div className="flex space-x-3 mt-2 text-base text-gray-400">
                                            <span className="bg-black/50 px-2 py-0.5 rounded text-gray-300 font-medium">{item.quantity}x</span>
                                            <span>@ {formatRupiah(item.price)}</span>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {formatRupiah((item.price * item.quantity))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-[#E8C27A] blur-3xl opacity-10 rounded-full animate-pulse"></div>
                                <FaShoppingCart className="text-8xl text-white/20 relative z-10" />
                            </div>
                            <p className="text-3xl font-light text-white mb-2">Keranjang Kosong</p>
                            <p className="text-xl text-gray-400">Silakan sebutkan pesanan Anda ke Kasir</p>
                        </div>
                    )}
                </div>

                {/* Footer / Total Area */}
                {!qrisData && !paymentSuccess && cartItems.length > 0 && (
                    <div className="bg-black/60 border-t border-white/10 p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-30 backdrop-blur-md">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-400 text-xl font-light">
                                <span>Subtotal</span>
                                <span className="text-gray-300 font-medium">{formatRupiah(totals.subTotal)}</span>
                            </div>
                            {totals.discount > 0 && (
                                <div className="flex justify-between text-red-400 text-xl font-light">
                                    <span>Diskon</span>
                                    <span className="font-medium">-{formatRupiah(totals.discount)}</span>
                                </div>
                            )}
                            {totals.tax > 0 && (
                                <div className="flex justify-between text-gray-400 text-xl font-light">
                                    <span>Pajak (10%)</span>
                                    <span className="text-gray-300 font-medium">{formatRupiah(totals.tax)}</span>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-white/20 pt-6 flex justify-between items-end">
                            <span className="text-3xl text-white font-light tracking-wide">Total Pembayaran</span>
                            <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#E8C27A] to-[#FDF3DA] drop-shadow-lg">{formatRupiah(totals.grandTotal)}</span>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(232, 194, 122, 0.3);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(232, 194, 122, 0.6);
                }
            `}</style>
        </div>
    );
}
