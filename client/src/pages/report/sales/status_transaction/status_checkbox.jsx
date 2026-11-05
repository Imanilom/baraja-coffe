import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

const StatusCheckboxFilter = ({ selectedStatus, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const statusOptions = [
        { value: "Waiting", label: "Waiting", color: "bg-blue-100 text-blue-800" },
        { value: "Pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        { value: "OnProcess", label: "OnProcess", color: "bg-purple-100 text-purple-800" },
        { value: "Completed", label: "Completed", color: "bg-green-100 text-green-800" },
        { value: "Cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCheckboxChange = (value) => {
        const newSelected = selectedStatus.includes(value)
            ? selectedStatus.filter((s) => s !== value)
            : [...selectedStatus, value];

        onChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedStatus.length === statusOptions.length) {
            onChange([]);
        } else {
            onChange(statusOptions.map((opt) => opt.value));
        }
    };

    const getDisplayText = () => {
        if (selectedStatus.length === 0) {
            return "Semua Status";
        }
        if (selectedStatus.length === statusOptions.length) {
            return "Semua Status";
        }
        if (selectedStatus.length === 1) {
            const selected = statusOptions.find((opt) => opt.value === selectedStatus[0]);
            return selected?.label || "1 Status";
        }
        return `${selectedStatus.length} Status Dipilih`;
    };

    return (
        <div className="relative md:w-48 w-full" ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-green-900 flex items-center justify-between"
            >
                <span className="text-gray-600 truncate">{getDisplayText()}</span>
                <FaChevronDown
                    className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {/* Select All Option */}
                    <label className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b">
                        <input
                            type="checkbox"
                            checked={selectedStatus.length === statusOptions.length}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-green-900 border-gray-300 rounded focus:ring-green-900"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                            Pilih Semua
                        </span>
                    </label>

                    {/* Status Options */}
                    {statusOptions.map((option) => (
                        <label
                            key={option.value}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedStatus.includes(option.value)}
                                onChange={() => handleCheckboxChange(option.value)}
                                className="w-4 h-4 text-green-900 border-gray-300 rounded focus:ring-green-900"
                            />
                            <span
                                className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}
                            >
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatusCheckboxFilter;