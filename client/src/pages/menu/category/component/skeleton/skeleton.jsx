const CategorySkeleton = () => {
    return (
        <div className="w-full px-6 animate-pulse">
            {/* // < !--Skeleton untuk Card Total Kategori-- > */}
            <div className="bg-green-800 rounded-lg p-6 mb-6 animate-pulse">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-4 bg-green-700 rounded w-24 mb-3"></div>
                        <div className="h-12 bg-green-700 rounded w-16"></div>
                    </div>
                    <div className="h-12 w-12 bg-green-700 rounded-full"></div>
                </div>
            </div>

            {/* // <!--Skeleton untuk Search Bar dan Button-- > */}
            <div className="flex justify-between items-center gap-4 mb-6 animate-pulse">
                <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
                <div className="h-12 w-48 bg-gray-200 rounded-lg"></div>
            </div>

            {/* // <!--Skeleton untuk Table Header-- > */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50">
                    <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="col-span-5 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="col-span-3 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* <!-- Skeleton untuk Table Rows --> */}
                <div className="divide-y">
                    {/* <!-- Repeat this block 8-10 times for multiple rows --> */}
                    <div className="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        {/* <!-- Waktu Submit --> */}
                        <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>

                        {/* <!-- Nama Kategori --> */}
                        <div className="col-span-5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        </div>

                        {/* <!-- Jumlah Produk --> */}
                        <div className="col-span-3">
                            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>

                        {/* <!-- Aksi --> */}
                        <div className="col-span-2">
                            <div className="flex gap-2 justify-end">
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="col-span-5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-3">
                            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div className="col-span-2">
                            <div className="flex gap-2 justify-end">
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="col-span-5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-3">
                            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div className="col-span-2">
                            <div className="flex gap-2 justify-end">
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="col-span-5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-3">
                            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div className="col-span-2">
                            <div className="flex gap-2 justify-end">
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="col-span-5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-3">
                            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div className="col-span-2">
                            <div className="flex gap-2 justify-end">
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CategorySkeleton;