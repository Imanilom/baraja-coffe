export default function UserTableSkeleton() {
    return (
        <div className="animate-pulse px-6">
            {/* 🔹 Filter/Search Bar Skeleton */}
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="h-10 w-64 bg-gray-200 rounded"></div>
                    <div className="h-10 w-40 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded"></div>
            </div>

            {/* 🔹 Table Skeleton */}
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-4 py-3"></th>
                            <th className="px-6 py-3 text-left font-semibold w-3/12">Name</th>
                            <th className="px-6 py-3 text-left font-semibold w-2/12">Status</th>
                            <th className="px-6 py-3 text-left font-semibold w-2/12">Role</th>
                            <th className="px-6 py-3 text-left font-semibold w-2/12">Email address</th>
                            <th className="px-6 py-3 text-left font-semibold w-2/12">Teams</th>
                            <th className="px-6 py-3 text-right font-semibold w-1/12">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(10)].map((_, i) => (
                            <tr key={i} className="border-b">
                                <td className="px-4 py-3">
                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                </td>
                                <td className="px-6 py-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div>
                                        <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-2 w-16 bg-gray-200 rounded"></div>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-3 w-28 bg-gray-200 rounded"></div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex gap-2">
                                        <div className="h-5 w-10 bg-gray-200 rounded"></div>
                                        <div className="h-5 w-10 bg-gray-200 rounded"></div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex gap-3 justify-end">
                                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 🔹 Pagination Skeleton */}
            <div className="flex justify-between items-center mt-4">
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}
