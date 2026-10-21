# Integrasi Callback BTN QRIS - Partner ID Baraja

Dokumen ini menjelaskan Partner ID khusus yang Baraja sediakan untuk request
callback pembayaran QRIS dari BTN ke endpoint Baraja. Dokumen ini dapat
dikirimkan ke tim BTN setelah placeholder yang ditandai dilengkapi.

## Informasi callback

| Item | Nilai |
| --- | --- |
| Merchant / partner | Baraja Coffee |
| Environment | {{SANDBOX atau PRODUCTION}} |
| Callback URL | `https://{{DOMAIN_BARAJA}}/api/snap/v1/qr/qr-mpm-notify` |
| HTTP method | `POST` |
| Callback `X-PARTNER-ID` | `{{PARTNER_ID_CALLBACK_BARAJA}}` |
| Format Partner ID | UUID, contoh format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

Partner ID di atas disediakan Baraja secara khusus agar digunakan pada header
`X-PARTNER-ID` ketika BTN memanggil callback Baraja.

## OAuth untuk akses BTN ke endpoint Baraja

BTN tidak perlu login ke akun admin Baraja. Baraja menyediakan OAuth 2.0
Client Credentials khusus integrasi BTN, dengan akses terbatas hanya untuk
meminta Partner ID callback. Credential OAuth dikirimkan kepada BTN melalui
kanal aman terpisah dan tidak sama dengan credential Open API BTN.

### Mendapatkan access token

```http
POST https://{{DOMAIN_BARAJA}}/api/btn-qris/oauth/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {{BASE64_CLIENT_ID_COLON_CLIENT_SECRET}}

grant_type=client_credentials
```

`Authorization` berisi Base64 dari teks `client_id:client_secret`, sesuai
HTTP Basic Client Authentication pada OAuth 2.0. Baraja memberikan nilai
`client_id` dan `client_secret` kepada BTN secara terpisah/aman. Access token
berlaku selama 900 detik.

Contoh response:

```json
{
  "access_token": "{{ACCESS_TOKEN}}",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "btn:callback-partner-id:read"
}
```

### Mengambil Partner ID callback

```http
GET https://{{DOMAIN_BARAJA}}/api/btn-qris/callback-partner-id
Authorization: Bearer {{ACCESS_TOKEN}}
```

Contoh response:

```json
{
  "success": true,
  "data": {
    "partnerId": "{{PARTNER_ID_CALLBACK_BARAJA}}"
  }
}
```

Endpoint hanya mengembalikan Partner ID yang sudah dikonfigurasi Baraja,
sehingga BTN akan selalu menerima nilai yang sama. Endpoint ini memerlukan
scope `btn:callback-partner-id:read`. Token tidak
memberikan akses ke akun atau endpoint admin Baraja lainnya.

## Pemisahan kredensial

Partner ID callback Baraja berbeda dari `Apikey ID` / `BTN_API_KEY` yang BTN
berikan kepada Baraja. `BTN_API_KEY` tetap digunakan Baraja pada request API
keluar ke BTN. Partner ID pada tabel di atas hanya untuk autentikasi request
callback masuk dari BTN ke Baraja.

Mohon BTN mengikat Partner ID callback tersebut ke konfigurasi callback QRIS
Baraja untuk environment yang disebutkan di atas.

## Data callback

Callback mengikuti layanan Payment Notify pada spesifikasi BTN SNAP QRIS,
dengan field utama berikut:

| Field | Keterangan |
| --- | --- |
| `originalReferenceNo` | Nomor referensi transaksi BTN |
| `originalPartnerReferenceNo` | Nomor referensi transaksi Baraja |
| `latestTransactionStatus` | Status transaksi, misalnya `00` untuk sukses |
| `transactionStatusDesc` | Deskripsi status transaksi |
| `amount.value` | Nilai transaksi dengan dua angka desimal |
| `amount.currency` | Mata uang, umumnya `IDR` |
| `merchantId` | Identitas merchant BTN |
| `issuerName` | Nama issuer |
| `customerNumber` | Nomor rekening/customer sesuai spesifikasi BTN |
| `accountType` | Jenis rekening/customer sesuai spesifikasi BTN |
| `customerName` | Nama customer sesuai spesifikasi BTN |
| `additionalInfo` | Informasi tambahan; dapat mencakup `referenceId`, `terminalId`, dan `merchantPAN` |

## Header request

Mohon callback dikirim dengan header SNAP yang telah disepakati, termasuk:

- `X-PARTNER-ID`: Partner ID callback Baraja dari tabel di atas.
- `X-TIMESTAMP`: timestamp request.
- `X-SIGNATURE`: signature request.
- `X-EXTERNAL-ID`: ID unik request, 16 karakter alfanumerik.
- `CHANNEL-ID`: channel ID 5 digit.
- `Authorization`: bearer token jika diwajibkan oleh skema callback BTN.
- `Content-Type`: `application/json`.

## Konfirmasi teknis dari BTN

Sebelum callback diaktifkan di production, mohon konfirmasi:

1. Apakah format UUID dengan tanda hubung dapat digunakan sebagai Partner ID
   callback dan didaftarkan pada konfigurasi BTN?
2. Apakah nilai `X-PARTNER-ID` callback diisi persis sama dengan Partner ID
   yang Baraja berikan di atas?
3. Header apa saja yang wajib dikirim BTN pada callback, khususnya apakah
   `Authorization` dan `CHANNEL-ID` diperlukan?
4. Skema signature callback yang digunakan BTN, termasuk string-to-sign,
   public key atau secret yang perlu dipasang Baraja, serta format timestamp.
5. Response HTTP dan body yang diharapkan BTN untuk menandai callback berhasil.
6. Apakah tersedia endpoint atau prosedur uji callback di sandbox sebelum
   kredensial production diaktifkan?

## Contoh response sukses Baraja

Setelah callback berhasil divalidasi dan diproses, endpoint Baraja merespons:

```json
{
  "responseCode": "2005200",
  "responseMessage": "Request has been processed successfully",
  "additionalInfo": {}
}
```

## Checklist internal sebelum dokumen dikirim

- Siapkan `BTN_CALLBACK_OAUTH_CLIENT_ID` dan secret acak kuat untuk
  `BTN_CALLBACK_OAUTH_CLIENT_SECRET` dan `BTN_CALLBACK_OAUTH_TOKEN_SECRET`
  (masing-masing minimal 32 karakter) pada environment server Baraja. Jangan
  gunakan atau kirim `JWT_SECRET`.
- Buat ID callback secara internal melalui `POST
  /api/btn-qris/callback-partner-id/generate` dengan akun admin Baraja, lalu
  pasang nilai tersebut sebagai `BTN_CALLBACK_PARTNER_ID` pada environment.
- Kirim OAuth `client_id` dan `client_secret` ke BTN melalui kanal aman.
- BTN mengambil access token di `/api/btn-qris/oauth/token`, lalu membaca
  Partner ID yang telah dikonfigurasi melalui `/api/btn-qris/callback-partner-id`.
- Ganti `{{PARTNER_ID_CALLBACK_BARAJA}}` dengan nilai yang sama dari
  `BTN_CALLBACK_PARTNER_ID`.
- Ganti `{{DOMAIN_BARAJA}}` dengan domain API yang dapat diakses BTN.
- Pilih environment yang sesuai dan pastikan URL callback dapat diakses dari
  jaringan BTN.
- Kirim Partner ID tersebut melalui kanal aman yang disepakati dengan BTN.
- Setelah BTN mengonfirmasi konfigurasi, set nilai yang sama sebagai
  `BTN_CALLBACK_PARTNER_ID` pada environment server Baraja. Jangan mengubah
  `BTN_API_KEY`.
- Simpan dokumen yang sudah dilengkapi di kanal internal yang aman; jangan
  commit Partner ID production ke repository publik.
