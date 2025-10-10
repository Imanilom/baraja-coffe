import * as Icons from 'lucide-react';
import { iconOptions } from '../utils/icons.js';
import { useState, useRef, useEffect } from 'react';

export const IconSelect = ({
    name = "icon",
    value,
    onChange,
    label = "Icon",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Auto focus search input ketika dropdown dibuka
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Close dropdown ketika click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (iconName) => {
        if (onChange) {
            // Simulasi event untuk kompatibilitas dengan handleChange
            const event = {
                target: {
                    name: name,
                    value: iconName
                }
            };
            onChange(event);
        }
        setIsOpen(false);
        setSearchTerm('');
    };

    // Filter icons yang valid (ada di lucide-react)
    const validIcons = iconOptions.filter(iconName => Icons[iconName] !== undefined);

    const filteredIcons = validIcons.filter(icon =>
        icon.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const SelectedIcon = value && Icons[value];

    return (
        <div className={className} ref={dropdownRef}>
            <label className="block mb-1 font-medium">{label}</label>

            <div className="relative">
                {/* Display selected icon */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full border rounded px-3 py-2 flex items-center justify-between bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <div className="flex items-center gap-2">
                        {SelectedIcon ? (
                            <>
                                <SelectedIcon className="w-5 h-5" />
                                <span>{value}</span>
                            </>
                        ) : value ? (
                            // Jika icon tidak ditemukan, tampilkan Box sebagai fallback
                            <>
                                <Icons.Box className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-400">{value} (not found)</span>
                            </>
                        ) : (
                            <span className="text-gray-400">Pilih Icon</span>
                        )}
                    </div>
                    <Icons.ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
                        {/* Search box */}
                        <div className="p-2 border-b sticky top-0 bg-white">
                            <div className="relative">
                                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Cari icon..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <Icons.X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Icon grid */}
                        <div className="grid grid-cols-12 gap-1 p-2 overflow-y-auto max-h-80">
                            {filteredIcons.map((iconName) => {
                                const IconComponent = Icons[iconName];
                                // Skip jika icon tidak ditemukan (double check)
                                if (!IconComponent) return null;

                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => handleSelect(iconName)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 transition-colors ${value === iconName ? 'bg-blue-100 hover:bg-blue-200 ring-2 ring-blue-500' : ''
                                            }`}
                                        title={iconName}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                        <span className="text-[10px] text-gray-600 truncate w-full text-center leading-tight">
                                            {iconName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredIcons.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <Icons.SearchX className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>Tidak ada icon yang ditemukan</p>
                                <p className="text-sm text-gray-400 mt-1">Coba kata kunci lain</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function untuk render icon by name dengan validasi
export const renderIcon = (iconName, props = {}) => {
    if (!iconName) return null;

    const IconComponent = Icons[iconName];
    if (!IconComponent) {
        // Return fallback icon jika tidak ditemukan
        return <Icons.Box {...props} />;
    }

    return <IconComponent {...props} />;
};