import React, { useState } from "react";
import { handleDownloadPDF } from "../../../utils/pdfHelper";

const PdfButton = ({ transactionData, formatDateTime, formatCurrency, fileName }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            await handleDownloadPDF(transactionData, formatDateTime, formatCurrency, fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal membuat PDF. Silakan coba lagi.");
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white ${loading
                ? "w-full bg-gray-400 text-sm font-medium py-2.5 shadow cursor-not-allowed"
                : "w-full bg-green-700 hover:bg-green-800 text-sm font-medium py-2.5 shadow"
                }`}
        >
            {loading ? "Downloading..." : "Download to PDF"}
        </button>
    );
};

export default PdfButton;