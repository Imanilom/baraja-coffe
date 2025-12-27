export default function CategoryTabs({
    categoryOptions,
    selectedCategory,
    setSelectedCategory,
}) {
    // Fungsi untuk mengurutkan kategori
    const getSortedCategories = () => {
        // Pisahkan "Semua Kategori" dari kategori lainnya
        const allCategory = categoryOptions.find(
            option => option.value === '' || option.label.toLowerCase().includes('semua')
        );

        const otherCategories = categoryOptions.filter(
            option => option.value !== '' && !option.label.toLowerCase().includes('semua')
        );

        // Urutkan kategori lainnya berdasarkan label A-Z
        const sortedOthers = otherCategories.sort((a, b) =>
            a.label.localeCompare(b.label, 'id', { sensitivity: 'base' })
        );

        // Gabungkan: "Semua Kategori" di awal, kemudian yang lain
        return allCategory ? [allCategory, ...sortedOthers] : sortedOthers;
    };

    const sortedCategories = getSortedCategories();

    return (
        <>
            <div className="flex flex-col col-span-1 w-3/4">
                <div className="flex gap-4 overflow-x-auto scrollbar-visible pb-2">
                    {sortedCategories.map((option) => (
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
        </>
    );
}