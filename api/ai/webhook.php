<?php
/**
 * WhatsApp Bot Webhook Receiver Backend (PHP Local XAMPP)
 * File: c:/xampp/htdocs/chatbot/webhook.php
 * Endpoint: http://localhost/chatbot/webhook.php
 */

header('Content-Type: application/json; charset=utf-8');

// =========================================================================
// 🔑 1. BACA KONFIGURASI DINAMIS DARI BACKOFFICE (config.json)
// =========================================================================
$configFile = __DIR__ . '/config.json';
$config = [
    'gemini_api_key'     => '',
    'company_name'       => 'Baraja Coffee & Resto',
    'admin_phone'        => '0812-3456-7890',
    'bot_status'         => 'active',
    'system_instruction' => ''
];

if (file_exists($configFile)) {
    $parsed = json_decode(file_get_contents($configFile), true);
    if (is_array($parsed)) {
        $config = array_merge($config, $parsed);
    }
}

define('GEMINI_API_KEY', $config['gemini_api_key']);
define('CASHIER_API_URL', 'http://app.barajacoffee.site/api/menu/all-menu-items');

// 1. Ambil data mentah (raw JSON) dari Node.js via Axios
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !isset($data['sender']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload received.']);
    exit;
}

$sender   = $data['sender'];
$pushName = $data['pushName'] ?? 'Pelanggan';
$message  = trim($data['message']);

// Log pesan masuk
file_put_contents('chatbot.log', date('[Y-m-d H:i:s]') . " {$pushName} ({$sender}): {$message}\n", FILE_APPEND);

// Cek jika bot sedang status maintenance dari Backoffice
if ($config['bot_status'] === 'maintenance') {
    echo json_encode([
        'status' => 'success',
        'reply'  => "Mohon maaf Kak {$pushName}, layanan Customer Service WhatsApp saat ini sedang dalam pemeliharaan sistem. Silakan hubungi Admin di {$config['admin_phone']}."
    ]);
    exit;
}

// Cek jika pelanggan ingin membatalkan / mereset sesi pesanan
$msgLower = strtolower($message);
if (in_array($msgLower, ['batal', 'batal pesan', 'batal pesanan', 'reset', 'reset pesanan', 'batalkan', 'cancel'])) {
    $sessionFile = __DIR__ . '/sessions/' . md5($sender) . '.json';
    if (file_exists($sessionFile)) {
        @unlink($sessionFile);
    }
    echo json_encode([
        'status' => 'success',
        'reply'  => "Siap Kak {$pushName}! Pesanan sebelumnya telah dibatalkan dan memori pesanan telah di-reset. 😊\n\nAda menu lezat atau minuman segar lainnya dari Baraja Coffee yang ingin Kakak pesan?"
    ]);
    exit;
}

// 2. Ambil Data Live Menu & Stok Real-Time dari API Kasir Baraja Coffee
$disabledItems = $config['disabled_items'] ?? [];
$disabledCategories = $config['disabled_categories'] ?? [];
$liveMenuCatalog = fetchLiveKasirMenu($message, $disabledItems, $disabledCategories);

// 3. Format Menu Rekomendasi Pilihan Admin dari Backoffice (Abaikan menu non-aktif)
$recomMenuText = "";
if (!empty($config['recommended_items']) && is_array($config['recommended_items'])) {
    $activeRecoms = array_filter($config['recommended_items'], fn($item) => !in_array($item, $disabledItems));
    if (!empty($activeRecoms)) {
        $recomMenuText = "\nMENU REKOMENDASI UTAMA PILIHAN MANAGEMENT (UTAMAKAN MENU INI BILA PELANGGAN MEMINTA REKOMENDASI):\n";
        foreach ($activeRecoms as $rItem) {
            $recomMenuText .= "- *{$rItem}*\n";
        }
    }
}

// 4. Gabungkan System Instruction dari Backoffice + Nama Pelanggan + Menu Rekomendasi + Data Stok Live Kasir
$userGreetingDirective = "\n\nINFORMASI PENGGUNA WHATSAPP SAAT INI:\n- Nama Profil WhatsApp Pengirim: {$pushName}\n- ATURAN SAPAAN: Selalu sapalah pelanggan dengan menyertakan nama WhatsApp-nya dengan ramah (misalnya: \"Halo Kak {$pushName}!\", \"Baik Kak {$pushName}\", \"Ada yang ingin dipesan lagi Kak {$pushName}?\"). Jika namanya hanya nomor atau tidak terbaca, gunakan \"Kak\".";
$fullSystemInstruction = $config['system_instruction'] . $userGreetingDirective . $recomMenuText . "\n\nDATA LIVE KATALOG KASIR & STOK REAL-TIME:\n" . $liveMenuCatalog;

// 5. Cek jika pelanggan meminta Foto Menu
$imageUrl = null;
if (preg_match('/(foto|gambar|spill|lihat foto|foto menu|minta foto|minta gambar)\s*(menu|untuk)?\s*(.+)/i', $message, $matches)) {
    $searchName = trim($matches[3]);
    $imageUrl = findMenuImageUrl($searchName);
    if ($imageUrl) {
        $fullSystemInstruction .= "\n\n[STATUS FOTO MENU '{$searchName}']: TERSEDIA di sistem kasir. Gambar resmi dikirimkan via media attachment.";
    } else {
        $fullSystemInstruction .= "\n\n[STATUS FOTO MENU '{$searchName}']: TIDAK TERSEDIA di sistem kasir. Wajib infokan secara jujur dan sopan kepada Kak {$pushName}: 'Mohon maaf Kak, foto resmi untuk menu {$searchName} belum tersedia di sistem kasir saat ini.' JANGAN mengarang foto!";
    }
}

// 6. Olah Balasan Bot dengan Memori Sesi Multi-Turn & Multi API Key Rotation
$apiKeys = [];
if (!empty($config['gemini_api_keys']) && is_array($config['gemini_api_keys'])) {
    foreach ($config['gemini_api_keys'] as $k) {
        $k = trim($k);
        if (!empty($k) && !in_array($k, $apiKeys)) {
            $apiKeys[] = $k;
        }
    }
}
if (!empty($config['gemini_api_key'])) {
    $k = trim($config['gemini_api_key']);
    if (!empty($k) && !in_array($k, $apiKeys)) {
        $apiKeys[] = $k;
    }
}

$reply = getBotResponse($sender, $message, $pushName, $fullSystemInstruction, $config, $apiKeys);

$responsePayload = [
    'status' => 'success',
    'reply'  => $reply
];

if ($imageUrl) {
    $responsePayload['image_url'] = $imageUrl;
}

// 7. Direct Inject Order ke System Kasir HANYA saat Pelanggan Ketik "PROSES PESANAN"
$msgLower = strtolower($message);

// HANYA trigger jika pesan dari pengguna mengandung frasa konfirmasi "proses pesanan", "fix pesan", "pesan sekarang"
$isUserConfirmed = preg_match('/(proses pesanan|fix pesan|pesan sekarang|proses pesan)/i', $msgLower);

if ($isUserConfirmed) {
    // Submit Order langsung ke API Kasir dari percakapan
    $cashierOrder = createUnifiedOrderInCashier($sender, $pushName, $reply, $message);
    if ($cashierOrder && !empty($cashierOrder['order_id'])) {
        $orderId = $cashierOrder['order_id'];
        $reply = "Terima kasih Kak {$pushName}! Pesanan Kakak telah dikonfirmasi dan **RESMI TERINPUT DI KASIR POS**.\n\n📌 *Nomor Order*: `#{$orderId}`\n💳 *Metode Pembayaran*: Bayar Langsung di Kasir / Staf Baraja\n\n_Silakan lakukan pembayaran di kasir atau tunggu staf kami menghampiri meja Kakak. Terima kasih!_ 😊";
        $responsePayload['reply'] = $reply;

        // Reset memory sesi percakapan agar pesanan lama tidak terduplikasi
        $sessionFile = __DIR__ . '/sessions/' . md5($sender) . '.json';
        if (file_exists($sessionFile)) {
            @unlink($sessionFile);
        }
    }

    if (!empty($config['kasir_group_jid'])) {
        $responsePayload['notify_group'] = true;
        $responsePayload['group_jid'] = $config['kasir_group_jid'];
        $orderIdTag = isset($cashierOrder['order_id']) ? " (#{$cashierOrder['order_id']})" : "";
        $responsePayload['group_message'] = "🔔 *NOTIFIKASI PESANAN MASUK (BARAJA BOT)*{$orderIdTag}\n\n" .
                                           "• *Pemesan*: {$pushName} ({$sender})\n" .
                                           "• *Rincian Pesanan & Balasan*: \n{$reply}\n\n" .
                                           "• *Waktu*: " . date('H:i:s / d-m-Y') . "\n\n" .
                                           "📌 *Pesanan ini telah terinjeksi ke sistem POS Kasir Baraja.*";
    }
}

echo json_encode($responsePayload);

/**
 * Fungsi Penentu Balasan Bot
 */
function getBotResponse($sender, $userMsg, $userName, $systemInstruction, $apiKeys = []) {
    $msgLower = strtolower($userMsg);

    if (preg_match('/(siapa\s*(pencipta|pembuat|yang\s*bikin|yang\s*buat|membuat)\s*(kamu|bot|baridin)|siapa\s*bikin\s*kamu)/i', $msgLower)) {
        return "Aku Baridin. Diciptakan dari kopi, dirakit dengan kode, dan diberi nyawa oleh rasa penasaran dan cinta ☕✨";
    }

    if (!empty($apiKeys)) {
        return callGeminiAI($sender, $userMsg, $systemInstruction, $apiKeys, $userName);
    }

    return "Maaf Kak {$userName}, API Key Gemini belum dikonfigurasi di Backoffice Admin Dashboard.";
}

/**
 * Memanggil API Kasir Baraja Coffee dengan Caching Lokal & Smart Keyword Alias Matching
 */
function fetchLiveKasirMenu($userQuery, $disabledItems = [], $disabledCategories = []) {
    $cacheFile = __DIR__ . '/menu_cache.json';
    $cacheLifetime = 1800; // Cache 30 menit
    $items = [];

    // Baca cache lokal terlebih dahulu
    if (file_exists($cacheFile)) {
        $json = json_decode(file_get_contents($cacheFile), true);
        $items = $json['data'] ?? $json ?? [];
    }

    // Jika cache kosong atau sudah > 30 menit, coba refresh dari API Kasir tanpa menghapus data cache lama
    if (empty($items) || (file_exists($cacheFile) && (time() - filemtime($cacheFile) > $cacheLifetime))) {
        $ch = curl_init(CASHIER_API_URL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response) {
            $parsed = json_decode($response, true);
            $newItems = $parsed['data'] ?? $parsed ?? [];
            if (!empty($newItems) && is_array($newItems)) {
                $items = $newItems;
                file_put_contents($cacheFile, $response);
            }
        }
    }

    if (empty($items) || !is_array($items)) {
        return "- (Gagal memuat katalog kasir).";
    }

    $qLower = strtolower(trim($userQuery));
    
    // Pemetaan Alias Pencarian Bahasa Indonesia <-> Nama di Kasir
    $aliasMap = [
        'teh' => ['teh', 'tea', 'lemon tea', 'lychee tea', 'hmt'],
        'air' => ['mineral water', 'mineral', 'water', 'reflection mineral', 'infused water', 'aqua'],
        'mineral' => ['mineral water', 'mineral', 'water', 'reflection mineral', 'aqua'],
        'air mineral' => ['mineral water', 'mineral', 'water', 'reflection mineral', 'aqua'],
        'air putih' => ['mineral water', 'mineral', 'water', 'reflection mineral', 'aqua'],
        'kopi' => ['coffee', 'latte', 'espresso', 'americano', 'cappuccino', 'braun', 'brew'],
        'makan' => ['nasi', 'goreng', 'snack', 'croissant', 'food', 'mie', 'ayam', 'daging'],
        'makanan' => ['nasi', 'goreng', 'snack', 'croissant', 'food', 'mie', 'ayam', 'daging'],
    ];

    $searchKeywords = [];
    foreach ($aliasMap as $alias => $targets) {
        if (str_contains($qLower, $alias)) {
            $searchKeywords = array_merge($searchKeywords, $targets);
        }
    }

    $matchedItems = [];
    $otherItems = [];
    $disabledCatsLower = array_map('strtolower', $disabledCategories);

    foreach ($items as $item) {
        $name = $item['name'] ?? '';
        if (empty($name)) continue;

        $itemId = $item['id'] ?? $item['_id'] ?? '';
        $categoryName = is_array($item['category'] ?? null) ? ($item['category']['name'] ?? 'Menu') : ($item['category'] ?? 'Menu');

        // 1. Filter out jika KATEGORI diset Non-Aktif
        if (!empty($categoryName) && in_array(strtolower($categoryName), $disabledCatsLower)) {
            continue;
        }

        // 2. Filter out jika ITEM diset Non-Aktif
        if (in_array($name, $disabledItems) || (!empty($itemId) && in_array($itemId, $disabledItems))) {
            continue;
        }

        $priceNum = $item['originalPrice'] ?? $item['discountedPrice'] ?? $item['price'] ?? 0;
        if ($priceNum <= 0) continue;

        $priceFormatted = "Rp " . number_format($priceNum, 0, ',', '.');
        $isAvail = isset($item['stock']['isAvailable']) ? $item['stock']['isAvailable'] : ($item['isAvailable'] ?? true);
        
        // Override out of stock if marked in SQLite database
        $outOfStockIds = $outOfStockIds ?? [];
        if (!empty($itemId) && in_array($itemId, $outOfStockIds)) {
            $isAvail = false;
        }

        $statusStok = $isAvail ? "READY" : "HABIS";
        $categoryName = is_array($item['category'] ?? null) ? ($item['category']['name'] ?? 'Menu') : ($item['category'] ?? 'Menu');

        $descRaw = trim($item['description'] ?? '');
        $descText = !empty($descRaw) ? " | Deskripsi: \"{$descRaw}\"" : "";

        $line = "- *{$name}* [Kategori: {$categoryName}]: {$priceFormatted} (Stok: {$statusStok}){$descText}";

        $nameLower = strtolower($name);
        $catLower = strtolower($categoryName);

        $isMatch = false;
        foreach ($searchKeywords as $kw) {
            if (str_contains($nameLower, $kw) || str_contains($catLower, $kw)) {
                $isMatch = true;
                break;
            }
        }

        if (!$isMatch && !empty($qLower)) {
            $words = explode(' ', $qLower);
            foreach ($words as $w) {
                if (strlen($w) >= 3 && (str_contains($nameLower, $w) || str_contains($catLower, $w))) {
                    $isMatch = true;
                    break;
                }
            }
        }

        if ($isMatch) {
            $matchedItems[] = $line;
        } else {
            $otherItems[] = $line;
        }
    }

    $finalItems = array_merge($matchedItems, array_slice($otherItems, 0, max(0, 35 - count($matchedItems))));
    if (empty($finalItems)) {
        $finalItems = array_slice($otherItems, 0, 35);
    }

    return implode("\n", array_slice($finalItems, 0, 40));
}

/**
 * Mengambil Riwayat Sesi Percakapan Multi-Turn untuk Pengirim
 */
function getSessionHistory($sender) {
    $sessionDir = __DIR__ . '/sessions';
    if (!is_dir($sessionDir)) {
        @mkdir($sessionDir, 0777, true);
    }
    $file = $sessionDir . '/' . md5($sender) . '.json';
    if (file_exists($file)) {
        $json = file_get_contents($file);
        $data = json_decode($json, true);
        if (is_array($data)) return $data;
    }
    return [];
}

/**
 * Menyimpan Riwayat Sesi Percakapan Multi-Turn
 */
function saveSessionHistory($sender, $history) {
    $sessionDir = __DIR__ . '/sessions';
    if (!is_dir($sessionDir)) {
        @mkdir($sessionDir, 0777, true);
    }
    $file = $sessionDir . '/' . md5($sender) . '.json';
    if (count($history) > 10) {
        $history = array_slice($history, -10);
    }
    file_put_contents($file, json_encode($history, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/**
 * Pemanggilan Google Gemini AI API via cURL dengan Multi-Turn History Memory & Multi API Key Rotation
 */
function callGeminiAI($sender, $userMsg, $systemInstruction, $apiKeys = [], $userName = 'Pelanggan') {
    if (empty($apiKeys)) {
        return "Maaf Kak {$userName}, API Key Gemini belum dikonfigurasi di Backoffice Admin Dashboard.";
    }

    $history = getSessionHistory($sender);

    $contentsPayload = [];
    foreach ($history as $h) {
        if (!empty($h['role']) && !empty($h['text'])) {
            $contentsPayload[] = [
                "role" => $h['role'],
                "parts" => [["text" => $h['text']]]
            ];
        }
    }

    $contentsPayload[] = [
        "role" => "user",
        "parts" => [["text" => $userMsg]]
    ];

    $models = [
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest'
    ];

    $replyText = null;

    // Loop melalui setiap API Key yang tersedia (Multi-Key Failover Rotation)
    foreach ($apiKeys as $keyIndex => $apiKey) {
        foreach ($models as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $apiKey;

            $payload = [
                "system_instruction" => [
                    "parts" => [
                        ["text" => $systemInstruction]
                    ]
                ],
                "contents" => $contentsPayload
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError) continue;

            $result = json_decode($response, true);

            // Respon sukses ditemukan!
            if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                $replyText = trim($result['candidates'][0]['content']['parts'][0]['text']);
                break 2; // Keluar dari loop model dan loop key
            }

            // Jika terkena limit / quota error (429 atau 403 atau pesan Quota)
            if ($httpCode === 429 || $httpCode === 403 || (isset($result['error']) && str_contains(strtolower($result['error']['message'] ?? ''), 'quota'))) {
                $keyPreview = substr($apiKey, 0, 10) . '...';
                file_put_contents(__DIR__ . '/gemini_rotation.log', date('[Y-m-d H:i:s]') . " [ROTATION] Key #{$keyIndex} ({$keyPreview}) limit habis (HTTP {$httpCode}). Otomatis beralih ke key berikutnya...\n", FILE_APPEND);
                break; // Keluar dari loop model untuk pindah ke API Key berikutnya
            }
        }
    }

    if (!$replyText) {
        $nameGreeting = (!empty($userName) && $userName !== 'Pelanggan') ? "Kak {$userName}" : "Kak";
        $replyText = "Halo {$nameGreeting}! 👋 Terima kasih sudah menghubungi Baraja Coffee. Ada yang bisa kami bantu seputar pemesanan menu atau reservasi?";
    }

    $history[] = ["role" => "user", "text" => $userMsg];
    $history[] = ["role" => "model", "text" => $replyText];
    saveSessionHistory($sender, $history);

    return $replyText;
}

/**
 * Mencari URL Gambar / Foto Menu Berdasarkan Nama Produk
 */
function findMenuImageUrl($query) {
    $cacheFile = __DIR__ . '/menu_cache.json';
    if (!file_exists($cacheFile)) return null;

    $raw = json_decode(file_get_contents($cacheFile), true);
    $items = $raw['data'] ?? $raw ?? [];

    $cleanQuery = strtolower(trim(preg_replace('/[^a-zA-Z0-9\s]/', '', $query)));
    if (empty($cleanQuery)) return null;
    
    foreach ($items as $item) {
        $name = $item['name'] ?? '';
        $nameClean = strtolower(trim(preg_replace('/[^a-zA-Z0-9\s]/', '', $name)));
        
        if (str_contains($nameClean, $cleanQuery) || str_contains($cleanQuery, $nameClean) || str_contains($cleanQuery, strtolower(explode(' ', $name)[0]))) {
            $imgUrl = $item['imageUrl'] ?? $item['image'] ?? null;
            if (!empty($imgUrl)) {
                $imgUrl = preg_replace('#([^:])//+#', '$1/', $imgUrl);
                if (str_contains($imgUrl, 'placeholder') || str_contains($imgUrl, 'Add-Sauce') || str_contains($imgUrl, 'Add_Sauce')) {
                    return null;
                }
                return $imgUrl;
            }
        }
    }

    return null;
}

/**
 * Mengirimkan Pesanan WhatsApp Otomatis ke Backend Kasir Baraja Coffee (Unified Order API)
 */
function createUnifiedOrderInCashier($sender, $pushName, $replyText, $userMessage) {
    $cacheFile = __DIR__ . '/menu_cache.json';
    if (!file_exists($cacheFile)) return null;

    $raw = json_decode(file_get_contents($cacheFile), true);
    $allMenu = $raw['data'] ?? $raw ?? [];

    $history = getSessionHistory($sender);

    // PENTING: Pindai 8 pesan terakhir dalam sesi aktif (termasuk rekapitulasi BARIDIN sebelum balasan ini)
    $recentHistoryText = "";
    $recentTurns = array_slice($history, -8);
    foreach ($recentTurns as $h) {
        $recentHistoryText .= ($h['text'] ?? '') . "\n";
    }

    $textToScan = $recentHistoryText . "\n" . $userMessage . "\n" . $replyText;

    // Deteksi Tipe Pesanan (Dine-In vs Take Away)
    $orderType = 'Dine-In';
    if (preg_match('/(take-away|takeaway|take away|bawa pulang|dibawa pulang)/i', $textToScan) && !preg_match('/dine-in|dine in|makan di tempat/i', $userMessage)) {
        if (preg_match('/(dine-in|dine in|makan di tempat)/i', $textToScan)) {
            $orderType = 'Dine-In';
        } else {
            $orderType = 'Take Away';
        }
    }

    // Deteksi Nomor Meja
    $tableNumber = '1';
    if (preg_match('/nomor meja\s*:\s*(\d+|[a-zA-Z0-9]+)/i', $textToScan, $tMatch)) {
        $tableNumber = trim($tMatch[1]);
    } elseif (preg_match('/(meja|table)\s*#?\s*(\d+|[a-zA-Z0-9]+)/i', $textToScan, $tMatch2)) {
        $tableNumber = trim($tMatch2[2]);
    }

    // Pindai item menu dari teks rekapitulasi percakapan terkini
    $orderedItems = [];
    $totalAmount = 0;

    foreach ($allMenu as $item) {
        $name = $item['name'] ?? '';
        if (empty($name) || strlen($name) < 3) continue;

        $price = $item['originalPrice'] ?? $item['discountedPrice'] ?? $item['price'] ?? 0;
        if ($price <= 0) continue;

        // Pemetaan sinonim Bahasa Indonesia <-> Nama Resmi di Kasir POS
        $aliases = [$name];
        if (strcasecmp($name, 'Mineral Water') === 0) {
            $aliases[] = 'Air putih';
            $aliases[] = 'Air mineral';
            $aliases[] = 'Aqua';
            $aliases[] = 'Air';
        } elseif (strcasecmp($name, 'Nasi Goreng La Baraja') === 0) {
            $aliases[] = 'Nasi Goreng Baraja';
            $aliases[] = 'Nasgor Baraja';
        }

        $isMatched = false;
        $matchedQty = 1;

        foreach ($aliases as $alias) {
            $aliasRegex = preg_quote($alias, '/');
            if (preg_match('/' . $aliasRegex . '/i', $textToScan)) {
                $isMatched = true;
                if (preg_match('/' . $aliasRegex . '\s*[:\-]?\s*(\d+)/i', $textToScan, $qMatch00)) {
                    $matchedQty = max(1, intval($qMatch00[1]));
                } elseif (preg_match('/' . $aliasRegex . '\s*\(\s*(\d+)\s*(pcs|porsi|gelas|cup|botol)?\s*\)/i', $textToScan, $qMatch0)) {
                    $matchedQty = max(1, intval($qMatch0[1]));
                } elseif (preg_match('/(\d+)\s*(x|pcs|porsi)?\s*' . $aliasRegex . '/i', $textToScan, $qMatch1)) {
                    $matchedQty = max(1, intval($qMatch1[1]));
                } elseif (preg_match('/' . $aliasRegex . '\s*(x|\*)\s*(\d+)/i', $textToScan, $qMatch2)) {
                    $matchedQty = max(1, intval($qMatch2[2]));
                }
                break;
            }
        }

        if ($isMatched) {
            $itemId = $item['id'] ?? $item['_id'] ?? '';
            if (empty($itemId)) continue;

            $itemSubtotal = $price * $matchedQty;
            $totalAmount += $itemSubtotal;

            $orderedItems[] = [
                'id' => $itemId,
                'quantity' => $matchedQty,
                'selectedAddons' => [],
                'selectedToppings' => [],
                'notes' => 'Pesanan via WA Bot',
                'dineType' => $orderType
            ];
        }
    }

    // If no items matched or total amount is 0, return null
    if (empty($orderedItems) || $totalAmount <= 0) {
        return null;
    }

    $phoneClean = preg_replace('/[^0-9]/', '', $sender);

    $payload = [
        'order_id' => null,
        'user' => $pushName . ' (WA Bot)',
        'source' => 'Web',
        'orderType' => $orderType,
        'tableNumber' => strval($tableNumber),
        'outletId' => '67cbc9560f025d897d69f889', // Baraja Coffee Amphitheater Outlet ID
        'contact' => [
            'phone' => $phoneClean,
            'email' => 'whatsapp@barajacoffee.site'
        ],
        'items' => $orderedItems,
        'customAmountItems' => [],
        'isSplitPayment' => false,
        'paymentDetails' => [
            'method' => 'Cash',
            'amount' => $totalAmount,
            'grandTotal' => $totalAmount,
            'subtotal' => $totalAmount,
            'voucherDiscount' => 0,
            'taxAmount' => 0,
            'serviceAmount' => 0
        ],
        'isOpenBill' => false,
        'type' => 'Indoor'
    ];

    $ch = curl_init('https://app.barajacoffee.site/api/unified-order');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response && ($httpCode === 200 || $httpCode === 201)) {
        $resData = json_decode($response, true);
        if ($resData && (($resData['success'] ?? false) || isset($resData['orderId']) || isset($resData['order_id']))) {
            $orderId = $resData['orderId'] ?? $resData['data']['orderId'] ?? $resData['data']['order_id'] ?? $resData['order_id'] ?? 'ORD-' . rand(1000, 9999);
            return [
                'order_id' => $orderId,
                'grand_total' => $totalAmount,
                'items_count' => count($orderedItems),
                'raw_response' => $resData
            ];
        }
    }

    file_put_contents(__DIR__ . '/chatbot.log', date('[Y-m-d H:i:s]') . " ⚠️ Inject Order Kasir API (HTTP {$httpCode}): {$response}\n", FILE_APPEND);
    return null;
}

