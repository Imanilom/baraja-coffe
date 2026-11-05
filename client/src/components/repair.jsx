import { Settings } from 'lucide-react';

export default function UnderDevelopment() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center">
                {/* Gear Icon */}
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-6 animate-spin" style={{ animationDuration: '3s' }} />

                {/* Main Content */}
                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    Sedang Dalam Pengembangan
                </h1>

                <p className="text-gray-600">
                    Halaman ini sedang dalam proses pengembangan.
                </p>
            </div>
        </div>
    );
}