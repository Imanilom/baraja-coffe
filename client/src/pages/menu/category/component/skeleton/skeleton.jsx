const CategorySkeleton = () => {
    return (
        <div className="w-full px-6 animate-pulse">
            {/* // < !--Skeleton untuk Card Total Kategori-- > */}
            <div class="bg-green-800 rounded-lg p-6 mb-6 animate-pulse">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="h-4 bg-green-700 rounded w-24 mb-3"></div>
                        <div class="h-12 bg-green-700 rounded w-16"></div>
                    </div>
                    <div class="h-12 w-12 bg-green-700 rounded-full"></div>
                </div>
            </div>

            {/* // <!--Skeleton untuk Search Bar dan Button-- > */}
            <div class="flex justify-between items-center gap-4 mb-6 animate-pulse">
                <div class="flex-1 h-12 bg-gray-200 rounded-lg"></div>
                <div class="h-12 w-48 bg-gray-200 rounded-lg"></div>
            </div>

            {/* // <!--Skeleton untuk Table Header-- > */}
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50">
                    <div class="col-span-2 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div class="col-span-5 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div class="col-span-3 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div class="col-span-2 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* <!-- Skeleton untuk Table Rows --> */}
                <div class="divide-y">
                    {/* <!-- Repeat this block 8-10 times for multiple rows --> */}
                    <div class="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        {/* <!-- Waktu Submit --> */}
                        <div class="col-span-2">
                            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>

                        {/* <!-- Nama Kategori --> */}
                        <div class="col-span-5">
                            <div class="flex items-center gap-2">
                                <div class="h-8 w-8 bg-gray-200 rounded"></div>
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        </div>

                        {/* <!-- Jumlah Produk --> */}
                        <div class="col-span-3">
                            <div class="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>

                        {/* <!-- Aksi --> */}
                        <div class="col-span-2">
                            <div class="flex gap-2 justify-end">
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div class="col-span-2">
                            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div class="col-span-5">
                            <div class="flex items-center gap-2">
                                <div class="h-8 w-8 bg-gray-200 rounded"></div>
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-3">
                            <div class="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div class="col-span-2">
                            <div class="flex gap-2 justify-end">
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div class="col-span-2">
                            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div class="col-span-5">
                            <div class="flex items-center gap-2">
                                <div class="h-8 w-8 bg-gray-200 rounded"></div>
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-4/5"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-3">
                            <div class="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div class="col-span-2">
                            <div class="flex gap-2 justify-end">
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div class="col-span-2">
                            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div class="col-span-5">
                            <div class="flex items-center gap-2">
                                <div class="h-8 w-8 bg-gray-200 rounded"></div>
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-3">
                            <div class="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div class="col-span-2">
                            <div class="flex gap-2 justify-end">
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4 p-4 items-center animate-pulse">
                        <div class="col-span-2">
                            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div class="col-span-5">
                            <div class="flex items-center gap-2">
                                <div class="h-8 w-8 bg-gray-200 rounded"></div>
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/5"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-3">
                            <div class="h-8 bg-gray-200 rounded-full w-24"></div>
                        </div>
                        <div class="col-span-2">
                            <div class="flex gap-2 justify-end">
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                                <div class="h-10 w-10 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CategorySkeleton;