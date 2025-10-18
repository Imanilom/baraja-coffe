export default function CategoryTabs({
    categoryOptions,
    selectedCategory,
    setSelectedCategory,
}) {
    return (
        <>
            <div className="flex flex-col col-span-1 w-3/4">
                <div className="flex gap-4 overflow-x-auto scrollbar-visible pb-2">
                    {categoryOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSelectedCategory(option.value)}
                            className={`px-3 py-1 text-sm whitespace-nowrap border-b-2 transition ${selectedCategory === option.value
                                ? "border-green-900 text-green-900 font-semibold"
                                : "border-transparent text-gray-900 hover:text-green-900"
                                }`}
                        >
                            {option.label}
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
