import React, { useState } from "react";
import { handleDownloadPDF } from "../../../utils/pdfHelper";

const PdfButton = ({ targetId, fileName }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true); // mulai loading
        await handleDownloadPDF(targetId, fileName);
        setTimeout(() => {
            setLoading(false);
        }, 15000); // tahan 2 detik
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
