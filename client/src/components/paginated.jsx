import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Paginated = ({ currentPage, setCurrentPage, totalPages }) => {

    const renderPageNumbers = () => {
        let pages = [];
        const maxVisiblePages = 5; // maksimal halaman yang ditampilkan

        if (totalPages <= maxVisiblePages) {
            // jika total halaman <= 5, tampilkan semua
            for (let i = 1; i <= totalPages; i++) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 border border-green-900 rounded ${currentPage === i
                            ? "bg-green-900 text-white border-green-900"
                            : "text-green-900 hover:bg-green-900 hover:text-white"
                            }`}
                    >
                        {i}
                    </button>
                );
            }
        } else {
            // logika untuk pagination yang panjang
            let startPage = Math.max(currentPage - 2, 1);
            let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

            // adjust startPage jika endPage sudah mentok
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(endPage - maxVisiblePages + 1, 1);
            }

            // tombol halaman pertama + dots
            if (startPage > 1) {
                pages.push(
                    <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white"
                    >
                        1
                    </button>
                );

                if (startPage > 2) {
                    pages.push(
                        <span key="start-dots" className="px-2 text-green-900">
                            ...
                        </span>
                    );
                }
            }

            // halaman tengah
            for (let i = startPage; i <= endPage; i++) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 border border-green-900 rounded ${currentPage === i
                            ? "bg-green-900 text-white border-green-900"
                            : "text-green-900 hover:bg-green-900 hover:text-white"
                            }`}
                    >
                        {i}
                    </button>
                );
            }

            // dots + tombol halaman terakhir
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push(
                        <span key="end-dots" className="px-2 text-green-900">
                            ...
                        </span>
                    );
                }

                pages.push(
                    <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white"
                    >
                        {totalPages}
                    </button>
                );
            }
        }

        return pages;
    };

    return (
        <>
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm text-white">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 disabled:opacity-50"
                    >
                        <FaChevronLeft /> Sebelumnya
                    </button>

                    <div className="flex gap-1 items-center max-w-md overflow-hidden">
                        {renderPageNumbers()}
                    </div>

                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 disabled:opacity-50"
                    >
                        Selanjutnya <FaChevronRight />
                    </button>
                </div>
            )}
        </>
    )
}

export default Paginated;