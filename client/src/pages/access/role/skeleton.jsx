import React from "react";

const RoleTableSkeleton = ({ rows = 10 }) => {
    return (
        <>
            <div className="animate-pulse px-6">
                {/* 🔹 Filter/Search Bar Skeleton */}
                <div className="flex flex-wrap justify-start items-center mb-4 gap-3">
                    <div className="h-10 w-28 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">#</th>
                                <th className="px-6 py-3 text-left">Role</th>
                                <th className="px-6 py-3 text-left">Deskripsi</th>
                                <th className="px-6 py-3 text-left">Tanggal Dibuat</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: rows }).map((_, idx) => (
                                <tr key={idx} className="border-b">
                                    <td className="px-4 py-3">
                                        <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-3">
                                            <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                                            <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default RoleTableSkeleton;
