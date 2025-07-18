import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaBell, FaChevronRight, FaHandshake, FaReceipt, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateCommission = () => {
    const navigate = useNavigate();
    const [showInput, setShowInput] = useState(false);
    const [showInputProduct, setShowInputProduct] = useState(false);
    const [showInputEmployee, setShowInputEmployee] = useState(false);
    const [search, setSearch] = useState('');
    const [searchProduct, setSearchProduct] = useState('');
    const [searchEmployee, setSearchEmployee] = useState('');
    const [outletList, setOutletList] = useState([]);
    const [productList, setProductList] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState('');
    const [tempSelectedProduct, setTempSelectedProduct] = useState('');
    const [tempSelectedEmployee, setTempSelectedEmployee] = useState('');
    // const [loading, setLoading] = useState(true);
    const dropdownRef = useRef();
    const [formData, setFormData] = useState({
        status: "0",
        pembagian: "1", // Default: Per-produk
        komisi: "1", // default to Presentase
        nilai: "",
        name: "",
        address: "",
        phone: "",
        email: ""
    });

    const fetchOutlets = async () => {
        // setLoading(true);
        try {
            const response = await axios.get('/api/outlet');
            // Pastikan response sesuai format
            setOutletList(response.data.data || []);
        } catch (error) {
            console.error('Gagal fetch outlet:', error);
        }
        // finally {
        //     setLoading(false);
        // }
    };

    const fetchProduct = async () => {
        try {
            const response = await axios.get('/api/menu/menu-items');
            // Pastikan response sesuai format
            setProductList(response.data.data || []);
        } catch (error) {
            console.error('Gagal fetch product:', error);
        }
    }

    const fetchEmployee = async () => {
        try {
            const response = await axios.get('/api/user');
            // Pastikan response sesuai format
            setEmployeeList(response.data || []);
        } catch (error) {
            console.error('Gagal fetch employee:', error);
        }
    }

    useEffect(() => {
        fetchOutlets();
        fetchProduct();
        fetchEmployee();
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
                setShowInputProduct(false);
                setShowInputEmployee(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const filteredOutlets = outletList.filter((outlet) =>
        outlet.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredProducts = productList.filter((product) =>
        product.name.toLowerCase().includes(searchProduct.toLowerCase())
    );

    const filteredEmployee = employeeList.filter((employee) =>
        employee.username.toLowerCase().includes(searchEmployee.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const newSupplier = { ...formData };

            const response = await axios.post('/api/marketlist/supplier', newSupplier); // Kirim sebagai array
            navigate("/admin/supplier");
        } catch (err) {
            console.error('Error adding category:', err);
        }
    };

    // Show loading state
    // if (loading) {
    //     return (
    //         <div className="flex justify-center items-center h-screen">
    //             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
    //         </div>
    //     );
    // }

    return (
        <div className="">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaHandshake className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Komisi
                        </span>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Tambah Komisi
                        </span>
                    </div>
                </div>
                <div className="grid px-3 grid-cols-1 w-full md:w-1/2 gap-4 pb-[200px]">

                    {/* Name */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Nama Komisi
                        </h3>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg flex-1"
                        />
                    </div>

                    {/* === OUTLET CUSTOM === */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Pilih Outlet
                        </h3>
                        <div className="relative flex-1">
                            {!showInput ? (
                                <button
                                    type="button"
                                    className="w-full text-[13px] text-[#999999] border py-2 px-3 rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                    onClick={() => setShowInput(true)}
                                >
                                    {tempSelectedOutlet || 'Pilih Outlet'}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-2 px-3 rounded text-left"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    placeholder="Cari outlet..."
                                />
                            )}
                            {showInput && (
                                <ul
                                    className="absolute z-10 bg-white border mt-1 w-full rounded shadow-md max-h-48 overflow-auto"
                                    ref={dropdownRef}
                                >
                                    {filteredOutlets.length > 0 ? (
                                        filteredOutlets.map((outlet, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedOutlet(outlet.name);
                                                    setShowInput(false);
                                                    setSearch('');
                                                }}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                            >
                                                {outlet.name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-[#999999]">Tidak ditemukan</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div class="flex items-center">
                        <label class="w-[140px]"></label>
                        <div class="flex flex-1 items-start space-x-2">
                            <div className="">
                                <input type="checkbox" class="form-checkbox w-5 h-5 flex" id="is_mandatory" value="1" checked disabled />
                            </div>
                            <div class=" text-sm text-gray-600">
                                <p>Wajibkan outlet untuk menggunakan komisi?</p>
                                <p class="text-xs text-gray-500">Hal ini akan mewajibkan setiap transaksi pada kasir untuk memilih karyawan yang menjual produk/jasa terlebih dahulu.</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center text-[#999999]">
                        <label class="w-[140px] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">Status Komisi</label>
                        <div class="flex-1 space-x-4">
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === "1"}
                                    onChange={handleInputChange}
                                    value="1"
                                    class="form-radio" /> Aktif
                            </label>
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === "0"}
                                    onChange={handleInputChange}
                                    value="0"
                                    class="form-radio" /> Non-aktif
                            </label>
                        </div>
                    </div>

                    <div className="text-[#999999]">
                        <div className="flex items-center">
                            <h3 className="w-[140px] block text-[14px]">
                                Text komisi Pada pos/kasir
                            </h3>
                            <input
                                type="text"
                                name="pos"
                                value={formData.pos}
                                onChange={handleInputChange}
                                className="w-full py-2 px-3 border rounded-lg flex-1"
                            />
                        </div>
                        <div className="pl-[140px] text-[12px]"><p>Perubahan text akan ditampilkan pada POS</p></div>
                    </div>

                    <div className="flex items-center text-[#999999]">
                        <label className="w-[140px] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Tipe pembagian komisi
                        </label>
                        <div className="flex-1 space-x-4">
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="pembagian"
                                    value="1"
                                    checked={formData.pembagian === '1'}
                                    onChange={handleInputChange}
                                    className="form-radio"
                                /> Per-produk
                            </label>
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="pembagian"
                                    value="0"
                                    checked={formData.pembagian === '0'}
                                    onChange={handleInputChange}
                                    className="form-radio"
                                /> Per-transaksi
                            </label>
                        </div>
                    </div>

                    {formData.pembagian === '1' && (
                        <div className="flex items-center mt-2">
                            <div className="pl-[140px] relative flex-1">
                                {!showInputProduct ? (
                                    <button
                                        type="button"
                                        className="w-full text-[13px] text-[#999999] border py-2 px-3 rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                        onClick={() => setShowInputProduct(true)}
                                    >
                                        {tempSelectedProduct || 'Pilih Produk'}
                                    </button>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full text-[13px] border py-2 px-3 rounded text-left"
                                        value={search}
                                        onChange={(e) => setSearchProduct(e.target.value)}
                                        autoFocus
                                        placeholder="Cari produk..."
                                    />
                                )}
                                {showInputProduct && (
                                    <ul
                                        className="absolute z-10 bg-white border mt-1 w-full rounded shadow-md max-h-48 overflow-auto"
                                        ref={dropdownRef}
                                    >
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product, idx) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => {
                                                        setTempSelectedProduct(product.name);
                                                        setShowInputProduct(false);
                                                        setSearchProduct('');
                                                    }}
                                                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                                >
                                                    {product.name}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-[#999999]">Tidak ditemukan</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center text-[#999999]">
                        <label className="w-[140px] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Nilai Komisi
                        </label>
                        <div className="flex-1 space-x-4">
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="komisi"
                                    value="1"
                                    checked={formData.komisi === '1'}
                                    onChange={handleInputChange}
                                    className="form-radio"
                                /> Presentase
                            </label>
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="komisi"
                                    value="0"
                                    checked={formData.komisi === '0'}
                                    onChange={handleInputChange}
                                    className="form-radio"
                                /> Indonesia Rupiah (IDR)
                            </label>
                        </div>
                    </div>

                    <div className="pl-[140px] flex items-center text-[#999999] space-x-4 mt-2">
                        <input
                            type="number"
                            name="nilai"
                            value={formData.nilai}
                            onChange={handleInputChange}
                            className="w-[100px] py-2 px-3 border rounded-lg"
                        />
                        <span>{formData.komisi === '1' ? '%' : 'Rp'}</span>
                    </div>

                    <div className="flex items-center">
                        <div className="pl-[140px] relative flex-1">
                            {!showInputEmployee ? (
                                <button
                                    type="button"
                                    className="w-full text-[13px] text-[#999999] border py-2 px-3 rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                    onClick={() => setShowInputEmployee(true)}
                                >
                                    {tempSelectedEmployee || 'Pilih Karyawan'}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-2 px-3 rounded text-left"
                                    value={search}
                                    onChange={(e) => setSearchEmployee(e.target.value)}
                                    autoFocus
                                    placeholder="Cari Karyawan..."
                                />
                            )}
                            {showInputEmployee && (
                                <ul
                                    className="absolute z-10 bg-white border mt-1 w-full rounded shadow-md max-h-48 overflow-auto"
                                    ref={dropdownRef}
                                >
                                    {filteredEmployee.length > 0 ? (
                                        filteredEmployee.map((employee, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedEmployee(employee.username);
                                                    setShowInputEmployee(false);
                                                    setSearchEmployee('');
                                                }}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                            >
                                                {employee.username}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-[#999999]">Tidak ditemukan</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-64 right-0 flex justify-between border-t px-3 py-3 items-center bg-white z-50">
                    <div className="">
                        <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/commission"
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
            </form>
        </div>
    );
};

export default CreateCommission;