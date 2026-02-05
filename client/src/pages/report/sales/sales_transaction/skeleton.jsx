import React from "react";

const SalesTransactionTableSkeleton = () => {
    return (
        <>
            <div className="flex flex-wrap gap-4 md:justify-between items-center px-6 py-3">
                {/* Datepicker Skeleton */}
                <div className="flex flex-col md:w-1/5 w-full">
                    <div className="h-[38px] bg-gray-200 rounded animate-pulse"></div>
                </div>

                <div className="flex items-center flex-wrap gap-3">
                    {/* Search Skeleton */}
                    <div className="relative md:w-64 w-full">
                        <div className="h-[38px] bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    {/* Outlet Skeleton */}
                    <div className="relative md:w-64 w-full">
                        <div className="h-[38px] bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>

            <main className="flex-1 px-6">
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-900">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr className="text-left text-[13px]">
                                <th className="mx-4 my-3 font-semibold w-2/12 bg-gray-200"></th>
                                <th className="mx-4 my-3 font-semibold w-1/12 bg-gray-200"></th>
                                <th className="mx-4 my-3 font-semibold w-2/12 bg-gray-200"></th>
                                <th className="mx-4 my-3 font-semibold w-3/12 bg-gray-200"></th>
                                <th className="mx-4 my-3 font-semibold w-1/12 bg-gray-200"></th>
                                <th className="mx-4 my-3 font-semibold w-2/12 bg-gray-200 text-right"></th>
                            </tr>
                        </thead>

                        <tbody className="text-sm">
                            {[...Array(10)].map((_, index) => (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24 ml-auto"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2" colSpan="4"></td>
                                <td className="px-2 py-2 text-right rounded" colSpan="2">
                                    <div className="bg-gray-100 inline-block px-4 py-1 rounded-full">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Skeleton */}
                <div className="flex justify-between items-center mt-4 text-sm">
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </main>
        </>
    );
};

export default SalesTransactionTableSkeleton;