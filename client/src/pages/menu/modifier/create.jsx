import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../../../firebase';
import { Link } from "react-router-dom";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateModifier = () => {
    const fileRef = useRef(null);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isOptional, setIsOptional] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [image, setImage] = useState(undefined);
    const [imagePercent, setImagePercent] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        category: [],
        imageURL: "",
        toppings: [],
        addons: [],
        rawMaterials: [],
        availableAt: "",
    });

    const [categories, setCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [rawMaterials, setRawMaterials] = useState([]);

    // State untuk pemilihan dan pencarian
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchTermCategories, setSearchTermCategories] = useState('');

    const [outlets, setOutlets] = useState([]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.category-dropdown')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    useEffect(() => {
        setLoading(true);
        const fetchCategories = async () => {
            try {
                const response = await axios.get("/api/menu/categories");
                const fetchedCategories = response.data.data || [];
                setCategories(fetchedCategories);

                // mapping id -> name
                const map = {};
                fetchedCategories.forEach(cat => {
                    map[cat._id] = cat.name;
                });
                setCategoryMap(map);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchOutlets = async () => {
            try {
                const response = await axios.get("/api/outlet/");
                setOutlets(response.data || []);
            } catch (error) {
                console.error("Error fetching outlets:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchRawMaterial = async () => {
            try {
                const response = await axios.get("/api/storage/raw-material");
                setRawMaterials(response.data.data || []);
            } catch (error) {
                console.error("Error fetching raw materials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
        fetchOutlets();
        fetchRawMaterial();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Cari kategori yang sesuai input, kecuali yang sudah dipilih
    const searchCategories = (term) => {
        if (!term) return [];

        const lower = term.toLowerCase();
        return categories.filter(
            (cat) =>
                cat.name.toLowerCase().includes(lower) &&
                !selectedCategories.includes(cat._id)
        );
    };

    // Memo hasil pencarian
    const searchResultsCategories = useMemo(
        () => searchCategories(searchTermCategories),
        [searchTermCategories, selectedCategories, categories]
    );

    // Tambahkan kategori (pakai nama)
    // const handleAddCategory = (categoryId) => {
    //   const categoryName = categoryMap[categoryId];
    //   if (!formData.category.includes(categoryName)) {
    //     const newSelected = [...selectedCategories, categoryId];
    //     const newCategoryNames = [...formData.category, categoryName];

    //     setSelectedCategories(newSelected);
    //     setFormData((prev) => ({
    //       ...prev,
    //       category: newCategoryNames,
    //     }));

    //     setSearchTermCategories("");
    //   }
    // };

    const handleAddCategory = (categoryId) => {
        const categoryName = categoryMap[categoryId];

        setSelectedCategories([categoryId]);
        setFormData((prev) => ({
            ...prev,
            category: [categoryName],
        }));
        setSearchTermCategories(categoryName); // tampilkan namanya di input
        setShowDropdown(false);
    };



    // Hapus kategori
    const handleRemoveCategory = (categoryId) => {
        const categoryName = categoryMap[categoryId];

        const newSelected = selectedCategories.filter((id) => id !== categoryId);
        const newCategoryNames = formData.category.filter((name) => name !== categoryName);

        setSelectedCategories(newSelected);
        setFormData((prev) => ({
            ...prev,
            category: newCategoryNames,
        }));
    };

    useEffect(() => {
        if (image) {
            handleFileUpload(image);
        }
    }, [image]);

    const handleFileUpload = async (image) => {
        const storage = getStorage(app);
        const fileName = new Date().getTime() + image.name;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, image);
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress =
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setImagePercent(Math.round(progress));
            },
            (error) => {
                setImageError(true);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
                    setFormData({ ...formData, imageURL: downloadURL })
                );
            }
        );
    };

    const visibleCategories = searchTermCategories
        ? searchResultsCategories
        : categories.filter(cat => !selectedCategories.includes(cat._id));

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log(formData)

        // const data = new FormData();
        const formDataToSubmit = {
            name: formData.name,
            price: Number(formData.price),
            description: formData.description,
            category: selectedCategories.map(id => categoryMap[id]), // Get names instead of IDs
            imageURL: formData.imageURL || "https://placehold.co/1920x1080/png",
            toppings: [],
            addons: [],
            rawMaterials: []
            // toppings: formData.toppings.map((topping) => ({
            //   name: topping.name,
            //   price: Number(topping.price),
            //   rawMaterials: topping.rawMaterials.map((materialId) => ({
            //     materialId,
            //     quantityRequired: 0.1
            //   }))
            // })) || '',
            // addons: formData.addons.map((addon) => ({
            //   name: addon.name,
            //   options: addon.options.map((option) => ({
            //     label: option.label,
            //     price: Number(option.price),
            //     isdefault: option.default  // Changed from 'default' to 'isdefault' to match target format
            //   })),
            //   rawMaterials: addon.rawMaterials.map((materialId) => ({
            //     materialId,
            //     quantityRequired: 0.2
            //   }))
            // })) || '',
            // rawMaterials: selectedRawMaterials.map((materialId) => ({
            //   materialId,
            //   quantityRequired: 0.2
            // })) || '',
        };

        try {
            const response = await axios.post("/api/menu/menu-items", formDataToSubmit);
            navigate("/admin/menu");
        } catch (error) {
            console.error("Error creating menu item:", error);
        }
    };


    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    return (
        <div className="">
            <div className="flex justify-end px-6 items-center py-5 space-x-2 border-b">
                <FaBell className="text-2xl text-gray-400" />
                <Link
                    to="/admin/menu"
                    className="text-gray-400 inline-block text-2xl"
                >
                    <FaUser />
                </Link>

            </div>
            <form onSubmit={handleSubmit} className="mb-[60px]">
                <div className="px-6 py-2 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaShoppingBag className="text-gray-400 inline-block" />
                        <Link
                            to="/admin/menu"
                            className="text-gray-400 inline-block"
                        >
                            Menu
                        </Link>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Opsi Tambahan
                        </span>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <sapn
                            className="text-gray-400 inline-block"
                        >
                            Tambah Opsi Tambahan
                        </sapn>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/modifier"
                            className="block border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="block bg-[#005429] text-white text-sm px-3 py-1.5 rounded"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-md text-center space-y-4">
                            <p className="text-lg font-semibold">Yakin ingin membatalkan?</p>
                            <div className="flex justify-center gap-4">
                                <Link
                                    to="/admin/menu"
                                    className="px-4 py-2 bg-red-500 text-white rounded"
                                >
                                    Ya, Batalkan
                                </Link>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-300 rounded"
                                >
                                    Tidak
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="bg-slate-50 p-6 j">
                    <div className="flex p-12 space-x-4 bg-white shadow-md h-[500px]">
                        {/* grid 1 */}
                        <div className="w-3/4">

                            {/* Name */}
                            <div className="mb-4">
                                <strong className=" block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5 text-[14px]">Nama Grup Opsi Tambahan</strong>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full py-2 px-3 border rounded-lg"
                                />
                            </div>

                            <div className="flex space-x-4">
                                <div className="w-3/4">
                                    <div>
                                        <strong className="my-2.5 block text-[#999999] text-[14px]">Tambah Opsi Tambahan</strong>
                                        <input
                                            type="text"
                                            name="opsi"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className="w-full py-2 px-3 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="w-1/4">
                                    {/* Price */}
                                    <div>
                                        <strong className="my-2.5 block text-[#999999] text-[14px]">Harga</strong>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="w-full py-2 px-3 border rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button className="text-[#005249] mb-4">+ Tambah Opsi Lain</button>
                            <div className="flex justify-between items-center">
                                <span className="flex-row">
                                    <strong className="text-[#999999] text-[14px] my-2.5">Bahan Baku</strong>
                                    <p>Apakah opsi tambahan ini memiliki bahan baku?</p>
                                </span>
                                <div className="flex space-x-2">
                                    <span>Tidak</span>
                                    <input type="checkbox" value="" className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default CreateModifier;