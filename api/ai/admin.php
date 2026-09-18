<?php
/**
 * WhatsApp Bot Backoffice Admin Dashboard
 * URL Access: http://localhost/chatbot/admin.php
 */
session_start();

$configFile = __DIR__ . '/config.json';
$cacheFile  = __DIR__ . '/menu_cache.json';

// Load static config for initial login check
$configData = [
    'admin_password'     => 'barajacoffee',
    'gemini_api_key'     => '',
    'company_name'       => 'Baraja Coffee Amphitheater',
    'admin_phone'        => '0851-1708-9827',
    'bot_status'         => 'active',
    'recommended_items'  => [],
    'system_instruction' => ''
];

if (file_exists($configFile)) {
    $parsed = json_decode(file_get_contents($configFile), true);
    if (is_array($parsed)) {
        $configData = array_merge($configData, $parsed);
    }
}

$adminPassword = $configData['admin_password'] ?? 'barajacoffee';

// Handle Logout Action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    unset($_SESSION['admin_logged_in']);
    session_destroy();
    header('Location: admin.php');
    exit;
}

// Handle Login POST
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $inputPass = $_POST['password'] ?? '';
    if ($inputPass === $adminPassword) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: admin.php');
        exit;
    } else {
        $loginError = 'Password yang Anda masukkan salah!';
    }
}

// Check Authentication
if (empty($_SESSION['admin_logged_in'])) {
    $isAjax = (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') 
           || isset($_GET['action']) 
           || (isset($_POST['action']) && $_POST['action'] !== 'login');
           
    if ($isAjax) {
        header('Content-Type: application/json', true, 401);
        echo json_encode(['status' => 'error', 'message' => 'Sesi login telah berakhir. Silakan login kembali.']);
        exit;
    }
    renderLoginPage($loginError, $configData['company_name']);
    exit;
}

function renderLoginPage($loginError, $companyName) {
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin Backoffice — <?php echo htmlspecialchars($companyName); ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:wght@600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #19140f;
            color: #eceff2;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 1.5rem;
        }
        .login-card {
            width: 100%;
            max-width: 420px;
            background: #241d18;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 18px;
            padding: 2.25rem 2rem;
            box-shadow: 0 20px 60px rgba(0,0,0,.5);
        }
        .brand-mark {
            width: 52px; height: 52px;
            border-radius: 14px;
            background: linear-gradient(135deg, #d4a44e 0%, #8a6628 100%);
            color: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.35rem;
            margin: 0 auto 1.25rem;
            box-shadow: 0 4px 16px rgba(169,128,58,.35);
        }
        h1 {
            font-family: 'Fraunces', serif;
            font-size: 1.5rem;
            text-align: center;
            color: #fff;
            margin-bottom: .35rem;
        }
        .sub {
            text-align: center;
            font-size: .83rem;
            color: #a09589;
            margin-bottom: 1.75rem;
        }
        .form-control {
            background: #15110d;
            border: 1.5px solid rgba(255,255,255,.1);
            color: #fff;
            padding: .75rem 1rem;
            border-radius: 10px;
            font-size: .95rem;
        }
        .form-control:focus {
            background: #15110d;
            border-color: #d4a44e;
            color: #fff;
            box-shadow: 0 0 0 3px rgba(212,164,78,.15);
        }
        .btn-gold {
            background: linear-gradient(135deg, #d4a44e 0%, #8a6628 100%);
            color: #fff;
            border: none;
            padding: .75rem 1rem;
            border-radius: 10px;
            font-weight: 700;
            font-size: .95rem;
            width: 100%;
            margin-top: .5rem;
            transition: all .2s;
        }
        .btn-gold:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(169,128,58,.4);
            color: #fff;
        }
        .input-group-text {
            background: #15110d;
            border: 1.5px solid rgba(255,255,255,.1);
            border-left: 0;
            color: #a09589;
            cursor: pointer;
            border-radius: 0 10px 10px 0;
        }
        .input-group .form-control {
            border-right: 0;
            border-radius: 10px 0 0 10px;
        }
    </style>
</head>
<body>
<div class="login-card">
    <div class="brand-mark"><i class="fa-solid fa-mug-saucer"></i></div>
    <h1>BARIDIN Backoffice</h1>
    <div class="sub"><?php echo htmlspecialchars($companyName); ?> — Silakan login</div>

    <?php if (!empty($loginError)): ?>
        <div class="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
            <i class="fa-solid fa-circle-exclamation"></i>
            <div><?php echo htmlspecialchars($loginError); ?></div>
        </div>
    <?php endif; ?>

    <form method="POST" action="admin.php">
        <input type="hidden" name="action" value="login">
        <div class="mb-3">
            <label class="form-label small fw-semibold text-light mb-1">Password Admin</label>
            <div class="input-group">
                <input type="password" class="form-control" name="password" id="loginPass" placeholder="Masukkan password admin..." required autofocus>
                <span class="input-group-text" onclick="togglePassVisibility('loginPass', this)">
                    <i class="fa-regular fa-eye"></i>
                </span>
            </div>
        </div>
        <button type="submit" class="btn btn-gold">
            <i class="fa-solid fa-right-to-bracket me-2"></i>Masuk Admin
        </button>
    </form>
</div>
<script>
function togglePassVisibility(inputId, iconSpan) {
    const input = document.getElementById(inputId);
    const icon = iconSpan.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
    }
}
</script>
</body>
</html>
<?php
}

// Handle GET AJAX Quick Actions
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    $action = $_GET['action'];

    if ($action === 'get_wa_status') {
        $waStatusFile = __DIR__ . '/wa_status.json';
        if (file_exists($waStatusFile)) {
            echo file_get_contents($waStatusFile);
        } else {
            echo json_encode(['status' => 'disconnected', 'message' => 'Bot WhatsApp belum di-start. Jalankan node index.js.']);
        }
        exit;
    }

    if ($action === 'sync_cache') {
        $ch = curl_init('http://app.barajacoffee.site/api/menu/all-menu-items');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $resp = curl_exec($ch);
        curl_close($ch);
        if ($resp) {
            file_put_contents(__DIR__ . '/menu_cache.json', $resp);
            echo json_encode(['status' => 'success', 'message' => 'Katalog menu kasir berhasil disinkronkan ulang!']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data dari API Kasir Baraja Coffee.']);
        }
        exit;
    }

    if ($action === 'clear_sessions') {
        $files = glob(__DIR__ . '/sessions/*.json');
        $count = 0;
        foreach ($files as $f) {
            if (is_file($f)) {
                @unlink($f);
                $count++;
            }
        }
        echo json_encode(['status' => 'success', 'message' => "Berhasil membersihkan {$count} memori percakapan aktif."]);
        exit;
    }

    if ($action === 'logout_wa') {
        $authDir = __DIR__ . '/auth_info_baileys';
        if (is_dir($authDir)) {
            $files = glob($authDir . '/*');
            foreach ($files as $f) {
                if (is_file($f)) @unlink($f);
            }
            @rmdir($authDir);
        }
        @unlink(__DIR__ . '/wa_status.json');
        echo json_encode(['status' => 'success', 'message' => 'Sesi WhatsApp berhasil dilogout! QR Code baru akan dibuat secara otomatis.']);
        exit;
    }

    if ($action === 'sync_disabled_order') {
        $sqlitePath = 'C:/xampp/htdocs/order/database/database.sqlite';
        if (!file_exists($sqlitePath)) {
            echo json_encode(['status' => 'error', 'message' => "Database SQLite Order App tidak ditemukan."]);
            exit;
        }

        try {
            $db = new PDO('sqlite:' . $sqlitePath);
            $hiddenProductIds = $db->query("SELECT id FROM product_visibility_overrides WHERE is_hidden = 1")->fetchAll(PDO::FETCH_COLUMN);
            $hiddenCategoryIds = [];
            try {
                $hiddenCategoryIds = $db->query("SELECT id FROM category_overrides WHERE is_hidden = 1")->fetchAll(PDO::FETCH_COLUMN);
            } catch (Exception $e) {}

            // Map Category ID -> Category Name via API categories
            $catMap = [];
            $ch = curl_init('http://app.barajacoffee.site/api/menu/categories');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $catResp = curl_exec($ch);
            curl_close($ch);
            if ($catResp) {
                $catJson = json_decode($catResp, true);
                $catData = $catJson['data'] ?? $catJson ?? [];
                foreach ($catData as $c) {
                    if (isset($c['_id']) && isset($c['name'])) {
                        $catMap[$c['_id']] = $c['name'];
                    }
                }
            }

            $disabledCats = [];
            foreach ($hiddenCategoryIds as $catId) {
                if (isset($catMap[$catId])) {
                    $disabledCats[] = $catMap[$catId];
                }
            }
            $disabledCats = array_values(array_unique($disabledCats));

            $items = file_exists($cacheFile) ? (json_decode(file_get_contents($cacheFile), true)['data'] ?? []) : [];

            $disabledItems = [];
            foreach ($items as $item) {
                $name = $item['name'] ?? '';
                if (empty($name)) continue;
                $itemId = $item['id'] ?? $item['_id'] ?? '';
                $itemCat = is_string($item['category'] ?? null) ? $item['category'] : ($item['category']['name'] ?? '');

                if ((!empty($itemId) && in_array($itemId, $hiddenProductIds)) || (!empty($itemCat) && in_array($itemCat, $disabledCats))) {
                    $disabledItems[] = $name;
                }
            }

            $disabledItems = array_values(array_unique($disabledItems));
            $config = json_decode(file_get_contents($configFile), true);
            $config['disabled_items'] = array_values(array_unique(array_merge($config['disabled_items'] ?? [], $disabledItems)));
            $config['disabled_categories'] = array_values(array_unique(array_merge($config['disabled_categories'] ?? [], $disabledCats)));
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            echo json_encode(['status' => 'success', 'message' => 'Berhasil menyinkronkan ' . count($disabledItems) . ' menu non-aktif dan ' . count($disabledCats) . ' kategori non-aktif dari Order App ke config.json!']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal membaca SQLite Order App: ' . $e->getMessage()]);
        }
        exit;
    }
}

// Handle Save Settings Action via POST AJAX
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_settings') {
    header('Content-Type: application/json');

    $adminPass  = trim($_POST['admin_password'] ?? '');
    $rawKeys    = trim($_POST['gemini_api_key'] ?? '');
    $compName   = trim($_POST['company_name'] ?? '');
    $adminPhone = trim($_POST['admin_phone'] ?? '');
    $kasirGroup = trim($_POST['kasir_group_jid'] ?? '');
    $botStatus  = trim($_POST['bot_status'] ?? 'active');
    $sysPrompt  = trim($_POST['system_instruction'] ?? '');
    $recomItems = $_POST['recommended_items'] ?? [];
    $disabItems = $_POST['disabled_items'] ?? [];
    $disabCats  = $_POST['disabled_categories'] ?? [];

    if (!is_array($recomItems)) $recomItems = [];
    if (!is_array($disabItems)) $disabItems = [];
    if (!is_array($disabCats))  $disabCats  = [];

    $currConfig = file_exists($configFile) ? (json_decode(file_get_contents($configFile), true) ?: []) : [];
    if (empty($adminPass)) {
        $adminPass = $currConfig['admin_password'] ?? 'barajacoffee';
    }

    $keysList = preg_split('/[\r\n,]+/', $rawKeys);
    $cleanKeys = [];
    foreach ($keysList as $k) {
        $k = trim($k);
        if (!empty($k) && !in_array($k, $cleanKeys)) {
            $cleanKeys[] = $k;
        }
    }
    $primaryKey = $cleanKeys[0] ?? '';

    $newConfig = array_merge($currConfig, [
        'admin_password'      => $adminPass,
        'gemini_api_key'      => $primaryKey,
        'gemini_api_keys'     => $cleanKeys,
        'company_name'        => $compName,
        'admin_phone'         => $adminPhone,
        'kasir_group_jid'     => $kasirGroup,
        'bot_status'          => $botStatus,
        'disabled_categories' => array_values($disabCats),
        'disabled_items'      => array_values($disabItems),
        'recommended_items'   => array_values($recomItems),
        'system_instruction'  => $sysPrompt
    ]);

    if (file_put_contents($configFile, json_encode($newConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['status' => 'success', 'message' => 'Pengaturan Backoffice & Menu Rekomendasi berhasil disimpan!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan file konfigurasi. Check permission.']);
    }
    exit;
}


// Load Current Configuration
$configData = [
    'gemini_api_key'     => '',
    'company_name'       => 'Baraja Coffee Amphitheater',
    'admin_phone'        => '0851-1708-9827',
    'bot_status'         => 'active',
    'recommended_items'  => [],
    'system_instruction' => ''
];

if (file_exists($configFile)) {
    $jsonContent = file_get_contents($configFile);
    $parsed = json_decode($jsonContent, true);
    if (is_array($parsed)) {
        $configData = array_merge($configData, $parsed);
    }
}

// Load All Menu Items for Checkbox Selector
$allMenuItems = [];
$cacheUpdated = null;
if (file_exists($cacheFile)) {
    $rawCache = json_decode(file_get_contents($cacheFile), true);
    $allMenuItems = $rawCache['data'] ?? $rawCache ?? [];
    $cacheUpdated = date('d M Y H:i', filemtime($cacheFile));
} else {
    // Attempt live fetch if cache doesn't exist
    $ch = curl_init('http://app.barajacoffee.site/api/menu/all-menu-items');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $resp = curl_exec($ch);
    curl_close($ch);
    if ($resp) {
        file_put_contents($cacheFile, $resp);
        $rawCache = json_decode($resp, true);
        $allMenuItems = $rawCache['data'] ?? $rawCache ?? [];
        $cacheUpdated = date('d M Y H:i');
    }
}

// Filter valid menu items (non-zero price)
$validMenuList = [];
foreach ($allMenuItems as $m) {
    $name = $m['name'] ?? '';
    $price = $m['originalPrice'] ?? $m['price'] ?? 0;
    if (!empty($name) && $price > 0) {
        $validMenuList[] = [
            'name' => $name,
            'price' => $price,
            'category' => is_array($m['category'] ?? null) ? ($m['category']['name'] ?? 'Menu') : ($m['category'] ?? 'Menu')
        ];
    }
}

// Group categories for the filter dropdown
$categories = array_values(array_unique(array_map(fn($i) => $i['category'], $validMenuList)));
sort($categories);

$selectedCount = count($configData['recommended_items'] ?? []);
$isActive      = ($configData['bot_status'] ?? 'active') === 'active';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BARIDIN Backoffice — <?php echo htmlspecialchars($configData['company_name']); ?></title>
    <meta name="description" content="Admin backoffice dashboard untuk bot WhatsApp BARIDIN Baraja Coffee Amphitheater.">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet">

    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome 6 -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">

    <style>
        /* =========================================================
           ROOT TOKENS
        ========================================================= */
        :root {
            --sw:          268px;
            --ink:         #241d18;
            --ink-soft:    #7a716a;
            --ink-faint:   #b0a89e;
            --line:        #e8e2da;
            --paper:       #f5f2ee;
            --surface:     #ffffff;
            --gold:        #a9803a;
            --gold-dk:     #8a6628;
            --gold-lt:     #f5edde;
            --gold-mid:    #d4a44e;
            --sage:        #4d7a50;
            --sage-lt:     #e6f0e7;
            --rose:        #c0392b;
            --rose-lt:     #fdecea;
            --slate:       #5b6470;
            --slate-lt:    #eceff2;
            --sidebar-bg:  #19140f;
            --sidebar-ink: #cec5b8;
            --radius-lg:   14px;
            --radius-md:   10px;
            --radius-sm:   7px;
            --shadow-sm:   0 1px 3px rgba(36,29,24,.07), 0 1px 2px rgba(36,29,24,.04);
            --shadow-md:   0 4px 16px rgba(36,29,24,.10);
            --shadow-lg:   0 10px 40px rgba(36,29,24,.14);
            --transition:  .18s cubic-bezier(.4,0,.2,1);
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            background: var(--paper);
            color: var(--ink);
            font-size: .925rem;
            margin: 0;
        }

        h1, h2, h3, h4, .serif {
            font-family: 'Fraunces', Georgia, serif;
            font-weight: 600;
            letter-spacing: -.02em;
        }

        /* =========================================================
           SIDEBAR
        ========================================================= */
        .sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            width: var(--sw);
            background: var(--sidebar-bg);
            display: flex;
            flex-direction: column;
            z-index: 1040;
            transition: transform var(--transition);
        }

        .sidebar-brand {
            display: flex;
            align-items: center;
            gap: .85rem;
            padding: 1.4rem 1.5rem 1.25rem;
            border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .brand-mark {
            width: 42px; height: 42px;
            border-radius: 11px;
            background: linear-gradient(135deg, var(--gold-mid) 0%, var(--gold-dk) 100%);
            color: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.05rem;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(169,128,58,.35);
        }

        .brand-name { color: #fff; font-size: 1rem; font-weight: 700; line-height: 1.2; letter-spacing: .01em; }
        .brand-sub  { font-size: .72rem; color: #736b60; margin-top: .1rem; }

        .sidebar-nav { padding: 1rem .85rem; flex: 1; overflow-y: auto; }

        .nav-sect {
            font-size: .68rem;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: #4e463d;
            padding: .75rem .6rem .35rem;
            font-weight: 700;
        }

        .sidebar .nav-link {
            display: flex;
            align-items: center;
            gap: .75rem;
            color: var(--sidebar-ink);
            border-radius: var(--radius-sm);
            padding: .62rem .75rem;
            font-size: .875rem;
            font-weight: 500;
            margin-bottom: .1rem;
            transition: background var(--transition), color var(--transition);
            position: relative;
        }
        .sidebar .nav-link .nav-ico {
            width: 20px; text-align: center;
            font-size: .9rem;
            color: #5e5449;
            transition: color var(--transition);
            flex-shrink: 0;
        }
        .sidebar .nav-link:hover { background: rgba(255,255,255,.05); color: #fff; }
        .sidebar .nav-link:hover .nav-ico { color: var(--gold-mid); }
        .sidebar .nav-link.active {
            background: linear-gradient(90deg, rgba(169,128,58,.22) 0%, rgba(169,128,58,.08) 100%);
            color: var(--gold-mid);
            font-weight: 600;
        }
        .sidebar .nav-link.active::before {
            content: '';
            position: absolute;
            left: 0; top: 20%; bottom: 20%;
            width: 3px;
            border-radius: 0 3px 3px 0;
            background: var(--gold-mid);
        }
        .sidebar .nav-link.active .nav-ico { color: var(--gold-mid); }

        .sidebar-foot {
            padding: 1rem 1.5rem 1.25rem;
            border-top: 1px solid rgba(255,255,255,.07);
        }
        .wa-pill {
            display: inline-flex;
            align-items: center;
            gap: .45rem;
            background: rgba(77,122,80,.15);
            border: 1px solid rgba(77,122,80,.25);
            border-radius: 100px;
            padding: .35rem .85rem;
            font-size: .75rem;
            color: #7fc985;
        }
        .wa-pill .dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            background: #4caf6e;
            box-shadow: 0 0 0 2px rgba(76,175,110,.3);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 2px rgba(76,175,110,.3); }
            50%       { box-shadow: 0 0 0 5px rgba(76,175,110,.1); }
        }
        .outlet-name {
            font-size: .8rem;
            color: #5e5449;
            margin-top: .55rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* =========================================================
           MAIN LAYOUT
        ========================================================= */
        .main { margin-left: var(--sw); min-height: 100vh; display: flex; flex-direction: column; }

        .topbar {
            background: var(--surface);
            border-bottom: 1px solid var(--line);
            padding: .9rem 1.85rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            position: sticky; top: 0; z-index: 1030;
            box-shadow: var(--shadow-sm);
        }

        .topbar-breadcrumb { font-size: .75rem; color: var(--ink-faint); font-weight: 500; }
        .topbar-title { font-size: 1.2rem; margin: .15rem 0 0; }

        .topbar-actions { display: flex; align-items: center; gap: .65rem; }

        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: .4rem;
            padding: .42rem 1rem;
            border-radius: 100px;
            font-size: .8rem;
            font-weight: 600;
            cursor: default;
        }
        .status-pill .dot { width: 7px; height: 7px; border-radius: 50%; }
        .status-active  { background: var(--sage-lt); color: var(--sage); }
        .status-maint   { background: #fef9e7; color: #c67c0a; }

        .content { padding: 1.75rem 1.85rem; flex: 1; }

        /* =========================================================
           PANE ANIMATION
        ========================================================= */
        .pane { display: none; animation: paneFade .2s ease; }
        .pane.show { display: block; }
        @keyframes paneFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        /* =========================================================
           CARDS
        ========================================================= */
        .card {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
        }

        .card-hd {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 1.1rem 1.4rem;
            border-bottom: 1px solid var(--line);
        }
        .card-hd-title { font-size: 1rem; margin: 0; }
        .card-hd-sub   { font-size: .78rem; color: var(--ink-soft); margin: .1rem 0 0; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400; }
        .card-bd       { padding: 1.4rem; }

        /* =========================================================
           STAT CARDS
        ========================================================= */
        .stat {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: var(--radius-lg);
            padding: 1.25rem 1.3rem;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            transition: box-shadow var(--transition), transform var(--transition);
            height: 100%;
            position: relative;
            overflow: hidden;
        }
        .stat:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }
        .stat::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            border-radius: 0 0 var(--radius-lg) var(--radius-lg);
            opacity: 0;
            transition: opacity var(--transition);
        }
        .stat:hover::after { opacity: 1; }
        .stat-gold::after  { background: linear-gradient(90deg, var(--gold), var(--gold-mid)); }
        .stat-sage::after  { background: linear-gradient(90deg, var(--sage), #6aaa6d); }
        .stat-slate::after { background: linear-gradient(90deg, #5b6470, #8d97a5); }
        .stat-rose::after  { background: linear-gradient(90deg, var(--rose), #e74c3c); }

        .stat-ico {
            width: 46px; height: 46px;
            border-radius: var(--radius-md);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.05rem;
            flex-shrink: 0;
        }
        .ico-gold  { background: var(--gold-lt); color: var(--gold-dk); }
        .ico-sage  { background: var(--sage-lt); color: var(--sage); }
        .ico-slate { background: var(--slate-lt); color: var(--slate); }
        .ico-rose  { background: var(--rose-lt); color: var(--rose); }

        .stat-body { min-width: 0; }
        .stat-num  { font-size: 1.5rem; font-weight: 700; line-height: 1.1; font-family: 'Fraunces', serif; }
        .stat-lab  { font-size: .77rem; color: var(--ink-soft); margin-top: .15rem; }

        /* =========================================================
           WA GATEWAY CARD
        ========================================================= */
        .wa-card {
            background: var(--sidebar-bg);
            border-radius: var(--radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-md);
            margin-bottom: 1.5rem;
        }
        .wa-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.4rem;
            border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .wa-card-title { color: #fff; font-size: .95rem; font-weight: 600; display: flex; align-items: center; gap: .6rem; }
        .wa-card-body  { padding: 1.4rem; }

        .qr-box {
            background: rgba(255,255,255,.04);
            border: 1px solid rgba(255,255,255,.1);
            border-radius: var(--radius-md);
            min-height: 240px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1.25rem;
        }

        .wa-actions { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.1rem; }
        .btn-wa-action {
            display: inline-flex;
            align-items: center;
            gap: .45rem;
            padding: .5rem 1rem;
            border-radius: var(--radius-sm);
            font-size: .82rem;
            font-weight: 600;
            cursor: pointer;
            transition: background var(--transition), transform var(--transition);
            border: none;
        }
        .btn-wa-action:hover { transform: translateY(-1px); }
        .btn-wa-sync  { background: rgba(77,122,80,.2);  color: #7fc985; }
        .btn-wa-sync:hover  { background: rgba(77,122,80,.3); }
        .btn-wa-import { background: rgba(169,128,58,.2); color: var(--gold-mid); }
        .btn-wa-import:hover { background: rgba(169,128,58,.3); }
        .btn-wa-reset { background: rgba(214,186,51,.15); color: #d4b84a; }
        .btn-wa-reset:hover { background: rgba(214,186,51,.25); }
        .btn-wa-danger { background: rgba(192,57,43,.2);  color: #e57d72; }
        .btn-wa-danger:hover { background: rgba(192,57,43,.3); }

        /* =========================================================
           SUMMARY TABLE
        ========================================================= */
        .sumtable td { padding: .85rem 1rem; border-bottom: 1px solid var(--line); font-size: .875rem; }
        .sumtable tr:last-child td { border-bottom: none; }
        .sumtable .lbl { color: var(--ink-soft); width: 42%; display: flex; align-items: center; gap: .5rem; }
        .sumtable .val { font-weight: 600; }

        /* =========================================================
           CATEGORY TOGGLE PILLS
        ========================================================= */
        .cat-pill {
            display: inline-flex;
            align-items: center;
            gap: .45rem;
            padding: .42rem .9rem;
            border-radius: 100px;
            font-size: .8rem;
            font-weight: 600;
            cursor: pointer;
            border: 1.5px solid transparent;
            transition: all var(--transition);
            user-select: none;
        }
        .cat-pill input { display: none; }
        .cat-pill.enabled {
            background: var(--sage-lt);
            color: var(--sage);
            border-color: rgba(77,122,80,.25);
        }
        .cat-pill.disabled {
            background: var(--rose-lt);
            color: var(--rose);
            border-color: rgba(192,57,43,.2);
        }
        .cat-pill:hover { box-shadow: 0 2px 8px rgba(36,29,24,.12); transform: translateY(-1px); }
        .cat-pill .cat-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
        }
        .cat-pill.enabled .cat-dot  { background: var(--sage); }
        .cat-pill.disabled .cat-dot { background: var(--rose); }

        /* =========================================================
           MENU PICKER
        ========================================================= */
        .menu-scroll {
            max-height: 520px;
            overflow-y: auto;
            padding-right: .25rem;
        }
        .menu-scroll::-webkit-scrollbar { width: 6px; }
        .menu-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 6px; }

        .menu-card {
            display: flex;
            align-items: center;
            gap: .65rem;
            background: var(--surface);
            border: 1.5px solid var(--line);
            border-radius: var(--radius-md);
            padding: .72rem .9rem;
            cursor: pointer;
            transition: border-color var(--transition), background var(--transition), box-shadow var(--transition);
            height: 100%;
        }
        .menu-card:hover { border-color: var(--gold); background: #fffdf8; box-shadow: 0 2px 8px rgba(169,128,58,.1); }
        .menu-card.is-checked { border-color: var(--gold); background: var(--gold-lt); }
        .menu-card.is-disabled { border-color: rgba(192,57,43,.3) !important; background: var(--rose-lt) !important; opacity: .85; }

        .menu-chk { flex-shrink: 0; }
        .menu-chk input[type="checkbox"] { width: 16px; height: 16px; border-radius: 4px; cursor: pointer; accent-color: var(--gold-dk); }

        .menu-info { flex: 1; min-width: 0; }
        .menu-name { font-size: .85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .menu-meta { font-size: .75rem; color: var(--ink-soft); margin-top: .1rem; }
        .menu-price { color: var(--gold-dk); font-weight: 700; }

        .dis-toggle { flex-shrink: 0; text-align: center; }
        .dis-toggle label { display: flex; flex-direction: column; align-items: center; gap: .15rem; cursor: pointer; }
        .dis-toggle input { accent-color: var(--rose); width: 14px; height: 14px; cursor: pointer; }
        .dis-toggle .dis-lbl { font-size: .62rem; color: var(--rose); font-weight: 700; line-height: 1; }

        /* =========================================================
           FORM ELEMENTS
        ========================================================= */
        .form-label { font-size: .82rem; font-weight: 600; margin-bottom: .4rem; }
        .form-control, .form-select {
            border: 1.5px solid var(--line);
            border-radius: var(--radius-sm);
            padding: .62rem .9rem;
            font-size: .9rem;
            background: var(--surface);
            color: var(--ink);
            transition: border-color var(--transition), box-shadow var(--transition);
        }
        .form-control:focus, .form-select:focus {
            border-color: var(--gold);
            box-shadow: 0 0 0 3px rgba(169,128,58,.12);
            outline: none;
        }
        .form-text { font-size: .77rem; color: var(--ink-soft); margin-top: .35rem; }
        textarea.form-control { min-height: 280px; line-height: 1.7; font-size: .875rem; resize: vertical; }
        .input-group-text {
            background: #faf8f4;
            border: 1.5px solid var(--line);
            border-right: 0;
            color: var(--ink-soft);
            border-radius: var(--radius-sm) 0 0 var(--radius-sm);
        }
        .input-group .form-control { border-left: 0; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
        .input-group .form-control:focus { border-left: 0; }

        /* =========================================================
           BUTTONS
        ========================================================= */
        .btn { border-radius: var(--radius-sm); font-size: .875rem; font-weight: 600; transition: all var(--transition); }
        .btn-gold {
            background: linear-gradient(135deg, var(--gold-mid) 0%, var(--gold-dk) 100%);
            color: #fff;
            border: none;
            box-shadow: 0 2px 8px rgba(169,128,58,.3);
        }
        .btn-gold:hover { background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dk) 100%); color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(169,128,58,.4); }
        .btn-gold:active { transform: none; }
        .btn-gold:disabled { opacity: .65; transform: none; }

        /* =========================================================
           SANDBOX CHAT
        ========================================================= */
        .chat-window {
            height: 340px;
            overflow-y: auto;
            background: var(--paper);
            border: 1.5px solid var(--line);
            border-radius: var(--radius-md);
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: .6rem;
        }
        .chat-window::-webkit-scrollbar { width: 5px; }
        .chat-window::-webkit-scrollbar-thumb { background: var(--line); border-radius: 5px; }

        .bubble {
            padding: .7rem 1rem;
            border-radius: 12px;
            max-width: 80%;
            font-size: .875rem;
            line-height: 1.55;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .bubble-user {
            align-self: flex-end;
            background: linear-gradient(135deg, var(--gold-mid), var(--gold-dk));
            color: #fff;
            border-bottom-right-radius: 4px;
        }
        .bubble-bot {
            align-self: flex-start;
            background: var(--surface);
            border: 1.5px solid var(--line);
            color: var(--ink);
            border-bottom-left-radius: 4px;
        }
        .bubble-time { font-size: .68rem; opacity: .65; margin-top: .3rem; text-align: right; }

        .quick-btns { display: flex; flex-wrap: wrap; gap: .5rem; margin: .85rem 0; }
        .quick-btn {
            padding: .38rem .85rem;
            border: 1.5px solid var(--line);
            border-radius: 100px;
            background: var(--surface);
            font-size: .8rem;
            font-weight: 500;
            cursor: pointer;
            color: var(--ink);
            transition: all var(--transition);
        }
        .quick-btn:hover { border-color: var(--gold); color: var(--gold-dk); background: var(--gold-lt); }

        /* =========================================================
           SAVE BAR
        ========================================================= */
        .save-bar {
            position: sticky;
            bottom: 0;
            background: rgba(245,242,238,.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-top: 1.5px solid var(--line);
            padding: .9rem 1.85rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            box-shadow: 0 -4px 20px rgba(36,29,24,.06);
        }
        .save-bar-hint { font-size: .8rem; color: var(--ink-soft); display: flex; align-items: center; gap: .5rem; }
        .save-bar-hint code { background: var(--line); padding: .15rem .4rem; border-radius: 4px; font-size: .77rem; color: var(--ink); }

        /* =========================================================
           TOAST
        ========================================================= */
        .toast-custom {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            min-width: 300px;
        }
        .toast-custom .toast-body { font-size: .875rem; font-weight: 500; padding: .85rem 1rem; display: flex; align-items: center; gap: .65rem; }

        /* =========================================================
           MISC
        ========================================================= */
        .badge-gold  { background: var(--gold-lt); color: var(--gold-dk); font-weight: 700; }
        .badge-sage  { background: var(--sage-lt); color: var(--sage); font-weight: 700; }
        .badge-rose  { background: var(--rose-lt); color: var(--rose); font-weight: 700; }
        .badge-slate { background: var(--slate-lt); color: var(--slate); font-weight: 700; }

        .recom-chip {
            display: inline-flex;
            align-items: center;
            gap: .35rem;
            padding: .3rem .75rem;
            border-radius: 100px;
            background: var(--gold-lt);
            color: var(--gold-dk);
            font-size: .78rem;
            font-weight: 700;
        }

        .tip-box {
            display: flex;
            gap: .85rem;
            background: var(--gold-lt);
            border: 1px solid rgba(169,128,58,.2);
            border-radius: var(--radius-md);
            padding: 1rem 1.1rem;
            color: #6b5220;
            font-size: .85rem;
            line-height: 1.55;
        }

        /* =========================================================
           RESPONSIVE
        ========================================================= */
        .backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1035; backdrop-filter: blur(2px); }
        .backdrop.show { display: block; }

        @media (max-width: 991.98px) {
            .sidebar { transform: translateX(-100%); }
            .sidebar.open { transform: translateX(0); box-shadow: var(--shadow-lg); }
            .main { margin-left: 0; }
            .content { padding: 1.25rem; }
            .save-bar { padding: .85rem 1.25rem; }
            .topbar { padding: .85rem 1.25rem; }
        }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #d9d2c9; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }

        /* =========================================================
           EXTRA: PREMIUM MICRO DETAIL
        ========================================================= */

        /* Stat card shimmer effect */
        .stat::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.55) 50%, transparent 60%);
            opacity: 0;
            transition: opacity .5s;
            pointer-events: none;
            border-radius: var(--radius-lg);
        }
        .stat:hover::before { opacity: 1; animation: shimmer .7s ease forwards; }
        @keyframes shimmer {
            from { background-position: -200% 0; }
            to   { background-position: 200% 0; }
        }

        /* Topbar brand gradient text (pane title) */
        .topbar-title {
            background: linear-gradient(90deg, var(--ink) 60%, var(--gold) 140%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* Select status options visual indicator */
        select#bot_status option[value="active"] { color: #4d7a50; font-weight: 600; }
        select#bot_status option[value="maintenance"] { color: #c67c0a; font-weight: 600; }

        /* Bubble time as caption */
        .bubble-time {
            font-size: .67rem;
            opacity: .55;
            margin-top: .4rem;
            text-align: right;
            letter-spacing: .01em;
        }

        /* Quick-btn active press */
        .quick-btn:active { transform: scale(.96); }

        /* Save bar pulsing save button glow */
        @keyframes btnGlow {
            0%, 100% { box-shadow: 0 2px 8px rgba(169,128,58,.3); }
            50%       { box-shadow: 0 4px 20px rgba(169,128,58,.55); }
        }
        .save-bar .btn-gold { animation: btnGlow 2.5s ease-in-out infinite; }
        .save-bar .btn-gold:hover { animation: none; }

        /* Card body section divider */
        .card-section {
            padding: 1rem 1.4rem;
            border-bottom: 1px solid var(--line);
        }
        .card-section:last-child { border-bottom: none; }
        .card-section-title {
            font-size: .7rem;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: var(--ink-faint);
            font-weight: 700;
            margin-bottom: .85rem;
        }

        /* Input focus ring improvement */
        .form-control:focus, .form-select:focus {
            background: #fffdf9;
        }

        /* Toast left accent bar */
        .toast-custom {
            border-left: 4px solid var(--sage) !important;
            transition: border-color .2s;
        }
        .toast-custom.toast-error { border-left-color: var(--rose) !important; }

        /* WA status pill transition */
        .wa-pill { transition: background .4s, color .4s, border-color .4s; }

        /* Menu card disable label badge */
        .dis-lbl {
            background: var(--rose-lt);
            color: var(--rose);
            border-radius: 4px;
            padding: .1rem .35rem;
            font-size: .62rem;
            font-weight: 700;
        }
    </style>
</head>
<body>

<!-- ============ SIDEBAR ============ -->
<aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
        <div class="brand-mark"><i class="fa-solid fa-mug-saucer"></i></div>
        <div>
            <div class="brand-name">BARIDIN</div>
            <div class="brand-sub">AI Chatbot Backoffice</div>
        </div>
    </div>

    <nav class="sidebar-nav">
        <div class="nav-sect">Ringkasan</div>
        <a href="#" class="nav-link active" data-pane="dashboard" id="nav-dashboard">
            <i class="fa-solid fa-gauge-high nav-ico"></i> Dashboard
        </a>

        <div class="nav-sect" style="margin-top:.5rem">Konfigurasi Bot</div>
        <a href="#" class="nav-link" data-pane="menu" id="nav-menu">
            <i class="fa-solid fa-star nav-ico"></i> Menu &amp; Kategori
        </a>
        <a href="#" class="nav-link" data-pane="persona" id="nav-persona">
            <i class="fa-solid fa-brain nav-ico"></i> Persona AI
        </a>
        <a href="#" class="nav-link" data-pane="params" id="nav-params">
            <i class="fa-solid fa-sliders nav-ico"></i> Parameter Layanan
        </a>

        <div class="nav-sect" style="margin-top:.5rem">Alat Bantu</div>
        <a href="#" class="nav-link" data-pane="sandbox" id="nav-sandbox">
            <i class="fa-solid fa-flask-vial nav-ico"></i> Sandbox Live Test
        </a>
        <a href="ai_flow.php" class="nav-link" style="color:#d4a44e;">
            <i class="fa-solid fa-microchip nav-ico" style="color:#d4a44e;"></i> AI Flow &amp; Diagnostics <i class="fa-solid fa-arrow-up-right-from-square ms-auto" style="font-size:.7rem;opacity:.7"></i>
        </a>

        <div class="nav-sect" style="margin-top:.5rem">Akun</div>
        <a href="admin.php?action=logout" class="nav-link text-danger" onclick="return confirm('Yakin ingin keluar dari Backoffice?')">
            <i class="fa-solid fa-right-from-bracket nav-ico text-danger"></i> Logout Admin
        </a>
    </nav>

    <div class="sidebar-foot">
        <div class="wa-pill" id="sideWaStatus">
            <span class="dot"></span> Memeriksa koneksi…
        </div>
        <div class="outlet-name"><?php echo htmlspecialchars($configData['company_name']); ?></div>
    </div>
</aside>
<div class="backdrop" id="backdrop"></div>

<!-- ============ MAIN ============ -->
<div class="main">
    <header class="topbar">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary d-lg-none" id="menuToggle" aria-label="Buka menu">
                <i class="fa-solid fa-bars"></i>
            </button>
            <div>
                <div class="topbar-breadcrumb">Backoffice / <span id="crumbNow">Dashboard</span></div>
                <h1 class="topbar-title" id="paneTitle">Dashboard</h1>
            </div>
        </div>
        <div class="topbar-actions">
            <div class="status-pill <?php echo $isActive ? 'status-active' : 'status-maint'; ?>">
                <span class="dot" style="background:<?php echo $isActive ? 'var(--sage)' : '#c67c0a'; ?>"></span>
                <?php echo $isActive ? 'Bot Aktif' : 'Maintenance'; ?>
            </div>
            <button type="submit" form="settingsForm" class="btn btn-gold px-3" id="saveBtn">
                <i class="fa-regular fa-floppy-disk me-1"></i> Simpan
            </button>
        </div>
    </header>

    <form id="settingsForm">
    <div class="content">

        <!-- ====== PANE: DASHBOARD ====== -->
        <div class="pane show" id="pane-dashboard">

            <!-- WA Gateway Widget -->
            <div class="wa-card mb-4">
                <div class="wa-card-header">
                    <div class="wa-card-title">
                        <i class="fa-brands fa-whatsapp" style="color:#25d366;font-size:1.15rem"></i>
                        Gateway WhatsApp — Status &amp; QR Scanner
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span id="waBadge" class="badge rounded-pill bg-secondary px-3" style="font-size:.75rem">Memuat…</span>
                        <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,.08);color:#cec5b8;border:none;font-size:.78rem" onclick="loadWAStatus()">
                            <i class="fa-solid fa-arrows-rotate me-1"></i>Refresh
                        </button>
                    </div>
                </div>
                <div class="wa-card-body">
                    <div class="row g-4 align-items-start">
                        <div class="col-12 col-md-auto">
                            <div class="qr-box" id="qrBox" style="min-width:220px">
                                <div class="spinner-border text-secondary" role="status" style="width:2rem;height:2rem"></div>
                                <p class="text-secondary small mt-3 mb-0">Memeriksa status…</p>
                            </div>
                        </div>
                        <div class="col">
                            <div id="waStatusDetails">
                                <h3 class="h5 text-white fw-bold mb-2">Pusat Kontrol Sesi WhatsApp</h3>
                                <p class="small mb-0" style="color:#8d8478">Sambungkan bot BARIDIN ke WhatsApp untuk mulai melayani pelanggan secara otomatis.</p>
                            </div>
                            <div class="wa-actions">
                                <button type="button" class="btn-wa-action btn-wa-sync" onclick="syncKasirCache()">
                                    <i class="fa-solid fa-rotate"></i> Sync Katalog Kasir
                                </button>
                                <button type="button" class="btn-wa-action btn-wa-import" onclick="syncDisabledFromOrder()">
                                    <i class="fa-solid fa-file-import"></i> Impor Non-Aktif dari Order
                                </button>
                                <button type="button" class="btn-wa-action btn-wa-reset" onclick="clearSessions()">
                                    <i class="fa-solid fa-eraser"></i> Reset Memori Sesi
                                </button>
                                <button type="button" class="btn-wa-action btn-wa-danger" onclick="logoutWA()">
                                    <i class="fa-solid fa-right-from-bracket"></i> Logout WA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-xl-3">
                    <div class="stat stat-gold">
                        <div class="stat-ico ico-gold"><i class="fa-solid fa-bowl-food"></i></div>
                        <div class="stat-body">
                            <div class="stat-num"><?php echo count($validMenuList); ?></div>
                            <div class="stat-lab">Menu aktif di kasir</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-xl-3">
                    <div class="stat stat-sage">
                        <div class="stat-ico ico-sage"><i class="fa-solid fa-star"></i></div>
                        <div class="stat-body">
                            <div class="stat-num" id="statSelected"><?php echo $selectedCount; ?></div>
                            <div class="stat-lab">Menu direkomendasikan bot</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-xl-3">
                    <div class="stat stat-slate">
                        <div class="stat-ico ico-slate"><i class="fa-brands fa-whatsapp"></i></div>
                        <div class="stat-body">
                            <div class="stat-num" style="font-size:1.1rem;padding-top:.15rem"><?php echo $isActive ? 'Aktif' : 'Maintenance'; ?></div>
                            <div class="stat-lab">Status layanan chatbot</div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-xl-3">
                    <div class="stat stat-rose">
                        <div class="stat-ico ico-rose"><i class="fa-solid fa-ban"></i></div>
                        <div class="stat-body">
                            <div class="stat-num"><?php echo count($configData['disabled_items'] ?? []); ?></div>
                            <div class="stat-lab">Menu dinonaktifkan</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary + Recom Preview -->
            <div class="row g-3">
                <div class="col-12 col-lg-7">
                    <div class="card h-100">
                        <div class="card-hd">
                            <div>
                                <h2 class="card-hd-title">Ringkasan Konfigurasi</h2>
                                <p class="card-hd-sub">Nilai aktif yang digunakan bot saat ini.</p>
                            </div>
                        </div>
                        <table class="sumtable w-100 mb-0">
                            <tbody>
                            <tr>
                                <td class="lbl ps-4"><i class="fa-solid fa-store"></i> Outlet</td>
                                <td class="val pe-4" id="sumCompany"><?php echo htmlspecialchars($configData['company_name']); ?></td>
                            </tr>
                            <tr>
                                <td class="lbl ps-4"><i class="fa-solid fa-headset"></i> Admin support</td>
                                <td class="val pe-4" id="sumPhone"><?php echo htmlspecialchars($configData['admin_phone']); ?></td>
                            </tr>
                            <tr>
                                <td class="lbl ps-4"><i class="fa-solid fa-users"></i> Grup kasir WA</td>
                                <td class="val pe-4" id="sumGroup" style="font-size:.82rem">
                                    <?php echo $configData['kasir_group_jid'] ? '<span class="badge badge-sage">Tersimpan</span>' : '<span class="badge badge-rose">Belum diatur</span>'; ?>
                                </td>
                            </tr>
                            <tr>
                                <td class="lbl ps-4"><i class="fa-solid fa-key"></i> Gemini API key</td>
                                <td class="val pe-4" id="sumKey">
                                    <?php echo $configData['gemini_api_key']
                                        ? '<span class="badge badge-sage">'.count($configData['gemini_api_keys'] ?? []).' key tersimpan</span>'
                                        : '<span class="badge badge-rose">Kosong</span>'; ?>
                                </td>
                            </tr>
                            <tr>
                                <td class="lbl ps-4"><i class="fa-solid fa-lock"></i> Password Admin</td>
                                <td class="val pe-4" id="sumPassword">
                                    <span class="badge badge-sage">Terproteksi</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="lbl ps-4"><i class="fa-solid fa-rotate"></i> Sinkron menu terakhir</td>
                                <td class="val pe-4" style="font-size:.82rem;color:var(--ink-soft)">
                                    <?php echo $cacheUpdated ? htmlspecialchars($cacheUpdated) . ' WIB' : '<span style="color:var(--rose)">Belum pernah disinkron</span>'; ?>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="col-12 col-lg-5">
                    <div class="card h-100">
                        <div class="card-hd">
                            <div>
                                <h2 class="card-hd-title">Rekomendasi Aktif</h2>
                                <p class="card-hd-sub">Menu yang ditawarkan bot lebih dulu.</p>
                            </div>
                            <span class="badge badge-gold rounded-pill px-3 py-2" id="badgeSelectedTop"><?php echo $selectedCount; ?></span>
                        </div>
                        <div class="card-bd">
                            <div id="recomPreview" class="d-flex flex-wrap gap-2"></div>
                            <p class="mb-0 mt-3" id="recomEmpty" style="font-size:.83rem;color:var(--ink-soft);display:none">
                                Belum ada menu dipilih. Buka <b>Menu &amp; Kategori</b> untuk memilih.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== PANE: MENU & KATEGORI ====== -->
        <div class="pane" id="pane-menu">
            <div class="card">
                <div class="card-hd">
                    <div>
                        <h2 class="card-hd-title">Menu &amp; Kategori</h2>
                        <p class="card-hd-sub">Pilih menu unggulan &amp; matikan kategori/item yang tidak tersedia.</p>
                    </div>
                    <span class="badge badge-gold rounded-pill px-3 py-2 fs-sm" id="selectedCountBadge">0 dipilih</span>
                </div>
                <div class="card-bd">
                    <!-- Category pills -->
                    <div class="mb-4">
                        <div class="form-label d-flex align-items-center gap-2 mb-2">
                            <i class="fa-solid fa-layer-group" style="color:var(--gold-dk)"></i>
                            Non-Aktifkan Kategori
                            <span class="badge badge-slate ms-1"><?php echo count($configData['disabled_categories'] ?? []); ?> non-aktif</span>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            <?php foreach ($categories as $cat):
                                $isCatDisabled = in_array(strtolower($cat), array_map('strtolower', $configData['disabled_categories'] ?? []));
                            ?>
                            <label class="cat-pill <?php echo $isCatDisabled ? 'disabled' : 'enabled'; ?>" id="catpill_<?php echo md5($cat); ?>"
                                   onclick="toggleCat(this, '<?php echo htmlspecialchars($cat, ENT_QUOTES); ?>')">
                                <input type="checkbox" name="disabled_categories[]"
                                       value="<?php echo htmlspecialchars($cat); ?>"
                                       <?php echo $isCatDisabled ? 'checked' : ''; ?>>
                                <span class="cat-dot"></span>
                                <?php echo htmlspecialchars($cat); ?>
                                <?php if ($isCatDisabled): ?>
                                    <i class="fa-solid fa-ban ms-1" style="font-size:.7rem"></i>
                                <?php else: ?>
                                    <i class="fa-solid fa-check ms-1" style="font-size:.7rem"></i>
                                <?php endif; ?>
                            </label>
                            <?php endforeach; ?>
                        </div>
                        <p class="form-text mt-2">Klik kategori untuk mengaktifkan/nonaktifkan. Semua menu dalam kategori yang dinonaktifkan otomatis tersembunyi dari bot.</p>
                    </div>

                    <hr class="my-0 mb-4">

                    <!-- Menu search / filter bar -->
                    <div class="row g-2 mb-3 align-items-center">
                        <div class="col-12 col-md-5">
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
                                <input type="text" class="form-control" id="menuSearchInput" placeholder="Cari nama menu…" oninput="filterMenuList()">
                            </div>
                        </div>
                        <div class="col-12 col-md-3">
                            <select class="form-select" id="categoryFilter" onchange="filterMenuList()">
                                <option value="">Semua kategori</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?php echo htmlspecialchars(strtolower($cat)); ?>"><?php echo htmlspecialchars($cat); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-12 col-md-4 d-flex gap-2">
                            <button type="button" class="btn btn-outline-secondary flex-fill" id="btnOnlySelected" onclick="toggleOnlySelected(this)">
                                <i class="fa-regular fa-star me-1"></i> Terpilih
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="toggleOnlyDisabled(this)" id="btnOnlyDisabled" title="Tampilkan hanya yang dinonaktifkan">
                                <i class="fa-solid fa-eye-slash me-1"></i> Non-Aktif
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="clearSelection()" title="Kosongkan pilihan rekomendasi">
                                <i class="fa-solid fa-eraser"></i>
                            </button>
                        </div>
                    </div>

                    <div class="menu-scroll">
                        <div class="row g-2" id="menuGrid">
                            <?php if (empty($validMenuList)): ?>
                                <div class="col-12 text-center py-5">
                                    <i class="fa-solid fa-mug-hot fa-2x mb-3" style="color:var(--ink-faint)"></i>
                                    <p class="mb-0" style="color:var(--ink-soft)">Data menu kasir belum tersedia. Gunakan tombol <b>Sync Katalog Kasir</b> di Dashboard.</p>
                                </div>
                            <?php else: ?>
                                <?php foreach ($validMenuList as $item):
                                    $itemName   = $item['name'];
                                    $isChecked  = in_array($itemName, $configData['recommended_items'] ?? []);
                                    $isDisabled = in_array($itemName, $configData['disabled_items'] ?? []);
                                    $extraClass = $isDisabled ? 'is-disabled' : ($isChecked ? 'is-checked' : '');
                                ?>
                                <div class="col-12 col-md-6 col-xl-4 menu-col"
                                     data-name="<?php echo strtolower(htmlspecialchars($itemName)); ?>"
                                     data-cat="<?php echo strtolower(htmlspecialchars($item['category'])); ?>"
                                     data-disabled="<?php echo $isDisabled ? '1' : '0'; ?>">
                                    <div class="menu-card <?php echo $extraClass; ?>" id="mc_<?php echo md5($itemName); ?>">
                                        <div class="menu-chk">
                                            <input class="form-check-input" type="checkbox"
                                                   name="recommended_items[]"
                                                   value="<?php echo htmlspecialchars($itemName); ?>"
                                                   <?php echo $isChecked ? 'checked' : ''; ?>
                                                   id="rec_<?php echo md5($itemName); ?>"
                                                   onchange="updateSelectedCount(); syncCardState('<?php echo md5($itemName); ?>')">
                                        </div>
                                        <div class="menu-info">
                                            <span class="menu-name"><?php echo htmlspecialchars($itemName); ?></span>
                                            <span class="menu-meta">
                                                <span class="menu-price">Rp <?php echo number_format($item['price'], 0, ',', '.'); ?></span>
                                                · <?php echo htmlspecialchars($item['category']); ?>
                                            </span>
                                        </div>
                                        <div class="dis-toggle" title="Nonaktifkan menu ini dari bot">
                                            <label for="dis_<?php echo md5($itemName); ?>">
                                                <input type="checkbox" name="disabled_items[]"
                                                       value="<?php echo htmlspecialchars($itemName); ?>"
                                                       <?php echo $isDisabled ? 'checked' : ''; ?>
                                                       id="dis_<?php echo md5($itemName); ?>"
                                                       onchange="syncDisableState('<?php echo md5($itemName); ?>', this.checked)">
                                                <span class="dis-lbl">Off</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== PANE: PERSONA ====== -->
        <div class="pane" id="pane-persona">
            <div class="card">
                <div class="card-hd">
                    <div>
                        <h2 class="card-hd-title">Persona &amp; Prompt AI</h2>
                        <p class="card-hd-sub">Kepribadian, gaya bahasa, dan aturan khusus BARIDIN.</p>
                    </div>
                    <span style="font-size:.78rem;color:var(--ink-soft)">
                        <i class="fa-regular fa-file-lines me-1"></i><span id="promptChars">0</span> karakter
                    </span>
                </div>
                <div class="card-bd">
                    <div class="mb-3">
                        <label class="form-label" for="system_instruction">System Instruction</label>
                        <textarea class="form-control" id="system_instruction" name="system_instruction"
                                  oninput="countPrompt()"
                                  placeholder="Contoh: Kamu adalah BARIDIN, barista virtual Baraja Coffee Amphitheater. Balas singkat, ramah, dan profesional…"><?php echo htmlspecialchars($configData['system_instruction']); ?></textarea>
                        <div class="form-text">Instruksi ini dikirim ke Gemini pada setiap percakapan baru. Sebutkan nama outlet, jam operasional, dan aturan khusus secara eksplisit.</div>
                    </div>

                    <div class="tip-box">
                        <i class="fa-solid fa-lightbulb mt-1" style="color:var(--gold);flex-shrink:0"></i>
                        <div>
                            <strong>Tips:</strong> Sertakan jam operasional, cara pemesanan (Dine-in/Take Away), metode pembayaran yang tersedia, dan karakter BARIDIN agar bot tidak mengarang jawaban sendiri.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== PANE: PARAMETER ====== -->
        <div class="pane" id="pane-params">
            <div class="row g-3">
                <div class="col-12 col-lg-6">
                    <div class="card h-100">
                        <div class="card-hd">
                            <div>
                                <h2 class="card-hd-title">Kredensial &amp; Identitas</h2>
                                <p class="card-hd-sub">API key Gemini dan informasi outlet.</p>
                            </div>
                        </div>
                        <div class="card-bd">
                            <div class="mb-3">
                                <label class="form-label" for="admin_password">
                                    Password Admin Backoffice
                                    <span class="badge badge-sage ms-1">Keamanan Dashboard</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fa-solid fa-lock" style="color:var(--gold)"></i></span>
                                    <input type="password" class="form-control" id="admin_password" name="admin_password"
                                           value="<?php echo htmlspecialchars($configData['admin_password'] ?? 'barajacoffee'); ?>" required>
                                    <span class="input-group-text" onclick="togglePassVisibility('admin_password', this)" style="cursor:pointer" title="Tampilkan/Sembunyikan password">
                                        <i class="fa-regular fa-eye"></i>
                                    </span>
                                </div>
                                <div class="form-text">Password untuk mengakses dashboard admin ini dan AI Flow Diagnostics.</div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label" for="gemini_api_key">
                                    Google Gemini API Keys
                                    <span class="badge badge-slate ms-1">Multi-Key Rotation</span>
                                </label>
                                <?php
                                    $keysVal = '';
                                    if (!empty($configData['gemini_api_keys']) && is_array($configData['gemini_api_keys'])) {
                                        $keysVal = implode("\n", $configData['gemini_api_keys']);
                                    } else {
                                        $keysVal = $configData['gemini_api_key'] ?? '';
                                    }
                                ?>
                                <textarea class="form-control" id="gemini_api_key" name="gemini_api_key" rows="4"
                                          style="font-family:monospace;font-size:.83rem;min-height:90px"
                                          placeholder="Masukkan 1 atau beberapa API Key (1 key per baris)…" required><?php echo htmlspecialchars($keysVal); ?></textarea>
                                <div class="form-text">
                                    <i class="fa-solid fa-arrows-rotate me-1" style="color:var(--sage)"></i>
                                    Sistem otomatis beralih ke key berikutnya jika kuota harian habis.
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label" for="company_name">Nama Outlet / Cafe</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fa-solid fa-store"></i></span>
                                    <input type="text" class="form-control" id="company_name" name="company_name"
                                           value="<?php echo htmlspecialchars($configData['company_name']); ?>" required>
                                </div>
                            </div>

                            <div class="mb-0">
                                <label class="form-label" for="admin_phone">WhatsApp Admin Support</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fa-brands fa-whatsapp" style="color:#25d366"></i></span>
                                    <input type="text" class="form-control" id="admin_phone" name="admin_phone"
                                           value="<?php echo htmlspecialchars($configData['admin_phone']); ?>" required>
                                </div>
                                <div class="form-text">Nomor ini dibagikan bot saat pelanggan minta bantuan manusia.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-6">
                    <div class="card h-100">
                        <div class="card-hd">
                            <div>
                                <h2 class="card-hd-title">Operasional</h2>
                                <p class="card-hd-sub">Tujuan notifikasi pesanan dan status layanan.</p>
                            </div>
                        </div>
                        <div class="card-bd">
                            <div class="mb-3">
                                <label class="form-label" for="kasir_group_jid">Link / ID Grup WA Kasir &amp; Barista</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fa-solid fa-users"></i></span>
                                    <input type="text" class="form-control" id="kasir_group_jid" name="kasir_group_jid"
                                           value="<?php echo htmlspecialchars($configData['kasir_group_jid'] ?? ''); ?>"
                                           placeholder="https://chat.whatsapp.com/… atau ID grup @g.us">
                                </div>
                                <div class="form-text">Bisa berupa link undangan grup atau ID grup (<code>1234567890@g.us</code>).</div>
                            </div>

                            <div class="mb-0">
                                <label class="form-label" for="bot_status">Status Layanan Chatbot</label>
                                <select class="form-select" id="bot_status" name="bot_status">
                                    <option value="active" <?php echo $configData['bot_status'] === 'active' ? 'selected' : ''; ?>>
                                        &#9679; Aktif &mdash; melayani pelanggan
                                    </option>
                                    <option value="maintenance" <?php echo $configData['bot_status'] === 'maintenance' ? 'selected' : ''; ?>>
                                        &#9881; Maintenance &mdash; kirim pesan pemeliharaan
                                    </option>
                                </select>
                                <div class="form-text">Saat maintenance, bot membalas otomatis dengan pesan pemeliharaan saja.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== PANE: SANDBOX ====== -->
        <div class="pane" id="pane-sandbox">
            <div class="card">
                <div class="card-hd">
                    <div>
                        <h2 class="card-hd-title">Sandbox Live Test</h2>
                        <p class="card-hd-sub">Uji respons BARIDIN tanpa mengganggu percakapan pelanggan nyata.</p>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="resetChat()">
                        <i class="fa-solid fa-rotate-left me-1"></i>Bersihkan
                    </button>
                </div>
                <div class="card-bd">
                    <div class="chat-window" id="sandboxChat">
                        <div class="bubble bubble-bot">
                            Halo Kak! BARIDIN di sini &#x2615; barista virtual Baraja Coffee.<br>Ada yang bisa saya bantu?
                            <div class="bubble-time">BARIDIN &middot; sekarang</div>
                        </div>
                    </div>

                    <div class="quick-btns">
                        <button type="button" class="quick-btn" onclick="quickAsk('rekomendasi menu')"><i class="fa-solid fa-mug-hot me-1" style="color:var(--gold)"></i> Rekomendasi menu</button>
                        <button type="button" class="quick-btn" onclick="quickAsk('jam buka cafe')"><i class="fa-solid fa-clock me-1" style="color:var(--gold)"></i> Jam buka</button>
                        <button type="button" class="quick-btn" onclick="quickAsk('saya mau pesan kopi')"><i class="fa-solid fa-cart-shopping me-1" style="color:var(--gold)"></i> Pesan kopi</button>
                        <button type="button" class="quick-btn" onclick="quickAsk('ada meja tersedia?')"><i class="fa-solid fa-chair me-1" style="color:var(--gold)"></i> Cek meja</button>
                        <button type="button" class="quick-btn" onclick="quickAsk('cara bayar QRIS')"><i class="fa-solid fa-qrcode me-1" style="color:var(--gold)"></i> Cara bayar</button>
                    </div>

                    <div class="input-group">
                        <input type="text" class="form-control" id="testMsg"
                               placeholder="Ketik pesan seperti pelanggan WhatsApp..."
                               onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendTestMsg();}">
                        <button type="button" class="btn btn-gold px-3" onclick="sendTestMsg()" id="sendBtn">
                            <i class="fa-solid fa-paper-plane me-1"></i>Kirim
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== SAVE BAR ====== -->
        <div class="save-bar">
            <div class="save-bar-hint">
                <i class="fa-solid fa-circle-info" style="color:var(--gold)"></i>
                Perubahan disimpan langsung ke <code>config.json</code> &mdash; berlaku seketika tanpa restart.
            </div>
            <button type="submit" class="btn btn-gold px-4" id="saveBtnBar">
                <i class="fa-regular fa-floppy-disk me-2"></i>Simpan Perubahan
            </button>
        </div>

    </div>
    </form>
</div>

<!-- ============ TOAST ============ -->
<div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index:9999">
    <div id="toast" class="toast toast-custom align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body" id="toastBody"></div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
/* =========================================================
   GLOBALS
========================================================= */
const form   = document.getElementById('settingsForm');
const toastEl = document.getElementById('toast');
const toast  = new bootstrap.Toast(toastEl, { delay: 3800 });

const PANE_TITLES = {
    dashboard: 'Dashboard',
    menu:      'Menu & Kategori',
    persona:   'Persona AI',
    params:    'Parameter Layanan',
    sandbox:   'Sandbox Live Test'
};

/* =========================================================
   NAVIGATION
========================================================= */
document.querySelectorAll('.sidebar .nav-link[data-pane]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const pane = link.dataset.pane;
        // update nav
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // update panes
        document.querySelectorAll('.pane').forEach(p => p.classList.remove('show'));
        document.getElementById('pane-' + pane).classList.add('show');
        // update topbar
        document.getElementById('paneTitle').textContent  = PANE_TITLES[pane];
        document.getElementById('crumbNow').textContent   = PANE_TITLES[pane];
        closeSidebar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

/* =========================================================
   SIDEBAR MOBILE
========================================================= */
const sidebarEl  = document.getElementById('sidebar');
const backdropEl = document.getElementById('backdrop');
document.getElementById('menuToggle').addEventListener('click', () => {
    sidebarEl.classList.add('open');
    backdropEl.classList.add('show');
});
backdropEl.addEventListener('click', closeSidebar);
function closeSidebar() {
    sidebarEl.classList.remove('open');
    backdropEl.classList.remove('show');
}

/* =========================================================
   CATEGORY PILL TOGGLE
========================================================= */
function toggleCat(pill, catName) {
    const checkbox = pill.querySelector('input[type="checkbox"]');
    const willDisable = !checkbox.checked; // about to check = disable

    // If enabling (removing ban), confirm
    if (!willDisable) {
        // they're disabling, let it proceed
    }

    checkbox.checked = willDisable;
    pill.classList.toggle('disabled', willDisable);
    pill.classList.toggle('enabled', !willDisable);

    // Update icon
    const icon = pill.querySelector('i');
    if (willDisable) {
        icon.className = 'fa-solid fa-ban ms-1';
        icon.style.fontSize = '.7rem';
    } else {
        icon.className = 'fa-solid fa-check ms-1';
        icon.style.fontSize = '.7rem';
    }

    // Re-filter menu list so greyed out items update
    filterMenuList();

    showToast(
        willDisable
            ? `<i class="fa-solid fa-ban me-2" style="color:var(--rose)"></i>Kategori <b>${catName}</b> dinonaktifkan.`
            : `<i class="fa-solid fa-check me-2" style="color:var(--sage)"></i>Kategori <b>${catName}</b> diaktifkan.`
    );
}

/* =========================================================
   MENU CARD STATE SYNC
========================================================= */
function syncCardState(hash) {
    const card = document.getElementById('mc_' + hash);
    if (!card) return;
    const recChk = document.getElementById('rec_' + hash);
    const disChk = document.getElementById('dis_' + hash);
    if (!recChk || !disChk) return;

    card.classList.toggle('is-checked',  recChk.checked && !disChk.checked);
    card.classList.toggle('is-disabled', disChk.checked);
}

function syncDisableState(hash, disabled) {
    const col  = document.querySelector(`.menu-col[data-name]`);  // fallback
    const card = document.getElementById('mc_' + hash);
    const recChk = document.getElementById('rec_' + hash);
    if (!card || !recChk) return;

    if (disabled) {
        // Uncheck recommended if we're disabling
        recChk.checked = false;
    }
    card.classList.toggle('is-disabled', disabled);
    card.classList.toggle('is-checked',  recChk.checked && !disabled);

    // Also update data-disabled on parent col
    const parentCol = card.closest('.menu-col');
    if (parentCol) parentCol.dataset.disabled = disabled ? '1' : '0';

    updateSelectedCount();
}

/* =========================================================
   MENU LIST — COUNT & FILTER
========================================================= */
function updateSelectedCount() {
    const checked = [...document.querySelectorAll('input[name="recommended_items[]"]:checked')];
    const n = checked.length;
    document.getElementById('selectedCountBadge').textContent = n + ' dipilih';
    document.getElementById('statSelected').textContent = n;
    document.getElementById('badgeSelectedTop').textContent = n;

    const box = document.getElementById('recomPreview');
    box.innerHTML = '';
    checked.slice(0, 14).forEach(c => {
        const chip = document.createElement('span');
        chip.className = 'recom-chip';
        chip.innerHTML = `<i class="fa-solid fa-star" style="font-size:.6rem"></i>${c.value}`;
        box.appendChild(chip);
    });
    if (n > 14) {
        const more = document.createElement('span');
        more.className = 'badge badge-slate rounded-pill px-3 py-2';
        more.textContent = '+' + (n - 14) + ' lainnya';
        box.appendChild(more);
    }
    document.getElementById('recomEmpty').style.display = n === 0 ? 'block' : 'none';
}

let onlySelected = false;
let onlyDisabled = false;

function toggleOnlySelected(btn) {
    onlySelected = !onlySelected;
    if (onlySelected) onlyDisabled = false;
    btn.classList.toggle('btn-gold', onlySelected);
    btn.classList.toggle('btn-outline-secondary', !onlySelected);
    document.getElementById('btnOnlyDisabled').classList.remove('btn-gold');
    document.getElementById('btnOnlyDisabled').classList.add('btn-outline-secondary');
    filterMenuList();
}

function toggleOnlyDisabled(btn) {
    onlyDisabled = !onlyDisabled;
    if (onlyDisabled) onlySelected = false;
    btn.classList.toggle('btn-gold', onlyDisabled);
    btn.classList.toggle('btn-outline-secondary', !onlyDisabled);
    document.getElementById('btnOnlySelected').classList.remove('btn-gold');
    document.getElementById('btnOnlySelected').classList.add('btn-outline-secondary');
    filterMenuList();
}

function filterMenuList() {
    const query = document.getElementById('menuSearchInput').value.toLowerCase().trim();
    const cat   = document.getElementById('categoryFilter').value;

    document.querySelectorAll('.menu-col').forEach(col => {
        const name    = col.dataset.name  || '';
        const itemCat = col.dataset.cat   || '';
        const disabled = col.dataset.disabled === '1';
        const checked = col.querySelector('input[name="recommended_items[]"]')?.checked;

        const matchSearch = !query || name.includes(query);
        const matchCat    = !cat   || itemCat === cat;
        const matchFilter = (!onlySelected || checked) && (!onlyDisabled || disabled);

        col.style.display = (matchSearch && matchCat && matchFilter) ? '' : 'none';
    });
}

function clearSelection() {
    document.querySelectorAll('input[name="recommended_items[]"]:checked').forEach(c => {
        c.checked = false;
        syncCardState(c.id.replace('rec_', ''));
    });
    updateSelectedCount();
}

/* =========================================================
   PERSONA CHAR COUNT
========================================================= */
function countPrompt() {
    const n = document.getElementById('system_instruction').value.length;
    document.getElementById('promptChars').textContent = n.toLocaleString('id-ID');
}

/* =========================================================
   SAVE FORM
========================================================= */
function setSaveLoading(loading) {
    ['saveBtn', 'saveBtnBar'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Menyimpan…'
            : '<i class="fa-regular fa-floppy-disk me-2"></i>Simpan Perubahan';
    });
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    setSaveLoading(true);
    const fd = new FormData(form);
    fd.append('action', 'save_settings');

    fetch('admin.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
            setSaveLoading(false);
            if (data.status === 'success') {
                showToast('<i class="fa-solid fa-circle-check me-2" style="color:var(--sage)"></i>' + data.message);
                refreshSummary();
            } else {
                showToast('<i class="fa-solid fa-triangle-exclamation me-2" style="color:var(--rose)"></i>' + data.message, true);
            }
        })
        .catch(err => {
            setSaveLoading(false);
            showToast('<i class="fa-solid fa-triangle-exclamation me-2" style="color:var(--rose)"></i>Gagal menyimpan: ' + err.message, true);
        });
});

function showToast(html, isError = false) {
    toastEl.classList.toggle('toast-error', isError);
    toastEl.style.borderLeftColor = isError ? 'var(--rose)' : 'var(--sage)';
    document.getElementById('toastBody').innerHTML = html;
    toast.show();
}

function refreshSummary() {
    const comp = document.getElementById('company_name').value;
    const phone = document.getElementById('admin_phone').value;
    const grp   = document.getElementById('kasir_group_jid').value;
    const key   = document.getElementById('gemini_api_key').value;

    document.getElementById('sumCompany').textContent = comp;
    document.getElementById('sumPhone').textContent   = phone;
    document.getElementById('sumGroup').innerHTML = grp
        ? '<span class="badge badge-sage">Tersimpan</span>'
        : '<span class="badge badge-rose">Belum diatur</span>';
    document.getElementById('sumKey').innerHTML = key
        ? '<span class="badge badge-sage">Tersimpan</span>'
        : '<span class="badge badge-rose">Kosong</span>';
}

/* =========================================================
   SANDBOX CHAT
========================================================= */
function timeFmt() {
    return new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
}

function quickAsk(text) {
    document.getElementById('testMsg').value = text;
    sendTestMsg();
}

function resetChat() {
    document.getElementById('sandboxChat').innerHTML =
        '<div class="bubble bubble-bot">Halo Kak! BARIDIN di sini &#x2615; barista virtual Baraja Coffee.<br>Ada yang bisa saya bantu?<div class="bubble-time">BARIDIN &middot; sekarang</div></div>';
}

function sendTestMsg() {
    const input = document.getElementById('testMsg');
    const text  = input.value.trim();
    if (!text) return;

    const chat = document.getElementById('sandboxChat');

    // User bubble
    const userDiv = document.createElement('div');
    userDiv.className = 'bubble bubble-user';
    userDiv.innerHTML = text.replace(/</g,'&lt;') + `<div class="bubble-time">${timeFmt()}</div>`;
    chat.appendChild(userDiv);
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    // Bot typing indicator
    const botDiv = document.createElement('div');
    botDiv.className = 'bubble bubble-bot';
    botDiv.innerHTML = '<span class="spinner-border spinner-border-sm me-2" style="width:.8rem;height:.8rem"></span>BARIDIN sedang mengetik…';
    chat.appendChild(botDiv);
    chat.scrollTop = chat.scrollHeight;

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    fetch('webhook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'sandbox@s.whatsapp.net', pushName: 'Admin Sandbox', message: text })
    })
    .then(r => r.json())
    .then(data => {
        const replyText = (data.reply || 'Tidak ada balasan.').replace(/</g, '&lt;').replace(/\n/g, '<br>');
        botDiv.innerHTML = replyText + `<div class="bubble-time">BARIDIN · ${timeFmt()}</div>`;
        chat.scrollTop = chat.scrollHeight;
        sendBtn.disabled = false;
    })
    .catch(err => {
        botDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-2" style="color:var(--rose)"></i>Error: ${err.message}`;
        sendBtn.disabled = false;
    });
}

/* =========================================================
   WHATSAPP STATUS
========================================================= */
function loadWAStatus() {
    fetch('admin.php?action=get_wa_status')
        .then(r => r.json())
        .then(data => {
            const qrBox   = document.getElementById('qrBox');
            const badge   = document.getElementById('waBadge');
            const details = document.getElementById('waStatusDetails');
            const sidePill = document.getElementById('sideWaStatus');
            if (!qrBox || !badge || !details) return;

            if (data.status === 'connected') {
                badge.className = 'badge rounded-pill bg-success px-3';
                badge.style.fontSize = '.75rem';
                badge.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i>Terhubung';

                qrBox.innerHTML = `
                    <div style="color:#4caf6e;font-size:2.8rem;margin-bottom:.75rem"><i class="fa-solid fa-circle-check"></i></div>
                    <div style="color:#fff;font-weight:700;font-size:.95rem">WhatsApp Terhubung!</div>
                    <span style="margin-top:.5rem;display:inline-block;background:rgba(76,175,110,.15);color:#7fc985;border:1px solid rgba(76,175,110,.25);border-radius:100px;padding:.3rem .85rem;font-size:.8rem;font-weight:600">+${data.phone || '08xxx'}</span>
                `;

                details.innerHTML = `
                    <h3 style="color:#7fc985;font-size:1rem;font-weight:700;margin-bottom:.6rem"><i class="fa-solid fa-shield-halved me-2"></i>Status: TERHUBUNG 24/7</h3>
                    <p style="color:#8d8478;font-size:.83rem;margin-bottom:.85rem">Bot BARIDIN siap melayani pelanggan dan mengirim notifikasi ke grup kasir.</p>
                    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.85rem 1rem">
                        <div style="font-size:.8rem;color:#8d8478;margin-bottom:.3rem"><b style="color:#cec5b8">Nama:</b> ${data.name || '—'}</div>
                        <div style="font-size:.8rem;color:#8d8478;margin-bottom:.3rem"><b style="color:#cec5b8">Nomor:</b> +${data.phone || '—'}</div>
                        <div style="font-size:.8rem;color:#8d8478"><b style="color:#cec5b8">Update:</b> ${new Date(data.updated_at).toLocaleTimeString('id-ID')} WIB</div>
                    </div>
                `;
                if (sidePill) sidePill.innerHTML = '<span class="dot"></span>WA Terhubung';
                if (sidePill) sidePill.style.background = 'rgba(77,122,80,.15)';

            } else if (data.status === 'qr_ready' && data.qr_code) {
                badge.className = 'badge rounded-pill bg-warning text-dark px-3';
                badge.style.fontSize = '.75rem';
                badge.innerHTML = '<i class="fa-solid fa-qrcode me-1"></i>Scan QR';

                qrBox.innerHTML = `
                    <img src="${data.qr_code}" alt="Scan QR Code WhatsApp" style="max-width:190px;border-radius:10px;border:3px solid rgba(255,255,255,.15)">
                    <p style="color:#8d8478;font-size:.78rem;margin-top:.65rem;margin-bottom:0"><i class="fa-solid fa-camera me-1"></i>Pindai via WhatsApp HP</p>
                `;

                details.innerHTML = `
                    <h3 style="color:#d4b84a;font-size:1rem;font-weight:700;margin-bottom:.6rem"><i class="fa-solid fa-qrcode me-2"></i>Pindai QR Code</h3>
                    <p style="color:#8d8478;font-size:.83rem;margin-bottom:.85rem">Ikuti 3 langkah untuk menyambungkan bot BARIDIN:</p>
                    <ol style="color:#8d8478;font-size:.82rem;line-height:1.75;padding-left:1.25rem;margin:0">
                        <li>Buka <b style="color:#cec5b8">WhatsApp</b> di HP Baraja Coffee.</li>
                        <li>Ketuk <b style="color:#cec5b8">Menu (⋮) → Perangkat Tertaut</b>.</li>
                        <li>Ketuk <b style="color:#cec5b8">Tautkan Perangkat</b> dan arahkan ke QR di samping.</li>
                    </ol>
                `;
                if (sidePill) sidePill.innerHTML = '<span class="dot" style="background:#d4b84a"></span>Menunggu Scan';

            } else {
                badge.className = 'badge rounded-pill bg-danger px-3';
                badge.style.fontSize = '.75rem';
                badge.innerHTML = '<i class="fa-solid fa-plug-circle-xmark me-1"></i>Offline';

                qrBox.innerHTML = `
                    <div style="color:#5e5449;font-size:2.8rem;margin-bottom:.75rem"><i class="fa-solid fa-terminal"></i></div>
                    <div style="color:#8d8478;font-weight:600;font-size:.92rem">Bot Belum Dijalankan</div>
                    <p style="color:#5e5449;font-size:.78rem;margin:.5rem 0 0">Jalankan <code style="color:#d4b84a">node index.js</code> di server</p>
                `;

                details.innerHTML = `
                    <h3 style="color:#e57d72;font-size:1rem;font-weight:700;margin-bottom:.6rem"><i class="fa-solid fa-circle-exclamation me-2"></i>Gateway Offline</h3>
                    <p style="color:#8d8478;font-size:.83rem;margin-bottom:.85rem">Service Gateway Baileys Node.js belum aktif.</p>
                    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.85rem 1rem;font-family:monospace;font-size:.82rem">
                        <div style="color:#8d8478">cd c:\\xampp\\htdocs\\chatbot</div>
                        <div style="color:#d4b84a;margin-top:.25rem">node index.js</div>
                    </div>
                `;
                if (sidePill) sidePill.innerHTML = '<span class="dot" style="background:#e57d72;box-shadow:none"></span>WA Offline';
                if (sidePill) sidePill.style.background = 'rgba(192,57,43,.12)';
            }
        })
        .catch(() => {});
}

/* =========================================================
   QUICK ACTIONS
========================================================= */
function syncKasirCache() {
    showToast('<i class="fa-solid fa-rotate fa-spin me-2"></i>Menghubungi API Kasir Baraja Coffee…');
    fetch('admin.php?action=sync_cache')
        .then(r => r.json())
        .then(data => showToast(
            (data.status === 'success'
                ? '<i class="fa-solid fa-circle-check me-2" style="color:var(--sage)"></i>'
                : '<i class="fa-solid fa-triangle-exclamation me-2" style="color:var(--rose)"></i>') + data.message,
            data.status !== 'success'
        ));
}

function syncDisabledFromOrder() {
    showToast('<i class="fa-solid fa-file-import fa-bounce me-2"></i>Membaca data non-aktif dari Order App…');
    fetch('admin.php?action=sync_disabled_order')
        .then(r => r.json())
        .then(data => {
            showToast(
                (data.status === 'success'
                    ? '<i class="fa-solid fa-circle-check me-2" style="color:var(--sage)"></i>'
                    : '<i class="fa-solid fa-triangle-exclamation me-2" style="color:var(--rose)"></i>') + data.message,
                data.status !== 'success'
            );
            if (data.status === 'success') setTimeout(() => location.reload(), 1600);
        });
}

function clearSessions() {
    if (!confirm('Yakin ingin menghapus semua memori percakapan aktif pelanggan?')) return;
    fetch('admin.php?action=clear_sessions')
        .then(r => r.json())
        .then(data => showToast(
            (data.status === 'success'
                ? '<i class="fa-solid fa-circle-check me-2" style="color:var(--sage)"></i>'
                : '<i class="fa-solid fa-triangle-exclamation me-2" style="color:var(--rose)"></i>') + data.message,
            data.status !== 'success'
        ));
}

function logoutWA() {
    if (!confirm('Yakin ingin logout WhatsApp Bot? Perlu scan QR ulang setelahnya.')) return;
    fetch('admin.php?action=logout_wa')
        .then(r => r.json())
        .then(data => {
            showToast(
                (data.status === 'success'
                    ? '<i class="fa-solid fa-circle-check me-2" style="color:var(--sage)"></i>'
                    : '<i class="fa-solid fa-triangle-exclamation me-2" style="color:var(--rose)"></i>') + data.message,
                data.status !== 'success'
            );
            loadWAStatus();
        });
}

/* =========================================================
   INIT
========================================================= */
updateSelectedCount();
countPrompt();
loadWAStatus();
setInterval(loadWAStatus, 5000);
</script>

</body>
</html>
