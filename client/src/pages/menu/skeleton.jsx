const MenuSkeleton = () => {
    return (
        <div className="w-full animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="flex gap-3">
                    <div className="h-9 w-24 bg-gray-200 rounded"></div>
                    <div className="h-9 w-28 bg-gray-200 rounded"></div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-[15px]">
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-7 w-20 bg-gray-200 rounded"></div>
                    ))}
                </div>

                {/* Search + Filters */}
                <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center flex-1 max-w-sm border rounded-lg px-3 py-2 shadow-sm">
                        <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 w-32 bg-gray-200 rounded"></div>
                        <div className="h-9 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="w-full">
                <div className="overflow-auto border rounded-lg mx-[15px]">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="text-sm border-b">
                                <th className="p-3 w-10">
                                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                </th>
                                <th className="py-3 text-left"></th>
                                <th className="py-3 text-left"></th>
                                <th className="py-3 text-left"></th>
                                <th className="py-3 text-right"></th>
                                <th className="py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    {/* Checkbox */}
                                    <td className="p-3 text-center">
                                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    </td>
                                    {/* Image + Name */}
                                    <td className="py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                            <div className="flex flex-col gap-2">
                                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                                <div className="h-3 w-20 bg-gray-100 rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Category */}
                                    <td className="py-2">
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    </td>
                                    {/* Status */}
                                    <td className="py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-12 bg-gray-200 rounded"></div>
                                            <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
                                        </div>
                                    </td>
                                    {/* Price */}
                                    <td className="py-2 text-right">
                                        <div className="h-4 w-16 bg-gray-200 rounded ml-auto"></div>
                                    </td>
                                    {/* Actions */}
                                    <td className="py-2">
                                        <div className="flex justify-end gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-end mx-3 items-center mt-6 gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
                ))}
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
};

export default MenuSkeleton;
