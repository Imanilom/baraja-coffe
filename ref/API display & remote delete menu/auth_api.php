<?php
// C:\xampp\htdocs\display2\auth_api.php
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

$storageDir = __DIR__ . '/storage';
if (!file_exists($storageDir)) {
    mkdir($storageDir, 0777, true);
}

$requestsFile = "$storageDir/auth_requests.json";
$configFile = "$storageDir/auth_config.json";

// Initialize files if not exist
if (!file_exists($requestsFile)) {
    file_put_contents($requestsFile, json_encode([]));
}

if (!file_exists($configFile)) {
    file_put_contents($configFile, json_encode(['master_pin' => '122333']));
}

function getRequests() {
    global $requestsFile;
    $content = @file_get_contents($requestsFile);
    return json_decode($content, true) ?? [];
}

function saveRequests($requests) {
    global $requestsFile;
    file_put_contents($requestsFile, json_encode(array_values($requests), JSON_PRETTY_PRINT));
}

function getConfig() {
    global $configFile;
    $content = @file_get_contents($configFile);
    return json_decode($content, true) ?? ['master_pin' => '122333'];
}

function saveConfig($config) {
    global $configFile;
    file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
}

$action = $_GET['action'] ?? $_POST['action'] ?? null;

// Handle JSON input
$rawInput = file_get_contents('php://input');
$data = [];
if (!empty($rawInput)) {
    $data = json_decode($rawInput, true) ?? [];
}
if (empty($action) && isset($data['action'])) {
    $action = $data['action'];
}

header('Content-Type: application/json');

// ─── 1. REQUEST AUTHORIZATION (CASHIER APP) ──────────────────────────────────
if ($action === 'request_auth') {
    $cashierName = $data['cashier_name'] ?? $_POST['cashier_name'] ?? 'Kasir';
    $reason = $data['reason'] ?? $_POST['reason'] ?? 'Penghapusan/Pengurangan Item';
    $orderId = $data['order_id'] ?? $_POST['order_id'] ?? '-';
    $itemName = $data['item_name'] ?? $_POST['item_name'] ?? '-';
    $deviceId = $data['device_id'] ?? $_POST['device_id'] ?? 'KASIR_UTAMA';

    $requestId = 'REQ-' . date('Ymd-His') . '-' . rand(100, 999);

    $requests = getRequests();
    $newRequest = [
        'request_id' => $requestId,
        'cashier_name' => $cashierName,
        'reason' => $reason,
        'order_id' => $orderId,
        'item_name' => $itemName,
        'device_id' => $deviceId,
        'status' => 'pending', // pending, approved, rejected, expired
        'created_at' => date('Y-m-d H:i:s'),
        'timestamp' => time(),
        'approved_by' => null,
        'updated_at' => null
    ];

    array_unshift($requests, $newRequest);
    if (count($requests) > 100) {
        $requests = array_slice($requests, 0, 100);
    }
    saveRequests($requests);

    echo json_encode([
        'status' => 'success',
        'message' => 'Permintaan otorisasi berhasil dikirim',
        'request_id' => $requestId,
        'request' => $newRequest
    ]);
    exit;
}

// ─── 2. CHECK REQUEST STATUS (CASHIER APP POLLING) ─────────────────────────
if ($action === 'check_request_status') {
    $requestId = $_GET['request_id'] ?? $data['request_id'] ?? '';
    if (empty($requestId)) {
        echo json_encode(['status' => 'error', 'message' => 'request_id required']);
        exit;
    }

    $requests = getRequests();
    foreach ($requests as $req) {
        if ($req['request_id'] === $requestId) {
            echo json_encode([
                'status' => 'success',
                'request_status' => $req['status'],
                'request' => $req
            ]);
            exit;
        }
    }

    echo json_encode(['status' => 'error', 'message' => 'Request not found']);
    exit;
}

// ─── 3. GET PENDING & HISTORY REQUESTS (WEB MANAGER) ─────────────────────────
if ($action === 'get_requests') {
    $requests = getRequests();
    $config = getConfig();
    
    // Auto-expire requests older than 10 minutes that are still pending
    $changed = false;
    $now = time();
    foreach ($requests as &$req) {
        if ($req['status'] === 'pending' && ($now - $req['timestamp']) > 600) {
            $req['status'] = 'expired';
            $changed = true;
        }
    }
    if ($changed) {
        saveRequests($requests);
    }

    echo json_encode([
        'status' => 'success',
        'requests' => $requests,
        'master_pin' => $config['master_pin'] ?? '122333'
    ]);
    exit;
}

// ─── 4. APPROVE / REJECT REQUEST (WEB MANAGER) ──────────────────────────────
if ($action === 'approve_request' || $action === 'reject_request') {
    $requestId = $data['request_id'] ?? $_POST['request_id'] ?? '';
    $pin = $data['pin'] ?? $_POST['pin'] ?? '';
    $managerName = $data['manager_name'] ?? $_POST['manager_name'] ?? 'Manager';
    $newStatus = ($action === 'approve_request') ? 'approved' : 'rejected';

    $config = getConfig();
    if (!empty($pin) && $pin !== $config['master_pin']) {
        echo json_encode(['status' => 'error', 'message' => 'PIN/Password Manager Salah']);
        exit;
    }

    $requests = getRequests();
    $found = false;
    foreach ($requests as &$req) {
        if ($req['request_id'] === $requestId) {
            $req['status'] = $newStatus;
            $req['approved_by'] = $managerName;
            $req['updated_at'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }

    if ($found) {
        saveRequests($requests);
        echo json_encode([
            'status' => 'success',
            'message' => 'Status otorisasi berhasil diperbarui menjadi ' . strtoupper($newStatus),
            'request_id' => $requestId,
            'new_status' => $newStatus
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Request ID tidak ditemukan']);
    }
    exit;
}

// ─── 5. UPDATE MASTER PIN (WEB MANAGER) ──────────────────────────────────────
if ($action === 'update_master_pin') {
    $oldPin = $data['old_pin'] ?? $_POST['old_pin'] ?? '';
    $newPin = $data['new_pin'] ?? $_POST['new_pin'] ?? '';

    $config = getConfig();
    if ($oldPin !== $config['master_pin']) {
        echo json_encode(['status' => 'error', 'message' => 'PIN Lama Tidak Sesuai']);
        exit;
    }

    if (empty($newPin) || strlen($newPin) < 4) {
        echo json_encode(['status' => 'error', 'message' => 'PIN Baru minimal 4 karakter']);
        exit;
    }

    $config['master_pin'] = $newPin;
    saveConfig($config);

    echo json_encode([
        'status' => 'success',
        'message' => 'PIN Master Otorisasi berhasil diperbarui'
    ]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Action tidak valid']);
