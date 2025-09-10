import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaChevronRight, FaStoreAlt } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { coordinateCityWithProvince } from "../../utils/coordinateCity";
import Header from "../admin/header";
import Select from "react-select";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const cityCoordinates = coordinateCityWithProvince;
const sortedCityCoordinates = [...cityCoordinates].sort((a, b) =>
    a.city.localeCompare(b.city)
);

function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
        map.setView(position, 13);
    }, [position]);
    return null;
}

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position ? <Marker position={position} /> : null;
}

const UpdateOutlet = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: "#d1d5db",
            minHeight: "34px",
            fontSize: "13px",
            color: "#6b7280",
            boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
            "&:hover": {
                borderColor: "#9ca3af",
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        input: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "13px",
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "13px",
            color: "#374151",
            backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.1)" : "white",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };

    const { id } = useParams();
    const navigate = useNavigate();

    const [tax, setTax] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        name: "",
        city: "",
        address: "",
        latitude: "",
        longitude: "",
        contactNumber: "",
        tax: "",
        importProduct: "",
        salesType: "",
        tableModule: false,
        pawoonOrder: false,
        pawoonOpen: "",
        pawoonClose: "",
    });

    const [tempAddress, setTempAddress] = useState(form.address);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [mapPosition, setMapPosition] = useState({ lat: -6.2, lng: 106.8 });

    // Kalau pilih kota, pindahkan map ke koordinat kota
    useEffect(() => {
        if (!initialLoaded || !form.city) return;
        const selected = cityCoordinates.find((c) => c.city === form.city);
        if (selected) {
            setMapPosition({ lat: selected.latitude, lng: selected.longitude });
        }
    }, [form.city]);

    useEffect(() => {
        fetchOutlets();
        fetchTax();
    }, []);

    const cityOptions = sortedCityCoordinates.map((city) => ({
        value: city.city,
        label: city.city,
    }));

    const fetchOutlets = async () => {
        try {
            const response = await axios.get(`/api/outlet/${id}`);
            const data = response.data.data ? response.data.data : response.data;
            setForm({
                name: data.name || "",
                city: data.city || "",
                address: data.address || "-",
                latitude: data.latitude || "",
                longitude: data.longitude || "",
                contactNumber: data.contactNumber || "",
                tax: data.tax || "",
                importProduct: data.importProduct || "",
                salesType: data.salesType || "",
                tableModule: data.tableModule || false,
                pawoonOrder: data.pawoonOrder || false,
                pawoonOpen: data.pawoonOpen || "08:00",
                pawoonClose: data.pawoonClose || "16:00",
            });
            setInitialLoaded(true);
        } catch (error) {
            console.error("Error fetching outlets:", error);
        }
    };

    useEffect(() => {
        setTempAddress(form.address);
    }, [form.address]);

    // Set map ke lat/lng outlet yang sudah ada
    useEffect(() => {
        if (form.latitude && form.longitude) {
            setMapPosition({
                lat: parseFloat(form.latitude),
                lng: parseFloat(form.longitude),
            });
        }
    }, [form.latitude, form.longitude]);

    // ⬅️ Sinkronkan lat/lng form dengan pin map
    useEffect(() => {
        if (mapPosition.lat && mapPosition.lng) {
            setForm((prev) => ({
                ...prev,
                latitude: mapPosition.lat.toString(),
                longitude: mapPosition.lng.toString(),
            }));
        }
    }, [mapPosition]);


    const fetchTax = async () => {
        try {
            const response = await axios.get("/api/tax-service");
            setTax(response.data || []);
        } catch (error) {
            console.error("Error fetching tax:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedData = {
                ...form,
                latitude: mapPosition.lat.toString(),
                longitude: mapPosition.lng.toString(),
            };

            console.log("Payload dikirim:", updatedData); // 🔍 debug

            await axios.put(`/api/outlet/${id}`, updatedData);
            alert("Data outlet berhasil diperbarui");
            navigate("/admin/outlet");
        } catch (err) {
            console.error("Gagal memperbarui outlet:", err);
            alert("Gagal memperbarui data outlet");
        }
    };


    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                {/* Breadcrumb */}
                <div className="px-3 py-3 flex justify-between items-center border-b bg-white">
                    <div className="flex items-center space-x-2 text-sm">
                        <FaStoreAlt className="text-gray-400" />
                        <span className="text-gray-500">Outlet</span>
                        <FaChevronRight className="text-gray-400" />
                        <span className="text-gray-700 font-medium">Ubah Outlet</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 px-4 py-6 md:px-8 lg:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto text-sm text-gray-600">
                        {/* Nama Outlet */}
                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-gray-700 after:content-['*'] after:text-red-500">
                                Nama Outlet
                            </label>
                            <input
                                type="text"
                                className="border rounded px-3 py-2 focus:border-green-600 focus:ring-green-600"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        {/* Kota */}
                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-gray-700 after:content-['*'] after:text-red-500">
                                Kota / Kabupaten
                            </label>
                            <Select
                                options={cityOptions}
                                value={cityOptions.find((opt) => opt.value === form.city) || null}
                                onChange={(selected) =>
                                    setForm({ ...form, city: selected ? selected.value : "" })
                                }
                                placeholder="Pilih kota..."
                                isClearable
                                className="text-sm"
                                menuPortalTarget={document.body}
                                styles={customSelectStyles}
                            />
                        </div>

                        {/* Lokasi */}
                        {form.city !== "" && (
                            <div className="md:col-span-2">
                                <label className="block mb-2 font-medium text-gray-700 after:content-['*'] after:text-red-500">
                                    Tandai Lokasi
                                </label>
                                <div className="space-y-4">
                                    <MapContainer
                                        center={mapPosition}
                                        zoom={13}
                                        className="w-full h-64 rounded"
                                        scrollWheelZoom
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <MapUpdater position={mapPosition} />
                                        <LocationMarker
                                            position={mapPosition}
                                            setPosition={setMapPosition}
                                        />
                                    </MapContainer>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Alamat */}
                                        <div className="md:col-span-3 space-y-1">
                                            <p className="font-semibold text-gray-800">
                                                Alamat (Berdasarkan pinpoint)
                                            </p>
                                            {!isEditing ? (
                                                <p className="text-sm">{form.address}</p>
                                            ) : (
                                                <textarea
                                                    value={tempAddress}
                                                    onChange={(e) => setTempAddress(e.target.value)}
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:border-green-600 focus:ring-green-600"
                                                    rows={3}
                                                    placeholder="Tulis alamat..."
                                                />
                                            )}
                                            <div className="text-sm text-[#005429] cursor-pointer">
                                                {!isEditing ? (
                                                    <span onClick={() => setIsEditing(true)}>Edit Alamat</span>
                                                ) : (
                                                    <span
                                                        onClick={() => {
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                address: tempAddress,
                                                            }));
                                                            setIsEditing(false);
                                                        }}
                                                    >
                                                        Simpan
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Latitude */}
                                        <div>
                                            <p className="font-semibold text-gray-800">Latitude</p>
                                            <p className="text-sm">{form.latitude}</p>
                                        </div>

                                        {/* Longitude */}
                                        <div>
                                            <p className="font-semibold text-gray-800">Longitude</p>
                                            <p className="text-sm">{form.longitude}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Nomor Telepon */}
                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-gray-700">
                                Nomor Telepon
                            </label>
                            <input
                                type="text"
                                className="border rounded px-3 py-2 focus:border-green-600 focus:ring-green-600"
                                value={form.contactNumber}
                                onChange={(e) =>
                                    setForm({ ...form, contactNumber: e.target.value })
                                }
                            />
                        </div>

                        {/* Pajak & Service */}
                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-gray-700">
                                Pajak & Service
                            </label>
                            <select
                                className="border rounded px-3 py-2 focus:border-green-600 focus:ring-green-600"
                                value={form.tax}
                                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                            >
                                <option value="">Tidak Ada Pajak</option>
                                {tax
                                    .filter((t) => t.type === "tax")
                                    .map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.name}{" "}
                                            {t.percentage != null
                                                ? `${t.percentage}%`
                                                : `Rp ${t.fixedFee}`}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Tipe Penjualan */}
                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-gray-700">
                                Tipe Penjualan
                            </label>
                            <select
                                className="border rounded px-3 py-2 focus:border-green-600 focus:ring-green-600"
                                value={form.salesType}
                                onChange={(e) => setForm({ ...form, salesType: e.target.value })}
                            >
                                <option value="">Pilih</option>
                                <option value="dine-in">Dine-In</option>
                                <option value="takeaway">Takeaway</option>
                                <option value="delivery">Delivery</option>
                            </select>
                        </div>

                        {/* Jam Buka Tutup */}
                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700">
                                    Jam Buka
                                </label>
                                <input
                                    type="time"
                                    className="w-full border rounded px-3 py-2 disabled:bg-gray-100 focus:border-green-600 focus:ring-green-600"
                                    value={form.pawoonOpen}
                                    onChange={(e) =>
                                        setForm({ ...form, pawoonOpen: e.target.value })
                                    }
                                    disabled={!form.pawoonOrder}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700">
                                    Jam Tutup
                                </label>
                                <input
                                    type="time"
                                    className="w-full border rounded px-3 py-2 disabled:bg-gray-100 focus:border-green-600 focus:ring-green-600"
                                    value={form.pawoonClose}
                                    onChange={(e) =>
                                        setForm({ ...form, pawoonClose: e.target.value })
                                    }
                                    disabled={!form.pawoonOrder}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 border-t bg-white px-4 py-3 flex flex-row justify-between items-center">
                    <p className="text-xs text-gray-500">
                        Kolom bertanda <b className="text-red-600">*</b> wajib diisi
                    </p>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/outlet"
                            className="border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-4 py-2 rounded transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="bg-[#005429] text-white text-sm px-4 py-2 rounded transition"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UpdateOutlet;
