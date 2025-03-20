import { Link } from "react-router-dom";

const PromoPage = () => {
  return (
    <div className="container mx-auto p-4">
      {/* Card Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Promo Khusus */}
        <Link
          to="/promo-khusus"
          className="card bg-gray-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <h2 className="text-lg font-bold mb-2">Promo Khusus</h2>
          <p className="text-sm">Akses promo khusus yang tersedia hanya untuk Anda.</p>
        </Link>

        {/* Card 2: Promo Otomatis */}
        <Link
          to="/promo-otomatis"
          className="card bg-gray-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <h2 className="text-lg font-bold mb-2">Promo Otomatis</h2>
          <p className="text-sm">Dapatkan diskon otomatis saat berbelanja.</p>
        </Link>

        {/* Card 3: Voucher */}
        <Link
          to="/voucher"
          className="card bg-gray-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <h2 className="text-lg font-bold mb-2">Voucher</h2>
          <p className="text-sm">Klaim voucher eksklusif untuk pengguna baru.</p>
        </Link>

        {/* Card 4: Poin */}
        <Link
          to="/poin"
          className="card bg-gray-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <h2 className="text-lg font-bold mb-2">Poin</h2>
          <p className="text-sm">Tukarkan poin Anda dengan hadiah menarik.</p>
        </Link>
      </div>
    </div>
  );
};

export default PromoPage;