const EditCategorySkeleton = () => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="animate-pulse">
                {/* Header */}
                <div className="mb-6">
                    <div className="h-8 bg-gray-300 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    {/* Nama Kategori */}
                    <div className="mb-6">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-48 mt-2"></div>
                    </div>

                    {/* Deskripsi */}
                    <div className="mb-6">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-32 bg-gray-100 rounded-lg w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-56 mt-2"></div>
                    </div>

                    {/* Tipe Kategori */}
                    <div className="mb-8">
                        <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                        <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-64 mt-2"></div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                        <div className="h-11 bg-gray-200 rounded-lg w-24"></div>
                        <div className="h-11 bg-gray-300 rounded-lg w-44"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditCategorySkeleton;