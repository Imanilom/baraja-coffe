import { Link } from "react-router-dom";

const PromoPage = () => {
  return (
    <div className="container mx-auto p-4 h-screen overflow-y-auto">
      {/* Card Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Promo Khusus */}
        <Link
          to="/admin/promo-khusus"
          className="card h-[260px] text-gray-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <div className="row">
            <h2 className="text-lg font-bold pb-[15px]">Promo Khusus</h2>
            <p className="text-sm">Merupakan promo yang dapat dipilih oleh kasir yang memiliki hak akses "Memberi Diskon"</p>
            <p className="text-sm">Contoh : Diskon 10% untuk pelajar</p>
          </div>
        </Link>

        {/* Card 2: Promo Otomatis */}
        <Link
          to="/promo-otomatis"
          className="card h-[260px] text-gray-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <h2 className="text-lg font-bold mb-2">Promo Otomatis</h2>
          <p className="text-sm">Merupakan promo yang akan otomatis diimplementasikan ketika konsumen mencapai kriteria tertentu</p>
          <p className="text-sm">Contoh : Jika konsumen membeli A maka otamatis Gratis B</p>
        </Link>

        {/* Card 3: Voucher */}
        <Link
          to="/voucher"
          className="card h-[260px] text-gray-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <h2 className="text-lg font-bold mb-2">Voucher</h2>
          <p className="text-sm">Merupakan promo dalam bentuk kode voucher yang dapat dibagikan ke pelanggan untuk mendapatkan potongan pembelian</p>
          <p className="text-sm">Contoh : *BelanjaHematJuni* diskon Rp5000</p>
        </Link>

        {/* Card 4: Poin */}
        <Link
          to="/poin"
          className="card h-[260px] text-gray-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          <h2 className="text-lg font-bold mb-2">Poin</h2>
          <p className="text-sm">Merupakan sistem Loyalty berupa pemberian poin untuk "Member" pada setiap transaksi dan dapat ditukar dengan potongan pembelian ketika Member telah mempunyai poin yang cukup</p>
          <p className="text-sm">Contoh : 100 point = diskon Rp5000</p>
        </Link>
      </div>
    </div>
  );
};

export default PromoPage;