import React from 'react';

export default function CustomerSalesSkeleton() {
    return (
        <div className="">
            {/* Breadcrumb Skeleton */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center">
                    <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="px-6">
                <div className="flex justify-between py-3 gap-2">
                    <div className="flex flex-col col-span-5 w-2/5">
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex flex-col col-span-5">
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3">
                                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse ml-auto"></div>
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse ml-auto"></div>
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse ml-auto"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(10)].map((_, index) => (
                                <tr key={index} className="border-t border-gray-100">
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse ml-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse ml-auto"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t">
                            <tr>
                                <td className="px-4 py-2">
                                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse ml-auto"></div>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse ml-auto"></div>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse ml-auto"></div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Skeleton */}
                <div className="flex justify-between items-center mt-4">
                    <div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>
                    <div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}