import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const MessageAlert = () => {
    const location = useLocation();
    const [message, setMessage] = useState(location.state?.success || "");

    useEffect(() => {
        if (location.state?.success) {
            // hapus state supaya refresh tidak munculkan pesan lagi
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(""), 5000); // hilang 5 detik
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div>
            {message && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md text-sm">
                    {message}
                </div>
            )}

            {/* isi tabel production list */}
        </div>
    );
};

export default MessageAlert;
