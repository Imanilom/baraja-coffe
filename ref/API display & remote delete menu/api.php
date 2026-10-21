<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cache-Control, Authorization, X-Requested-With, X-Api-Key');
header('Access-Control-Allow-Credentials: true');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

define('API_SECRET_KEY', 'baraja_display_secret_2026');

function validateApiKey() {
    $providedKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? $_POST['api_key'] ?? '';
    if ($providedKey !== API_SECRET_KEY) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid API Key']);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$storageDir = __DIR__ . '/storage';
if (!file_exists($storageDir)) {
    mkdir($storageDir, 0777, true);
}

$action = $_GET['action'] ?? null;
$deviceId = $_GET['device'] ?? $_POST['device'] ?? 'BAR BELAKANG';
// Sanitize device ID for filename
$safeDeviceId = strtolower(preg_replace('/[^a-zA-Z0-9_\-]/', '_', $deviceId));
if (empty($safeDeviceId)) {
    $safeDeviceId = 'default';
}

$stateFile = "$storageDir/$safeDeviceId.json";

// ─── ACTION: LIST DEVICES ──────────────────────────────────────────────────
if ($action === 'list_devices') {
    header('Content-Type: application/json');
    $devices = [];
    $files = glob("$storageDir/*.json");
    if ($files) {
        foreach ($files as $file) {
            $name = basename($file, '.json');
            $devices[] = str_replace('_', ' ', $name);
        }
    }
    if (empty($devices)) {
        $devices = ['BAR BELAKANG', 'default'];
    }
    echo json_encode(['status' => 'success', 'devices' => array_values(array_unique($devices))]);
    exit;
}

// ─── ACTION: GET PROMOS ────────────────────────────────────────────────────
if ($action === 'get_promos') {
    header('Content-Type: application/json');
    $dbFile = __DIR__ . '/promos.db';
    if (file_exists($dbFile)) {
        try {
            $pdo = new PDO("sqlite:$dbFile");
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->query("SELECT * FROM promos WHERE is_active = 1 OR is_active = '1' ORDER BY sort_order ASC, id DESC");
            $promos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $dir = dirname($_SERVER['SCRIPT_NAME']);
            $baseUrl = rtrim("$protocol://$host$dir", '/');
            foreach ($promos as &$p) {
                if (!empty($p['media_url']) && !preg_match('/^https?:\/\//i', $p['media_url'])) {
                    $p['media_url'] = $baseUrl . '/' . ltrim($p['media_url'], '/');
                }
                if (isset($p['media_type']) && $p['media_type'] === 'video') {
                    $p['is_video'] = 1;
                }
            }
            echo json_encode(['status' => 'success', 'promos' => $promos]);
            exit;
        } catch (Exception $e) {}
    }
    $promos = [
        [
            'id' => 1,
            'title' => 'Espresso Blend Promo 20%',
            'tag' => 'Spesial Minggu Ini',
            'desc' => 'Dapatkan diskon 20% untuk semua varian Manual Brew Arabica.',
            'image' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
        ]
    ];
    echo json_encode(['status' => 'success', 'promos' => $promos]);
    exit;
}

// ─── ACTION: GET TICKERS ───────────────────────────────────────────────────
if ($action === 'get_tickers') {
    header('Content-Type: application/json');
    $dbFile = __DIR__ . '/promos.db';
    if (file_exists($dbFile)) {
        try {
            $pdo = new PDO("sqlite:$dbFile");
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->query("SELECT * FROM tickers WHERE is_active = 1 ORDER BY sort_order ASC, id DESC");
            $tickers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($tickers)) {
                echo json_encode(['status' => 'success', 'tickers' => $tickers]);
                exit;
            }
        } catch (Exception $e) {}
    }
    $tickers = [
        ['icon' => '☕', 'text' => 'Selamat Datang di Baraja Coffee Amphitheater'],
        ['icon' => '📡', 'text' => 'WiFi: acaradibaraja — Gratis untuk pelanggan'],
    ];
    echo json_encode(['status' => 'success', 'tickers' => $tickers]);
    exit;
}

// ─── ACTION: SEND RECEIPT VIA SMTP EMAIL ──────────────────────────────────
if ($action === 'send_receipt') {
    validateApiKey();
    header('Content-Type: application/json');
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Email tidak valid']);
        exit;
    }

    $smtpConfig = file_exists(__DIR__ . '/smtp_config.php') ? include(__DIR__ . '/smtp_config.php') : [];

    $toEmail = $data['email'];
    $orderNumber = $data['order_number'] ?? '-';
    $customerName = $data['customer_name'] ?? 'Pelanggan';
    $tableName = $data['table_name'] ?? '-';
    $items = $data['items'] ?? [];
    $subtotal = number_format($data['subtotal'] ?? 0, 0, ',', '.');
    $discountAmt = number_format($data['discount_amount'] ?? 0, 0, ',', '.');
    $grandTotal = number_format($data['grand_total'] ?? 0, 0, ',', '.');
    $paymentMethod = $data['payment_method'] ?? 'Tunai / QRIS';
    $dateStr = date('d F Y H:i');

    // Build HTML Receipt Table
    $itemsHtml = '';
    foreach ($items as $item) {
        $qty = $item['qty'] ?? 1;
        $name = htmlspecialchars($item['name'] ?? '');
        $price = number_format($item['price'] ?? 0, 0, ',', '.');
        $total = number_format(($item['price'] ?? 0) * $qty, 0, ',', '.');
        $note = !empty($item['note']) ? '<br><small style="color:#8B4A1C;">' . htmlspecialchars($item['note']) . '</small>' : '';
        
        $itemsHtml .= "
        <tr>
            <td style='padding:8px 0; border-bottom:1px solid #EEE;'>
                <strong>{$qty}x {$name}</strong>{$note}
            </td>
            <td style='padding:8px 0; text-align:right; border-bottom:1px solid #EEE;'>
                Rp {$total}
            </td>
        </tr>";
    }

    $subject = "Struk Pembelian #{$orderNumber} - Baraja Coffee Amphitheater";
    $htmlContent = "
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'></head>
    <body style='font-family: Arial, sans-serif; background-color: #F8F4EE; padding: 20px;'>
        <div style='max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 24px; border: 1px solid #E4D9C8;'>
            <div style='text-align: center; margin-bottom: 20px;'>
                <h2 style='margin: 0; color: #1E1009;'>BARAJA COFFEE</h2>
                <p style='margin: 4px 0 0 0; color: #8B4A1C; font-size: 12px; letter-spacing: 2px;'>AMPHITHEATER</p>
                <p style='margin: 4px 0 0 0; color: #9E8A78; font-size: 11px;'>Jl. Tuparev No. 60 · Cirebon</p>
            </div>
            <hr style='border: none; border-top: 1px dashed #E4D9C8; margin: 16px 0;'>
            <table style='width: 100%; font-size: 12px; color: #5A4535; margin-bottom: 12px;'>
                <tr><td>No. Antrean: <strong>{$orderNumber}</strong></td><td style='text-align:right;'>{$dateStr}</td></tr>
                <tr><td>Pelanggan: <strong>{$customerName}</strong></td><td style='text-align:right;'>Meja: {$tableName}</td></tr>
            </table>
            <hr style='border: none; border-top: 1px dashed #E4D9C8; margin: 16px 0;'>
            <table style='width: 100%; font-size: 13px; color: #1E1009;'>
                {$itemsHtml}
            </table>
            <div style='margin-top: 16px; padding-top: 12px; border-top: 1px solid #E4D9C8;'>
                <table style='width: 100%; font-size: 13px; color: #5A4535;'>
                    <tr><td>Subtotal</td><td style='text-align:right;'>Rp {$subtotal}</td></tr>
                    " . ($discountAmt > 0 ? "<tr><td style='color:#B91C1C;'>Diskon</td><td style='text-align:right; color:#B91C1C;'>- Rp {$discountAmt}</td></tr>" : "") . "
                    <tr style='font-size: 16px; font-weight: bold; color: #1E1009;'>
                        <td style='padding-top: 10px;'>TOTAL BAYAR</td>
                        <td style='padding-top: 10px; text-align:right; color: #C08A2A;'>Rp {$grandTotal}</td>
                    </tr>
                    <tr><td style='font-size:11px; padding-top:6px;'>Metode Pembayaran</td><td style='text-align:right; font-size:11px; padding-top:6px;'>{$paymentMethod}</td></tr>
                </table>
            </div>
            <div style='text-align: center; margin-top: 24px; font-size: 12px; color: #9E8A78;'>
                <p style='margin: 0;'>Terima kasih telah berkunjung ke Baraja Coffee!</p>
            </div>
        </div>
    </body>
    </html>";

    // Send email using SMTP Socket or php mail()
    $success = sendSmtpEmail($toEmail, $subject, $htmlContent, $smtpConfig);

    if ($success) {
        echo json_encode(['status' => 'success', 'message' => 'Email struk berhasil terkirim']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengirim email struk via SMTP']);
    }
    exit;
}

// ─── POST / SAVE DISPLAY STATE ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    validateApiKey();
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $jsonData = json_decode($rawInput, true);
        $targetDevId = $safeDeviceId;
        if (!empty($jsonData['device_id'])) {
            $jsonDevId = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $jsonData['device_id']);
            if (!empty($jsonDevId)) {
                $targetDevId = $jsonDevId;
            }
        }
        file_put_contents("$storageDir/$targetDevId.json", $rawInput);
        file_put_contents("$storageDir/$targetDevId.ts", microtime(true));

        header('Content-Type: application/json');
        echo json_encode(['status' => 'success']);
        exit;
    }
}

// ─── GET / FETCH DISPLAY STATE ─────────────────────────────────────────────
header('Content-Type: application/json');
if (file_exists($stateFile)) {
    echo file_get_contents($stateFile);
} elseif (file_exists("$storageDir/default.json")) {
    echo file_get_contents("$storageDir/default.json");
} else {
    echo json_encode([
        'device_id' => $deviceId,
        'items' => [],
        'discount_rate' => 0.0,
        'status' => 0,
        'order_number' => '-',
        'customer_name' => null,
        'table_name' => null,
        'timestamp' => time() * 1000,
    ]);
}

/**
 * Helper to send email via SMTP socket or PHP mail()
 */
function sendSmtpEmail($to, $subject, $htmlMessage, $config) {
    $smtpHost = $config['smtp_host'] ?? '';
    $smtpPort = $config['smtp_port'] ?? 587;
    $smtpUser = $config['smtp_user'] ?? '';
    $smtpPass = $config['smtp_pass'] ?? '';
    $fromEmail = $config['from_email'] ?? $smtpUser;
    $fromName = $config['from_name'] ?? 'Baraja Coffee';

    // If SMTP credentials not properly configured, fallback to standard php mail()
    if (empty($smtpHost) || empty($smtpUser) || $smtpPass === 'your-app-password' || $smtpPass === 'app-password-16-digit') {
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "From: {$fromName} <{$fromEmail}>\r\n";
        return @mail($to, $subject, $htmlMessage, $headers);
    }

    try {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $socket = stream_socket_client(
            "tcp://{$smtpHost}:{$smtpPort}",
            $errno,
            $errstr,
            10,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$socket) return false;

        fgets($socket, 512);
        fputs($socket, "EHLO localhost\r\n");
        while ($line = fgets($socket, 512)) {
            if (substr($line, 3, 1) == ' ') break;
        }

        fputs($socket, "STARTTLS\r\n");
        fgets($socket, 512);

        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

        fputs($socket, "EHLO localhost\r\n");
        while ($line = fgets($socket, 512)) {
            if (substr($line, 3, 1) == ' ') break;
        }

        fputs($socket, "AUTH LOGIN\r\n");
        fgets($socket, 512);
        fputs($socket, base64_encode($smtpUser) . "\r\n");
        fgets($socket, 512);
        fputs($socket, base64_encode($smtpPass) . "\r\n");
        $authResponse = fgets($socket, 512);

        if (substr($authResponse, 0, 3) != '235') {
            fclose($socket);
            return false;
        }

        fputs($socket, "MAIL FROM: <{$fromEmail}>\r\n");
        fgets($socket, 512);
        fputs($socket, "RCPT TO: <{$to}>\r\n");
        fgets($socket, 512);
        fputs($socket, "DATA\r\n");
        fgets($socket, 512);

        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "To: {$to}\r\n";
        $headers .= "Subject: {$subject}\r\n";

        fputs($socket, "{$headers}\r\n{$htmlMessage}\r\n.\r\n");
        fgets($socket, 512);
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return true;
    } catch (Exception $e) {
        return false;
    }
}
