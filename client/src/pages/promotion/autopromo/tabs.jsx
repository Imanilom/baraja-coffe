export default function PromoTabs({ activeTab, handleTabChange, totalAktif, totalTidakAktif }) {
    const tabOptions = [
        { value: "aktif", label: "Aktif", count: totalAktif },
        { value: "tidak-berlaku", label: "Tidak Aktif", count: totalTidakAktif },
    ];

    return (
        <>
            <div className="flex flex-col col-span-1 w-3/4">
                <div className="flex gap-4 overflow-x-auto scrollbar-visible pb-2">
                    {tabOptions.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition flex items-center justify-between min-w-[120px]
                ${activeTab === tab.value
                                    ? "border-green-900 text-green-900 font-semibold"
                                    : "border-transparent text-gray-500 hover:text-green-900"
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className="ml-2 text-xs text-gray-400">({tab.count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* CSS langsung di file ini */}
            <style jsx>{`
        .scrollbar-visible::-webkit-scrollbar {
          height: 0; /* tinggi scrollbar horizontal */
        }
        .scrollbar-visible::-webkit-scrollbar-thumb {
          background: #9ca3af; /* gray-400 */
          border-radius: 9999px;
        }
        .scrollbar-visible::-webkit-scrollbar-track {
          background: #e5e7eb; /* gray-200 */
        }
      `}</style>
        </>
    );
}
