import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

const MessageAlertMenu = () => {
    const location = useLocation();
    const [alert, setAlert] = useState({
        type: "success",
        message: location.state?.success || "",
        visible: false,
    });

    useEffect(() => {
        if (location.state?.success) {
            // hapus state supaya refresh tidak munculkan pesan lagi
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        if (alert.message) {
            setAlert((prev) => ({ ...prev, visible: true }));

            const timer = setTimeout(() => {
                setAlert((prev) => ({ ...prev, visible: false }));
                setTimeout(() => setAlert((prev) => ({ ...prev, message: "" })), 300); // hapus setelah animasi selesai
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [alert.message]);

    const getAlertStyle = (type) => {
        switch (type) {
            case "success":
                return { bg: "bg-green-500", icon: <FaCheckCircle className="text-white text-lg" /> };
            case "error":
                return { bg: "bg-red-500", icon: <FaTimesCircle className="text-white text-lg" /> };
            case "warning":
                return { bg: "bg-yellow-500", icon: <FaExclamationTriangle className="text-white text-lg" /> };
            case "info":
                return { bg: "bg-blue-500", icon: <FaInfoCircle className="text-white text-lg" /> };
            default:
                return { bg: "bg-gray-500", icon: <FaInfoCircle className="text-white text-lg" /> };
        }
    };

    if (!alert.message) return null;

    const { bg, icon } = getAlertStyle(alert.type);

    return (
        <div className="fixed top-5 right-5 z-50">
            <div
                className={`flex items-center space-x-3 text-white px-4 py-3 rounded-xl shadow-lg min-w-[250px] ${bg}
        transform transition-all duration-500 ease-in-out
        ${alert.visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
            >
                {icon}
                <span className="text-sm font-medium">{alert.message}</span>
            </div>
        </div>
    );
};

export default MessageAlertMenu;
