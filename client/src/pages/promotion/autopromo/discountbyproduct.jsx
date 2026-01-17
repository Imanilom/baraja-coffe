// import { useState } from 'react';
// import { FaPlus, FaTimes } from 'react-icons/fa';

// const DiscountByProductForm = ({ products, formData, setFormData, errors, formatCurrency }) => {
//     const [selectedProduct, setSelectedProduct] = useState('');
//     const [discountValue, setDiscountValue] = useState(formData.discount || '');

//     const customSelectStyles = {
//         control: 'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white',
//     };

//     const handleAddProduct = () => {
//         if (!selectedProduct) {
//             alert('Mohon pilih produk!');
//             return;
//         }

//         const currentProducts = formData.conditions?.products || [];

//         // Check if product already exists
//         if (currentProducts.includes(selectedProduct)) {
//             alert('Produk sudah ditambahkan!');
//             return;
//         }

//         setFormData(prev => ({
//             ...prev,
//             conditions: {
//                 ...prev.conditions,
//                 products: [...currentProducts, selectedProduct]
//             }
//         }));

//         // Reset product selection
//         setSelectedProduct('');
//     };

//     const handleRemoveProduct = (productId) => {
//         const currentProducts = formData.conditions?.products || [];
//         const filtered = currentProducts.filter(id => id !== productId);

//         setFormData(prev => ({
//             ...prev,
//             conditions: {
//                 ...prev.conditions,
//                 products: filtered
//             }
//         }));
//     };

//     const handleDiscountChange = (value) => {
//         setDiscountValue(value);

//         if (value && parseFloat(value) >= 0) {
//             setFormData(prev => ({
//                 ...prev,
//                 discount: parseFloat(value)
//             }));
//         } else {
//             setFormData(prev => ({
//                 ...prev,
//                 discount: 0
//             }));
//         }
//     };

//     const selectedProducts = formData.conditions?.products || [];
//     const currentDiscount = formData.discount || 0;

//     const getProductDetails = (productId) => {
//         return products.find(p => p.id === productId);
//     };

//     const calculateDiscountAmount = (price, percentage) => {
//         const priceNum = typeof price === 'string' ? parseFloat(price.replace(/[^0-9]/g, '')) : price;
//         return (priceNum * percentage) / 100;
//     };

//     return (
//         <div className="space-y-4">
//             {/* Add Product Section */}
//             <div className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50">
//                 <h4 className="text-base font-semibold text-gray-800 mb-4">
//                     Tambah Produk
//                 </h4>

//                 <div className="space-y-3">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Pilih Produk <span className="text-red-500">*</span>
//                         </label>
//                         <select
//                             value={selectedProduct}
//                             onChange={(e) => setSelectedProduct(e.target.value)}
//                             className={customSelectStyles.control}
//                         >
//                             <option value="">Pilih produk...</option>
//                             {products
//                                 .filter(p => !selectedProducts.includes(p.id))
//                                 .map(p => (
//                                     <option key={p.id} value={p.id}>
//                                         {p.name} - {formatCurrency ? formatCurrency(p.originalPrice) : p.originalPrice}
//                                     </option>
//                                 ))}
//                         </select>
//                     </div>

//                     <button
//                         type="button"
//                         onClick={handleAddProduct}
//                         disabled={!selectedProduct}
//                         className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
//                     >
//                         <FaPlus size={14} />
//                         Tambah Produk
//                     </button>
//                 </div>
//             </div>

//             {/* List of Added Products */}
//             <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Produk dengan Diskon <span className="text-red-500">*</span>
//                     {selectedProducts.length > 0 && (
//                         <span className="ml-2 text-xs text-gray-500">
//                             ({selectedProducts.length} produk)
//                         </span>
//                     )}
//                 </label>

//                 {selectedProducts.length === 0 ? (
//                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white">
//                         <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//                         </svg>
//                         <p className="text-sm font-medium text-gray-600">Belum ada produk ditambahkan</p>
//                         <p className="text-xs text-gray-500 mt-1">Tambahkan produk untuk memberikan diskon</p>
//                     </div>
//                 ) : (
//                     <div className="space-y-3">
//                         {selectedProducts.map((productId, index) => {
//                             const product = getProductDetails(productId);
//                             if (!product) return null;

//                             const discountAmount = currentDiscount > 0 ? calculateDiscountAmount(product.originalPrice, currentDiscount) : 0;

//                             return (
//                                 <div
//                                     key={productId}
//                                     className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
//                                 >
//                                     <div className="flex items-start justify-between">
//                                         <div className="flex-1">
//                                             <div className="flex items-center gap-2 mb-2">
//                                                 <span className="text-xs font-bold text-white bg-green-600 px-2.5 py-1 rounded-md">
//                                                     #{index + 1}
//                                                 </span>
//                                                 <h5 className="text-sm font-semibold text-gray-900">
//                                                     {product.name}
//                                                 </h5>
//                                             </div>

//                                             <div className="ml-0">
//                                                 <div className="flex items-center gap-2 text-xs">
//                                                     <span className="text-gray-600">Harga:</span>
//                                                     <span className="font-medium text-gray-800">
//                                                         {formatCurrency ? formatCurrency(product.originalPrice) : product.originalPrice}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         </div>

//                                         <button
//                                             type="button"
//                                             onClick={() => handleRemoveProduct(productId)}
//                                             className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                                             title="Hapus produk"
//                                         >
//                                             <FaTimes size={16} />
//                                         </button>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}

//                 {errors?.products && (
//                     <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
//                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                         {errors.products}
//                     </p>
//                 )}
//             </div>

//             {/* Discount Percentage Input */}
//             <div className="border-2 border-gray-200 rounded-lg p-5 bg-white">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Diskon Persentase untuk Semua Produk <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                     <input
//                         type="number"
//                         value={discountValue}
//                         onChange={(e) => handleDiscountChange(e.target.value)}
//                         placeholder="Masukkan persentase diskon"
//                         className="w-full pr-10 pl-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
//                         min="0"
//                         max="100"
//                         step="0.1"
//                     />
//                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm font-medium">
//                         %
//                     </span>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1.5">
//                     Diskon ini akan diterapkan untuk semua produk yang dipilih di atas
//                 </p>
//                 {errors?.discount && (
//                     <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
//                         <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                         {errors.discount}
//                     </p>
//                 )}
//             </div>

//             {/* Summary */}
//             {selectedProducts.length > 0 && currentDiscount > 0 && (
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                     <div className="flex items-start gap-3">
//                         <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                         </svg>
//                         <div className="flex-1">
//                             <p className="text-sm font-semibold text-blue-900 mb-1">Informasi Promo</p>
//                             <p className="text-xs text-blue-700 leading-relaxed">
//                                 Diskon sebesar <strong>{currentDiscount}%</strong> akan otomatis diterapkan pada <strong>{selectedProducts.length} produk</strong> yang dipilih saat customer melakukan pembelian.
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default DiscountByProductForm;

import { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const DiscountByProductForm = ({ products, formData, setFormData, errors, formatCurrency }) => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [discountValue, setDiscountValue] = useState(formData.discount || '');

    const customSelectStyles = {
        control: 'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white',
    };

    const handleAddProduct = () => {
        if (!selectedProduct) {
            alert('Mohon pilih produk!');
            return;
        }

        const currentProducts = formData.conditions?.products || [];

        // Check if product already exists
        if (currentProducts.includes(selectedProduct)) {
            alert('Produk sudah ditambahkan!');
            return;
        }

        setFormData(prev => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                products: [...currentProducts, selectedProduct]
            }
        }));

        // Reset product selection
        setSelectedProduct('');
    };

    const handleRemoveProduct = (productId) => {
        const currentProducts = formData.conditions?.products || [];
        const filtered = currentProducts.filter(id => id !== productId);

        setFormData(prev => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                products: filtered
            }
        }));
    };

    const handleDiscountChange = (value) => {
        setDiscountValue(value);

        if (value && parseFloat(value) >= 0) {
            setFormData(prev => ({
                ...prev,
                discount: parseFloat(value)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                discount: 0
            }));
        }
    };

    const selectedProducts = formData.conditions?.products || [];
    const currentDiscount = formData.discount || 0;

    const getProductDetails = (productId) => {
        // Support both id and _id field
        return products.find(p => p.id === productId || p._id === productId);
    };

    const getProductId = (product) => {
        // Support both id and _id field
        return product.id || product._id;
    };

    const calculateDiscountAmount = (price, percentage) => {
        const priceNum = typeof price === 'string' ? parseFloat(price.replace(/[^0-9]/g, '')) : price;
        return (priceNum * percentage) / 100;
    };

    return (
        <div className="space-y-4">
            {/* Add Product Section */}
            <div className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50">
                <h4 className="text-base font-semibold text-gray-800 mb-4">
                    Tambah Produk
                </h4>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Produk <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className={customSelectStyles.control}
                        >
                            <option value="">Pilih produk...</option>
                            {products
                                .filter(p => !selectedProducts.includes(getProductId(p)))
                                .map(p => (
                                    <option key={getProductId(p)} value={getProductId(p)}>
                                        {p.name} - {formatCurrency ? formatCurrency(p.originalPrice) : p.originalPrice}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={!selectedProduct}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <FaPlus size={14} />
                        Tambah Produk
                    </button>
                </div>
            </div>

            {/* List of Added Products */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produk dengan Diskon <span className="text-red-500">*</span>
                    {selectedProducts.length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                            ({selectedProducts.length} produk)
                        </span>
                    )}
                </label>

                {selectedProducts.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm font-medium text-gray-600">Belum ada produk ditambahkan</p>
                        <p className="text-xs text-gray-500 mt-1">Tambahkan produk untuk memberikan diskon</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedProducts.map((productId, index) => {
                            const product = getProductDetails(productId);
                            if (!product) return null;

                            const discountAmount = currentDiscount > 0 ? calculateDiscountAmount(product.originalPrice, currentDiscount) : 0;

                            return (
                                <div
                                    key={productId}
                                    className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-white bg-green-600 px-2.5 py-1 rounded-md">
                                                    #{index + 1}
                                                </span>
                                                <h5 className="text-sm font-semibold text-gray-900">
                                                    {product.name}
                                                </h5>
                                            </div>

                                            <div className="ml-0">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-gray-600">Harga:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {formatCurrency ? formatCurrency(product.originalPrice) : product.originalPrice}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProduct(productId)}
                                            className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus produk"
                                        >
                                            <FaTimes size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {errors?.products && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.products}
                    </p>
                )}
            </div>

            {/* Discount Percentage Input */}
            <div className="border-2 border-gray-200 rounded-lg p-5 bg-white">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diskon Persentase untuk Semua Produk <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        placeholder="Masukkan persentase diskon"
                        className="w-full pr-10 pl-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                        min="0"
                        max="100"
                        step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm font-medium">
                        %
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                    Diskon ini akan diterapkan untuk semua produk yang dipilih di atas
                </p>
                {errors?.discount && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.discount}
                    </p>
                )}
            </div>

            {/* Summary */}
            {selectedProducts.length > 0 && currentDiscount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Informasi Promo</p>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Diskon sebesar <strong>{currentDiscount}%</strong> akan otomatis diterapkan pada <strong>{selectedProducts.length} produk</strong> yang dipilih saat customer melakukan pembelian.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscountByProductForm;