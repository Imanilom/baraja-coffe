# Dokumentasi API & Audit Sistem - Customer Display & Otorisasi Baraja Coffee

Dokumen ini berisi hasil audit teknis komprehensif serta dokumentasi lengkap API (REST API, Server-Sent Events / SSE, dan Otorisasi) untuk sistem **Customer Display & Manager Authorization** Baraja Coffee.

---

## 1. Arsitektur & Gambaran Umum Sistem

Sistem Customer Display Baraja Coffee terdiri dari dua komponen utama:
1. **Frontend App (Flutter - `mobile/display`)**: Aplikasi tampilan layar pelanggan yang berjalan di perangkat Android / Tablet / Web TV (seperti device `BAR BELAKANG`).
2. **Backend API (PHP Native - Server/XAMPP)**: Endpoint pengolah state transaksi, streaming real-time SSE, pengiriman struk email via SMTP, serta sistem approval otorisasi supervisor/manager.

### Ringkasan Alur Kerja Data (Data Flow):
```
┌────────────────────────┐      POST /api.php (State)     ┌───────────────────────┐
│ Aplikasi POS / Kasir   │ ─────────────────────────────> │ Backend Server (PHP)  │
└────────────────────────┘                                └───────────┬───────────┘
                                                                      │
                                   SSE Stream / Polling               │ Menulis File State
                                ┌─────────────────────────────────────┘ & Database SQLite
                                ▼
┌────────────────────────────────────────────────────────┐
│ Customer Display App (Flutter)                         │
│ - Menampilkan Pesanan, Ringkasan, QRIS                │
│ - Play Promo Video / Banner & Running Text             │
└────────────────────────────────────────────────────────┘
```

---

## 2. Pengaturan Konfigurasi & Authentikasi

| Parameter | Nilai / Format | Keterangan |
| :--- | :--- | :--- |
| **Base API URL** | `https://barajacoffee.com/display2/api.php` | Endpoint utama REST API |
| **Stream SSE URL** | `https://barajacoffee.com/display2/stream.php` | Endpoint real-time event stream |
| **Auth API URL** | `https://barajacoffee.com/display2/auth_api.php` | Endpoint sistem otorisasi manager |
| **Header Auth** | `X-Api-Key: baraja_display_secret_2026` | Diperlukan untuk metode POST / Perubahan data |
| **Header SSE** | `Accept: text/event-stream` | Diperlukan untuk langganan stream realtime |

---

## 3. Schema Data / Data Models

### A. `DisplayState` (State Tampilan Layar)
```json
{
  "device_id": "BAR BELAKANG",
  "items": [
    {
      "name": "Manual Brew Arabica Gayo",
      "qty": 1,
      "price": 65000.0,
      "note": "Less ice"
    }
  ],
  "discount_rate": 0.05,
  "status": 0,
  "order_number": "A-102",
  "customer_name": "Bpk. Ahmad",
  "table_name": "Meja 12",
  "payment_method": "QRIS BCA",
  "payment_amount": 104500.0,
  "change_amount": 0.0,
  "timestamp": 1722662800000
}
```
* **Status Enum**:
  * `0`: Ordering / Proses Pemesanan (Kasir sedang input item).
  * `1`: Payment / Proses Pembayaran (Menampilkan QR / rincian bayar).
  * `2`: Paid / Pembayaran Selesai (Menampilkan struk digital & animasi sukses).

### B. `CartItem` (Item Pesanan)
| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `name` | `String` | Nama produk / menu |
| `qty` | `Integer` | Jumlah item |
| `price` | `Double` | Harga satuan produk |
| `note` | `String?` | Catatan opsi (opsional, misal: *Less sugar*) |

---

## 4. Katalis & Dokumentasi Endpoint API

### 1. Display State & Real-Time Sync API (`api.php` & `stream.php`)

#### 1.1 Ambil Status Display Terbaru (GET State)
* **HTTP Method**: `GET`
* **URL**: `/api.php?device={deviceId}`
* **Headers**: `Content-Type: application/json`
* **Query Parameters**:
  * `device` *(optional)*: Nama ID perangkat display (Default: `BAR BELAKANG`).
* **Response `200 OK`**:
```json
{
  "device_id": "BAR BELAKANG",
  "items": [...],
  "discount_rate": 0.0,
  "status": 0,
  "order_number": "A-101",
  "customer_name": "Sdr. Rian",
  "table_name": "Meja 05",
  "payment_method": null,
  "payment_amount": null,
  "change_amount": null,
  "timestamp": 1722662800000
}
```

---

#### 1.2 Push / Update Status Display (POST State)
* **HTTP Method**: `POST`
* **URL**: `/api.php?device={deviceId}`
* **Headers**:
  * `Content-Type: application/json`
  * `X-Api-Key: baraja_display_secret_2026`
* **Request Body**:
```json
{
  "device_id": "BAR BELAKANG",
  "items": [
    {
      "name": "Espresso Single",
      "qty": 2,
      "price": 25000,
      "note": null
    }
  ],
  "discount_rate": 0.1,
  "status": 1,
  "order_number": "A-105",
  "customer_name": "Ibu Anita",
  "table_name": "Meja 02",
  "timestamp": 1722662850000
}
```
* **Response `200 OK`**:
```json
{
  "status": "success"
}
```
* **Response `401 Unauthorized`**:
```json
{
  "status": "error",
  "message": "Unauthorized: Invalid API Key"
}
```

---

#### 1.3 Real-Time SSE Event Stream (`stream.php`)
* **HTTP Method**: `GET`
* **URL**: `/stream.php?device={deviceId}`
* **Headers**:
  * `Accept: text/event-stream`
  * `Cache-Control: no-cache`
* **Deskripsi**:
  Menggunakan Server-Sent Events (SSE) untuk mendorong pembaruan data secara instan (<300ms) ke aplikasi Flutter tanpa perlu polling berulang. Memiliki fitur heartbeat otomatis (`: ping\n\n`) setiap 15 detik dan auto-reconnect max connection 60 detik untuk mencegah thread exhaustion pada server.
* **Format Event Payload**:
```http
data: {"device_id":"BAR BELAKANG","items":[{"name":"Americano","qty":1,"price":30000}],"status":0,"order_number":"A-108","timestamp":1722662900000}

: ping

```

---

#### 1.4 Daftar Perangkat Terdaftar (`list_devices`)
* **HTTP Method**: `GET`
* **URL**: `/api.php?action=list_devices`
* **Response `200 OK`**:
```json
{
  "status": "success",
  "devices": [
    "BAR BELAKANG",
    "BAR DEPAN",
    "VIP ROOM"
  ]
}
```

---

#### 1.5 Ambil Banner & Video Promo (`get_promos`)
* **HTTP Method**: `GET`
* **URL**: `/api.php?action=get_promos`
* **Response `200 OK`**:
```json
{
  "status": "success",
  "promos": [
    {
      "id": 1,
      "title": "Espresso Blend Promo 20%",
      "tag": "Spesial Minggu Ini",
      "desc": "Dapatkan diskon 20% untuk semua varian Manual Brew Arabica.",
      "media_url": "https://barajacoffee.com/display2/uploads/promo_espresso.mp4",
      "is_video": 1,
      "is_active": 1,
      "sort_order": 1
    }
  ]
}
```

---

#### 1.6 Ambil Running Text Ticker (`get_tickers`)
* **HTTP Method**: `GET`
* **URL**: `/api.php?action=get_tickers`
* **Response `200 OK`**:
```json
{
  "status": "success",
  "tickers": [
    {
      "id": 1,
      "icon": "☕",
      "text": "Selamat Datang di Baraja Coffee Amphitheater",
      "is_active": 1,
      "sort_order": 1
    },
    {
      "id": 2,
      "icon": "📡",
      "text": "WiFi: acaradibaraja — Gratis untuk pelanggan",
      "is_active": 1,
      "sort_order": 2
    }
  ]
}
```

---

#### 1.7 Kirim Struk Digital via SMTP Email (`send_receipt`)
* **HTTP Method**: `POST`
* **URL**: `/api.php?action=send_receipt`
* **Headers**:
  * `Content-Type: application/json`
  * `X-Api-Key: baraja_display_secret_2026`
* **Request Body**:
```json
{
  "device_id": "BAR BELAKANG",
  "email": "pelanggan@gmail.com",
  "order_number": "A-105",
  "customer_name": "Ibu Anita",
  "table_name": "Meja 02",
  "items": [
    {"name": "Latte", "qty": 2, "price": 35000, "note": "Oatmilk"}
  ],
  "subtotal": 70000,
  "discount_amount": 7000,
  "grand_total": 63000,
  "payment_method": "QRIS BCA",
  "payment_amount": 63000,
  "change_amount": 0,
  "timestamp": 1722662950000
}
```
* **Response `200 OK`**:
```json
{
  "status": "success",
  "message": "Email struk berhasil terkirim"
}
```

---

### 2. Manager Authorization API (`auth_api.php`)

API ini digunakan ketika aplikasi Kasir membutuhkan otorisasi supervisor/manager (misalnya void item, hapus transaksi, atau pemberian diskon khusus).

#### 2.1 Pengajuan Otorisasi dari Kasir (`request_auth`)
* **HTTP Method**: `POST`
* **URL**: `/auth_api.php?action=request_auth`
* **Request Body**:
```json
{
  "cashier_name": "Budi Kasir",
  "reason": "Void Item Salah Pesan",
  "order_id": "A-110",
  "item_name": "Matcha Latte",
  "device_id": "KASIR_UTAMA"
}
```
* **Response `200 OK`**:
```json
{
  "status": "success",
  "message": "Permintaan otorisasi berhasil dikirim",
  "request_id": "REQ-20260803-120530-482",
  "request": {
    "request_id": "REQ-20260803-120530-482",
    "cashier_name": "Budi Kasir",
    "reason": "Void Item Salah Pesan",
    "order_id": "A-110",
    "item_name": "Matcha Latte",
    "device_id": "KASIR_UTAMA",
    "status": "pending",
    "created_at": "2026-08-03 12:05:30",
    "timestamp": 1722662730
  }
}
```

---

#### 2.2 Cek Status Otorisasi (Kasir Polling) (`check_request_status`)
* **HTTP Method**: `GET`
* **URL**: `/auth_api.php?action=check_request_status&request_id=REQ-20260803-120530-482`
* **Response `200 OK`**:
```json
{
  "status": "success",
  "request_status": "approved",
  "request": {
    "request_id": "REQ-20260803-120530-482",
    "status": "approved",
    "approved_by": "Manager Hendra",
    "updated_at": "2026-08-03 12:06:10"
  }
}
```

---

#### 2.3 Daftar Pengajuan Otorisasi (Web Manager) (`get_requests`)
* **HTTP Method**: `GET`
* **URL**: `/auth_api.php?action=get_requests`
* **Deskripsi**: Menampilkan semua pengajuan otorisasi. Otomatis mengubah status pengajuan `pending` yang berusia > 10 menit menjadi `expired`.

---

#### 2.4 Setujui / Tolak Otorisasi (`approve_request` / `reject_request`)
* **HTTP Method**: `POST`
* **URL**: `/auth_api.php?action=approve_request` *(atau `action=reject_request`)*
* **Request Body**:
```json
{
  "request_id": "REQ-20260803-120530-482",
  "pin": "122333",
  "manager_name": "Manager Hendra"
}
```
* **Response `200 OK`**:
```json
{
  "status": "success",
  "message": "Status otorisasi berhasil diperbarui menjadi APPROVED",
  "request_id": "REQ-20260803-120530-482",
  "new_status": "approved"
}
```

---

#### 2.5 Perbarui Master PIN Manager (`update_master_pin`)
* **HTTP Method**: `POST`
* **URL**: `/auth_api.php?action=update_master_pin`
* **Request Body**:
```json
{
  "old_pin": "122333",
  "new_pin": "889900"
}
```
* **Response `200 OK`**:
```json
{
  "status": "success",
  "message": "PIN Master Otorisasi berhasil diperbarui"
}
```

---

## 5. Audit & Pengamanan Sistem yang Telah Diterapkan (Security Hardening Completed)

### 🛡️ Perbaikan Keamanan yang Telah Selesai Diimplementasikan:
1. **Penutupan Kebocoran Master PIN**:
   - Menghapus atribut `master_pin` dari response JSON `get_requests` di `auth_api.php`. Master PIN tidak lagi terekspos di API publik.
2. **Proteksi Akses Langsung File Sensitif**:
   - Menambahkan aturan di `.htaccess` dan `storage/.htaccess` untuk memblokir unduhan browser secara langsung terhadap file `.json`, `.db`, `.log`, dan `smtp_config.php`.
3. **Implementasi Rate Limiting & Lockout Perangkat/IP**:
   - Menambahkan fitur pelacakan percobaan PIN salah per IP address pada `auth_api.php`. Jika terdapat 5 kali kegagalan berturut-turut dalam 15 menit, server akan memblokir (*lockout 429*) percobaan PIN selanjutnya selama 15 menit.
4. **Enkripsi PIN dengan Bcrypt Hashing**:
   - PIN Master sekarang disalin dan disimpan dalam format enkripsi `password_hash($pin, PASSWORD_BCRYPT)`. Sistem mendukung pencocokan otomatis (*auto-upgrade*) dari format plaintext lama ke hash aman secara transparan.
5. **Pembersihan & Sanitasi Input HTML (XSS Protection)**:
   - Seluruh input string pada pengajuan otorisasi (`cashier_name`, `reason`, `order_id`, `item_name`, `manager_name`) di-sanitasi menggunakan `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')`.
6. **Pengetatan Header CORS (Cross-Origin Resource Sharing)**:
   - Header CORS pada `api.php`, `auth_api.php`, dan `stream.php` diperketat dengan memeriksa domain origin yang diizinkan untuk mencegah refleksi origin liar (*reflected origin attack*).

---

### Versi & Dokumentasi
* **Dokumen Dibuat & Diperbarui**: 3 Agustus 2026
* **Penulis / Modul**: Antigravity AI Code Assistant - Baraja Coffee Tech Team
* **Status Keamanan**: ✅ **HARDENED & SECURED**
* **Target File Output**: [api.md](file:///d:/baraja/cashier/mobile/display/api.md)
