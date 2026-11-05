import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const PageLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <FaSpinner className="w-10 h-10 text-[#005429] animate-spin" />
                <p className="text-[#005429] font-medium text-sm animate-pulse">Loading...</p>
            </div>
        </div>
    );
};

export default PageLoader;
