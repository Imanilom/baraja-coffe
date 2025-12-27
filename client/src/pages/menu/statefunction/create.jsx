import { useState, useEffect, useMemo } from "react";
import axios from "axios";

const StateFunctionCreateMenu = () => {
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
    const [selectedRawMaterials, setSelectedRawMaterials] = useState([]);
    const [searchTermToppings, setSearchTermToppings] = useState('');
    const [searchTermAddons, setSearchTermAddons] = useState('');
    const [searchTermCategories, setSearchTermCategories] = useState('');
    const [searchTermRawMaterials, setSearchTermRawMaterials] = useState('');
    const [selectedToppingRawMaterials, setSelectedToppingRawMaterials] = useState([]);
    const [selectedAddonRawMaterials, setSelectedAddonRawMaterials] = useState([]);

    const [outlets, setOutlets] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get("/api/menu/categories");
                const fetchedCategories = response.data.data || [];
                setCategories(fetchedCategories);

                // Create a mapping of category IDs to names
                const map = {};
                fetchedCategories.forEach(category => {
                    map[category._id] = category.name;
                });
                setCategoryMap(map);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        const fetchOutlets = async () => {
            try {
                const response = await axios.get("/api/outlet/");
                setOutlets(response.data || []);
            } catch (error) {
                console.error("Error fetching outlets:", error);
            }
        };

        const fetchRawMaterial = async () => {
            try {
                const response = await axios.get("/api/storage/raw-material");
                setRawMaterials(response.data.data || []);
            } catch (error) {
                console.error("Error fetching raw materials:", error);
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

    // Fungsi pencarian fuzzy untuk kategori
    const searchCategories = (term) => {
        if (!term) return [];

        const lowercaseTerm = term.toLowerCase();
        return categories.filter(category =>
            category.name.toLowerCase().includes(lowercaseTerm) &&
            !selectedCategories.includes(category._id)
        );
    };

    // Hasil pencarian
    const searchResultsCategories = useMemo(() =>
        searchCategories(searchTermCategories),
        [searchTermCategories, selectedCategories]
    );

    // Handler untuk menambah kategori
    const handleAddCategory = (categoryId) => {
        if (!selectedCategories.includes(categoryId)) {
            setSelectedCategories([...selectedCategories, categoryId]);
            setSearchTermCategories(''); // Reset pencarian setelah memilih
        }
    };

    // Handler untuk menghapus kategori
    const handleRemoveCategory = (categoryId) => {
        setSelectedCategories(
            selectedCategories.filter(id => id !== categoryId)
        );
    };

    // Fungsi pencarian fuzzy untuk bahan baku
    const searchRawMaterials = (term) => {
        if (!term) return [];

        const lowercaseTerm = term.toLowerCase();
        return rawMaterials.filter(material =>
            material.name.toLowerCase().includes(lowercaseTerm) &&
            !selectedRawMaterials.includes(material._id)
        );
    };

    const searchResultsRawMaterials = useMemo(() =>
        searchRawMaterials(searchTermRawMaterials),
        [searchTermRawMaterials, selectedRawMaterials]
    );

    // Handler untuk menambah bahan baku
    const handleAddRawMaterial = (materialId) => {
        if (!selectedRawMaterials.includes(materialId)) {
            setSelectedRawMaterials([...selectedRawMaterials, materialId]);
            setSearchTermRawMaterials(''); // Reset pencarian setelah memilih
        }
    };

    // Handler untuk menghapus bahan baku
    const handleRemoveRawMaterial = (materialId) => {
        setSelectedRawMaterials(
            selectedRawMaterials.filter(id => id !== materialId)
        );
    };

    // Fungsi pencarian fuzzy untuk raw materials topping
    const searchToppingRawMaterials = (term) => {
        if (!term) return [];

        const lowercaseTerm = term.toLowerCase();
        return rawMaterials.filter(material =>
            material.name.toLowerCase().includes(lowercaseTerm) &&
            !selectedToppingRawMaterials.includes(material._id)
        );
    };

    // Fungsi pencarian fuzzy untuk raw materials addon
    const searchAddonRawMaterials = (term) => {
        if (!term) return [];

        const lowercaseTerm = term.toLowerCase();
        return rawMaterials.filter(material =>
            material.name.toLowerCase().includes(lowercaseTerm) &&
            !selectedAddonRawMaterials.includes(material._id)
        );
    };

    // Hasil pencarian untuk topping raw materials
    const searchResultsToppingRawMaterials = useMemo(() =>
        searchToppingRawMaterials(searchTermToppings),
        [searchTermToppings, selectedToppingRawMaterials]
    );

    // Hasil pencarian untuk addon raw materials
    const searchResultsAddonRawMaterials = useMemo(() =>
        searchAddonRawMaterials(searchTermAddons),
        [searchTermAddons, selectedAddonRawMaterials]
    );

    // Handler untuk menambah raw material ke topping
    const handleAddToppingRawMaterial = (materialId) => {
        if (!selectedToppingRawMaterials.includes(materialId)) {
            setSelectedToppingRawMaterials([...selectedToppingRawMaterials, materialId]);
            setSearchTermToppings(''); // Reset pencarian setelah memilih
        }
    };

    // Handler untuk menghapus raw material dari topping
    const handleRemoveToppingRawMaterial = (materialId) => {
        setSelectedToppingRawMaterials(
            selectedToppingRawMaterials.filter(id => id !== materialId)
        );
    };

    // Handler untuk menambah raw material ke addon
    const handleAddAddonRawMaterial = (materialId) => {
        if (!selectedAddonRawMaterials.includes(materialId)) {
            setSelectedAddonRawMaterials([...selectedAddonRawMaterials, materialId]);
            setSearchTermAddons(''); // Reset pencarian setelah memilih
        }
    };

    // Handler untuk menghapus raw material dari addon
    const handleRemoveAddonRawMaterial = (materialId) => {
        setSelectedAddonRawMaterials(
            selectedAddonRawMaterials.filter(id => id !== materialId)
        );
    };


    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Mempertahankan aspek rasio tetapi mengurangi ukuran jika perlu
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);

                    // Mengatur kualitas kompresi (0.7 berarti 70% kualitas)
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', 0.7); // Mengatur format ke JPEG dan kualitas 0.7
                };
            };
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Cek ukuran file (dalam bytes, 1MB = 1048576 bytes)
        if (file.size > 1048576) {
            // File lebih besar dari 1MB, kompresi diperlukan
            const compressedFile = await compressImage(file);
            const base64String = await convertToBase64(compressedFile);
            setFormData((prevData) => ({
                ...prevData,
                imageURL: base64String,
            }));
            const imageUrl = URL.createObjectURL(compressedFile);
            setImagePreview(imageUrl);
        } else {
            // File sudah di bawah 1MB
            const base64String = await convertToBase64(file);
            setFormData((prevData) => ({
                ...prevData,
                imageURL: base64String,
            }));
            const imageUrl = URL.createObjectURL(file);
            setImagePreview(imageUrl);
        }
    };

    // Helper function to convert file to base64
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };



    const handleToppingInputChange = (index, field, value) => {
        setFormData((prevData) => {
            const updatedToppings = [...prevData.toppings];
            updatedToppings[index] = {
                ...updatedToppings[index],
                [field]: value,
            };
            return {
                ...prevData,
                toppings: updatedToppings,
            };
        });
    };

    const handleToppingRawMaterialChange = (toppingIndex, e) => {
        const { value, checked } = e.target;
        setFormData((prevData) => {
            const updatedToppings = [...prevData.toppings];

            // Initialize rawMaterials array if it doesn't exist
            if (!updatedToppings[toppingIndex].rawMaterials) {
                updatedToppings[toppingIndex].rawMaterials = [];
            }

            let updatedRawMaterials = [...updatedToppings[toppingIndex].rawMaterials];

            if (checked) {
                updatedRawMaterials.push(value);
            } else {
                updatedRawMaterials = updatedRawMaterials.filter(
                    (materialId) => materialId !== value
                );
            }

            updatedToppings[toppingIndex] = {
                ...updatedToppings[toppingIndex],
                rawMaterials: updatedRawMaterials,
            };

            return {
                ...prevData,
                toppings: updatedToppings,
            };
        });
    };

    const handleAddonInputChange = (index, field, value) => {
        setFormData((prevData) => {
            const updatedAddons = [...prevData.addons];
            updatedAddons[index] = {
                ...updatedAddons[index],
                [field]: value,
            };
            return {
                ...prevData,
                addons: updatedAddons,
            };
        });
    };

    const handleAddonOptionInputChange = (addonIndex, optionIndex, field, value) => {
        setFormData((prevData) => {
            const updatedAddons = [...prevData.addons];
            updatedAddons[addonIndex].options[optionIndex] = {
                ...updatedAddons[addonIndex].options[optionIndex],
                [field]: field === "price" ? value : value,
            };
            return {
                ...prevData,
                addons: updatedAddons,
            };
        });
    };

    const handleAddonRawMaterialChange = (addonIndex, e) => {
        const { value, checked } = e.target;
        setFormData((prevData) => {
            const updatedAddons = [...prevData.addons];

            // Initialize rawMaterials array if it doesn't exist
            if (!updatedAddons[addonIndex].rawMaterials) {
                updatedAddons[addonIndex].rawMaterials = [];
            }

            let updatedRawMaterials = [...updatedAddons[addonIndex].rawMaterials];

            if (checked) {
                updatedRawMaterials.push(value);
            } else {
                updatedRawMaterials = updatedRawMaterials.filter(
                    (materialId) => materialId !== value
                );
            }

            updatedAddons[addonIndex] = {
                ...updatedAddons[addonIndex],
                rawMaterials: updatedRawMaterials,
            };

            return {
                ...prevData,
                addons: updatedAddons,
            };
        });
    };

    const handleAddTopping = () => {
        setFormData((prevData) => ({
            ...prevData,
            toppings: [...prevData.toppings, { name: "", price: "", rawMaterials: [] }],
        }));
    };

    const handleAddAddon = () => {
        setFormData((prevData) => ({
            ...prevData,
            addons: [
                ...prevData.addons,
                { name: "", options: [{ label: "", price: "", default: false }], rawMaterials: [] },
            ],
        }));
    };

    const handleRemoveTopping = (index) => {
        setFormData((prevData) => {
            const updatedToppings = prevData.toppings.filter((_, i) => i !== index);
            return {
                ...prevData,
                toppings: updatedToppings,
            };
        });
    };

    const handleRemoveAddon = (index) => {
        setFormData((prevData) => {
            const updatedAddons = prevData.addons.filter((_, i) => i !== index);
            return {
                ...prevData,
                addons: updatedAddons,
            };
        });
    };

    const handleRemoveAddonOption = (addonIndex, optionIndex) => {
        setFormData((prevData) => {
            const updatedAddons = [...prevData.addons];
            updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.filter(
                (_, i) => i !== optionIndex
            );
            return {
                ...prevData,
                addons: updatedAddons,
            };
        });
    };

    const handleAddOption = (addonIndex) => {
        setFormData((prevData) => {
            const updatedAddons = [...prevData.addons];
            updatedAddons[addonIndex].options.push({ label: "", price: "", default: false });
            return {
                ...prevData,
                addons: updatedAddons,
            };
        });
    };

    const handleDefaultOptionChange = (addonIndex, optionIndex) => {
        setFormData((prevData) => {
            const updatedAddons = [...prevData.addons];
            updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.map((option, index) => {
                if (index === optionIndex) {
                    return { ...option, default: true };
                }
                return { ...option, default: false };
            });
            return {
                ...prevData,
                addons: updatedAddons,
            };
        });
    };

    const handleAvailableAtChange = (e) => {
        setFormData((prevData) => ({
            ...prevData,
            availableAt: [e.target.value], // Simpan sebagai array dengan satu elemen
        }));
    };

    return {
        formData,
        setFormData,
        categories,
        categoryMap,
        rawMaterials,
        selectedCategories,
        selectedRawMaterials,
        searchTermCategories,
        searchTermRawMaterials,
        searchResultsRawMaterials,
        searchResultsCategories,
        outlets,
        imagePreview,
        searchTermToppings,
        searchTermAddons,
        setSearchTermCategories,
        setSearchTermRawMaterials,
        handleAddonInputChange,
        handleRemoveAddonOption,
        handleAvailableAtChange,
        handleAddonRawMaterialChange,
        handleAddonOptionInputChange,
        handleAddOption,
        handleRemoveCategory,
        handleAddRawMaterial,
        handleDefaultOptionChange,
        handleAddTopping,
        handleRemoveTopping,
        handleAddAddon,
        handleRemoveAddon,
        handleRemoveRawMaterial,
        handleImageChange,
        handleToppingRawMaterialChange,
        handleToppingInputChange,
        handleInputChange,
        handleAddCategory,
        setSearchTermToppings,
        setSearchTermAddons,
        selectedToppingRawMaterials,
        selectedAddonRawMaterials,
        searchResultsToppingRawMaterials,
        searchResultsAddonRawMaterials,
        handleAddToppingRawMaterial,
        handleRemoveToppingRawMaterial,
        handleAddAddonRawMaterial,
        handleRemoveAddonRawMaterial,

    };
};

export default StateFunctionCreateMenu;