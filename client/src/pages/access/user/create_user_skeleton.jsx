import React from "react";
import { FaChevronRight, FaIdBadge } from "react-icons/fa";

const CreateUserSkeleton = () => {
    return (
        <div className="text-gray-700">
            {/* Form Container */}
            <div className="max-w-5xl mx-auto mt-6 mb-12 bg-white shadow rounded-lg overflow-hidden animate-pulse">
                {/* Breadcrumb + Actions */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center text-sm text-gray-400 space-x-2">
                        <FaIdBadge />
                        <span>User</span>
                        <FaChevronRight />
                        <span className="text-gray-400 font-medium">
                            Tambah User
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <div className="h-9 w-20 bg-gray-200 rounded"></div>
                        <div className="h-9 w-20 bg-gray-200 rounded"></div>
                        <div className="h-9 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>

                {/* Tab Navigation Skeleton */}
                <div className="px-6 pt-4">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-1">
                            <div className="h-12 w-32 bg-gray-200 rounded-t"></div>
                            <div className="h-12 w-24 bg-gray-100 rounded-t"></div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Input fields skeleton */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                            {/* Username skeleton */}
                            <div>
                                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                <div className="h-10 w-full bg-gray-100 rounded"></div>
                            </div>

                            {/* Email skeleton */}
                            <div>
                                <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                                <div className="h-10 w-full bg-gray-100 rounded"></div>
                            </div>

                            {/* Phone skeleton */}
                            <div>
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                <div className="h-10 w-full bg-gray-100 rounded"></div>
                            </div>

                            {/* Role skeleton */}
                            <div>
                                <div className="h-4 w-12 bg-gray-200 rounded mb-2"></div>
                                <div className="h-10 w-full bg-gray-100 rounded"></div>
                            </div>

                            {/* Password skeleton */}
                            <div>
                                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                <div className="h-10 w-1/2 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                    </div>

                    {/* Outlet skeleton */}
                    <div>
                        <div className="h-5 w-16 bg-gray-200 rounded mb-3"></div>
                        <div className="h-10 w-full bg-gray-100 rounded mb-3"></div>
                        <div className="border rounded p-3 max-h-64 overflow-y-auto space-y-2 bg-gray-50">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div key={item} className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUserSkeleton;