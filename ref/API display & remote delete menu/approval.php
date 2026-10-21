<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manager Remote Authorization Portal - Baraja Coffee</title>

    <!-- PWA Manifest & Meta Tags -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#4F6B41">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Baraja Approval">
    <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <style>
        :root {
            --sage: #6E8F5C;
            --sage-light: #8CA97A;
            --sage-dark: #4F6B41;
            --sage-soft: rgba(110, 143, 92, 0.12);
            --bg-dark: #F5F7F0;
            --bg-dark-2: #EEF2E7;
            --card-bg: rgba(255, 255, 255, 0.85);
            --card-border: rgba(79, 107, 65, 0.14);
            --success: #5C8C4A;
            --success-dark: #446B36;
            --danger: #C15C4E;
            --warning: #B9862B;
            --text-main: #2B3328;
            --text-muted: #6E7A66;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-dark);
            background-image:
                radial-gradient(at 0% 0%, rgba(110, 143, 92, 0.14) 0px, transparent 55%),
                radial-gradient(at 100% 100%, rgba(140, 163, 124, 0.16) 0px, transparent 55%);
            color: var(--text-main);
            min-height: 100vh;
            padding-bottom: 48px;
        }

        h1, h2, h3, h4, h5, .brand-title, .section-title, .btn {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ===== Header ===== */
        header {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(14px);
            border-bottom: 1px solid var(--card-border);
            padding: 16px 28px;
            box-shadow: 0 2px 16px rgba(79, 107, 65, 0.06);
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .brand-logo {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, var(--sage-light), var(--sage-dark));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            box-shadow: 0 4px 14px rgba(140, 163, 124, 0.35);
        }

        .brand-title h1 {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.3px;
            margin: 0;
        }

        .brand-title p {
            font-size: 12.5px;
            color: var(--text-muted);
            margin: 0;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .live-badge {
            background: rgba(127, 176, 105, 0.15);
            color: var(--success);
            border: 1px solid rgba(127, 176, 105, 0.35);
            padding: 7px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .live-dot {
            width: 8px;
            height: 8px;
            background-color: var(--success);
            border-radius: 50%;
            animation: pulse 1.6s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(127, 176, 105, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(127, 176, 105, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(127, 176, 105, 0); }
        }

        .main-container {
            max-width: 1140px;
            margin: 28px auto;
            padding: 0 20px;
        }

        /* ===== Tabs ===== */
        .nav-tabs-custom {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--card-border);
            padding-bottom: 10px;
            flex-wrap: wrap;
        }

        .tab-btn {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-muted);
            padding: 10px 18px;
            font-size: 14px;
            font-weight: 600;
            font-family: 'Plus Jakarta Sans', sans-serif;
            cursor: pointer;
            border-radius: 10px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tab-btn:hover {
            color: var(--text-main);
            background: rgba(79, 107, 65, 0.06);
        }

        .tab-btn.active {
            color: var(--sage-dark);
            background: var(--sage-soft);
            border: 1px solid rgba(110, 143, 92, 0.35);
        }

        .tab-badge {
            background: var(--danger);
            color: white;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
        }

        .section-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-main);
        }

        .section-title i {
            color: var(--sage-dark);
        }

        /* ===== Cards ===== */
        .requests-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 18px;
        }

        .request-card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--card-border);
            border-radius: 18px;
            padding: 22px;
            position: relative;
            box-shadow: 0 8px 24px rgba(79, 107, 65, 0.08);
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .request-card:hover {
            transform: translateY(-3px);
            border-color: rgba(110, 143, 92, 0.4);
            box-shadow: 0 12px 30px rgba(79, 107, 65, 0.14);
        }

        .request-card.pending {
            border-left: 4px solid var(--warning);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 14px;
        }

        .cashier-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .avatar {
            width: 40px;
            height: 40px;
            background: var(--sage-soft);
            border: 1px solid rgba(110, 143, 92, 0.35);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--sage-dark);
            font-weight: 700;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .cashier-name {
            font-weight: 700;
            font-size: 15px;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .time-ago {
            font-size: 12px;
            color: var(--text-muted);
        }

        .status-pill {
            padding: 4px 11px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }

        .status-pill.pending {
            background: rgba(217, 164, 65, 0.18);
            color: var(--warning);
            border: 1px solid rgba(217, 164, 65, 0.35);
        }

        .status-pill.approved {
            background: rgba(127, 176, 105, 0.18);
            color: var(--success);
            border: 1px solid rgba(127, 176, 105, 0.35);
        }

        .status-pill.rejected {
            background: rgba(217, 112, 102, 0.18);
            color: var(--danger);
            border: 1px solid rgba(217, 112, 102, 0.35);
        }

        .card-body {
            background: rgba(79, 107, 65, 0.05);
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 16px;
            border: 1px solid rgba(79, 107, 65, 0.07);
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            font-size: 13px;
            margin-bottom: 7px;
        }

        .detail-row:last-child {
            margin-bottom: 0;
        }

        .detail-label {
            color: var(--text-muted);
        }

        .detail-val {
            font-weight: 500;
            text-align: right;
        }

        .reason-box {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed rgba(79, 107, 65, 0.18);
            color: var(--sage-dark);
            font-size: 13px;
            font-weight: 500;
            display: flex;
            gap: 8px;
        }

        .card-actions {
            display: flex;
            gap: 10px;
        }

        .btn {
            padding: 9px 14px;
            border: none;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            transition: all 0.2s;
        }

        .btn-approve {
            background: linear-gradient(135deg, var(--success), var(--success-dark));
            color: white;
            box-shadow: 0 4px 14px rgba(127, 176, 105, 0.3);
            flex: 1;
        }

        .btn-approve:hover {
            filter: brightness(1.08);
            transform: scale(1.02);
        }

        .btn-reject {
            background: rgba(217, 112, 102, 0.15);
            color: var(--danger);
            border: 1px solid rgba(217, 112, 102, 0.3);
            flex: 1;
        }

        .btn-reject:hover {
            background: rgba(217, 112, 102, 0.3);
        }

        .btn-test {
            background: var(--sage-soft);
            color: var(--sage-dark);
            border: 1px solid rgba(110, 143, 92, 0.4);
        }
        .btn-test:hover {
            background: rgba(110, 143, 92, 0.22);
        }

        .empty-state {
            text-align: center;
            padding: 64px 20px;
            background: var(--card-bg);
            border-radius: 18px;
            border: 1px dashed var(--card-border);
            color: var(--text-muted);
        }

        .empty-state .icon {
            font-size: 40px;
            margin-bottom: 16px;
            display: block;
            color: var(--sage);
        }

        .empty-state h3 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--text-main);
            font-size: 17px;
            margin-bottom: 6px;
        }

        /* ===== Settings ===== */
        .input-group {
            margin-bottom: 18px;
        }

        .input-group label {
            display: block;
            font-size: 12.5px;
            color: var(--text-muted);
            margin-bottom: 7px;
            font-weight: 500;
        }

        .input-control {
            width: 100%;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(79, 107, 65, 0.2);
            padding: 12px 14px;
            border-radius: 10px;
            color: var(--text-main);
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-control:focus {
            border-color: var(--sage);
            box-shadow: 0 0 0 3px var(--sage-soft);
        }

        .settings-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 18px;
            padding: 26px;
            max-width: 500px;
            box-shadow: 0 8px 24px rgba(79, 107, 65, 0.08);
        }

        .settings-card .card-header-icon {
            width: 46px;
            height: 46px;
            border-radius: 12px;
            background: var(--sage-soft);
            border: 1px solid rgba(110, 143, 92, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--sage-dark);
            font-size: 18px;
            margin-bottom: 16px;
        }

        /* ===== PWA & Offline Components ===== */
        .offline-banner {
            background: linear-gradient(135deg, #c15c4e, #9e4337);
            color: white;
            padding: 10px 20px;
            text-align: center;
            font-size: 13.5px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(193, 92, 78, 0.3);
            position: sticky;
            top: 0;
            z-index: 101;
            animation: fadeInDown 0.3s ease;
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-100%); }
            to { opacity: 1; transform: translateY(0); }
        }

        .btn-pwa-install {
            background: linear-gradient(135deg, var(--sage), var(--sage-dark));
            color: white;
            border: none;
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(79, 107, 65, 0.25);
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .btn-pwa-install:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(79, 107, 65, 0.35);
            color: white;
        }

        .btn-notif-toggle {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--card-border);
            color: var(--text-main);
            border-radius: 10px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .btn-notif-toggle:hover {
            background: var(--sage-soft);
            color: var(--sage-dark);
        }

        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 22px;
        }
    </style>
</head>
<body>

    <header>
        <div class="brand">
            <div class="brand-logo">
                <i class="fa-solid fa-leaf"></i>
            </div>
            <div class="brand-title">
                <h1>Baraja Manager Portal</h1>
                <p>Remote Otorisasi Hapus / Void Order Kasir</p>
            </div>
        </div>

        <div class="header-actions">
            <button id="pwaInstallBtn" class="btn btn-pwa-install" style="display: none;" onclick="triggerPwaInstall()">
                <i class="fa-solid fa-download"></i> Install App PWA
            </button>
            <button id="notifToggleBtn" class="btn btn-notif-toggle" onclick="toggleNotificationPermission()">
                <i class="fa-solid fa-bell"></i> <span id="notifBtnLabel">Notifikasi: Off</span>
            </button>
            <button class="btn btn-test" onclick="sendTestRequest()">
                <i class="fa-solid fa-flask"></i> Kirim Test Request
            </button>
            <div class="live-badge">
                <div class="live-dot"></div>
                <span id="liveStatusText">LIVE POLLING ACTIVE</span>
            </div>
        </div>
    </header>

    <!-- Offline Detection Banner -->
    <div id="offlineBanner" class="offline-banner" style="display: none;">
        <i class="fa-solid fa-wifi-slash"></i>
        <span>Koneksi internet terputus. Portal bekerja secara offline dengan data tersimpan.</span>
    </div>

    <div class="main-container">
        <div class="nav-tabs-custom">
            <button class="tab-btn active" onclick="switchTab('pending', event)">
                <i class="fa-regular fa-clock"></i>
                <span>Menunggu Otorisasi</span>
                <span class="tab-badge" id="pendingCount">0</span>
            </button>
            <button class="tab-btn" onclick="switchTab('history', event)">
                <i class="fa-solid fa-clipboard-list"></i>
                <span>Riwayat Audit</span>
            </button>
            <button class="tab-btn" onclick="switchTab('settings', event)">
                <i class="fa-solid fa-key"></i>
                <span>Pengaturan Master PIN</span>
            </button>
        </div>

        <!-- TAB 1: PENDING REQUESTS -->
        <div id="tabPending">
            <div class="section-title">
                <i class="fa-solid fa-bell"></i>
                <span>Permintaan Otorisasi Terbaru</span>
            </div>
            <div class="requests-grid" id="pendingGrid">
                <!-- Rendered dynamically -->
            </div>
        </div>

        <!-- TAB 2: AUDIT HISTORY -->
        <div id="tabHistory" style="display: none;">
            <div class="section-title">
                <i class="fa-solid fa-scroll"></i>
                <span>Riwayat Otorisasi yang Telah Diproses</span>
            </div>
            <div class="requests-grid" id="historyGrid">
                <!-- Rendered dynamically -->
            </div>
        </div>

        <!-- TAB 3: SETTINGS -->
        <div id="tabSettings" style="display: none;">
            <div class="section-title">
                <i class="fa-solid fa-gear"></i>
                <span>Pengaturan System & Keamanan</span>
            </div>
            <div class="settings-grid">
                <!-- Card 1: Master PIN -->
                <div class="settings-card" style="max-width: 100%;">
                    <div class="card-header-icon">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">Ubah PIN Master Otorisasi</h4>
                    <!-- Form wrapper to fix browser DOM password warning -->
                    <form id="passwordForm" onsubmit="event.preventDefault(); saveNewPin();">
                        <div class="input-group">
                            <label for="oldPinInput">PIN Master Saat Ini</label>
                            <input type="password" id="oldPinInput" name="old_pin" autocomplete="current-password" class="input-control" placeholder="Masukkan PIN lama (Default: 122333)">
                        </div>
                        <div class="input-group">
                            <label for="newPinInput">PIN Master Baru</label>
                            <input type="password" id="newPinInput" name="new_pin" autocomplete="new-password" class="input-control" placeholder="Masukkan PIN baru (minimal 4 digit)">
                        </div>
                        <button type="submit" class="btn btn-approve" style="width: 100%; margin-top: 8px;">
                            <i class="fa-solid fa-floppy-disk"></i> Simpan PIN Baru
                        </button>
                    </form>
                </div>

                <!-- Card 2: PWA & Status Notifikasi -->
                <div class="settings-card" style="max-width: 100%;">
                    <div class="card-header-icon" style="background: rgba(79, 107, 65, 0.15); color: var(--sage-dark);">
                        <i class="fa-solid fa-mobile-screen-button"></i>
                    </div>
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">Status Aplikasi Progressive Web App (PWA)</h4>
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5;">
                        Portal ini dirancang sebagai <strong>Progressive Web App (PWA)</strong>. Anda dapat meng-install aplikasi ini ke Layar Utama HP (Android/iOS) atau PC untuk akses cepat dan notifikasi real-time.
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: var(--bg-dark-2);">
                            <span style="font-size: 13px; font-weight: 600;"><i class="fa-solid fa-microchip text-success me-2"></i>Service Worker</span>
                            <span id="swStatusBadge" class="badge bg-success">Active / Offline Ready</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: var(--bg-dark-2);">
                            <span style="font-size: 13px; font-weight: 600;"><i class="fa-solid fa-bell text-warning me-2"></i>Notifikasi Browser</span>
                            <span id="notifStatusBadge" class="badge bg-secondary">Belum Diberikan</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: var(--bg-dark-2);">
                            <span style="font-size: 13px; font-weight: 600;"><i class="fa-solid fa-wifi text-primary me-2"></i>Status Koneksi</span>
                            <span id="networkStatusBadge" class="badge bg-success">Online</span>
                        </div>
                        <button id="pwaCardInstallBtn" class="btn btn-pwa-install w-100 mt-2" onclick="triggerPwaInstall()" style="display: none;">
                            <i class="fa-solid fa-download me-2"></i> Install Aplikasi ke HP / Desktop
                        </button>
                        <button class="btn btn-outline-secondary btn-sm w-100 mt-1" onclick="toggleNotificationPermission()">
                            <i class="fa-solid fa-bell me-2"></i> Uji & Atur Izin Notifikasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Audio Alert for Incoming Request -->
    <audio id="alertSound" preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg">
    </audio>

    <!-- Bootstrap Bundle (for potential future components) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        let currentRequests = [];
        let previousPendingIds = new Set();

        async function fetchRequests() {
            try {
                const res = await fetch('auth_api.php?action=get_requests');
                const data = await res.json();
                if (data.status === 'success') {
                    currentRequests = data.requests || [];
                    renderGrid();
                    checkNewRequests();
                }
            } catch (err) {
                console.error('Failed fetching requests:', err);
            }
        }

        function checkNewRequests() {
            const pendingReqs = currentRequests.filter(r => r.status === 'pending');
            let hasNew = false;

            const currentPendingIds = new Set();
            pendingReqs.forEach(r => {
                currentPendingIds.add(r.request_id);
                if (!previousPendingIds.has(r.request_id)) {
                    hasNew = true;
                }
            });

            if (hasNew && previousPendingIds.size > 0) {
                const sound = document.getElementById('alertSound');
                if (sound) sound.play().catch(() => {});

                // Trigger Browser Desktop/Mobile Push Notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                    const latestReq = pendingReqs[0];
                    new Notification('Permintaan Otorisasi Baru 🌿', {
                        body: latestReq ? `Kasir ${latestReq.cashier_name} meminta hapus: ${latestReq.item_name}` : `Ada ${pendingReqs.length} permintaan otorisasi pending.`,
                        icon: 'icons/icon-192.png',
                        badge: 'icons/icon-192.png',
                        tag: 'baraja-approval-req'
                    });
                }
            }

            previousPendingIds = currentPendingIds;
            document.getElementById('pendingCount').textContent = pendingReqs.length;
        }

        function renderGrid() {
            const pendingGrid = document.getElementById('pendingGrid');
            const historyGrid = document.getElementById('historyGrid');

            const pendingList = currentRequests.filter(r => r.status === 'pending');
            const historyList = currentRequests.filter(r => r.status !== 'pending');

            // Render Pending
            if (pendingList.length === 0) {
                pendingGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fa-solid fa-shield-halved icon"></i>
                        <h3>Tidak Ada Permintaan Otorisasi Pending</h3>
                        <p>Belum ada permintaan otorisasi baru dari kasir saat ini.</p>
                        <button class="btn btn-test" onclick="sendTestRequest()" style="margin: 16px auto 0 auto;">
                            <i class="fa-solid fa-flask"></i> Klik Untuk Coba Simulasi Request
                        </button>
                    </div>
                `;
            } else {
                pendingGrid.innerHTML = pendingList.map(r => `
                    <div class="request-card pending">
                        <div class="card-header">
                            <div class="cashier-info">
                                <div class="avatar">${(r.cashier_name || 'K').charAt(0).toUpperCase()}</div>
                                <div>
                                    <div class="cashier-name">${r.cashier_name || 'Kasir'}</div>
                                    <div class="time-ago"><i class="fa-regular fa-clock"></i> ${r.created_at || ''}</div>
                                </div>
                            </div>
                            <span class="status-pill pending">Pending</span>
                        </div>
                        <div class="card-body">
                            <div class="detail-row">
                                <span class="detail-label">No. Order:</span>
                                <span class="detail-val">${r.order_id || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Item / Produk:</span>
                                <span class="detail-val" style="color:#3E6B8A;">${r.item_name || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Device Kasir:</span>
                                <span class="detail-val">${r.device_id || 'Kasir Main'}</span>
                            </div>
                            <div class="reason-box">
                                <i class="fa-regular fa-comment-dots"></i> <span>Alasan: ${r.reason || 'Penghapusan'}</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-reject" onclick="processRequest('${r.request_id}', 'reject')">
                                <i class="fa-solid fa-xmark"></i> Tolak
                            </button>
                            <button class="btn btn-approve" onclick="processRequest('${r.request_id}', 'approve')">
                                <i class="fa-solid fa-check"></i> Setujui
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            // Render History
            if (historyList.length === 0) {
                historyGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fa-solid fa-box-archive icon"></i>
                        <h3>Belum Ada Riwayat Otorisasi</h3>
                    </div>
                `;
            } else {
                historyGrid.innerHTML = historyList.map(r => `
                    <div class="request-card">
                        <div class="card-header">
                            <div class="cashier-info">
                                <div class="avatar">${(r.cashier_name || 'K').charAt(0).toUpperCase()}</div>
                                <div>
                                    <div class="cashier-name">${r.cashier_name || 'Kasir'}</div>
                                    <div class="time-ago">${r.created_at || ''}</div>
                                </div>
                            </div>
                            <span class="status-pill ${r.status}">${r.status}</span>
                        </div>
                        <div class="card-body">
                            <div class="detail-row">
                                <span class="detail-label">Order:</span>
                                <span class="detail-val">${r.order_id || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Alasan:</span>
                                <span class="detail-val">${r.reason || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Diproses Oleh:</span>
                                <span class="detail-val">${r.approved_by || 'Manager'}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        async function processRequest(requestId, action) {
            const actionName = action === 'approve' ? 'approve_request' : 'reject_request';
            try {
                const res = await fetch('auth_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: actionName,
                        request_id: requestId,
                        manager_name: 'Manager Remote Web'
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    fetchRequests();
                } else {
                    alert('Gagal: ' + data.message);
                }
            } catch (err) {
                alert('Error koneksi: ' + err);
            }
        }

        async function sendTestRequest() {
            try {
                const res = await fetch('auth_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'request_auth',
                        cashier_name: 'Kasir Demo',
                        reason: 'Simulasi Otorisasi Hapus Produk Coffee',
                        order_id: 'ORD-DEMO-123',
                        item_name: 'Manual Brew Arabica',
                        device_id: 'Tablet Kasir 1'
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    fetchRequests();
                }
            } catch (err) {
                alert('Error test request: ' + err);
            }
        }

        async function saveNewPin() {
            const oldPin = document.getElementById('oldPinInput').value;
            const newPin = document.getElementById('newPinInput').value;

            if (!oldPin || !newPin) {
                alert('Silakan isi PIN lama dan PIN baru');
                return;
            }

            try {
                const res = await fetch('auth_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update_master_pin',
                        old_pin: oldPin,
                        new_pin: newPin
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    alert('✅ PIN Master Otorisasi Berhasil Diperbarui!');
                    document.getElementById('oldPinInput').value = '';
                    document.getElementById('newPinInput').value = '';
                } else {
                    alert('❌ Gagal: ' + data.message);
                }
            } catch (err) {
                alert('Error koneksi: ' + err);
            }
        }

        function switchTab(tab, evt) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('tabPending').style.display = 'none';
            document.getElementById('tabHistory').style.display = 'none';
            document.getElementById('tabSettings').style.display = 'none';

            if (evt && evt.currentTarget) {
                evt.currentTarget.classList.add('active');
            }

            if (tab === 'pending') {
                document.getElementById('tabPending').style.display = 'block';
            } else if (tab === 'history') {
                document.getElementById('tabHistory').style.display = 'block';
            } else if (tab === 'settings') {
                document.getElementById('tabSettings').style.display = 'block';
            }
        }

        // Poll every 3 seconds
        fetchRequests();
        setInterval(fetchRequests, 3000);

        /* ===== PWA Service Worker & Install Logic ===== */
        let deferredPrompt = null;

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => {
                        console.log('PWA ServiceWorker registered:', reg.scope);
                        const swBadge = document.getElementById('swStatusBadge');
                        if (swBadge) swBadge.textContent = 'Active / Offline Ready';
                    })
                    .catch(err => {
                        console.warn('PWA ServiceWorker registration failed:', err);
                        const swBadge = document.getElementById('swStatusBadge');
                        if (swBadge) {
                            swBadge.textContent = 'Standard Web';
                            swBadge.className = 'badge bg-secondary';
                        }
                    });
            });
        }

        // PWA Install Prompt Listener
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const pwaBtn = document.getElementById('pwaInstallBtn');
            const pwaCardBtn = document.getElementById('pwaCardInstallBtn');
            if (pwaBtn) pwaBtn.style.display = 'inline-flex';
            if (pwaCardBtn) pwaCardBtn.style.display = 'block';
        });

        async function triggerPwaInstall() {
            if (!deferredPrompt) {
                alert('Aplikasi sudah ter-install atau peramban Anda telah mengaktifkan PWA.');
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User installed the PWA app');
            }
            deferredPrompt = null;
            const pwaBtn = document.getElementById('pwaInstallBtn');
            const pwaCardBtn = document.getElementById('pwaCardInstallBtn');
            if (pwaBtn) pwaBtn.style.display = 'none';
            if (pwaCardBtn) pwaCardBtn.style.display = 'none';
        }

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            deferredPrompt = null;
            const pwaBtn = document.getElementById('pwaInstallBtn');
            const pwaCardBtn = document.getElementById('pwaCardInstallBtn');
            if (pwaBtn) pwaBtn.style.display = 'none';
            if (pwaCardBtn) pwaCardBtn.style.display = 'none';
        });

        // Notification Permission Logic
        function updateNotifBadges() {
            const btnLabel = document.getElementById('notifBtnLabel');
            const badge = document.getElementById('notifStatusBadge');

            if (!('Notification' in window)) {
                if (btnLabel) btnLabel.textContent = 'Notifikasi: Tidak Didukung';
                if (badge) { badge.textContent = 'Tidak Didukung'; badge.className = 'badge bg-secondary'; }
                return;
            }

            if (Notification.permission === 'granted') {
                if (btnLabel) btnLabel.textContent = 'Notifikasi: Aktif';
                if (badge) { badge.textContent = 'Aktif (Granted)'; badge.className = 'badge bg-success'; }
            } else if (Notification.permission === 'denied') {
                if (btnLabel) btnLabel.textContent = 'Notifikasi: Ditolak';
                if (badge) { badge.textContent = 'Ditolak (Blocked)'; badge.className = 'badge bg-danger'; }
            } else {
                if (btnLabel) btnLabel.textContent = 'Notifikasi: Minta Izin';
                if (badge) { badge.textContent = 'Belum Diberikan'; badge.className = 'badge bg-warning text-dark'; }
            }
        }

        async function toggleNotificationPermission() {
            if (!('Notification' in window)) {
                alert('Browser Anda tidak mendukung Notifikasi.');
                return;
            }

            if (Notification.permission === 'granted') {
                new Notification('Baraja Approval PWA 🌿', {
                    body: 'Notifikasi browser sudah aktif dan siap menerima peringatan otorisasi.',
                    icon: 'icons/icon-192.png'
                });
                alert('Notifikasi sudah aktif. Pengujian notifikasi dikirim!');
            } else if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                updateNotifBadges();
                if (permission === 'granted') {
                    new Notification('Baraja Approval PWA 🌿', {
                        body: 'Izin notifikasi berhasil diberikan!',
                        icon: 'icons/icon-192.png'
                    });
                }
            } else {
                alert('Izin notifikasi saat ini ditolak oleh browser. Silakan ubah izin situs di pengaturan peramban Anda.');
            }
        }

        updateNotifBadges();

        // Network Status Handlers (Online / Offline)
        function updateNetworkStatus() {
            const banner = document.getElementById('offlineBanner');
            const networkBadge = document.getElementById('networkStatusBadge');
            const liveText = document.getElementById('liveStatusText');

            if (!navigator.onLine) {
                if (banner) banner.style.display = 'flex';
                if (networkBadge) { networkBadge.textContent = 'Offline'; networkBadge.className = 'badge bg-danger'; }
                if (liveText) liveText.textContent = 'MODE OFFLINE';
            } else {
                if (banner) banner.style.display = 'none';
                if (networkBadge) { networkBadge.textContent = 'Online'; networkBadge.className = 'badge bg-success'; }
                if (liveText) liveText.textContent = 'LIVE POLLING ACTIVE';
            }
        }

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();
    </script>
</body>
</html>