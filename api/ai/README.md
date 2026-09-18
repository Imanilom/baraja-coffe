# WhatsApp Bot Gateway (Node.js Baileys + PHP XAMPP)

Bot WhatsApp otomatis 100% gratis menggunakan library open-source Baileys (Node.js) yang terhubung ke Backend PHP lokal (XAMPP).

## Struktur Project
```text
c:/xampp/htdocs/chatbot/
├── auth_info_baileys/  # Auto-generated (Penyimpanan sesi WhatsApp)
├── node_modules/       # Dependencies Node.js
├── index.js            # Script Gateway WhatsApp Node.js
├── webhook.php         # Backend Receiver PHP
├── package.json        # Node.json package configuration
└── README.md           # Panduan penggunaan
```

## Prasyarat
1. Node.js (v18+)
2. XAMPP (Apache & PHP)
3. Aplikasi WhatsApp di HP

## Cara Menjalankan
1. Jalankan Apache dari Control Panel XAMPP.
2. Buka Terminal / CMD di folder `c:\xampp\htdocs\chatbot`.
3. Jalankan `node index.js`.
4. Scan QR Code yang muncul di terminal menggunakan WhatsApp HP (Perangkat Tertaut / Linked Devices).
5. Kirim pesan ke nomor bot untuk menguji!
