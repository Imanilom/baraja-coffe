import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "@/lib/axios";
import dayjs from "dayjs";
import {
    FaPrint,
    FaCheckCircle,
    FaCoffee,
    FaDownload,
    FaCopy,
    FaExclamationTriangle
} from "react-icons/fa";

export default function PublicReceipt() {
    const { orderId: paramOrderId } = useParams();
    const [searchParams] = useSearchParams();
    const queryOrderId = searchParams.get("orderId") || searchParams.get("id");
    const targetOrderId = paramOrderId || queryOrderId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const [copied, setCopied] = useState(false);
    const receiptRef = useRef(null);

    const formatCurrency = (val) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        return dayjs(dateStr).format("DD MMM YYYY, HH:mm");
    };

    const fetchOrder = useCallback(async () => {
        if (!targetOrderId) {
            setError("Kode struk atau ID pesanan tidak ditemukan pada link.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let foundOrder = null;

            // 1. Coba endpoint report search
            try {
                const res = await axios.get("/api/report/orders", {
                    params: { search: targetOrderId, mode: "all" }
                });
                const list = Array.isArray(res.data?.data) ? res.data.data : [];
                foundOrder = list.find(
                    (o) =>
                        o.order_id === targetOrderId ||
                        o._id === targetOrderId ||
                        o.id === targetOrderId
                ) || list[0];
            } catch (e) {
                console.warn("Fetch report/orders failed:", e.message);
            }

            // 2. Coba endpoint direct order
            if (!foundOrder) {
                try {
                    const res = await axios.get(`/api/orders/${targetOrderId}`);
                    foundOrder = res.data?.data || res.data;
                } catch (e) {
                    console.warn("Fetch direct orders/:id failed:", e.message);
                }
            }

            if (foundOrder) {
                setOrderData(foundOrder);
            } else {
                setError(`Pesanan dengan kode "${targetOrderId}" tidak ditemukan.`);
            }
        } catch (err) {
            console.error("Error fetching public receipt:", err);
            setError("Gagal memuat struk digital. Pastikan koneksi internet stabil.");
        } finally {
            setLoading(false);
        }
    }, [targetOrderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handlePrint = () => {
        window.print();
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center max-w-sm w-full">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <h3 className="font-bold text-slate-800 text-lg">Memuat Struk Digital</h3>
                    <p className="text-slate-500 text-sm text-center mt-1">
                        Mohon tunggu sebentar, sedang mengambil data pesanan...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4">
                        <FaExclamationTriangle />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">Struk Tidak Ditemukan</h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        {error || "Data pesanan tidak ditemukan atau link sudah kedaluwarsa."}
                    </p>
                    <button
                        onClick={fetchOrder}
                        className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition shadow-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    const items = orderData.items || orderData.products || [];
    const outletName =
        orderData.cashierId?.outlet?.[0]?.outletId?.name ||
        orderData.outlet?.name ||
        "Baraja Coffee";
    const outletAddress =
        orderData.cashierId?.outlet?.[0]?.outletId?.address ||
        orderData.outlet?.address ||
        "Jl. Tentara Pelajar No. 107, Cirebon";
    const cashierName =
        orderData.cashierId?.name ||
        orderData.cashier?.name ||
        orderData.user_id?.name ||
        "Kasir";
    const customerName = orderData.user || orderData.customerName || "Pelanggan";
    const tableNumber = orderData.tableNumber || orderData.table_number || "-";
    const orderType = orderData.orderType?.name || orderData.order_type || "Dine In";
    const orderCode = orderData.order_id || orderData.orderId || targetOrderId;
    const createdAt = orderData.createdAt || orderData.created_at || new Date();

    const subtotal = orderData.totalBeforeDiscount || orderData.subtotal || orderData.total || 0;
    const totalDiscount =
        orderData.discounts?.totalDiscount ||
        orderData.customDiscountDetails?.discountAmount ||
        orderData.discount ||
        0;
    const taxService =
        orderData.taxAndServiceDetails?.[0]?.amount ||
        orderData.tax_amount ||
        orderData.service_amount ||
        0;
    const grandTotal =
        orderData.grandTotal ||
        orderData.totalAfterDiscount ||
        subtotal - totalDiscount + taxService;

    const paymentMethod =
        orderData.paymentDetails?.method_type ||
        orderData.actualPaymentMethod ||
        orderData.paymentMethod ||
        "Cash / QRIS";

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-4 flex flex-col items-center font-sans">
            {/* Header Toolbar (Hidden saat print) */}
            <div className="w-full max-w-md mb-4 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2 text-slate-700">
                    <FaCoffee className="text-emerald-700 text-xl" />
                    <span className="font-bold text-slate-800 text-base tracking-tight">Baraja E-Receipt</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        title="Salin Link Struk"
                    >
                        {copied ? <FaCheckCircle className="text-emerald-600" /> : <FaCopy />}
                        <span>{copied ? "Tersalin!" : "Salin Link"}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                        title="Cetak atau Download PDF"
                    >
                        <FaPrint />
                        <span>Cetak / PDF</span>
                    </button>
                </div>
            </div>

            {/* Receipt Card */}
            <div
                ref={receiptRef}
                className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden print:shadow-none print:border-none print:m-0 print:max-w-none print:w-full"
            >
                {/* Top Green Accent Ribbon */}
                <div className="h-2 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 print:hidden" />

                <div className="p-6">
                    {/* Brand Header */}
                    <div className="text-center pb-5 border-b border-dashed border-slate-200">
                        <img
                            src="/images/logo_resi.png"
                            alt="Baraja Coffee"
                            className="h-12 mx-auto object-contain mb-2"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{outletName}</h1>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto leading-relaxed">
                            {outletAddress}
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div className="my-4 flex items-center justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-bold">
                            <FaCheckCircle className="text-emerald-600" />
                            <span>TRANSAKSI BERHASIL</span>
                        </div>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600 border border-slate-100">
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">No. Struk</span>
                            <span className="font-bold text-slate-800 font-mono">{orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Waktu</span>
                            <span className="font-semibold text-slate-700">{formatDateTime(createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Pelanggan</span>
                            <span className="font-semibold text-slate-800">{customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Kasir / Meja</span>
                            <span className="font-semibold text-slate-700">{cashierName} / Meja {tableNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Tipe Pesanan</span>
                            <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                                {orderType}
                            </span>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="mt-5 mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Rincian Menu
                        </h3>
                        <div className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">Tidak ada rincian item.</p>
                            ) : (
                                items.map((item, idx) => {
                                    const itemName =
                                        item.menuItem?.name || item.name || item.menuItemName || "Item Pesanan";
                                    const itemQty = item.quantity || item.qty || 1;
                                    const itemPrice =
                                        item.menuItem?.price || item.price || item.unitPrice || 0;
                                    const itemSubtotal = item.subtotal || itemQty * itemPrice;

                                    const toppings = item.selectedToppings || [];
                                    const addons = item.selectedAddons || [];
                                    const note = item.notes;

                                    return (
                                        <div key={idx} className="py-2.5 text-xs">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {itemName}
                                                    </span>
                                                    <span className="text-slate-400 ml-2 font-semibold">
                                                        x{itemQty}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-slate-800 text-sm whitespace-nowrap">
                                                    {formatCurrency(itemSubtotal)}
                                                </span>
                                            </div>

                                            {toppings.length > 0 && (
                                                <div className="text-[11px] text-slate-500 mt-0.5 pl-2 border-l-2 border-slate-200">
                                                    Topping: {toppings.map((t) => t.name).join(", ")}
                                                </div>
                                            )}
                                            {addons.length > 0 && (
                                                <div className="text-[11px] text-slate-500 mt-0.5 pl-2 border-l-2 border-slate-200">
                                                    {addons
                                                        .map(
                                                            (a) =>
                                                                `${a.name}: ${a.options?.map((o) => o.label).join(", ") || "-"}`
                                                        )
                                                        .join(" | ")}
                                                </div>
                                            )}
                                            {note && (
                                                <div className="text-[11px] text-amber-700 italic mt-0.5">
                                                    Catatan: {note}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Summary Totals */}
                    <div className="border-t border-dashed border-slate-300 pt-3.5 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
                        </div>

                        {totalDiscount > 0 && (
                            <div className="flex justify-between text-red-600 font-medium">
                                <span>Diskon</span>
                                <span>-{formatCurrency(totalDiscount)}</span>
                            </div>
                        )}

                        {taxService > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Pajak & Service</span>
                                <span className="font-medium text-slate-800">{formatCurrency(taxService)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-base font-bold text-slate-900">
                            <span>Total Pembayaran</span>
                            <span className="text-emerald-800 text-lg font-extrabold">{formatCurrency(grandTotal)}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 text-xs text-slate-500">
                            <span>Metode Pembayaran</span>
                            <span className="font-bold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                {paymentMethod}
                            </span>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="text-center mt-6 pt-5 border-t border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-800 mb-1">Terima Kasih!</p>
                        <p className="text-[11px] text-slate-400">
                            Struk ini adalah bukti pembayaran digital yang sah.
                        </p>
                        <p className="text-[10px] text-slate-300 mt-2">
                            Powered by Baraja Coffee POS
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Download CTA */}
            <div className="w-full max-w-md mt-4 text-center print:hidden">
                <button
                    onClick={handlePrint}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                >
                    <FaDownload />
                    <span>Download / Simpan Struk PDF</span>
                </button>
            </div>
        </div>
    );
}
