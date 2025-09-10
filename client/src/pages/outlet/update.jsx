import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaChevronRight, FaMapPin, FaPhone, FaStore } from "react-icons/fa";
import { coordinateCityWithProvince, provinceCoordinates } from "../../utils/coordinateCity";

// --- Leaflet marker fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// fly to posisi baru
function MapFlyTo({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], 13, { duration: 1.5 });
        }
    }, [position, map]);
    return null;
}

function Field({ label, required, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-800">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </label>
            {children}
        </div>
    );
}

function ClickToPlaceMarker({ onChange }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        const handleClick = (e) => {
            onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        };
        map.on("click", handleClick);
        return () => {
            map.off("click", handleClick);
        };
    }, [map, onChange]);

    return null;
}


export default function UpdateOutlet() {
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

    const [staff, setStaff] = useState([]);
    const [outlet, setOutlet] = useState({
        name: "",
        address: "",
        city: "",
        location: "",
        contactNumber: "",
        admin: "",
        outletPictures: "",
    });

    const [loc, setLoc] = useState({
        _id: null,
        label: "Outlet",
        recipientName: "",
        phoneNumber: "",
        address: "",
        province: "",
        city: "",
        district: "",
        postalCode: "",
        details: "",
        isPrimary: true,
        isActive: true,
    });

    const [mapPos, setMapPos] = useState({ lat: -6.2, lng: 106.816666 });
    const [hasMarker, setHasMarker] = useState(false);

    // --- Opsi Select ---
    const provinceOptions = provinceCoordinates.map(p => ({
        value: p.province,
        label: p.province,
        lat: p.lat,
        lng: p.lng,
    }));

    const cityOptions = useMemo(() => {
        if (!loc.province) return [];
        return coordinateCityWithProvince
            .filter(c => c.province === loc.province)
            .map(c => ({
                value: c.city,
                label: c.city,
                lat: c.latitude,
                lng: c.longitude,
            }));
    }, [loc.province]);

    const cityOnly = coordinateCityWithProvince.map(c => ({
        value: c.city,
        label: c.city,
    }));

    // --- Ambil data awal ---
    const fetchOutlet = async () => {
        try {
            // Ambil outlet utama
            const res = await axios.get(`/api/outlet/${id}`);
            const data = res.data.data || res.data;

            setOutlet({
                name: data.name,
                address: data.address,
                city: data.city,
                location: data.location,
                contactNumber: data.contactNumber,
                admin: data.admin?._id || "",
                outletPictures: (data.outletPictures || []).join(", "),
            });

            // Ambil lokasi outlet
            const resLoc = await axios.get(`/api/outlet/${id}/locations`);
            const locs = resLoc.data.data || [];

            if (locs.length > 0) {
                const l = locs[0]; // ambil lokasi pertama
                setLoc({
                    _id: l._id,
                    label: l.label,
                    recipientName: l.recipientName,
                    phoneNumber: l.phoneNumber,
                    address: l.address,
                    province: l.province,
                    city: l.city,
                    district: l.district,
                    postalCode: l.postalCode,
                    details: l.details,
                    isPrimary: l.isPrimary,
                    isActive: l.isActive,
                });

                if (l.coordinates?.coordinates) {
                    setMapPos({
                        lat: l.coordinates.coordinates[1],
                        lng: l.coordinates.coordinates[0],
                    });
                    setHasMarker(true);
                }
            }
        } catch (err) {
            console.error(err);
            alert("Gagal memuat data outlet");
        }
    };


    const fetchStaff = async () => {
        try {
            const staffResponse = await axios.get("/api/user/staff");
            const staffData = staffResponse.data.data || staffResponse.data;
            const adminStaff = staffData.filter(user => user.role === "admin");
            const options = adminStaff.map(user => ({
                value: user._id,
                label: user.name,
            }));
            setStaff(options);
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    };

    useEffect(() => {
        fetchOutlet();
        fetchStaff();
    }, [id]);

    const handleUpdateAll = async (e) => {
        e.preventDefault();
        try {
            // Update outlet
            const pics = (outlet.outletPictures || "")
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);

            const payloadOutlet = {
                name: outlet.name,
                address: outlet.address,
                city: outlet.city,
                location: outlet.location,
                contactNumber: outlet.contactNumber,
                admin: outlet.admin || null,
                outletPictures: pics.length ? pics : undefined,
            };
            await axios.put(`/api/outlet/${id}`, payloadOutlet);

            // Update lokasi (jika ada ID)
            if (loc._id) {
                const payloadLoc = {
                    label: loc.label || "Outlet",
                    recipientName: loc.recipientName,
                    phoneNumber: loc.phoneNumber,
                    address: loc.address,
                    province: loc.province,
                    city: loc.city,
                    district: loc.district,
                    postalCode: loc.postalCode,
                    details: loc.details,
                    isPrimary: !!loc.isPrimary,
                    isActive: !!loc.isActive,
                    coordinates: {
                        type: "Point",
                        coordinates: [Number(mapPos.lng), Number(mapPos.lat)],
                    },
                };
                await axios.put(`/api/outlet/${id}/locations/${loc._id}`, payloadLoc);
            }

            alert("Data outlet berhasil diperbarui");
            navigate("/admin/outlet");
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Gagal update data");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2 text-sm text-gray-700">
                    <FaStore className="w-4 h-4 text-gray-400" />
                    <span>Outlet</span>
                    <FaChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Edit Outlet</span>
                </div>
            </div>

            {/* Main content */}
            <form onSubmit={handleUpdateAll} className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: Outlet */}
                    <div layout className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Data Outlet</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nama Outlet" required>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={outlet.name}
                                    onChange={(e) => setOutlet({ ...outlet, name: e.target.value })}
                                />
                            </Field>

                            <Field label="Nomor Telepon" required>
                                <div className="flex items-center gap-2">
                                    <FaPhone className="w-4 h-4 text-gray-400" />
                                    <input
                                        className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={outlet.contactNumber}
                                        onChange={(e) => setOutlet({ ...outlet, contactNumber: e.target.value })}
                                    />
                                </div>
                            </Field>

                            <Field label="Alamat" required>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={outlet.address}
                                    onChange={(e) => setOutlet({ ...outlet, address: e.target.value })}
                                />
                            </Field>

                            <Field label="Kota / Kabupaten" required>
                                <Select
                                    options={cityOnly}
                                    value={cityOnly.find(opt => opt.value === outlet.city) || null}
                                    onChange={(selected) =>
                                        setOutlet({
                                            ...outlet,
                                            city: selected ? selected.value : "",
                                        })
                                    }
                                    placeholder="Pilih Kota/Kabupaten..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </Field>


                            <Field label="Lokasi (deskripsi)" required>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={outlet.location}
                                    onChange={(e) => setOutlet({ ...outlet, location: e.target.value })}
                                    placeholder="cth: Ruko Emerald Blok B No. 12"
                                />
                            </Field>

                            <Field label="Admin (optional)">
                                <Select
                                    options={staff}
                                    value={staff.find(opt => opt.value === outlet.admin) || null}
                                    onChange={(selected) => setOutlet({ ...outlet, admin: selected ? selected.value : null })}
                                    placeholder="Pilih Admin..."
                                    className="text-sm"
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </Field>

                            <Field label="Foto Outlet (URL, pisahkan dengan koma)">
                                <input
                                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={outlet.outletPictures}
                                    onChange={(e) => setOutlet({ ...outlet, outletPictures: e.target.value })}
                                    placeholder="https://... , https://..."
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Right column: Tips / Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Ringkasan</h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li><strong>Outlet</strong>: {outlet.name || "-"}</li>
                            <li><strong>Telepon</strong>: {outlet.contactNumber || "-"}</li>
                            <li><strong>Kota</strong>: {outlet.city || "-"}</li>
                            <li><strong>Alamat</strong>: {outlet.address || "-"}</li>
                        </ul>
                        <div className="mt-4 text-xs text-gray-500">
                            Lengkapi lokasi di langkah ke-2 untuk menyimpan pin [lng, lat] sesuai skema GeoJSON.
                        </div>
                    </div>

                    {/* Location card spans all columns on large screens */}
                    <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><FaMapPin className="w-5 h-5" /> Lokasi Outlet</h2>
                            <div className="text-sm">
                                Koordinat: <span className="font-mono">{hasMarker ? `${mapPos.lat.toFixed(6)}, ${mapPos.lng.toFixed(6)}` : "-"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Map */}
                            <div className="lg:col-span-2 order-2 lg:order-1">
                                <div className="rounded-2xl overflow-hidden border">
                                    <MapContainer center={[mapPos.lat, mapPos.lng]} zoom={13} className="h-80 w-full">
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                        {/* auto-fly setiap kali mapPos berubah */}
                                        <MapFlyTo position={mapPos} />

                                        {/* klik untuk menaruh marker */}
                                        <ClickToPlaceMarker
                                            onChange={(ll) => {
                                                setMapPos({ lat: ll.lat, lng: ll.lng });
                                                setHasMarker(true);
                                            }}
                                        />

                                        {hasMarker && <Marker position={[mapPos.lat, mapPos.lng]} />}
                                    </MapContainer>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Klik pada peta untuk menaruh pin. Data akan dikirim sebagai <code>[lng, lat]</code>.</p>
                            </div>

                            {/* Location form */}
                            <div className="order-1 lg:order-2">
                                <div className="grid grid-cols-1 gap-4">
                                    <Field label="Label Alamat" required>
                                        <input
                                            type="text"
                                            className="w-full border rounded-xl px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                                            value="Outlet"
                                            disabled
                                        />
                                    </Field>

                                    <Field label="Nama Penerima" required>
                                        <input
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            value={loc.recipientName}
                                            onChange={(e) => setLoc({ ...loc, recipientName: e.target.value })}
                                            placeholder="Nama PIC"
                                        />
                                    </Field>

                                    <Field label="No. Telepon" required>
                                        <input
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            value={loc.phoneNumber}
                                            onChange={(e) => setLoc({ ...loc, phoneNumber: e.target.value })}
                                        />
                                    </Field>

                                    <Field label="Alamat (Lengkap)" required>
                                        <textarea
                                            rows={3}
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            value={loc.address}
                                            onChange={(e) => setLoc({ ...loc, address: e.target.value })}
                                        />
                                    </Field>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Provinsi" required>
                                            <Select
                                                options={provinceOptions}
                                                value={provinceOptions.find(opt => opt.value === loc.province) || null}
                                                onChange={(selected) => {
                                                    setLoc({ ...loc, province: selected ? selected.value : "", city: "" });
                                                    if (selected) {
                                                        setMapPos({ lat: selected.lat, lng: selected.lng });
                                                        setHasMarker(true);
                                                    }
                                                }}
                                                placeholder="Pilih..."
                                                isClearable
                                                styles={customSelectStyles}
                                            />
                                        </Field>
                                        <Field label="Kota / Kabupaten" required>
                                            <Select
                                                options={cityOptions}
                                                value={cityOptions.find(opt => opt.value === loc.city) || null}
                                                onChange={(selected) => {
                                                    setLoc({ ...loc, city: selected ? selected.value : "" });
                                                    if (selected) {
                                                        setMapPos({ lat: selected.lat, lng: selected.lng });
                                                        setHasMarker(true);
                                                    }
                                                }}
                                                placeholder="Pilih..."
                                                isClearable
                                                styles={customSelectStyles}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Kecamatan" required>
                                            <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={loc.district} onChange={(e) => setLoc({ ...loc, district: e.target.value })} />
                                        </Field>
                                        <Field label="Kode Pos" required>
                                            <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={loc.postalCode} onChange={(e) => setLoc({ ...loc, postalCode: e.target.value })} />
                                        </Field>
                                    </div>

                                    <Field label="Detail Tambahan">
                                        <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={loc.details} onChange={(e) => setLoc({ ...loc, details: e.target.value })} />
                                    </Field>

                                    <div className="flex items-center gap-4 text-sm">
                                        <label className="inline-flex items-center gap-2">
                                            <input type="checkbox" className="rounded border-gray-300" checked={loc.isPrimary} onChange={(e) => setLoc({ ...loc, isPrimary: e.target.checked })} />
                                            <span>Jadikan utama</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                            <input type="checkbox" className="rounded border-gray-300" checked={loc.isActive} onChange={(e) => setLoc({ ...loc, isActive: e.target.checked })} />
                                            <span>Aktif</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="sticky bottom-0 z-20 bg-white/80 backdrop-blur border-t">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">Kolom bertanda <b className="text-red-600">*</b> wajib diisi. Koordinat disimpan sebagai <code>[lng, lat]</code>.</p>
                        <div className="flex items-center gap-2">
                            <Link to="/admin/outlet" className="border border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white text-sm px-4 py-2 rounded-2xl transition">Batal</Link>
                            <button type="submit" className="bg-emerald-700 text-white text-sm px-4 py-2 rounded-2xl shadow-sm hover:bg-emerald-800 transition">Simpan</button>
                        </div>
                    </div>
                </div>
            </form>

        </div>
    );
}