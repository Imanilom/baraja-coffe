<?php
/**
 * ═══ SMTP CONFIGURATION FOR BARAJA CUSTOMER DISPLAY ═══
 * Silakan sesuaikan konfigurasi SMTP email di bawah ini dengan akun email toko Anda.
 * Jika menggunakan Gmail, disarankan memakai "App Password" 16-digit dari akun Google.
 */

return [
    'smtp_host'     => 'smtp.gmail.com',            // Server SMTP (e.g., smtp.gmail.com)
    'smtp_port'     => 587,                         // Port: 587 (TLS) atau 465 (SSL)
    'smtp_auth'     => true,                        // Autentikasi SMTP
    'smtp_user'     => 'barajacoffee.pos@gmail.com',// Username / Email Pengirim
    'smtp_pass'     => 'app-password-16-digit',     // Password / App Password 16 digit
    'smtp_secure'   => 'tls',                       // Protocol: 'tls' atau 'ssl'
    'from_email'    => 'barajacoffee.pos@gmail.com',// Email yang muncul di pengirim
    'from_name'     => 'Baraja Coffee Amphitheater',// Nama Toko/Pengirim
];
