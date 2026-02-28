import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaGift, FaTicketAlt, FaStar, FaCrown } from "react-icons/fa";
import Header from "../admin/header";

const PromoPage = () => {
  const promoCards = [
    {
      title: "Promo Khusus",
      description: "Merupakan promo yang dapat dipilih oleh kasir yang memiliki hak akses \"Memberi Diskon\"",
      example: "Contoh : Diskon 10% untuk pelajar",
      icon: <FaGift className="w-8 h-8" />,
      link: "/admin/promo-khusus",
      color: "from-blue-500 to-blue-600",
      bgPattern: "bg-blue-50"
    },
    {
      title: "Promo Otomatis",
      description: "Merupakan promo yang akan otomatis diimplementasikan ketika konsumen mencapai kriteria tertentu",
      example: "Contoh : Jika konsumen membeli A maka otomatis Gratis B",
      icon: <FaTicketAlt className="w-8 h-8" />,
      link: "/admin/promo-otomatis",
      color: "from-purple-500 to-purple-600",
      bgPattern: "bg-purple-50"
    },
    {
      title: "Voucher",
      description: "Merupakan promo dalam bentuk kode voucher yang dapat dibagikan ke pelanggan untuk mendapatkan potongan pembelian",
      example: "Contoh : *BelanjaHematJuni* diskon Rp5000",
      icon: <FaTicketAlt className="w-8 h-8" />,
      link: "/admin/voucher",
      color: "from-green-500 to-green-600",
      bgPattern: "bg-green-50"
    },
    {
      title: "Loyalty Program",
      description: "Kelola program loyalitas pelanggan dengan sistem poin dan reward",
      example: "",
      icon: <FaStar className="w-8 h-8" />,
      link: "/admin/loyalty",
      color: "from-yellow-500 to-yellow-600",
      bgPattern: "bg-yellow-50"
    },
    {
      title: "Loyalty Member",
      description: "Merupakan sistem Loyalty berupa pemberian poin untuk \"Member\" pada setiap transaksi dan dapat ditukar dengan potongan pembelian ketika Member telah mempunyai poin yang cukup",
      example: "Contoh : 100 point = diskon Rp5000",
      icon: <FaCrown className="w-8 h-8" />,
      link: "/admin/loyalty-levels",
      color: "from-orange-500 to-orange-600",
      bgPattern: "bg-orange-50"
    }
  ];

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Manajemen Promo
        </h1>
        <p className="text-gray-600">
          Kelola berbagai jenis promosi dan program loyalitas untuk pelanggan Anda
        </p>
      </div>

      {/* Promo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promoCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300 transform hover:-translate-y-1"
          >
            {/* Card Header with Gradient */}
            <div className={`bg-gradient-to-r ${card.color} p-6 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-xl text-white">
                  {card.icon}
                </div>
                <h2 className="text-xl font-bold text-white">{card.title}</h2>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                {card.description}
              </p>

              {card.example && (
                <div className={`${card.bgPattern} rounded-lg p-3 border border-gray-200`}>
                  <p className="text-xs text-gray-600 font-medium">{card.example}</p>
                </div>
              )}

              {/* Hover Arrow */}
              <div className="mt-4 flex items-center text-sm font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                <span>Kelola</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PromoPage;