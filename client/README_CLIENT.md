# Dokumentasi Teknis Client - Baraja Coffee

Dokumentasi ini dibuat untuk membantu programmer baru memahami struktur, alur, dan logika kode pada folder `client` di project Baraja Coffee secara mendalam (folder demi folder).

---

## 1. Project Overview
Aplikasi client merupakan dashboard manajemen Point of Sale (POS) dan operasional cafe/restoran yang dibangun menggunakan **React** dan **Vite**. Aplikasi ini menangani segala sesuatu mulai dari manajemen menu, stok (inventory), laporan penjualan, hingga pengaturan akses karyawan.

## 2. Tech Stack
- **Framework**: React.js (Vite)
- **State Management**: Redux Toolkit & Redux Persist
- **Styling**: Tailwind CSS, Lucide Icons, React Icons
- **Routing**: React Router DOM (v6)
- **Data Fetching**: Axios
- **Utilities**: Date-fns, XLSX (Export), Recharts (Grafik)

---

## 3. Struktur Folder Utama (`/client/src`)

Berikut adalah penjelasan rinci untuk setiap folder di dalam `src/`:

### 📂 `src/components/`
Berisi komponen UI yang bersifat mandiri dan dapat digunakan kembali di berbagai halaman.
- `Modal.jsx`: Komponen dasar untuk jendela popup.
- `paginated.jsx`: Menangani logika paginasi (halaman 1, 2, 3...) untuk tabel data.
- `PrivateRoute.jsx`: Penjaga gerbang (Proteksi Route). Mengecek apakah user sudah login sebelum mengizinkan akses ke halaman admin.
- `download.jsx`: Komponen serbaguna untuk memicu proses unduhan.
- `iconSelect.jsx`: Komponen pemilihan ikon (biasanya digunakan di pengaturan menu/sidebar).
- `modal/`: Sub-folder berisi spesifik modal (misal: modal konfirmasi atau modal input khusus).

### 📂 `src/pages/`
Folder terbesar yang berisi logika bisnis dan tampilan halaman. Berikut adalah detail kegunaan folder-folder di dalamnya:

| Nama Folder | Penjelasan Fungsi |
| :--- | :--- |
| `access/` | Manajemen Hak Akses (User, Role, Department). |
| `activity_logs/` | Catatan aktivitas pengguna dalam sistem. |
| `admin/` | Komponen utama dashboard (Sidebar, Header, Layout Utama Admin). |
| `analytics/` | Halaman visualisasi data dan grafik performa bisnis. |
| `aset/` | Pengaturan aset fisik milik outlet/cafe. |
| `commission/` | Pengaturan komisi untuk karyawan/sales. |
| `content/` | Manajemen konten (artikel/banner/promosi visual). |
| `customer/` | Database pelanggan dan manajemen member. |
| `dashboard/` | Halaman ringkasan utama saat pertama kali masuk. |
| `device/` | Pengaturan perangkat (billing hardware/printer). |
| `employee/` | Data biodata dan administrasi karyawan. |
| `event/` | Manajemen acara khusus atau promo temporer. |
| `hr/` | Fungsi Human Resources (Absensi, Gaji, dll). |
| `inventory/` | Modul stok (In/Out, Opname, Transfer antar outlet). |
| `menu/` | Pengolahan produk, kategori, dan resep (ingredients). |
| `menuondevice/` | Pengaturan menu spesifik per perangkat terminal. |
| `outlet/` | Manajemen cabang/outlet dan informasi detailnya. |
| `promotion/` | Pengaturan diskon, promo otomatis, dan loyalty program. |
| `purchase/` | Alur pengadaan barang (Supplier, PO, Shopping List). |
| `recepit_design/` | Pengaturan tampilan cetak nota/struk belanja. |
| `report/` | Laporan Detail (Harian, Menu, Profit, Operasional). |
| `reservation/` | Sistem pemesanan tempat/meja oleh pelanggan. |
| `schedules/` | Pengaturan jadwal kerja/shift karyawan. |
| `stock_reconciliation/`| Proses pencocokan stok fisik dengan data sistem. |
| `storage/` | Pengaturan lokasi penyimpanan/gudang. |
| `table/` | Denah meja dan manajemen status meja (Table Plan). |
| `target_sales/` | Pengaturan target penjualan periodik. |
| `tax/` | Konfigurasi Pajak (Tax) dan Biaya Layanan (Service). |
| `voucher/` | Manajemen kode voucher belanja. |

- *Tips*: Jika Anda ingin mengubah tampilan halaman tertentu, carilah foldernya di tabel di atas.

### 📂 `src/redux/`
Tempat pengelolaan data global menggunakan Redux Toolkit.
- `store.js`: Pusat konfigurasi Redux yang menggabungkan semua slice/reducer.
- `user/`: Folder khusus untuk autentikasi.
  - `userSlice.js`: Menyimpan data user yang sedang login, token JWT, dan status loading/error saat login.

### 📂 `src/style/`
Menyimpan file CSS tambahan yang tidak bisa dicakup oleh Tailwind secara langsung.
- `Datepicker.css`: Styling khusus untuk library kalender/datepicker agar sesuai dengan desain Baraja Coffee.
- `Home.css`: CSS spesifik untuk halaman landing/home.

### 📂 `src/utils/`
Gudang fungsi bantuan (helper) yang mempercepat pengembangan:
- `api.js`: Konfigurasi dasar Axios (Base URL, Interceptors untuk menyisipkan Token JWT secara otomatis).
- **Export Helpers**: Kumpulan file `export...SalesExcel.js` yang menangani konversi data tabel menjadi file Excel (.xlsx).
- `pdfHelper.js`: Logika untuk membuat dokumen PDF (misal: nota atau laporan).
- `icons.js`: Daftar ikon yang tersedia untuk digunakan di seluruh aplikasi.
- `coordinateCity.jsx`: Helper untuk data geografis atau koordinat cabang.

---

## 4. Alur Kerja & Entry Points

### 🚀 `main.jsx`
Langkah pertama aplikasi berjalan. Di sini aplikasi dibungkus oleh:
- `Provider`: Mengaktifkan Redux.
- `PersistGate`: Mengaktifkan penyimpanan state di LocalStorage (agar tidak logout saat refresh).

### 🛣️ `App.jsx`
Pusat pengaturan navigasi. Membagi rute menjadi:
1. **Public**: Halaman Sign In / Sign Up.
2. **Private (Admin)**: Semua halaman di dalam `/admin/*` yang diproteksi Role.

### 🖼️ `AdminLayout` (`pages/admin/index.jsx`)
Semua halaman admin diapit oleh `AdminLayout`. Jika Anda ingin mengubah tampilan Sidebar atau Header yang muncul di semua halaman admin, ubahlah file di folder `pages/admin/`.

---

---

---

## 5. Detail File & Mapping Endpoint (Comprehensive)

Berikut adalah daftar lengkap file utama dan endpoint API yang digunakan di setiap modul:

### 🔐 Modul Akses & Pengguna (RBAC)
| Komponen | Endpoint Backend | Keterangan |
| :--- | :--- | :--- |
| **User Management** | `GET /api/user/staff` | List semua staf/user. |
| | `POST /api/user/create` | Registrasi user baru. |
| | `PUT /api/user/update/:id` | Update data user. |
| | `DELETE /api/user/delete/:id` | Hapus user. |
| **Role Management** | `GET /api/roles` | List semua role akses. |
| | `POST /api/roles` | Buat role baru. |
| | `PUT /api/roles/:id` | Update permission role. |
| **Menu Sidebar** | `GET /api/sidebar/admin/menus` | Pengaturan menu sidebar. |

### �️ Modul Promosi & Voucher
| Komponen | Endpoint Backend | Keterangan |
| :--- | :--- | :--- |
| **Voucher** | `GET /api/promotion/vouchers` | List voucher aktif. |
| | `POST /api/promotion/voucher-create` | Buat voucher baru. |
| **Promo List** | `GET /api/promotion/promos` | List promo khusus. |
| | `POST /api/promotion/promo-create` | Buat promo baru. |
| **Auto Promo** | `GET /api/promotion/autopromos` | Promo otomatis sistem. |
| **Loyalty** | `GET /api/promotion/loyalty-levels` | Level member & poin. |

### 🪑 Modul Meja & Area (Floor Plan)
| Komponen | Endpoint Backend | Keterangan |
| :--- | :--- | :--- |
| **Area** | `GET /api/areas` | List area (Indoor/Outdoor/dll). |
| | `POST /api/areas` | Buat area baru. |
| | `DELETE /api/areas/:id` | Hapus area. |
| **Meja** | `GET /api/areas/tables/:id` | Detail meja di area tertentu. |
| | `POST /api/areas/tables` | Tambah meja ke area. |
| | `PUT /api/areas/tables/bulk-update` | Update posisi meja massal. |

### 🍔 Modul Menu & Inventory
| Komponen | Endpoint Backend | Keterangan |
| :--- | :--- | :--- |
| **Produk** | `GET /api/menu/all-menu-items-backoffice` | Database produk. |
| | `POST /api/menu/menu-create` | Tambah produk baru. |
| | `PUT /api/menu/menu-update/:id` | Update produk. |
| | `DELETE /api/menu/menu-delete/:id` | Hapus produk. |
| **Kategori** | `GET /api/category` | List kategori menu. |
| | `POST /api/category/category-create` | Tambah kategori baru. |
| | `PUT /api/category/category-update/:id` | Update kategori. |
| | `DELETE /api/category/category-delete/:id` | Hapus kategori. |
| **Inventory** | `GET /api/storage/raw-material` | Stok bahan baku. |
| | `POST /api/storage/stock-opname` | Input hasil opname. |
| | `PUT /api/storage/stock-opname/:id` | Update stok opname. |
| | `DELETE /api/storage/stock-opname/:id` | Hapus stok opname. |
| **Raw Material** | `GET /api/storage/raw-material` | Stok bahan baku. |
| | `POST /api/storage/raw-material-create` | Tambah bahan baku baru. |
| | `PUT /api/storage/raw-material-update/:id` | Update bahan baku. |
| | `DELETE /api/storage/raw-material-delete/:id` | Hapus bahan baku. |

### 📊 Modul Laporan & Event
| Komponen | Endpoint Backend | Keterangan |
| :--- | :--- | :--- |
| **Transaksi** | `GET /api/report/orders` | Laporan transaksi penjualan. |
| | `DELETE /api/report/sales-report/bulk` | Hapus transaksi massal. |
| **Profit** | `GET /api/report/sales-summary` | Ringkasan omzet & profit. |
| | `GET /api/report/daily-profit` | Laporan profit harian. |
| **Pajak** | `GET /api/report/tax-revenue` | Laporan setoran pajak. |
| **Event** | `GET /api/event` | Manajemen event khusus. |
| | `POST /api/event` | Registrasi event baru. |

### 🏠 Modul Outlet & Pengaturan
| Komponen | Endpoint Backend | Keterangan |
| :--- | :--- | :--- |
| **Outlet** | `GET /api/outlet` | List semua cabang/outlet. |
| **Pajak & Servis** | `GET /api/tax` | Pengaturan persentase Tax & Service. |
| | `POST /api/tax` | Buat aturan pajak baru. |

---

## 6. Pola Pemanggilan API (Coding Pattern)

Untuk memudahkan Programmer Baru, berikut adalah pola standar cara halaman mengambil data:

1.  **Definisi Base URL**: Diatur di `utils/api.js` (biasanya mengarah ke `http://localhost:3000/api`).
2.  **Request Hook**: Menggunakan `useEffect` untuk memicu pengambilan data saat komponen di-*mount*.
3.  **Loading State**: Selalu gunakan state `loading` (true/false) untuk menampilkan Skeleton atau Spinner saat data sedang diproses.

```javascript
// Contoh Pattern Standar di dalam File Halaman
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const resp = await axios.get('/api/nama-endpoint');
      setData(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## 7. Tips untuk Programmer Baru (Onboarding)
- **Request API**: Selalu gunakan instance axios yang sudah dikonfigurasi di `utils/api.js`.
- **Menambahkan Halaman**: Buat folder di `pages/`, buat komponennya, lalu daftarkan path-nya di `App.jsx`.
- **Global State**: Gunakan `useSelector` untuk mengambil data user dan `useDispatch` untuk memicu aksi (seperti logout).
- **Responsive Design**: Gunakan prefix Tailwind seperti `lg:`, `md:`, dan `sm:` agar dashboard tampak bagus di tablet maupun desktop.
- **Export Data**: Jika ingin membuat fitur laporan baru, tiru pola yang ada di folder `utils/` (exportHelper).

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

