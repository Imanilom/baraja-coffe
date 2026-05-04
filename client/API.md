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
Semua halaman admin diapit oleh `AdminLayout`. Jika Anda ingin mengubah tampilan Sidebar atau Header yang muncul di semua halaman admin, ubahlah file di folder `page## 5. Detail API & Endpoint Mapping (Comprehensive)

Berikut adalah daftar lengkap endpoint API yang digunakan di setiap modul aplikasi Backoffice Baraja Coffee. Seluruh request menggunakan base URL yang dikonfigurasi di `src/utils/api.js` (biasanya mengarah ke `/api` pada environment produksi).

### 🔐 5.1. Authentication & Session
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signin` | Login ke sistem dan mendapatkan token JWT. |
| `POST` | `/api/auth/signup` | Registrasi user baru (biasanya untuk admin). |

### 👥 5.2. User & Role Management (RBAC)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/user/staff` | List semua staf dan pengguna sistem. |
| `POST` | `/api/user/create` | Membuat pengguna (staf/admin) baru. |
| `PUT` | `/api/user/update/:id` | Memperbarui data profil pengguna. |
| `PUT` | `/api/user/:id` | Mengubah status aktif/non-aktif pengguna. |
| `DELETE` | `/api/user/delete/:id` | Menghapus data pengguna dari sistem. |
| `GET` | `/api/roles` | List semua role (superadmin, admin, kasir, dll). |
| `POST` | `/api/roles` | Membuat role akses baru. |
| `PUT` | `/api/roles/:id` | Memperbarui hak akses/permission pada role. |

### 🏠 5.3. Outlet & Warehouse
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/outlet` | List semua cabang/outlet yang terdaftar. |
| `POST` | `/api/outlet` | Menambahkan cabang/outlet baru. |
| `PUT` | `/api/outlet/:id` | Memperbarui informasi detail outlet. |
| `DELETE` | `/api/outlet/:id` | Menghapus data outlet. |
| `GET` | `/api/warehouses` | List semua gudang/warehouse. |

### 🍔 5.4. Menu & Product Management
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/menu/all-menu-items-backoffice` | Database lengkap produk untuk backoffice. |
| `GET` | `/menu-items` | Sinkronisasi data item menu. |
| `POST` | `/menu-items` | Membuat item menu/produk baru. |
| `PUT` | `/menu-items/:id` | Memperbarui detail produk & harga. |
| `DELETE` | `/menu-items/:id` | Menghapus produk dari daftar menu. |
| `GET` | `/api/category` | List kategori menu (Makanan, Minuman, dll). |
| `POST` | `/api/category/category-create` | Menambahkan kategori baru. |
| `PUT` | `/api/category/category-update/:id` | Memperbarui nama/ikon kategori. |
| `DELETE` | `/api/category/category-delete/:id` | Menghapus kategori. |
| `GET` | `/toppings` | List topping/addons yang tersedia. |
| `POST` | `/toppings` | Membuat topping/addons baru. |
| `PUT` | `/toppings/:id` | Memperbarui detail topping. |

### 🪑 5.5. Table & Area Management (Floor Plan)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/areas` | List area (Indoor, Outdoor, VIP, dll). |
| `POST` | `/api/areas` | Membuat area meja baru. |
| `PUT` | `/api/areas/:id` | Memperbarui nama atau outlet area. |
| `DELETE` | `/api/areas/:id` | Menghapus area beserta layoutnya. |
| `GET` | `/api/areas/tables/:id` | Detail meja dan posisinya di area tertentu. |
| `POST` | `/api/areas/tables` | Menambahkan meja ke dalam area. |
| `PUT` | `/api/areas/tables/:id` | Memperbarui informasi/status meja. |
| `PUT` | `/api/areas/tables/bulk-update` | Update posisi (X, Y) meja secara massal. |
| `DELETE` | `/api/areas/tables/:id` | Menghapus meja dari layout. |

### 💰 5.6. Tax, Service & Target Sales
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/tax-service` | Pengaturan pajak (Tax) dan biaya layanan (Service). |
| `POST` | `/api/tax-service` | Membuat aturan pajak baru per outlet. |
| `PUT` | `/api/tax-service/:id` | Memperbarui persentase pajak/layanan. |
| `DELETE` | `/api/tax-service/:id` | Menghapus aturan pajak. |

### 🎁 5.7. Promotion, Voucher & Loyalty
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/vouchers` | List kode voucher yang tersedia. |
| `POST` | `/api/vouchers` | Membuat voucher baru (Diskon/Potongan). |
| `PUT` | `/api/vouchers/:id` | Memperbarui masa aktif atau jumlah voucher. |
| `DELETE` | `/api/vouchers/:id` | Menghapus voucher. |
| `GET` | `/api/promotion/promos` | List kampanye promosi aktif. |
| `GET` | `/api/promotion/autopromos` | Pengaturan promo otomatis sistem. |
| `GET` | `/api/promotion/loyalty-levels` | Manajemen level membership dan poin. |

### 👥 5.8. Customer Management
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/user/staff` (role: customer) | Mengambil database pelanggan. |
| `PUT` | `/api/user/:id` | Mengubah status member atau detail pelanggan. |

### 📦 5.9. Storage, Inventory & Raw Materials
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/storage/raw-material` | List bahan baku dan stok saat ini. |
| `POST` | `/api/storage/raw-material-create` | Menambahkan bahan baku baru. |
| `PUT` | `/api/storage/raw-material-update/:id` | Update data bahan baku. |
| `DELETE` | `/api/storage/raw-material-delete/:id` | Hapus bahan baku. |
| `GET` | `/api/storage/stock-opname` | List riwayat stock opname. |
| `POST` | `/api/storage/stock-opname` | Input hasil pencocokan stok fisik. |

### 👔 5.10. Human Resources (HR), Salary & Attendance
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/hr/employees` | Database karyawan lengkap. |
| `POST` | `/api/hr/employees` | Pendaftaran karyawan baru. |
| `PUT` | `/api/hr/employees/:id` | Update biodata dan kontrak kerja. |
| `PATCH` | `/api/hr/employees/:id/deactivate` | Menonaktifkan status karyawan. |
| `GET` | `/api/hr/companies` | List perusahaan/badan hukum di bawah grup. |
| `GET` | `/api/hr/salaries/summary` | Ringkasan pengeluaran gaji karyawan. |
| `POST` | `/api/hr/salaries/calculate-all` | Menghitung gaji massal untuk periode tertentu. |
| `PATCH` | `/api/hr/salaries/:id/approve` | Menyetujui slip gaji (Approval). |
| `GET` | `/api/attendance/fingerprint/activities` | Monitor aktivitas absensi fingerprint real-time. |
| `POST` | `/api/hr/fingerprints/bulk-sync` | Sinkronisasi data user antara mesin & server. |

### 🛒 5.11. Purchase & Marketlist
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/marketlist/supplier` | List supplier/pemasok bahan baku. |
| `POST` | `/api/marketlist/supplier` | Menambahkan supplier baru ke sistem. |
| `GET` | `/api/marketlist/requests` | List pengajuan belanja (Shopping List). |

### 📊 5.12. Sales & Profit Reports
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/report/orders` | Mengambil data transaksi (mendukung filter tanggal/outlet). |
| `GET` | `/api/report/sales-report/summary` | Ringkasan total penjualan kotor/bersih. |
| `GET` | `/api/report/sales-report/transaction-type` | Penjualan berdasarkan tipe (Dine-in, Takeaway). |
| `GET` | `/api/report/sales-report/transaction-outlet` | Penjualan per cabang/outlet. |
| `GET` | `/api/report/sales-report/transaction-category` | Penjualan per kategori produk. |
| `GET` | `/api/report/sales-report/transaction-customer` | Penjualan berdasarkan data pelanggan. |
| `GET` | `/api/report/daily-profit` | Laporan laba kotor harian. |
| `GET` | `/api/report/hourly-profit/range` | Laporan tren penjualan per jam. |
| `DELETE` | `/api/report/sales-report/bulk` | Penghapusan data transaksi secara massal. |

### 📝 5.13. Operational & Activity Logs
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/logs` | Log aktivitas user (Audit Trail) untuk keamanan data. |

---

## 6. Pola Pemanggilan API (Coding Pattern)

Untuk memudahkan pengembangan, berikut adalah pola standar cara halaman mengambil data menggunakan Axios:

1.  **Helper Axios**: Selalu gunakan `@/lib/axios` untuk memastikan token JWT dan header dikirim secara otomatis.
2.  **Loading State**: Gunakan state `loading` untuk kontrol UI (skeleton/spinner).
3.  **Error Handling**: Gunakan `try-catch` dan tampilkan pesan error yang user-friendly dari `err.response.data.message`.

```javascript
// Contoh Pattern Standar di dalam File Halaman
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

const fetchData = async () => {
    try {
        setLoading(true);
        const response = await axios.get('/api/endpoint-target', {
            params: { startDate: '2024-01-01' }
        });
        setData(response.data.data || response.data);
    } catch (err) {
        console.error("Fetch Error:", err);
    } finally {
        setLoading(false);
    }
};
```

---

## 7. Tips Onboarding Programmer Baru
- **Cek `src/utils/api.js`**: Jika ingin menambah servis global.
- **Paginasi**: Gunakan komponen `<Paginated />` dari `src/components/` untuk tabel data besar.
- **Pajak & Service**: Perhatikan hitungan total di setiap laporan, pastikan sudah memproses `tax` dan `service` yang didapat dari API Tax-Service.
- **Responsive**: Gunakan grid Tailwind (`grid-cols-1 md:grid-cols-3`) agar dashboard fleksibel di berbagai layar.

---

# React + Vite Setup
Aplikasi ini dioptimalkan dengan Vite untuk pengembangan cepat (HMR). Dokumentasi setup asli dapat dilihat pada file README asli.
) uses [SWC](https://swc.rs/) for Fast Refresh

