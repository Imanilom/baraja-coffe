<?php
/**
 * BARIDIN AI Flow & Monitoring Dashboard
 * URL: http://localhost/chatbot/ai_flow.php
 */
session_start();

$configFile = __DIR__ . '/config.json';
$config = json_decode(@file_get_contents($configFile), true) ?: [];
$adminPassword = $config['admin_password'] ?? 'barajacoffee';

// Check authentication
if (empty($_SESSION['admin_logged_in'])) {
    $isAjax = (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') 
           || isset($_GET['action']);
    if ($isAjax) {
        header('Content-Type: application/json', true, 401);
        echo json_encode(['status' => 'error', 'message' => 'Sesi login telah berakhir. Silakan login kembali.']);
        exit;
    }
    header('Location: admin.php');
    exit;
}

// Handle AJAX actions
if (isset($_GET['action'])) {
    header('Content-Type: application/json; charset=utf-8');
    $act = $_GET['action'];

    if ($act === 'get_chatlog') {
        $file = __DIR__ . '/chatbot.log';
        if (!file_exists($file)) { echo json_encode(['lines' => []]); exit; }
        $lines = array_filter(array_map('trim', file($file)));
        $lines = array_values(array_slice($lines, -100));
        echo json_encode(['lines' => $lines]);
        exit;
    }

    if ($act === 'get_gemini_log') {
        $file = __DIR__ . '/gemini_rotation.log';
        if (!file_exists($file)) { echo json_encode(['lines' => []]); exit; }
        $lines = array_filter(array_map('trim', file($file)));
        $lines = array_values(array_slice($lines, -60));
        echo json_encode(['lines' => $lines]);
        exit;
    }

    if ($act === 'get_sessions') {
        $dir = __DIR__ . '/sessions';
        $sessions = [];
        if (is_dir($dir)) {
            $files = glob($dir . '/*.json');
            foreach ($files as $f) {
                $raw = @file_get_contents($f);
                $hist = json_decode($raw, true) ?: [];
                $sessions[] = [
                    'filename' => basename($f),
                    'path' => $f,
                    'size' => filesize($f),
                    'mtime' => filemtime($f),
                    'mtime_fmt' => date('d M Y H:i:s', filemtime($f)),
                    'turns' => count($hist),
                    'messages' => array_slice($hist, -4),
                    'full_history' => $hist
                ];
            }
            usort($sessions, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
        }
        echo json_encode(['sessions' => $sessions]);
        exit;
    }

    if ($act === 'delete_session') {
        $file = $_POST['file'] ?? '';
        $path = __DIR__ . '/sessions/' . basename($file);
        if (file_exists($path)) {
            @unlink($path);
            echo json_encode(['status' => 'success', 'message' => 'Sesi memori berhasil dihapus']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'File sesi tidak ditemukan']);
        }
        exit;
    }

    if ($act === 'clear_logs') {
        $target = $_POST['target'] ?? 'all';
        if ($target === 'chatbot' || $target === 'all') {
            @file_put_contents(__DIR__ . '/chatbot.log', '');
        }
        if ($target === 'gemini' || $target === 'all') {
            @file_put_contents(__DIR__ . '/gemini_rotation.log', '');
        }
        echo json_encode(['status' => 'success', 'message' => 'Log berhasil dibersihkan']);
        exit;
    }

    if ($act === 'test_key') {
        $key = trim($_POST['key'] ?? '');
        if (empty($key)) {
            echo json_encode(['status' => 'error', 'message' => 'API Key kosong']);
            exit;
        }

        $models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
        $success = false;
        $resText = '';
        $latency = 0;
        $lastErr = '';

        foreach ($models as $m) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key=" . urlencode($key);
            $payload = [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [['text' => 'Ping check. Reply with "BARIDIN_ONLINE".']]
                    ]
                ],
                'generationConfig' => [
                    'maxOutputTokens' => 15,
                    'temperature' => 0.1
                ]
            ];

            $start = microtime(true);
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $res = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            $latency = round((microtime(true) - $start) * 1000);

            if ($err) {
                $lastErr = 'cURL: ' . $err;
                continue;
            }

            $json = json_decode($res, true);
            if ($httpCode === 200 && isset($json['candidates'][0]['content']['parts'][0]['text'])) {
                $reply = trim($json['candidates'][0]['content']['parts'][0]['text']);
                echo json_encode(['status' => 'success', 'latency_ms' => $latency, 'reply' => $reply, 'model' => $m, 'http_code' => 200]);
                exit;
            } else {
                $lastErr = $json['error']['message'] ?? ('HTTP ' . $httpCode);
            }
        }

        echo json_encode(['status' => 'error', 'latency_ms' => $latency, 'message' => $lastErr]);
        exit;
    }

    if ($act === 'simulate_ai') {
        $userMsg = trim($_POST['message'] ?? '');
        $sender = trim($_POST['sender'] ?? '628999999999');
        $pushName = trim($_POST['push_name'] ?? 'Test User');

        if (empty($userMsg)) {
            echo json_encode(['status' => 'error', 'message' => 'Pesan simulasi tidak boleh kosong']);
            exit;
        }

        // Baca config
        $configFile = __DIR__ . '/config.json';
        $config = json_decode(@file_get_contents($configFile), true) ?: [];
        $apiKeys = $config['gemini_api_keys'] ?? [];
        if (empty($apiKeys) && !empty($config['gemini_api_key'])) {
            $apiKeys = [$config['gemini_api_key']];
        }

        if (empty($apiKeys)) {
            echo json_encode(['status' => 'error', 'message' => 'Tidak ada Gemini API Key yang terkonfigurasi di config.json']);
            exit;
        }

        // Baca cache menu
        $menuCacheFile = __DIR__ . '/menu_cache.json';
        $menuData = json_decode(@file_get_contents($menuCacheFile), true) ?: [];
        $disabledItems = $config['disabled_items'] ?? [];
        $disabledCats = $config['disabled_categories'] ?? [];

        // RAG Catalog extraction
        $catalogText = "";
        $matchedItems = [];
        $words = preg_split('/\s+/', strtolower($userMsg));

        if (is_array($menuData)) {
            foreach ($menuData as $cat => $items) {
                if (in_array($cat, $disabledCats)) continue;
                if (!is_array($items)) continue;

                $catMatched = [];
                foreach ($items as $it) {
                    $name = $it['name'] ?? '';
                    if (in_array($name, $disabledItems)) continue;

                    // Match logic
                    $nameLower = strtolower($name);
                    $matched = false;
                    foreach ($words as $w) {
                        if (strlen($w) >= 3 && strpos($nameLower, $w) !== false) {
                            $matched = true;
                            break;
                        }
                    }

                    if ($matched || count($matchedItems) < 15) {
                        $price = isset($it['price']) ? 'Rp ' . number_format($it['price'], 0, ',', '.') : 'Rp -';
                        $status = ($it['status'] ?? '1') == '1' ? 'READY' : 'HABIS';
                        $catMatched[] = "• {$name} ({$price}) [{$status}]";
                        if ($matched) $matchedItems[] = $name;
                    }
                }

                if (!empty($catMatched)) {
                    $catalogText .= "\n[KATEGORI: {$cat}]\n" . implode("\n", array_slice($catMatched, 0, 8)) . "\n";
                }
            }
        }

        // Recommendations
        $recomText = "";
        if (!empty($config['recommended_items'])) {
            $recoms = array_filter($config['recommended_items'], fn($i) => !in_array($i, $disabledItems));
            if (!empty($recoms)) {
                $recomText = "\n\nMENU REKOMENDASI UTAMA:\n- " . implode("\n- ", $recoms);
            }
        }

        // Assemble Full Prompt
        $systemInstruction = ($config['system_instruction'] ?? '') . $recomText . "\n\nDATA KATALOG KASIR REAL-TIME:\n" . $catalogText;

        // Session memory simulation
        $sessionFile = __DIR__ . '/sessions/' . md5($sender) . '.json';
        $history = file_exists($sessionFile) ? (json_decode(@file_get_contents($sessionFile), true) ?: []) : [];

        $contents = [];
        foreach ($history as $h) {
            $contents[] = [
                'role' => $h['role'] === 'user' ? 'user' : 'model',
                'parts' => [['text' => $h['text']]]
            ];
        }
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMsg]]
        ];

        // Call Gemini
        $success = false;
        $aiReply = "";
        $keyUsed = "";
        $modelUsed = "gemini-3.5-flash-lite";
        $latency = 0;
        $errorDetails = [];
        $models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

        foreach ($apiKeys as $idx => $k) {
            $key = trim($k);
            if (empty($key)) continue;

            foreach ($models as $m) {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key=" . urlencode($key);
                $payload = [
                    'system_instruction' => [
                        'parts' => [['text' => $systemInstruction]]
                    ],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.65,
                        'topP' => 0.95,
                        'topK' => 40,
                        'maxOutputTokens' => 1024
                    ]
                ];

                $start = microtime(true);
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_TIMEOUT, 15);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $res = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                $latency = round((microtime(true) - $start) * 1000);

                $json = json_decode($res, true);
                if ($httpCode === 200 && isset($json['candidates'][0]['content']['parts'][0]['text'])) {
                    $aiReply = trim($json['candidates'][0]['content']['parts'][0]['text']);
                    $keyUsed = 'Key #' . ($idx + 1) . ' (' . substr($key, 0, 8) . '...' . substr($key, -4) . ')';
                    $modelUsed = $m;
                    $success = true;
                    break 2;
                } else {
                    $errorDetails[] = 'Key #' . ($idx + 1) . " [{$m}]: HTTP " . $httpCode . ' - ' . ($json['error']['message'] ?? 'Unknown Error');
                }
            }
        }

        if ($success) {
            echo json_encode([
                'status' => 'success',
                'reply' => $aiReply,
                'latency_ms' => $latency,
                'key_used' => $keyUsed,
                'model' => $modelUsed,
                'matched_rag_items' => $matchedItems,
                'system_prompt_preview' => mb_substr($systemInstruction, 0, 350) . '...',
                'history_turns' => count($history)
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Semua API Key gagal merespons.',
                'errors' => $errorDetails
            ]);
        }
        exit;
    }

    if ($act === 'get_quick_stats') {
        $configFile = __DIR__ . '/config.json';
        $config = json_decode(@file_get_contents($configFile), true) ?: [];
        $apiKeys = $config['gemini_api_keys'] ?? [];
        if (empty($apiKeys) && !empty($config['gemini_api_key'])) $apiKeys = [$config['gemini_api_key']];

        $menuCacheFile = __DIR__ . '/menu_cache.json';
        $menuData = json_decode(@file_get_contents($menuCacheFile), true) ?: [];
        $totalMenuItems = 0;
        if (is_array($menuData)) {
            foreach ($menuData as $items) {
                if (is_array($items)) $totalMenuItems += count($items);
            }
        }

        $sessionFiles = glob(__DIR__ . '/sessions/*.json') ?: [];
        $waStatusFile = __DIR__ . '/wa_status.json';
        $waStatus = json_decode(@file_get_contents($waStatusFile), true) ?: ['status' => 'offline'];

        echo json_encode([
            'wa_status' => $waStatus['status'] ?? 'offline',
            'key_count' => count($apiKeys),
            'menu_count' => $totalMenuItems,
            'session_count' => count($sessionFiles),
            'disabled_count' => count($config['disabled_items'] ?? [])
        ]);
        exit;
    }
}

// Load static config for initial render
$config = json_decode(@file_get_contents(__DIR__ . '/config.json'), true) ?: [];
$apiKeys = $config['gemini_api_keys'] ?? [];
if (empty($apiKeys) && !empty($config['gemini_api_key'])) $apiKeys = [$config['gemini_api_key']];
$waStatus = json_decode(@file_get_contents(__DIR__ . '/wa_status.json'), true) ?: ['status' => 'offline'];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BARIDIN AI Flow & Monitoring Dashboard | Baraja Coffee</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    
    <style>
        :root {
            --bg-body: #0a0e17;
            --bg-sidebar: #0f1523;
            --bg-card: #141c2e;
            --bg-card-subtle: rgba(20, 28, 46, 0.7);
            --bg-input: #1a243a;
            --border: #23304a;
            --border-highlight: #34466d;
            --primary: #f59e0b;
            --primary-light: #fbbf24;
            --primary-glow: rgba(245, 158, 11, 0.2);
            --accent-cyan: #06b6d4;
            --accent-emerald: #10b981;
            --accent-rose: #f43f5e;
            --accent-purple: #8b5cf6;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --text-dim: #64748b;
            --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            --radius-lg: 16px;
            --radius-md: 10px;
            --radius-sm: 6px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: var(--font-sans);
        }

        body {
            background-color: var(--bg-body);
            color: var(--text-main);
            display: flex;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Sidebar Navigation */
        .sidebar {
            width: 270px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 100;
        }

        .brand-header {
            padding: 24px;
            display: flex;
            align-items: center;
            gap: 14px;
            border-bottom: 1px solid var(--border);
        }

        .brand-logo {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, var(--primary), #d97706);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-size: 22px;
            font-weight: 800;
            box-shadow: 0 4px 16px var(--primary-glow);
        }

        .brand-text h2 {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .brand-text span {
            font-size: 11px;
            color: var(--primary);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .nav-list {
            padding: 20px 14px;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
            overflow-y: auto;
        }

        .nav-item a {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 13.5px;
            font-weight: 500;
            border-radius: var(--radius-md);
            transition: all 0.2s ease;
        }

        .nav-item a:hover {
            background: rgba(255, 255, 255, 0.04);
            color: var(--text-main);
        }

        .nav-item.active a {
            background: linear-gradient(90deg, rgba(245, 158, 11, 0.15), transparent);
            color: var(--primary-light);
            border-left: 3px solid var(--primary);
            font-weight: 600;
        }

        .nav-item a i {
            font-size: 16px;
            width: 20px;
            text-align: center;
        }

        .sidebar-footer {
            padding: 18px 20px;
            border-top: 1px solid var(--border);
            background: rgba(0, 0, 0, 0.2);
        }

        .status-badge-pill {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 30px;
            font-size: 12px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent-emerald);
            display: inline-block;
            box-shadow: 0 0 10px var(--accent-emerald);
        }

        .status-dot.offline {
            background: var(--accent-rose);
            box-shadow: 0 0 10px var(--accent-rose);
        }

        /* Main Workspace Content */
        .main-wrapper {
            margin-left: 270px;
            flex: 1;
            padding: 30px 40px;
            max-width: 1500px;
        }

        /* Top Header */
        .top-navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 28px;
        }

        .page-title h1 {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .page-title p {
            color: var(--text-muted);
            font-size: 13.5px;
            margin-top: 4px;
        }

        .action-tools {
            display: flex;
            gap: 12px;
        }

        .btn {
            padding: 10px 18px;
            border-radius: var(--radius-md);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            transition: all 0.2s;
            border: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary), #d97706);
            color: #000;
            box-shadow: 0 4px 14px var(--primary-glow);
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            filter: brightness(1.08);
        }

        .btn-secondary {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-main);
        }

        .btn-secondary:hover {
            background: var(--bg-input);
            border-color: var(--border-highlight);
        }

        .btn-sm {
            padding: 6px 12px;
            font-size: 11.5px;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
            margin-bottom: 28px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 20px;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s, border-color 0.2s;
        }

        .stat-card:hover {
            border-color: var(--border-highlight);
            transform: translateY(-2px);
        }

        .stat-card .stat-icon {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            background: rgba(255, 255, 255, 0.04);
            color: var(--text-muted);
        }

        .stat-card.c-amber .stat-icon { background: rgba(245, 158, 11, 0.15); color: var(--primary); }
        .stat-card.c-cyan .stat-icon { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); }
        .stat-card.c-emerald .stat-icon { background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); }
        .stat-card.c-purple .stat-icon { background: rgba(139, 92, 246, 0.15); color: var(--accent-purple); }

        .stat-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-value {
            font-size: 26px;
            font-weight: 800;
            margin: 8px 0 4px 0;
            letter-spacing: -0.5px;
        }

        .stat-sub {
            font-size: 11.5px;
            color: var(--text-dim);
        }

        /* Flow Visualizer Box */
        .flow-section {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
            margin-bottom: 28px;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-title i {
            color: var(--primary);
        }

        /* Interactive Architecture Flow Nodes */
        .flow-steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 14px;
            position: relative;
        }

        .flow-node {
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 16px;
            position: relative;
            transition: all 0.2s;
        }

        .flow-node:hover {
            border-color: var(--primary);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .flow-node-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            background: rgba(255,255,255,0.08);
            display: inline-block;
            margin-bottom: 8px;
            color: var(--primary);
        }

        .flow-node h4 {
            font-size: 13.5px;
            font-weight: 700;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .flow-node p {
            font-size: 11.5px;
            color: var(--text-muted);
            line-height: 1.5;
        }

        /* Split Section: Sandbox & Logs */
        .split-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 24px;
            margin-bottom: 28px;
        }

        @media (max-width: 1100px) {
            .split-grid {
                grid-template-columns: 1fr;
            }
        }

        .card-box {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
            display: flex;
            flex-direction: column;
        }

        /* Form Inputs */
        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            font-size: 12.5px;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--text-muted);
        }

        .form-control {
            width: 100%;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 10px 14px;
            color: var(--text-main);
            font-size: 13.5px;
            outline: none;
            transition: border-color 0.2s;
        }

        .form-control:focus {
            border-color: var(--primary);
        }

        textarea.form-control {
            resize: vertical;
            min-height: 85px;
        }

        /* AI Output Box */
        .ai-output-box {
            background: var(--bg-body);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 16px;
            margin-top: 14px;
            min-height: 140px;
            position: relative;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .ai-output-box.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-dim);
            font-style: italic;
        }

        .ai-meta-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            background: rgba(255,255,255,0.05);
            margin-right: 6px;
            margin-top: 8px;
            color: var(--text-muted);
        }

        .ai-meta-tag i {
            color: var(--primary);
        }

        /* Log Terminals */
        .terminal-box {
            background: #070a10;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 14px;
            font-family: var(--font-mono);
            font-size: 11.5px;
            height: 380px;
            overflow-y: auto;
            color: #d1d5db;
            line-height: 1.6;
        }

        .terminal-line {
            padding: 2px 0;
            border-bottom: 1px solid rgba(255,255,255,0.02);
            word-break: break-all;
        }

        .terminal-line .timestamp {
            color: var(--text-dim);
            margin-right: 8px;
        }

        .terminal-line.rot-success { color: #34d399; }
        .terminal-line.rot-error { color: #f87171; }
        .terminal-line.rot-warn { color: #fbbf24; }

        /* Key Rotation List */
        .key-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            margin-bottom: 10px;
            font-size: 13px;
        }

        .key-info {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: var(--font-mono);
        }

        .key-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(245,158,11,0.15);
            color: var(--primary);
        }

        /* Active Sessions Table */
        .session-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
        }

        .session-table th {
            text-align: left;
            padding: 10px 14px;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
            font-weight: 600;
        }

        .session-table td {
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            vertical-align: top;
        }

        .session-table tr:hover td {
            background: rgba(255, 255, 255, 0.02);
        }

        /* Tab buttons */
        .tabs {
            display: flex;
            gap: 8px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 16px;
            padding-bottom: 8px;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 13px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s;
        }

        .tab-btn.active {
            background: var(--bg-input);
            color: var(--primary);
        }

        /* Badge status */
        .badge {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }

        .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .badge-danger { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

        /* Spinner */
        .spin {
            animation: fa-spin 1s infinite linear;
        }
    </style>
</head>
<body>

    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="brand-header">
            <div class="brand-logo">
                <i class="fa-solid fa-mug-hot"></i>
            </div>
            <div class="brand-text">
                <h2>BARIDIN AI</h2>
                <span>Flow & Diagnostics</span>
            </div>
        </div>

        <ul class="nav-list">
            <li class="nav-item">
                <a href="admin.php">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Kembali ke Admin</span>
                </a>
            </li>
            <li class="nav-item active">
                <a href="#pipeline">
                    <i class="fa-solid fa-network-wired"></i>
                    <span>AI Flow Architecture</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="#sandbox">
                    <i class="fa-solid fa-vial-circle-check"></i>
                    <span>Live AI Simulator</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="#keys">
                    <i class="fa-solid fa-key"></i>
                    <span>Multi-Key Manager</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="#sessions">
                    <i class="fa-solid fa-comments"></i>
                    <span>Session Inspector</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="#logs">
                    <i class="fa-solid fa-terminal"></i>
                    <span>Live Stream Logs</span>
                </a>
            </li>
            <li class="nav-item" style="margin-top:auto">
                <a href="admin.php?action=logout" style="color:var(--accent-rose)" onclick="return confirm('Yakin ingin keluar dari Backoffice?')">
                    <i class="fa-solid fa-right-from-bracket" style="color:var(--accent-rose)"></i>
                    <span>Logout Admin</span>
                </a>
            </li>
        </ul>

        <div class="sidebar-footer">
            <div class="status-badge-pill">
                <span style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-dot <?= ($waStatus['status'] ?? '') === 'connected' ? '' : 'offline' ?>" id="waDot"></span>
                    <strong id="waStatusText"><?= ($waStatus['status'] ?? '') === 'connected' ? 'WA Online' : 'WA ' . ucfirst($waStatus['status'] ?? 'Offline') ?></strong>
                </span>
                <span style="color: var(--text-dim); font-size: 11px;">v2.5 Flash</span>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-wrapper">

        <!-- Top Nav -->
        <div class="top-navbar">
            <div class="page-title">
                <h1><i class="fa-solid fa-microchip" style="color: var(--primary);"></i> AI Flow Architecture & Diagnostics</h1>
                <p>Pemantauan alur pemrosesan pesan WhatsApp, integrasi data katalog kasir (RAG), dan rotasi Gemini 2.5 Flash API</p>
            </div>
            <div class="action-tools">
                <button class="btn btn-secondary" onclick="refreshAllData()">
                    <i class="fa-solid fa-rotate" id="refreshIcon"></i> Refresh Data
                </button>
                <a href="admin.php" class="btn btn-primary">
                    <i class="fa-solid fa-sliders"></i> Pengaturan Bot
                </a>
            </div>
        </div>

        <!-- Stats Counter -->
        <div class="stats-grid">
            <div class="stat-card c-amber">
                <div class="stat-icon"><i class="fa-solid fa-key"></i></div>
                <div class="stat-label">Gemini API Keys</div>
                <div class="stat-value" id="sKeyCount"><?= count($apiKeys) ?></div>
                <div class="stat-sub">Rotasi otomatis multi-akun</div>
            </div>

            <div class="stat-card c-cyan">
                <div class="stat-icon"><i class="fa-solid fa-utensils"></i></div>
                <div class="stat-label">Katalog Live Kasir</div>
                <div class="stat-value" id="sMenuCount">...</div>
                <div class="stat-sub">Diambil via API POS Baraja</div>
            </div>

            <div class="stat-card c-emerald">
                <div class="stat-icon"><i class="fa-solid fa-user-group"></i></div>
                <div class="stat-label">Sesi Aktif Customer</div>
                <div class="stat-value" id="sSessCount">...</div>
                <div class="stat-sub">Memori konteks percakapan</div>
            </div>

            <div class="stat-card c-purple">
                <div class="stat-icon"><i class="fa-solid fa-ban"></i></div>
                <div class="stat-label">Item / Kategori Dinonaktifkan</div>
                <div class="stat-value" id="sDisabledCount"><?= count($config['disabled_items'] ?? []) ?></div>
                <div class="stat-sub">Diproteksi dari saran AI</div>
            </div>
        </div>

        <!-- Flow Pipeline Section -->
        <div class="flow-section" id="pipeline">
            <div class="section-header">
                <div class="section-title">
                    <i class="fa-solid fa-diagram-project"></i>
                    <span>Alur Pemrosesan Pesan End-to-End (Message Flow Pipeline)</span>
                </div>
                <span class="badge badge-success"><i class="fa-solid fa-bolt"></i> Realtime Webhook</span>
            </div>

            <div class="flow-steps">
                <div class="flow-node">
                    <span class="flow-node-badge">STEP 1</span>
                    <h4><i class="fa-brands fa-whatsapp" style="color: #25d366;"></i> WhatsApp In</h4>
                    <p>Pesan masuk dari pelanggan diterima oleh engine Baileys (Node.js) di background daemon.</p>
                </div>

                <div class="flow-node">
                    <span class="flow-node-badge">STEP 2</span>
                    <h4><i class="fa-solid fa-shield-halved" style="color: var(--accent-cyan);"></i> Validasi & Filter</h4>
                    <p>Filter grup/broadcast, sanitasi teks, cek reset pesanan, dan verifikasi status aktif bot.</p>
                </div>

                <div class="flow-node">
                    <span class="flow-node-badge">STEP 3</span>
                    <h4><i class="fa-solid fa-database" style="color: var(--primary);"></i> RAG Menu & Context</h4>
                    <p>Pencarian item relevan di SQLite/Cache Kasir, injeksi daftar rekomendasi, dan muat sesi percakapan.</p>
                </div>

                <div class="flow-node">
                    <span class="flow-node-badge">STEP 4</span>
                    <h4><i class="fa-solid fa-robot" style="color: var(--accent-purple);"></i> Gemini Flash Rotation</h4>
                    <p>Generasi balasan cerdas via Gemini 2.5 Flash dengan sistem rotasi otomatis multi-API Key.</p>
                </div>

                <div class="flow-node">
                    <span class="flow-node-badge">STEP 5</span>
                    <h4><i class="fa-solid fa-paper-plane" style="color: var(--accent-emerald);"></i> Kirim Balasan / Order</h4>
                    <p>Balas chat WhatsApp customer secara natural & forward pesanan ke Grup Kasir jika pesanan selesai.</p>
                </div>
            </div>
        </div>

        <!-- Split Grid: Live Simulator vs Gemini Key Manager -->
        <div class="split-grid">
            
            <!-- Live Simulator -->
            <div class="card-box" id="sandbox">
                <div class="section-header">
                    <div class="section-title">
                        <i class="fa-solid fa-flask-vial"></i>
                        <span>Interactive AI Flow Simulator (Live Sandbox)</span>
                    </div>
                    <span class="badge badge-warning">Simulasi Langsung</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Nama Pelanggan (PushName):</label>
                        <input type="text" id="simPushName" class="form-control" value="Kak Rangga">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nomor WhatsApp (Sender ID):</label>
                        <input type="text" id="simSender" class="form-control" value="6289912345678">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Pesan Customer (Pertanyaan / Pesanan):</label>
                    <textarea id="simMessage" class="form-control" placeholder="Contoh: Rekomendasi kopi yang best seller apa kak? Atau: Mau pesan Hellbraun 2 dan Nasi Goreng La Baraja 1 dine in meja 5..."></textarea>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="btn btn-primary" id="btnSimulate" onclick="runSimulation()">
                        <i class="fa-solid fa-play"></i> Jalankan Simulasi AI
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="setSimExample('Rekomendasi makanan yang enak dan nendang apa kak?')">
                        Contoh: Tanya Rekomendasi
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="setSimExample('Pesan Aglio Olio Prawn 1 dan Mojito Omar 1 ya kak, dine in meja 8')">
                        Contoh: Pesan Menu
                    </button>
                </div>

                <!-- Simulation Output -->
                <div style="margin-top: 18px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Hasil Respons BARIDIN AI:</span>
                        <span id="simStatus"></span>
                    </div>

                    <div class="ai-output-box empty" id="simOutputBox">
                        Klik 'Jalankan Simulasi AI' untuk melihat hasil balasan, latency waktu, dan token yang digunakan.
                    </div>

                    <div id="simMetaContainer" style="display: none; margin-top: 10px;">
                        <div class="ai-meta-tag"><i class="fa-solid fa-stopwatch"></i> Latency: <strong id="mLatency">-</strong></div>
                        <div class="ai-meta-tag"><i class="fa-solid fa-key"></i> <span id="mKey">-</span></div>
                        <div class="ai-meta-tag"><i class="fa-solid fa-microchip"></i> Model: <strong id="mModel">gemini-2.5-flash</strong></div>
                        <div class="ai-meta-tag"><i class="fa-solid fa-comments"></i> Konteks: <strong id="mTurns">0</strong> turn</div>
                        <div id="mRagItems" style="margin-top: 8px; font-size: 11.5px; color: var(--accent-cyan);"></div>
                    </div>
                </div>
            </div>

            <!-- Gemini Key Health & Rotation -->
            <div class="card-box" id="keys">
                <div class="section-header">
                    <div class="section-title">
                        <i class="fa-solid fa-key"></i>
                        <span>Status Rotasi API Key (Gemini Rotation)</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="testAllKeys()">
                        <i class="fa-solid fa-vial"></i> Uji Semua Key
                    </button>
                </div>

                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
                    Sistem mendistribusikan beban chat ke beberapa API Key Google AI Studio untuk mencegah rate-limit (HTTP 429 Quota Exceeded).
                </p>

                <div id="keyListContainer">
                    <?php if (empty($apiKeys)): ?>
                        <div style="padding: 20px; text-align: center; color: var(--text-dim);">
                            Belum ada API Key terpasang di config.json.
                        </div>
                    <?php else: ?>
                        <?php foreach ($apiKeys as $idx => $k): ?>
                            <div class="key-row" id="keyRow_<?= $idx ?>">
                                <div class="key-info">
                                    <span class="key-badge">KEY #<?= $idx + 1 ?></span>
                                    <span><?= htmlspecialchars(substr($k, 0, 12) . '...' . substr($k, -6)) ?></span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span id="keyStatus_<?= $idx ?>" class="badge badge-warning">Belum diuji</span>
                                    <button class="btn btn-secondary btn-sm" onclick="testSingleKey('<?= htmlspecialchars($k) ?>', <?= $idx ?>)">
                                        <i class="fa-solid fa-play"></i> Uji
                                    </button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <div style="margin-top: 16px; padding: 12px; background: rgba(245, 158, 11, 0.08); border-radius: var(--radius-md); border-left: 3px solid var(--primary); font-size: 12px; color: var(--text-muted);">
                    <strong style="color: var(--primary);">Tips:</strong> Tambahkan beberapa API Key di halaman <a href="admin.php" style="color: var(--primary); text-decoration: underline;">Pengaturan Bot</a> untuk memastikan bot selalu online 24/7 tanpa kendala kuota.
                </div>
            </div>

        </div>

        <!-- Split Grid: Session Inspector & Live Logs -->
        <div class="split-grid">
            
            <!-- Customer Session Inspector -->
            <div class="card-box" id="sessions">
                <div class="section-header">
                    <div class="section-title">
                        <i class="fa-solid fa-users-viewfinder"></i>
                        <span>Inspektur Sesi Memori Chat Customer</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="loadSessions()">
                        <i class="fa-solid fa-rotate"></i> Refresh Sesi
                    </button>
                </div>

                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
                    Daftar memori percakapan aktif yang disimpan di folder <code>sessions/</code> untuk menjaga alur multi-turn conversation.
                </p>

                <div style="max-height: 380px; overflow-y: auto;">
                    <table class="session-table">
                        <thead>
                            <tr>
                                <th>Sesi / File</th>
                                <th>Turn</th>
                                <th>Terakhir Aktif</th>
                                <th>Preview Chat</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="sessionTableBody">
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--text-dim); padding: 24px;">Memuat sesi...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Live Logs Terminal -->
            <div class="card-box" id="logs">
                <div class="section-header">
                    <div class="section-title">
                        <i class="fa-solid fa-terminal"></i>
                        <span>Live Stream Log</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="clearLogs()">
                            <i class="fa-solid fa-trash-can"></i> Bersihkan Log
                        </button>
                    </div>
                </div>

                <div class="tabs">
                    <button class="tab-btn active" id="tabChat" onclick="switchLogTab('chat')">
                        <i class="fa-brands fa-whatsapp"></i> Chatbot Log
                    </button>
                    <button class="tab-btn" id="tabGemini" onclick="switchLogTab('gemini')">
                        <i class="fa-solid fa-rotate"></i> Gemini Rotation Log
                    </button>
                </div>

                <div class="terminal-box" id="logTerminal">
                    <div style="color: var(--text-dim); text-align: center; padding: 20px;">Memuat log streaming...</div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 11.5px; color: var(--text-dim);">
                    <span><i class="fa-solid fa-circle-notch fa-spin"></i> Auto-refresh setiap 3 detik</span>
                    <span id="logLinesCount">0 baris log</span>
                </div>
            </div>

        </div>

    </main>

    <!-- Scripts -->
    <script>
        let currentLogTab = 'chat';
        let logInterval = null;

        document.addEventListener('DOMContentLoaded', () => {
            refreshAllData();
            startLogStream();
        });

        function refreshAllData() {
            const icon = document.getElementById('refreshIcon');
            icon.classList.add('spin');

            fetch('ai_flow.php?action=get_quick_stats')
                .then(r => r.json())
                .then(d => {
                    document.getElementById('sKeyCount').textContent = d.key_count;
                    document.getElementById('sMenuCount').textContent = d.menu_count + ' item';
                    document.getElementById('sSessCount').textContent = d.session_count + ' sesi';
                    document.getElementById('sDisabledCount').textContent = d.disabled_count + ' item';

                    const dot = document.getElementById('waDot');
                    const txt = document.getElementById('waStatusText');
                    if (d.wa_status === 'connected') {
                        dot.className = 'status-dot';
                        txt.textContent = 'WA Online';
                    } else if (d.wa_status === 'qr_ready') {
                        dot.className = 'status-dot';
                        dot.style.background = '#f59e0b';
                        txt.textContent = 'Scan QR';
                    } else {
                        dot.className = 'status-dot offline';
                        txt.textContent = 'WA Offline';
                    }
                })
                .catch(() => {})
                .finally(() => {
                    setTimeout(() => icon.classList.remove('spin'), 500);
                });

            loadSessions();
            loadLogs();
        }

        function setSimExample(text) {
            document.getElementById('simMessage').value = text;
        }

        function runSimulation() {
            const msg = document.getElementById('simMessage').value.trim();
            const sender = document.getElementById('simSender').value.trim();
            const pushName = document.getElementById('simPushName').value.trim();
            const btn = document.getElementById('btnSimulate');
            const box = document.getElementById('simOutputBox');
            const meta = document.getElementById('simMetaContainer');
            const status = document.getElementById('simStatus');

            if (!msg) {
                alert('Silakan tuliskan pesan simulasi terlebih dahulu.');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses Gemini AI...';
            box.className = 'ai-output-box';
            box.textContent = 'Sedang mengeksekusi pipeline: Validasi -> Ekstraksi RAG -> Rotasi API Key -> Gemini 2.5 Flash...';
            meta.style.display = 'none';
            status.innerHTML = '<span class="badge badge-warning"><i class="fa-solid fa-spinner fa-spin"></i> Running</span>';

            const fd = new FormData();
            fd.append('message', msg);
            fd.append('sender', sender);
            fd.append('push_name', pushName);

            fetch('ai_flow.php?action=simulate_ai', {
                method: 'POST',
                body: fd
            })
            .then(r => r.json())
            .then(d => {
                if (d.status === 'success') {
                    box.textContent = d.reply;
                    box.className = 'ai-output-box';
                    meta.style.display = 'block';
                    document.getElementById('mLatency').textContent = d.latency_ms + ' ms';
                    document.getElementById('mKey').textContent = d.key_used;
                    document.getElementById('mModel').textContent = d.model;
                    document.getElementById('mTurns').textContent = d.history_turns;

                    const ragEl = document.getElementById('mRagItems');
                    if (d.matched_rag_items && d.matched_rag_items.length > 0) {
                        ragEl.innerHTML = '<i class="fa-solid fa-database"></i> Menu RAG Cocok: <strong>' + d.matched_rag_items.join(', ') + '</strong>';
                    } else {
                        ragEl.innerHTML = '<i class="fa-solid fa-database"></i> Menu RAG: <em>Katalog Umum</em>';
                    }

                    status.innerHTML = '<span class="badge badge-success"><i class="fa-solid fa-check"></i> ' + d.latency_ms + 'ms</span>';
                } else {
                    box.textContent = 'ERROR SIMULASI: ' + d.message + (d.errors ? '\n\n' + d.errors.join('\n') : '');
                    status.innerHTML = '<span class="badge badge-danger">Gagal</span>';
                }
            })
            .catch(err => {
                box.textContent = 'Network / Script Error: ' + err;
                status.innerHTML = '<span class="badge badge-danger">Error</span>';
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-play"></i> Jalankan Simulasi AI';
            });
        }

        function testSingleKey(key, index) {
            const badge = document.getElementById('keyStatus_' + index);
            badge.className = 'badge badge-warning';
            badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menguji...';

            const fd = new FormData();
            fd.append('key', key);

            fetch('ai_flow.php?action=test_key', {
                method: 'POST',
                body: fd
            })
            .then(r => r.json())
            .then(d => {
                if (d.status === 'success') {
                    badge.className = 'badge badge-success';
                    badge.innerHTML = '<i class="fa-solid fa-check"></i> OK (' + d.latency_ms + 'ms)';
                } else {
                    badge.className = 'badge badge-danger';
                    badge.innerHTML = '<i class="fa-solid fa-xmark"></i> ' + (d.message.length > 18 ? d.message.substring(0, 18) + '...' : d.message);
                    badge.title = d.message;
                }
            })
            .catch(err => {
                badge.className = 'badge badge-danger';
                badge.innerHTML = '<i class="fa-solid fa-xmark"></i> Net Error';
            });
        }

        function testAllKeys() {
            const keys = <?= json_encode($apiKeys) ?>;
            keys.forEach((k, idx) => {
                setTimeout(() => testSingleKey(k, idx), idx * 300);
            });
        }

        function loadSessions() {
            const tbody = document.getElementById('sessionTableBody');
            fetch('ai_flow.php?action=get_sessions')
                .then(r => r.json())
                .then(d => {
                    const list = d.sessions || [];
                    if (list.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 24px;">Tidak ada sesi aktif di folder sessions/.</td></tr>';
                        return;
                    }

                    let html = '';
                    list.forEach(s => {
                        let previewText = '';
                        if (s.messages && s.messages.length > 0) {
                            const lastMsg = s.messages[s.messages.length - 1];
                            const role = lastMsg.role === 'user' ? 'Customer' : 'BARIDIN';
                            previewText = `<strong>${role}:</strong> ` + (lastMsg.text.length > 60 ? lastMsg.text.substring(0, 60) + '...' : lastMsg.text);
                        } else {
                            previewText = '<em>Sesi kosong</em>';
                        }

                        html += `
                            <tr>
                                <td>
                                    <div style="font-weight: 600; font-family: var(--font-mono); font-size: 11.5px;">${s.filename}</div>
                                    <div style="font-size: 11px; color: var(--text-dim);">${(s.size/1024).toFixed(1)} KB</div>
                                </td>
                                <td><span class="badge badge-warning">${s.turns} turn</span></td>
                                <td style="font-size: 11.5px; color: var(--text-muted);">${s.mtime_fmt}</td>
                                <td style="font-size: 11.5px; color: var(--text-muted); max-width: 250px;">${previewText}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" style="color: var(--accent-rose);" onclick="deleteSession('${s.filename}')" title="Hapus sesi memori">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                    tbody.innerHTML = html;
                })
                .catch(() => {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--accent-rose);">Gagal memuat sesi.</td></tr>';
                });
        }

        function deleteSession(filename) {
            if (!confirm(`Hapus memori percakapan untuk file ${filename}?`)) return;
            const fd = new FormData();
            fd.append('file', filename);

            fetch('ai_flow.php?action=delete_session', {
                method: 'POST',
                body: fd
            })
            .then(r => r.json())
            .then(d => {
                alert(d.message);
                loadSessions();
            });
        }

        function switchLogTab(tab) {
            currentLogTab = tab;
            document.getElementById('tabChat').className = tab === 'chat' ? 'tab-btn active' : 'tab-btn';
            document.getElementById('tabGemini').className = tab === 'gemini' ? 'tab-btn active' : 'tab-btn';
            loadLogs();
        }

        function loadLogs() {
            const terminal = document.getElementById('logTerminal');
            const linesCount = document.getElementById('logLinesCount');
            const act = currentLogTab === 'chat' ? 'get_chatlog' : 'get_gemini_log';

            fetch('ai_flow.php?action=' + act)
                .then(r => r.json())
                .then(d => {
                    const lines = d.lines || [];
                    linesCount.textContent = lines.length + ' baris log';
                    if (lines.length === 0) {
                        terminal.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 20px;">Belum ada catatan log.</div>';
                        return;
                    }

                    let html = '';
                    lines.forEach(l => {
                        let cls = 'terminal-line';
                        if (l.includes('SUCCESS') || l.includes('200 OK')) cls += ' rot-success';
                        else if (l.includes('FAIL') || l.includes('ERROR') || l.includes('429')) cls += ' rot-error';
                        else if (l.includes('ROTATE') || l.includes('WARN')) cls += ' rot-warn';

                        html += `<div class="${cls}">${escapeHtml(l)}</div>`;
                    });
                    terminal.innerHTML = html;
                    terminal.scrollTop = terminal.scrollHeight;
                })
                .catch(() => {});
        }

        function startLogStream() {
            if (logInterval) clearInterval(logInterval);
            logInterval = setInterval(() => {
                loadLogs();
            }, 3000);
        }

        function clearLogs() {
            const target = currentLogTab === 'chat' ? 'chatbot' : 'gemini';
            if (!confirm(`Bersihkan log ${currentLogTab === 'chat' ? 'Chatbot' : 'Gemini Rotation'}?`)) return;

            const fd = new FormData();
            fd.append('target', target);

            fetch('ai_flow.php?action=clear_logs', {
                method: 'POST',
                body: fd
            })
            .then(r => r.json())
            .then(d => {
                loadLogs();
            });
        }

        function escapeHtml(text) {
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    </script>
</body>
</html>
