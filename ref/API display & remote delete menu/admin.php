<?php
session_start();

define('ADMIN_PASSWORD', 'barajacoffee');

if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    unset($_SESSION['admin_logged_in']);
    session_destroy();
    header('Location: admin.php');
    exit;
}

$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $user = trim($_POST['username'] ?? '');
    $pass = $_POST['password'] ?? '';
    if ($user === 'admin' && $pass === ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: admin.php');
        exit;
    } else {
        $loginError = 'Username atau Password salah!';
    }
}

if (empty($_SESSION['admin_logged_in'])) {
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Admin - Baraja Customer Display</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
            * { box-sizing: border-box; font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
            h1, label, .btn-submit { font-family: 'Plus Jakarta Sans', sans-serif; }
            body {
                background-color: #F5F7F0;
                background-image:
                    radial-gradient(at 0% 0%, rgba(110, 143, 92, 0.16) 0px, transparent 55%),
                    radial-gradient(at 100% 100%, rgba(140, 163, 124, 0.18) 0px, transparent 55%);
                color: #2B3328;
                display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;
            }
            .login-card { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border: 1px solid rgba(79,107,65,0.14); border-radius: 20px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 20px 40px rgba(79,107,65,0.12); text-align: center; }
            .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: linear-gradient(135deg, #8CA97A, #4F6B41); border-radius: 16px; font-size: 26px; color: #fff; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(79,107,65,0.3); }
            h1 { font-size: 22px; font-weight: 800; color: #2B3328; margin-bottom: 6px; }
            p.sub { font-size: 13px; color: #6E7A66; margin-bottom: 28px; }
            .form-group { text-align: left; margin-bottom: 18px; }
            label { display: block; font-size: 12px; font-weight: 700; color: #4F6B41; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
            input[type="text"], input[type="password"] { width: 100%; background: #FFFFFF; border: 1px solid rgba(79,107,65,0.2); border-radius: 10px; padding: 12px 16px; color: #2B3328; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
            input[type="text"]:focus, input[type="password"]:focus { border-color: #6E8F5C; box-shadow: 0 0 0 3px rgba(110,143,92,0.14); }
            .btn-submit { width: 100%; background: linear-gradient(135deg, #6E8F5C, #4F6B41); color: #fff; font-size: 14px; font-weight: 700; border: none; padding: 14px; border-radius: 10px; cursor: pointer; transition: transform 0.1s, filter 0.2s; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .btn-submit:hover { filter: brightness(1.06); }
            .btn-submit:active { transform: scale(0.98); }
            .error-box { background: rgba(193, 92, 78, 0.1); border: 1px solid rgba(193, 92, 78, 0.35); color: #C15C4E; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        </style>
    </head>
    <body>
        <div class="login-card">
            <div class="logo-badge"><i class="fa-solid fa-mug-saucer"></i></div>
            <h1>Baraja Coffee</h1>
            <p class="sub">Admin Panel Customer Display System</p>
            <?php if (!empty($loginError)): ?>
                <div class="error-box"><i class="fa-solid fa-triangle-exclamation"></i> <?= htmlspecialchars($loginError) ?></div>
            <?php endif; ?>
            <form method="POST" action="admin.php">
                <input type="hidden" name="action" value="login">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" name="username" placeholder="Masukkan username" required autofocus>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Masukkan password" required>
                </div>
                <button type="submit" class="btn-submit"><i class="fa-solid fa-right-to-bracket"></i> Login ke Panel Admin</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Database Connection (SQLite3 PDO)
$dbFile = __DIR__ . '/promos.db';
try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);


    // Create promos table
    $pdo->exec("CREATE TABLE IF NOT EXISTS promos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        media_type TEXT DEFAULT 'image',
        media_url TEXT,
        accent_color TEXT DEFAULT '#D4A853',
        bg_color1 TEXT DEFAULT '#2C1810',
        bg_color2 TEXT DEFAULT '#1A0C05',
        is_video INTEGER DEFAULT 0,
        video_duration TEXT DEFAULT '0:30',
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Create tickers table (Feature 2)
    $pdo->exec("CREATE TABLE IF NOT EXISTS tickers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        icon TEXT DEFAULT '☕',
        text TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Seed default promos if table is empty
    $countPromos = $pdo->query("SELECT COUNT(*) FROM promos")->fetchColumn();
    if ($countPromos == 0) {
        $stmt = $pdo->prepare("INSERT INTO promos (tag, title, subtitle, media_type, media_url, accent_color, bg_color1, bg_color2, is_video, video_duration, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->execute(['🎥 CINEMATIC VIDEO', "Atmosphere &\nBrewing Baraja", 'Saksikan keahlian barista Baraja menyeduh kopi pilihan dalam atmosfer Amphitheater yang hangat.', 'video', '', '#E8C27A', '#1E1408', '#100A04', 1, '0:30', 1]);
        $stmt->execute(['☕ SIGNATURE MENU', "Manual Brew\nArabica Gayo", 'Single origin dengan cita rasa floral, fruity, dan aftertaste manis khas dataran tinggi Gayo.', 'image', '', '#D4A853', '#2C1810', '#1A0C05', 0, '', 2]);
        $stmt->execute(['🎰 DAILY REWARD', "Spin Wheel\nBerhadiah", 'Transaksi min. Rp 500.000 berhak putar Spin Wheel berhadiah merchandise & voucher eksklusif.', 'image', '', '#BBA5E8', '#1A1030', '#0E0A1E', 0, '', 3]);
    }

    // Seed default tickers if table is empty
    $countTickers = $pdo->query("SELECT COUNT(*) FROM tickers")->fetchColumn();
    if ($countTickers == 0) {
        $stmtT = $pdo->prepare("INSERT INTO tickers (icon, text, sort_order) VALUES (?, ?, ?)");
        $stmtT->execute(['☕', 'Selamat Datang di Baraja Coffee Amphitheater', 1]);
        $stmtT->execute(['📡', 'WiFi: acaradibaraja — Gratis untuk pelanggan', 2]);
        $stmtT->execute(['🎶', 'Live Event setiap malam — Gratis!', 3]);
        $stmtT->execute(['⏰', 'Jam Operasional: 06:00 — 03:00 WIB', 4]);
        $stmtT->execute(['🎁', 'Spin Berhadiah min. transaksi Rp 500.000', 5]);
        $stmtT->execute(['📸', 'Follow @barajacoffee untuk promo eksklusif', 6]);
    }
} catch (Exception $e) {
    die("Database Error: " . $e->getMessage());
}

// Upload directory
$uploadDir = __DIR__ . '/uploads/';
if (!file_exists($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
}

// Handle Form Actions
$message = '';
$messageType = 'success';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // ── PROMO ACTIONS ──
    if ($action === 'save') {
        $id = intval($_POST['id'] ?? 0);
        $tag = trim($_POST['tag'] ?? '');
        $title = trim($_POST['title'] ?? '');
        $subtitle = trim($_POST['subtitle'] ?? '');
        $mediaType = $_POST['media_type'] ?? 'image';
        $accentColor = $_POST['accent_color'] ?? '#D4A853';
        $bgColor1 = $_POST['bg_color1'] ?? '#2C1810';
        $bgColor2 = $_POST['bg_color2'] ?? '#1A0C05';
        $isVideo = isset($_POST['is_video']) ? 1 : 0;
        $videoDuration = trim($_POST['video_duration'] ?? '0:30');
        $isActive = isset($_POST['is_active']) ? 1 : 0;
        $sortOrder = intval($_POST['sort_order'] ?? 0);
        $existingMediaUrl = $_POST['existing_media_url'] ?? '';

        $mediaUrlInput = trim($_POST['media_url_input'] ?? '');
        $mediaUrl = !empty($mediaUrlInput) ? $mediaUrlInput : $existingMediaUrl;

        $uploadErrorMsg = null;
        if (isset($_FILES['media_file']) && $_FILES['media_file']['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['media_file']['name'], PATHINFO_EXTENSION));
            $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'];
            if (in_array($ext, $allowedExts)) {
                $filename = 'promo_' . time() . '_' . rand(100, 999) . '.' . $ext;
                $targetFile = $uploadDir . $filename;
                if (move_uploaded_file($_FILES['media_file']['tmp_name'], $targetFile)) {
                    $mediaUrl = 'uploads/' . $filename;
                } else {
                    $uploadErrorMsg = 'Gagal memindahkan file terunggah ke folder uploads/';
                }
            } else {
                $uploadErrorMsg = 'Format file tidak didukung (.'.$ext.'). Gunakan format MP4, WEBM, JPG, PNG.';
            }
        } elseif (isset($_FILES['media_file']) && $_FILES['media_file']['error'] !== UPLOAD_ERR_NO_FILE) {
            $errCode = $_FILES['media_file']['error'];
            if ($errCode === UPLOAD_ERR_INI_SIZE || $errCode === UPLOAD_ERR_FORM_SIZE) {
                $uploadErrorMsg = 'Ukuran file video/media melebihi batas php.ini XAMPP (upload_max_filesize). Silakan gunakan file < 2MB atau isi kolom URL Media (Link Direct MP4).';
            }
        }

        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE promos SET tag=?, title=?, subtitle=?, media_type=?, media_url=?, accent_color=?, bg_color1=?, bg_color2=?, is_video=?, video_duration=?, is_active=?, sort_order=? WHERE id=?");
            $stmt->execute([$tag, $title, $subtitle, $mediaType, $mediaUrl, $accentColor, $bgColor1, $bgColor2, $isVideo, $videoDuration, $isActive, $sortOrder, $id]);
            $message = $uploadErrorMsg ? $uploadErrorMsg : 'Promo berhasil diperbarui!';
            if ($uploadErrorMsg) $messageType = 'danger';
        } else {
            $stmt = $pdo->prepare("INSERT INTO promos (tag, title, subtitle, media_type, media_url, accent_color, bg_color1, bg_color2, is_video, video_duration, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$tag, $title, $subtitle, $mediaType, $mediaUrl, $accentColor, $bgColor1, $bgColor2, $isVideo, $videoDuration, $isActive, $sortOrder]);
            $message = $uploadErrorMsg ? $uploadErrorMsg : 'Promo baru berhasil ditambahkan!';
            if ($uploadErrorMsg) $messageType = 'danger';
        }
    } elseif ($action === 'delete') {
        $id = intval($_POST['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare("DELETE FROM promos WHERE id=?");
            $stmt->execute([$id]);
            $message = 'Promo berhasil dihapus!';
        }
    } elseif ($action === 'toggle_active') {
        $id = intval($_POST['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE promos SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id=?");
            $stmt->execute([$id]);
            $message = 'Status promo berhasil diubah!';
        }
    }

    // ── TICKER ACTIONS ──
    elseif ($action === 'save_ticker') {
        $id = intval($_POST['ticker_id'] ?? 0);
        $icon = trim($_POST['ticker_icon'] ?? '☕');
        $text = trim($_POST['ticker_text'] ?? '');
        $isActive = isset($_POST['ticker_is_active']) ? 1 : 0;
        $sortOrder = intval($_POST['ticker_sort_order'] ?? 0);

        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE tickers SET icon=?, text=?, is_active=?, sort_order=? WHERE id=?");
            $stmt->execute([$icon, $text, $isActive, $sortOrder, $id]);
            $message = 'Ticker Running Text berhasil diperbarui!';
        } else {
            $stmt = $pdo->prepare("INSERT INTO tickers (icon, text, is_active, sort_order) VALUES (?, ?, ?, ?)");
            $stmt->execute([$icon, $text, $isActive, $sortOrder]);
            $message = 'Ticker Running Text baru berhasil ditambahkan!';
        }
    } elseif ($action === 'delete_ticker') {
        $id = intval($_POST['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare("DELETE FROM tickers WHERE id=?");
            $stmt->execute([$id]);
            $message = 'Ticker berhasil dihapus!';
        }
    } elseif ($action === 'toggle_ticker') {
        $id = intval($_POST['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE tickers SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id=?");
            $stmt->execute([$id]);
            $message = 'Status Ticker berhasil diubah!';
        }
    }
}

// Fetch All Data
$promos = $pdo->query("SELECT * FROM promos ORDER BY sort_order ASC, id DESC")->fetchAll();
$tickers = $pdo->query("SELECT * FROM tickers ORDER BY sort_order ASC, id DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard — Baraja Display Manager</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        :root {
            --sage: #6E8F5C;
            --sage-light: #8CA97A;
            --sage-dark: #4F6B41;
            --sage-soft: rgba(110, 143, 92, 0.1);
            --border-soft: rgba(79, 107, 65, 0.14);
            --text-main: #2B3328;
            --text-muted: #6E7A66;
        }
        body {
            background-color: #F5F7F0;
            background-image:
                radial-gradient(at 0% 0%, rgba(110, 143, 92, 0.1) 0px, transparent 55%),
                radial-gradient(at 100% 100%, rgba(140, 163, 124, 0.12) 0px, transparent 55%);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
        }
        h1, h5, h6, .navbar-brand, .nav-link, .btn, label, .modal-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .navbar {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-soft);
            box-shadow: 0 2px 16px rgba(79, 107, 65, 0.06);
        }
        .card-custom {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid var(--border-soft);
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(79, 107, 65, 0.06);
        }
        .nav-tabs {
            border-bottom: 1px solid var(--border-soft);
        }
        .nav-tabs .nav-link {
            color: var(--text-muted);
            border: none;
            border-bottom: 3px solid transparent;
            font-weight: 700;
        }
        .nav-tabs .nav-link:hover {
            color: var(--sage-dark);
        }
        .nav-tabs .nav-link.active {
            color: var(--sage-dark);
            background: transparent;
            border-bottom: 3px solid var(--sage);
        }
        .table-custom {
            color: var(--text-main);
        }
        .table-custom th {
            background-color: rgba(110, 143, 92, 0.08);
            color: var(--sage-dark);
            border-bottom: 1px solid var(--border-soft);
            font-size: 12.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .table-custom td {
            border-bottom: 1px solid var(--border-soft);
            vertical-align: middle;
        }
        .btn-gold {
            background: linear-gradient(135deg, var(--sage), var(--sage-dark));
            color: #fff;
            font-weight: 700;
            border: none;
        }
        .btn-gold:hover {
            background: linear-gradient(135deg, var(--sage-light), var(--sage));
            color: #fff;
        }
        .badge-tag {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
        }
        .color-preview {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: inline-block;
            border: 1px solid rgba(79, 107, 65, 0.2);
        }
        .media-preview {
            max-width: 60px;
            max-height: 40px;
            border-radius: 6px;
            object-fit: cover;
        }
        .text-warning { color: var(--sage-dark) !important; }
        .text-secondary { color: var(--text-muted) !important; }
        .btn-outline-warning { color: var(--sage-dark); border-color: rgba(79,107,65,0.35); }
        .btn-outline-warning:hover { background: var(--sage); border-color: var(--sage); color: #fff; }
        .btn-outline-danger { color: #C15C4E; border-color: rgba(193,92,78,0.4); }
        .btn-outline-danger:hover { background: #C15C4E; border-color: #C15C4E; }
        .btn-success { background: #5C8C4A; border-color: #5C8C4A; }
        .btn-secondary { background: #A9B39F; border-color: #A9B39F; }
        .form-control, .form-select, .form-control.bg-dark {
            background-color: #FFFFFF !important;
            color: var(--text-main) !important;
            border-color: rgba(79,107,65,0.2) !important;
        }
        .form-control:focus, .form-select:focus {
            border-color: var(--sage) !important;
            box-shadow: 0 0 0 3px var(--sage-soft) !important;
        }
        .modal-content {
            background: rgba(255,255,255,0.97) !important;
            border: 1px solid var(--border-soft) !important;
            color: var(--text-main) !important;
        }
        .modal-header, .modal-footer { border-color: var(--border-soft) !important; }
        .btn-close { filter: none !important; }
        .stat-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            background: var(--sage-soft);
            color: var(--sage-dark);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
    </style>
</head>
<body class="pb-5">

<!-- Header Navbar -->
<nav class="navbar py-3">
    <div class="container d-flex justify-content-between align-items-center">
        <a class="navbar-brand d-flex align-items-center" href="#">
            <div class="rounded-circle d-flex align-items-center justify-content-center me-3 text-white" style="width:40px; height:40px; background: linear-gradient(135deg, #8CA97A, #4F6B41);">
                <i class="fa-solid fa-mug-saucer"></i>
            </div>
            <div>
                <div class="fw-bold fs-5" style="letter-spacing:1px; color: var(--text-main);">BARAJA COFFEE</div>
                <div class="small text-warning" style="font-size:10px; letter-spacing:2px;">ADMIN DISPLAY MANAGER (SQLITE3)</div>
            </div>
        </a>
        <a href="admin.php?action=logout" class="btn btn-outline-danger btn-sm px-3 rounded-pill fw-bold">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
        </a>
    </div>
</nav>

<div class="container mt-4">

    <?php if ($message): ?>
        <div class="alert alert-dismissible fade show" role="alert" style="background:rgba(92,140,74,0.1); border:1px solid rgba(92,140,74,0.35); color:#446B36;">
            <i class="fa-solid fa-circle-check"></i> <strong>Sukses:</strong> <?= htmlspecialchars($message) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="card-custom p-3 d-flex flex-row align-items-center">
                <div class="stat-icon me-3"><i class="fa-solid fa-palette"></i></div>
                <div>
                    <div class="text-secondary small">TOTAL PROMO</div>
                    <div class="fs-4 fw-bold" style="color: var(--text-main);"><?= count($promos) ?> Slide</div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card-custom p-3 d-flex flex-row align-items-center">
                <div class="stat-icon me-3"><i class="fa-solid fa-bullhorn"></i></div>
                <div>
                    <div class="text-secondary small">RUNNING TICKER</div>
                    <div class="fs-4 fw-bold text-warning"><?= count($tickers) ?> Ticker</div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card-custom p-3 d-flex flex-row align-items-center">
                <div class="stat-icon me-3"><i class="fa-solid fa-circle-check"></i></div>
                <div>
                    <div class="text-secondary small">AKTIF SLIDE / TICKER</div>
                    <div class="fs-4 fw-bold" style="color:#5C8C4A;">
                        <?= count(array_filter($promos, function($p){ return $p['is_active'] == 1; })) ?> / <?= count(array_filter($tickers, function($t){ return $t['is_active'] == 1; })) ?>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card-custom p-3 d-flex flex-row align-items-center">
                <div class="stat-icon me-3"><i class="fa-solid fa-database"></i></div>
                <div>
                    <div class="text-secondary small">DATABASE ENGINE</div>
                    <div class="fs-4 fw-bold text-warning">SQLite3</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Navigation Tabs -->
    <ul class="nav nav-tabs mb-3" id="adminTabs" role="tablist">
        <li class="nav-item">
            <button class="nav-link active" id="promos-tab" data-bs-toggle="tab" data-bs-target="#promos-content" type="button"><i class="fa-solid fa-palette me-1"></i> Promo Slider Manager</button>
        </li>
        <li class="nav-item">
            <button class="nav-link" id="tickers-tab" data-bs-toggle="tab" data-bs-target="#tickers-content" type="button"><i class="fa-solid fa-bullhorn me-1"></i> Running Text / Ticker Manager</button>
        </li>
    </ul>

    <div class="tab-content" id="adminTabsContent">
        <!-- ── TAB 1: PROMO SLIDER MANAGER ── -->
        <div class="tab-pane fade show active" id="promos-content" role="tabpanel">
            <div class="card-custom p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold mb-0 text-warning"><i class="fa-solid fa-clipboard-list me-1"></i> Daftar Promo Slider Customer Display</h5>
                    <button class="btn btn-gold btn-sm px-3" data-bs-toggle="modal" data-bs-target="#promoModal" onclick="clearForm()">
                        <i class="fa-solid fa-plus"></i> Tambah Promo Baru
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-custom align-middle">
                        <thead>
                            <tr>
                                <th width="50">Urutan</th>
                                <th>Tag / Badge</th>
                                <th>Judul Promo</th>
                                <th>Sub-Judul</th>
                                <th>Media</th>
                                <th>Aksen Warna</th>
                                <th>Status</th>
                                <th width="150">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($promos)): ?>
                                <tr>
                                    <td colspan="8" class="text-center py-4 text-secondary">Belum ada promo. Klik tombol "+ Tambah Promo Baru" untuk menambahkan.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($promos as $p): ?>
                                    <tr>
                                        <td class="fw-bold text-warning text-center"><?= $p['sort_order'] ?></td>
                                        <td>
                                            <span class="badge-tag" style="background:<?= $p['accent_color'] ?>; color:#000;">
                                                <?= htmlspecialchars($p['tag']) ?>
                                            </span>
                                        </td>
                                        <td class="fw-bold"><?= nl2br(htmlspecialchars($p['title'])) ?></td>
                                        <td class="small text-secondary" style="max-width: 250px;"><?= htmlspecialchars($p['subtitle']) ?></td>
                                        <td>
                                            <?php if ($p['media_url']): ?>
                                                <?php if ($p['is_video']): ?>
                                                    <span class="badge" style="background:#6B3FB5;"><i class="fa-solid fa-video"></i> Video (<?= $p['video_duration'] ?>)</span>
                                                <?php else: ?>
                                                    <img src="<?= htmlspecialchars($p['media_url']) ?>" class="media-preview" alt="Promo">
                                                <?php endif; ?>
                                            <?php else: ?>
                                                <span class="text-secondary small"><i>Default Vector</i></span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <span class="color-preview" style="background:<?= $p['accent_color'] ?>;" title="Accent"></span>
                                            <span class="color-preview" style="background:<?= $p['bg_color1'] ?>;" title="BG 1"></span>
                                            <span class="color-preview" style="background:<?= $p['bg_color2'] ?>;" title="BG 2"></span>
                                        </td>
                                        <td>
                                            <form method="POST" style="display:inline;">
                                                <input type="hidden" name="action" value="toggle_active">
                                                <input type="hidden" name="id" value="<?= $p['id'] ?>">
                                                <button type="submit" class="btn btn-sm text-white <?= $p['is_active'] ? 'btn-success' : 'btn-secondary' ?>">
                                                    <i class="fa-solid <?= $p['is_active'] ? 'fa-circle-check' : 'fa-circle-xmark' ?>"></i> <?= $p['is_active'] ? 'Aktif' : 'Non-Aktif' ?>
                                                </button>
                                            </form>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-warning me-1" onclick='editPromo(<?= json_encode($p) ?>)' data-bs-toggle="modal" data-bs-target="#promoModal"><i class="fa-solid fa-pen"></i> Edit</button>
                                            <form method="POST" style="display:inline;" onsubmit="return confirm('Yakin hapus promo ini?');">
                                                <input type="hidden" name="action" value="delete">
                                                <input type="hidden" name="id" value="<?= $p['id'] ?>">
                                                <button type="submit" class="btn btn-sm btn-outline-danger"><i class="fa-solid fa-trash"></i></button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ── TAB 2: RUNNING TEXT TICKER MANAGER ── -->
        <div class="tab-pane fade" id="tickers-content" role="tabpanel">
            <div class="card-custom p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold mb-0 text-warning"><i class="fa-solid fa-bullhorn me-1"></i> Daftar Ticker Running Text Header</h5>
                    <button class="btn btn-gold btn-sm px-3" data-bs-toggle="modal" data-bs-target="#tickerModal" onclick="clearTickerForm()">
                        <i class="fa-solid fa-plus"></i> Tambah Ticker Baru
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-custom align-middle">
                        <thead>
                            <tr>
                                <th width="60">Urutan</th>
                                <th width="70">Icon</th>
                                <th>Teks Pengumuman / Ticker</th>
                                <th width="120">Status</th>
                                <th width="150">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($tickers)): ?>
                                <tr>
                                    <td colspan="5" class="text-center py-4 text-secondary">Belum ada ticker pengumuman. Klik "+ Tambah Ticker Baru" untuk menambahkan.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($tickers as $t): ?>
                                    <tr>
                                        <td class="fw-bold text-warning text-center"><?= $t['sort_order'] ?></td>
                                        <td class="fs-4 text-center"><?= htmlspecialchars($t['icon']) ?></td>
                                        <td class="fw-bold" style="color: var(--text-main);"><?= htmlspecialchars($t['text']) ?></td>
                                        <td>
                                            <form method="POST" style="display:inline;">
                                                <input type="hidden" name="action" value="toggle_ticker">
                                                <input type="hidden" name="id" value="<?= $t['id'] ?>">
                                                <button type="submit" class="btn btn-sm text-white <?= $t['is_active'] ? 'btn-success' : 'btn-secondary' ?>">
                                                    <i class="fa-solid <?= $t['is_active'] ? 'fa-circle-check' : 'fa-circle-xmark' ?>"></i> <?= $t['is_active'] ? 'Aktif' : 'Non-Aktif' ?>
                                                </button>
                                            </form>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-warning me-1" onclick='editTicker(<?= json_encode($t) ?>)' data-bs-toggle="modal" data-bs-target="#tickerModal"><i class="fa-solid fa-pen"></i> Edit</button>
                                            <form method="POST" style="display:inline;" onsubmit="return confirm('Yakin hapus ticker ini?');">
                                                <input type="hidden" name="action" value="delete_ticker">
                                                <input type="hidden" name="id" value="<?= $t['id'] ?>">
                                                <button type="submit" class="btn btn-sm btn-outline-danger"><i class="fa-solid fa-trash"></i></button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

</div>

<!-- Modal Form Promo -->
<div class="modal fade" id="promoModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" style="border-radius:20px;">
            <form method="POST" enctype="multipart/form-data">
                <input type="hidden" name="action" value="save">
                <input type="hidden" name="id" id="form_id" value="0">
                <input type="hidden" name="existing_media_url" id="form_existing_media_url" value="">

                <div class="modal-header">
                    <h5 class="modal-title text-warning fw-bold" id="modalTitle"><i class="fa-solid fa-plus"></i> Tambah Promo Baru</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-8">
                            <label class="form-label text-secondary small">TAG / BADGE TEXT</label>
                            <input type="text" class="form-control bg-dark text-white border-secondary" name="tag" id="form_tag" placeholder="Misal: ☕ SIGNATURE MENU, 🎥 CINEMATIC VIDEO" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label text-secondary small">URUTAN SLIDE (SORT)</label>
                            <input type="number" class="form-control bg-dark text-white border-secondary" name="sort_order" id="form_sort_order" value="1" required>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label text-secondary small">JUDUL PROMO (Gunakan enter untuk baris baru)</label>
                            <textarea class="form-control bg-dark text-white border-secondary" name="title" id="form_title" rows="2" placeholder="Manual Brew&#10;Arabica Gayo" required></textarea>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label text-secondary small">DESKRIPSI / SUB-JUDUL</label>
                            <textarea class="form-control bg-dark text-white border-secondary" name="subtitle" id="form_subtitle" rows="3" placeholder="Deskripsi singkat menarik..." required></textarea>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label text-secondary small">TIPE MEDIA</label>
                            <select class="form-select bg-dark text-white border-secondary" name="media_type" id="form_media_type" onchange="toggleMediaFields()">
                                <option value="image">Gambar (JPG, PNG, WEBP)</option>
                                <option value="video">Video (MP4, WEBM)</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-secondary small">UPLOAD FILE MEDIA (Opsional)</label>
                            <input type="file" class="form-control bg-dark text-white border-secondary" name="media_file">
                        </div>

                        <div class="col-md-12">
                            <div id="current_media_box" class="d-flex align-items-center gap-2 p-2 rounded-3 mb-1" style="background: var(--sage-soft); border: 1px dashed rgba(79,107,65,0.35); display:none;">
                                <img id="current_media_thumb" src="" class="rounded-2" style="width:52px;height:38px;object-fit:cover; display:none;" alt="Media saat ini">
                                <div id="current_media_icon" class="d-flex align-items-center justify-content-center rounded-2" style="width:52px;height:38px; background:#6B3FB5; color:#fff; display:none;">
                                    <i class="fa-solid fa-video"></i>
                                </div>
                                <div class="small flex-grow-1" style="min-width:0;">
                                    <div class="fw-bold" style="color: var(--sage-dark);"><i class="fa-solid fa-circle-info"></i> Media saat ini terpasang</div>
                                    <a id="current_media_link" href="#" target="_blank" class="text-decoration-none" style="color: var(--text-muted); word-break: break-all;"></a>
                                </div>
                            </div>
                            <div id="no_media_box" class="small text-secondary fst-italic mb-1">
                                <i class="fa-regular fa-image"></i> Belum ada file/URL media untuk promo ini (memakai tampilan vector/gradient default).
                            </div>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label text-secondary small">URL MEDIA / LINK DIRECT VIDEO (Opsional)</label>
                            <input type="text" class="form-control bg-dark text-white border-secondary" name="media_url_input" id="form_media_url_input" placeholder="Misal: https://.../video.mp4 atau uploads/namafile.mp4">
                            <div class="form-text text-muted small">Kosongkan agar media saat ini (lihat kotak info di atas) tetap dipakai. Isi atau upload file baru untuk menggantinya.</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label text-secondary small">WARNA AKSEN (HEX)</label>
                            <input type="color" class="form-control form-control-color w-100 bg-dark border-secondary" name="accent_color" id="form_accent_color" value="#D4A853">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label text-secondary small">WARNA BG 1 (GRADIENT)</label>
                            <input type="color" class="form-control form-control-color w-100 bg-dark border-secondary" name="bg_color1" id="form_bg_color1" value="#2C1810">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label text-secondary small">WARNA BG 2 (GRADIENT)</label>
                            <input type="color" class="form-control form-control-color w-100 bg-dark border-secondary" name="bg_color2" id="form_bg_color2" value="#1A0C05">
                        </div>

                        <div class="col-md-6" id="video_opts" style="display:none;">
                            <label class="form-label text-secondary small">DURASI VIDEO (Misal: 0:30)</label>
                            <input type="text" class="form-control bg-dark text-white border-secondary" name="video_duration" id="form_video_duration" value="0:30">
                        </div>

                        <div class="col-md-6 d-flex align-items-end">
                            <div class="form-check form-switch me-4">
                                <input class="form-check-input" type="checkbox" name="is_video" id="form_is_video">
                                <label class="form-check-label" style="color: var(--text-main);" for="form_is_video">Mode Video Showcase</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="is_active" id="form_is_active" checked>
                                <label class="form-check-label" style="color: var(--text-main);" for="form_is_active">Aktifkan Slide</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary text-white" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-gold px-4"><i class="fa-solid fa-floppy-disk"></i> Simpan Promo</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Form Ticker -->
<div class="modal fade" id="tickerModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content" style="border-radius:20px;">
            <form method="POST">
                <input type="hidden" name="action" value="save_ticker">
                <input type="hidden" name="ticker_id" id="ticker_form_id" value="0">

                <div class="modal-header">
                    <h5 class="modal-title text-warning fw-bold" id="tickerModalTitle"><i class="fa-solid fa-bullhorn"></i> Tambah Ticker Pengumuman</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label text-secondary small">ICON (EMOJI)</label>
                            <input type="text" class="form-control bg-dark text-white border-secondary fs-5 text-center" name="ticker_icon" id="ticker_form_icon" value="☕" required>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label text-secondary small">URUTAN (SORT ORDER)</label>
                            <input type="number" class="form-control bg-dark text-white border-secondary" name="ticker_sort_order" id="ticker_form_sort_order" value="1" required>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label text-secondary small">TEKS TICKER PENGUMUMAN</label>
                            <textarea class="form-control bg-dark text-white border-secondary" name="ticker_text" id="ticker_form_text" rows="3" placeholder="Misal: WiFi: acaradibaraja — Gratis untuk pelanggan" required></textarea>
                        </div>
                        <div class="col-md-12">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="ticker_is_active" id="ticker_form_is_active" checked>
                                <label class="form-check-label" style="color: var(--text-main);" for="ticker_form_is_active">Aktifkan Ticker Ini</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary text-white" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-gold px-4"><i class="fa-solid fa-floppy-disk"></i> Simpan Ticker</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
    function clearForm() {
        document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-plus"></i> Tambah Promo Baru';
        document.getElementById('form_id').value = '0';
        document.getElementById('form_existing_media_url').value = '';
        document.getElementById('form_tag').value = '';
        document.getElementById('form_title').value = '';
        document.getElementById('form_subtitle').value = '';
        document.getElementById('form_media_type').value = 'image';
        document.getElementById('form_accent_color').value = '#D4A853';
        document.getElementById('form_bg_color1').value = '#2C1810';
        document.getElementById('form_bg_color2').value = '#1A0C05';
        document.getElementById('form_is_video').checked = false;
        document.getElementById('form_video_duration').value = '0:30';
        document.getElementById('form_is_active').checked = true;
        document.getElementById('form_sort_order').value = '1';
        document.querySelector('#promoModal input[name="media_file"]').value = '';
        updateCurrentMediaBox('', false);
        toggleMediaFields();
    }

    function editPromo(p) {
        document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Promo #' + p.id;
        document.getElementById('form_id').value = p.id;
        document.getElementById('form_existing_media_url').value = p.media_url || '';
        document.getElementById('form_tag').value = p.tag;
        document.getElementById('form_title').value = p.title;
        document.getElementById('form_subtitle').value = p.subtitle;
        document.getElementById('form_media_type').value = p.media_type;
        document.getElementById('form_accent_color').value = p.accent_color || '#D4A853';
        document.getElementById('form_bg_color1').value = p.bg_color1 || '#2C1810';
        document.getElementById('form_bg_color2').value = p.bg_color2 || '#1A0C05';
        document.getElementById('form_is_video').checked = p.is_video == 1;
        document.getElementById('form_video_duration').value = p.video_duration || '0:30';
        document.getElementById('form_is_active').checked = p.is_active == 1;
        document.getElementById('form_sort_order').value = p.sort_order;
        document.querySelector('#promoModal input[name="media_file"]').value = '';
        updateCurrentMediaBox(p.media_url || '', p.is_video == 1);
        toggleMediaFields();
    }

    function updateCurrentMediaBox(mediaUrl, isVideo) {
        var box = document.getElementById('current_media_box');
        var noBox = document.getElementById('no_media_box');
        var thumb = document.getElementById('current_media_thumb');
        var icon = document.getElementById('current_media_icon');
        var link = document.getElementById('current_media_link');

        document.getElementById('form_media_url_input').value = '';

        if (mediaUrl) {
            box.style.display = 'flex';
            noBox.style.display = 'none';
            link.href = mediaUrl;
            link.textContent = mediaUrl;
            if (isVideo) {
                thumb.style.display = 'none';
                icon.style.display = 'flex';
            } else {
                icon.style.display = 'none';
                thumb.style.display = 'block';
                thumb.src = mediaUrl;
            }
        } else {
            box.style.display = 'none';
            noBox.style.display = 'block';
        }
    }

    function toggleMediaFields() {
        var type = document.getElementById('form_media_type').value;
        var videoOpts = document.getElementById('video_opts');
        var isVideo = document.getElementById('form_is_video');
        if (type === 'video') {
            videoOpts.style.display = 'block';
            isVideo.checked = true;
        } else {
            videoOpts.style.display = 'none';
        }
    }

    function clearTickerForm() {
        document.getElementById('tickerModalTitle').innerHTML = '<i class="fa-solid fa-bullhorn"></i> Tambah Ticker Pengumuman';
        document.getElementById('ticker_form_id').value = '0';
        document.getElementById('ticker_form_icon').value = '☕';
        document.getElementById('ticker_form_text').value = '';
        document.getElementById('ticker_form_sort_order').value = '1';
        document.getElementById('ticker_form_is_active').checked = true;
    }

    function editTicker(t) {
        document.getElementById('tickerModalTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Ticker #' + t.id;
        document.getElementById('ticker_form_id').value = t.id;
        document.getElementById('ticker_form_icon').value = t.icon || '☕';
        document.getElementById('ticker_form_text').value = t.text;
        document.getElementById('ticker_form_sort_order').value = t.sort_order;
        document.getElementById('ticker_form_is_active').checked = t.is_active == 1;
    }
</script>
</body>
</html>