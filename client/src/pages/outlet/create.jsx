import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaChevronRight, FaStoreAlt, FaInfoCircle } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const cityCoordinates = [

    {
        "id": "3209",
        "province_id": "32",
        "city": "KABUPATEN CIREBON",
        "alt_name": "KABUPATEN CIREBON",
        "latitude": -6.8,
        "longitude": 108.56667
    },
    {
        "id": "3274",
        "province_id": "32",
        "city": "KOTA CIREBON",
        "alt_name": "KOTA CIREBON",
        "latitude": -6.75,
        "longitude": 108.55
    },
];

const sortedCityCoordinates = [...cityCoordinates].sort((a, b) =>
    a.city.localeCompare(b.city)
);


function MapUpdater({ position }) {
    const map = useMap();

    useEffect(() => {
        map.setView(position, 13);
    }, [position, map]);

    return null;
}

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        }
    });
    return position ? <Marker position={position} /> : null;
}

const CreateOutlet = () => {
    const [outlets, setOutlets] = useState([]);
    const [tax, setTax] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    // const [formData, setFormData] = useState({
    //     name: "",
    //     location: "",
    //     contactNumber: "",
    //     latitude: "",
    //     longitude: "",
    //     outletPictures: [],  // Store multiple pictures in an array
    // });
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
        // pawoonOrder: false,
        // pawoonOpen: "",
        // pawoonClose: ""
    });

    const [tempAddress, setTempAddress] = useState(form.address);

    const [mapPosition, setMapPosition] = useState({ lat: -6.2, lng: 106.8 });

    useEffect(() => {
        if (form.city !== "") {
            const selected = cityCoordinates.find((city) => city.city === form.city);
            if (selected) {
                setMapPosition({
                    lat: selected.latitude,
                    lng: selected.longitude
                });
            }
        }
    }, [form.city]);

    useEffect(() => {
        setForm((prevForm) => ({
            ...prevForm,
            latitude: mapPosition.lat,
            longitude: mapPosition.lng,
        }));
    }, [mapPosition]);


    const navigate = useNavigate();
    const [showImportDropdown, setShowImportDropdown] = useState(false);
    const [searchImport, setSearchImport] = useState('');
    const [tempSelectedImport, setTempSelectedImport] = useState('');
    const importDropdownRef = useRef(null);

    // filter opsi berdasarkan pencarian
    const filteredImportOptions = outlets.filter((item) =>
        item.name.toLowerCase().includes(searchImport.toLowerCase())
    );

    useEffect(() => {
        fetchOutlets();
        fetchTax();
    }, []);

    const fetchOutlets = async () => {
        try {
            const response = await axios.get("/api/outlet");
            setOutlets(response.data.data || []);
        } catch (error) {
            console.error("Error fetching outlets:", error);
        }
    };

    const fetchTax = async () => {
        try {
            const response = await axios.get("/api/tax-service");
            setTax(response.data || []);
        } catch (error) {
            console.error("Error fetching tax:", error);
        }
    }

    useEffect(() => {
        if (!form.address && form.city) {
            setForm(prev => ({ ...prev, address: prev.city }));
        }
    }, [form.city]);

    useEffect(() => {
        setTempAddress(form.address);
    }, [form.address]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const newOutlet = { ...form };
            console.log(newOutlet);

            // await axios.post('/api/outlet', newOutlet); // Kirim sebagai array
            // navigate("/admin/outlet");
        } catch (err) {
            console.error('Error adding category:', err);
        }
    };

    return (
        <div className="">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaStoreAlt className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Outlet
                        </span>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Tambah Outlet
                        </span>
                    </div>
                </div>
                <div className="grid px-3 grid-cols-1 w-full md:w-7/12 gap-4 text-[14px] text-[#999999] pb-[60px]">
                    <div className="flex items-center">
                        <label className="w-[140px] block mb-1 text-sm after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Nama Outlet</label>
                        <input
                            type="text"
                            className="flex-1 w-full border rounded px-3 py-2"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center">
                        <label className="w-[140px] block mb-1 text-sm after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Kota / Kabupaten</label>
                        <select
                            className="flex-1 w-full border rounded px-3 py-2"
                            value={form.city}
                            onChange={(e) => {
                                const selectedCity = e.target.value;
                                setForm(prev => ({
                                    ...prev,
                                    city: selectedCity,
                                    address: selectedCity, // 👈 langsung override address juga
                                }));
                            }}
                        >
                            <option value="">Pilih Kota</option>
                            {sortedCityCoordinates.map((city) => (
                                <option key={city.id} value={city.city}>{city.city}</option>
                            ))}
                        </select>
                    </div>

                    {form.city !== "" && (
                        <>
                            <div className="flex">
                                <label className="w-[140px] block mb-2 text-sm after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Tandai Lokasi</label>
                                <div className="flex-1 space-y-3">
                                    <MapContainer center={mapPosition} zoom={13} className="w-full h-64 rounded" scrollWheelZoom>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <MapUpdater position={mapPosition} />
                                        <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                                    </MapContainer>
                                    <div className="space-y-6">

                                        {/* Alamat Pinpoint */}
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">Alamat (Berdasarkan pinpoint)</p>

                                            {!isEditing ? (
                                                <p id="detail-address" className="text-sm">{form.address || form.city}</p>
                                            ) : (
                                                <textarea
                                                    value={form.address}
                                                    onChange={(e) =>
                                                        setForm(prev => ({
                                                            ...prev,
                                                            address: e.target.value,
                                                        }))
                                                    }

                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-0 focus:ring-[#005429] focus:border-[#005429]"
                                                    rows={3}
                                                    placeholder="Tulis alamat..."
                                                />
                                            )}

                                            <input type="hidden" name="address" value={form.address} />
                                            <label className="text-red-500 text-xs hidden"></label>

                                            {/* Tombol Edit / Simpan */}
                                            <div className="text-sm text-blue-600 space-x-2">
                                                {!isEditing ? (
                                                    <span
                                                        onClick={() => setIsEditing(true)}
                                                        className="cursor-pointer text-[#005429]"
                                                    >
                                                        Edit Alamat
                                                    </span>
                                                ) : (
                                                    <span
                                                        onClick={() => {
                                                            // setForm((prev) => ({
                                                            //     ...prev,
                                                            //     address: tempAddress.trim(), // gunakan hasil edit langsung
                                                            // }));
                                                            setIsEditing(false);
                                                        }}
                                                        className="cursor-pointer text-[#005429]"
                                                    >
                                                        Simpan
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Latitude */}
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">Latitude (Berdasarkan pinpoint)</p>
                                            <p id="detail-latitude" className="text-sm">{mapPosition.lat.toFixed(6)}</p>
                                            <input
                                                type="hidden"
                                                name="latitude"
                                                value={form.latitude}
                                            />
                                        </div>

                                        {/* Longitude */}
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">Longitude (Berdasarkan pinpoint)</p>
                                            <p id="detail-longitude" className="text-sm">{mapPosition.lng.toFixed(6)}</p>
                                            <input
                                                type="hidden"
                                                name="longitude"
                                                value={form.longitude}
                                            />
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-center">
                        <label className="w-[140px] block mb-1 text-sm ">Nomor Telepon</label>
                        <input
                            type="text"
                            className="flex-1 w-full border rounded px-3 py-2"
                            value={form.contactNumber}
                            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center">
                        <label className="w-[140px] block mb-1 text-sm ">Pajak & Service</label>
                        <select
                            className="flex-1 w-full border rounded px-3 py-2"
                            value={form.tax}
                            onChange={(e) => setForm({ ...form, tax: e.target.value })}
                        >
                            <option value="">Tidak Ada Pajak</option>
                            {tax.filter((t) => t.type === 'tax').map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.name} ({t.percentage != null ? `${t.percentage}%` : `Rp ${t.fixedFee}`})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center w-[140px] text-[14px] text-[#999999] space-x-2">
                            <p className="">Impor Produk</p>
                            <div className="relative group">
                                <FaInfoCircle className="cursor-help" />
                                <span className="absolute w-[340px] left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:inline-block bg-white border text-[#999999] text-xs rounded px-2 py-1 z-10 shadow-lg">
                                    Anda dapat mengimpor seluruh produk dari outlet yang sudah ada.
                                </span>
                            </div>
                        </label>

                        <div className="relative flex-1">
                            {!showImportDropdown ? (
                                <button
                                    type="button"
                                    className="w-full text-[13px] text-gray-500 border py-2 px-3 rounded text-left relative"
                                    onClick={() => setShowImportDropdown(true)}
                                >
                                    {tempSelectedImport || 'Pilih Import Produk'}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-2 px-3 rounded"
                                    value={searchImport}
                                    onChange={(e) => setSearchImport(e.target.value)}
                                    autoFocus
                                    placeholder="Cari opsi..."
                                />
                            )}

                            {showImportDropdown && (
                                <ul
                                    className="absolute z-10 bg-white border mt-1 w-full rounded shadow-md max-h-48 overflow-auto"
                                    ref={importDropdownRef}
                                >
                                    {filteredImportOptions.length > 0 ? (
                                        filteredImportOptions.map((item, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedImport(item.name);
                                                    setForm({ ...form, importProduct: item.value });
                                                    setShowImportDropdown(false);
                                                    setSearchImport('');
                                                }}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                            >
                                                {item.name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>


                    <div className="flex items-center justify-between space-x-2">
                        <label htmlFor="tableModule" className="text-sm flex items-center space-x-2">
                            <p>Modul Meja</p>
                            <div className="relative group">
                                <FaInfoCircle className="cursor-help" />
                                <span className="absolute w-[340px] left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:inline-block bg-white border text-[#999999] text-xs rounded px-2 py-1 whitespace-wrap z-10 shadow-lg">
                                    Anda dapat mengaktifkan modul meja apabila tipe bisnis Anda restoran dan semacamnya.
                                </span>
                            </div>
                        </label>
                        <div className="flex items-center space-x-2">
                            <h3>Tidak</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer"
                                    checked={form.tableModule}
                                    onChange={(e) => setForm({ ...form, tableModule: e.target.checked })} />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-blue-300 
                    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                    peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                    after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                    after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
                            </label>
                        </div>
                    </div>

                    {/* <div className="flex items-center">
                        <label className="w-[140px] block mb-1 text-sm ">Tipe Penjualan</label>
                        <select
                            className="flex-1 w-full border rounded px-3 py-2"
                            value={form.salesType}
                            onChange={(e) => setForm({ ...form, salesType: e.target.value })}
                        >
                            <option value="">Pilih</option>
                            <option value="dine-in">Dine-In</option>
                            <option value="takeaway">Takeaway</option>
                            <option value="delivery">Delivery</option>
                        </select>
                    </div> */}

                    {/* <div className="flex items-center justify-between space-x-2">
                        <label htmlFor="pawoonOrder" className="text-sm">Pawoon Order</label>
                        <div className="flex items-center space-x-2">
                            <h3 className="text-sm">Tidak</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    id="pawoonOrder"
                                    checked={form.pawoonOrder}
                                    onChange={(e) => setForm({ ...form, pawoonOrder: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-blue-300 
        peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
        peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
        after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
        after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]">
                                </div>
                            </label>
                        </div>
                    </div> */}

                    {/* Input tetap tampil, tapi disable jika pawoonOrder belum dicentang */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm">Jam Buka</label>
                            <input
                                type="time"
                                className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                                value={form.pawoonOpen}
                                onChange={(e) => setForm({ ...form, pawoonOpen: e.target.value })}
                                disabled={!form.pawoonOrder}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm">Jam Tutup</label>
                            <input
                                type="time"
                                className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                                value={form.pawoonClose}
                                onChange={(e) => setForm({ ...form, pawoonClose: e.target.value })}
                                disabled={!form.pawoonOrder}
                            />
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-64 right-0 flex justify-between items-center border-t px-3 z-50 bg-white">
                    <div className="">
                        <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                    </div>
                    <div className="flex space-x-2 py-2">
                        <Link
                            to="/admin/outlet"
                            className="border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="bg-[#005429] text-white text-sm px-3 py-1.5 rounded"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </form >
        </div >
    );
};

export default CreateOutlet;
