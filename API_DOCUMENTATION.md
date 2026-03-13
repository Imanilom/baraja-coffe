# API Documentation - Baraja App Integration

Dokumentasi ini berisi daftar lengkap endpoint backend yang digunakan oleh aplikasi `baraja_app` (Customer & GRO App).

## **1. Authentication & User (`auth_service.dart` & `user_service.dart`)**

### **Customer Authentication**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `POST` | `/api/auth/signup` | Register user baru dengan email & password. |
| `POST` | `/api/auth/signin` | Login user dengan email/username & password. |
| `POST` | `/api/auth/google` | Login menggunakan Google Sign-In (kirim `idToken`). |
| `POST` | `/api/auth/reset-password` | Request email untuk reset password. |
| `GET` | `/api/user/profile` | Mendapatkan profil user yang sedang login (Cek Token). |
| `PUT` | `/api/user/profile` | Update profil user (username, email, phone). |
| `PUT` | `/api/user/change-password` | Ganti password customer. |
| `GET` | `/api/user/auth-type` | Cek tipe login user (Google/Email). |

### **Notifications & FCM (`notification_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `POST` | `/api/fcm/save-fcm-token` | Menyimpan token FCM untuk notifikasi push. |
| `POST` | `/api/fcm/remove-fcm-token` | Menghapus token FCM saat logout. |
| `GET` | `/api/notifications/:userId` | Mendapatkan daftar notifikasi user. |
| `PATCH` | `/api/notifications/:notificationId/read` | Menandai notifikasi sebagai sudah dibaca. |
| `PATCH` | `/api/notifications/:userId/read-all` | Menandai semua notifikasi user sebagai sudah dibaca. |

---

## **2. Products & Content**

### **Menu & Content (`product_service.dart`, `promo_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `GET` | `/api/menu/menu-items` | Mendapatkan semua menu item (termasuk topping & addon). |
| `GET` | `/api/content` | Mendapatkan daftar promo/konten banner. |
| `GET` | `/api/app-config` | Mendapatkan konfigurasi aplikasi (diskon, dll). |

### **Favorites (`favorite_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `GET` | `/api/favorites/:userId` | Mendapatkan daftar menu favorit user. |
| `POST` | `/api/favorites/:userId/:menuItemId` | Menambahkan menu ke favorit. |
| `DELETE` | `/api/favorites/:userId/:menuItemId` | Menghapus menu dari favorit. |

### **Ratings (`rating_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `POST` | `/api/rating/create` | Membuat rating/review baru. |
| `GET` | `/api/rating/my-rating/:menuItemId/:id` | Cek rating user untuk item tertentu. |
| `PUT` | `/ratings/:ratingId` | Update rating yang sudah ada. |
| `GET` | `/ratings/menu/:menuItemId` | List rating per menu item. |
| `GET` | `/ratings/customer` | List rating oleh customer. |
| `DELETE` | `/ratings/:ratingId` | Menghapus rating. |

---

## **3. Orders & Payments**

### **Orders (`order_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `POST` | `/api/orderApp` | Membuat pesanan baru (Dine-in, Takeaway, Delivery, Reservasi). |
| `GET` | `/api/orders/history/:userId` | Mendapatkan riwayat pesanan user. |
| `GET` | `/api/order/:id` | Mendapatkan detail status pesanan tertentu (Tracking). |

### **Payments (`confirm_service.dart`, `payment_methode_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `POST` | `/api/charge` | Memproses pembayaran (Cash, Midtrans, Down Payment). |
| `POST` | `/api/final-payment` | Memproses pelunasan (Final Payment). |
| `GET` | `/api/final-payment-status/:orderId` | Cek status pelunasan order tertentu. |
| `GET` | `/api/paymentlist/payment-methods` | Mendapatkan daftar metode pembayaran yang tersedia. |

### **Vouchers (`voucher_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `GET` | `/api/vouchers/available` | Mendapatkan voucher yang tersedia (params: `isActive`, `validNow`, `userId`). |
| `POST` | `/api/vouchers/mark-used` | Menandai voucher telah digunakan. |
| `POST` | `/api/vouchers/validate` | Validasi voucher sebelum checkout. |

### **Taxes (`tax_service.dart`)**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `GET` | `/api/tax-service/` | Mendapatkan konfigurasi pajak (PPN, PB1) & service charge. |

---

## **4. Reservations & Tables (`reservation_service.dart`, `table_service.dart`)**

| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `GET` | `/api/areas` | Mendapatkan daftar area resto (Indoor, Outdoor, dll). |
| `GET` | `/api/areas/:areaId/tables` | Mendapatkan daftar meja di area tertentu. |
| `GET` | `/api/reservations/availability` | Cek ketersediaan meja pada tanggal/jam tertentu. |
| `POST` | `/api/reservations` | Membuat reservasi baru. |
| `GET` | `/api/areas/stats` | Statistik area (jumlah meja, kapasitas). |
| `GET` | `/api/tables/check/:tableNumber` | Cek ketersediaan satu meja spesifik. |
| `GET` | `/api/tables/available/:areaId` | List meja yang available di area tertentu. |

---

## **5. GRO (Guest Relation Officer) Features (`gro_service.dart`)**

| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `GET` | `/api/gro/dashboard-stats` | Statistik dashboard GRO. |
| `GET` | `/api/gro/reservations` | List semua reservasi (filter: status, date, area). |
| `GET` | `/api/gro/reservations/:id` | Detail reservasi. |
| `PUT` | `/api/gro/reservations/:id/edit` | Edit data reservasi. |
| `PUT` | `/api/gro/reservations/:id/confirm` | Konfirmasi reservasi. |
| `PUT` | `/api/gro/reservations/:id/check-in` | Check-in tamu reservasi. |
| `PUT` | `/api/gro/reservations/:id/check-out` | Check-out tamu reservasi. |
| `PUT` | `/api/gro/reservations/:id/complete` | Selesaikan reservasi. |
| `PUT` | `/api/gro/reservations/:id/cancel` | Batalkan reservasi. |
| `PUT` | `/api/gro/reservations/:id/transfer-table` | Pindah meja reservasi. |
| `GET` | `/api/gro/orders/:id` | Detail order (GRO view). |
| `PUT` | `/api/gro/orders/:id/dine-in/check-in` | Check-in order dine-in. |
| `PUT` | `/api/gro/orders/:id/dine-in/check-out` | Check-out order dine-in. |
| `PUT` | `/api/gro/orders/:id/complete` | Selesaikan order. |
| `PUT` | `/api/gro/orders/:id/cancel` | Batalkan order. |

---

## **6. Event & Ticketing (`event_service.dart`, `ticket_service.dart`)**

### **Events**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `GET` | `/api/event/` | Mendapatkan daftar event. |

### **Tickets**
| Method | Endpoint | Fungsi |
|:---:|:---|:---|
| `POST` | `/api/ticket/buy` | Membeli tiket event. |
| `GET` | `/api/ticket/user/:userId` | List tiket milik user. |
| `GET` | `/api/ticket/code/:ticketCode` | Detail tiket berdasarkan kode. |
| `POST` | `/api/ticket/validate/:ticketCode` | Validasi tiket (Check-in event). |
| `GET` | `/api/ticket/event/:eventId/availability` | Cek ketersediaan tiket event. |
| `GET` | `/api/ticket/event/:eventId` | List tiket per event (Organizer). |
| `GET` | `/api/payment/status/:paymentId` | Cek status pembayaran tiket. |
| `POST` | `/api/ticket/:ticketId/cancel` | Batalkan tiket. |
| `PATCH` | `/api/ticket/:ticketId/status` | Update status tiket manual. |

---

## **Catatan Penting**
- **Base URL**: Diambil dari `.env` (biasanya `http://domain.com` atau `http://ip:port`).
- **Authorization**: Sebagian besar endpoint (kecuali login/register/menu public) membutuhkan header `Authorization: Bearer <token>`.
- **Custom Headers**:
    - `ngrok-skip-browser-warning`: `true` (Digunakan saat development dengan ngrok).
