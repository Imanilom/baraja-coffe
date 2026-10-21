<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cache-Control, Authorization, X-Requested-With, X-Api-Key');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache, no-transform');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');

// Disable output buffering
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', 1);
}
@ini_set('zlib.output_compression', 0);
@ini_set('implicit_flush', 1);
for ($i = 0; $i < ob_get_level(); $i++) {
    ob_end_flush();
}
ob_implicit_flush(1);

$storageDir = __DIR__ . '/storage';
$deviceId = $_GET['device'] ?? 'BAR BELAKANG';
$safeDeviceId = strtolower(preg_replace('/[^a-zA-Z0-9_\-]/', '_', trim($deviceId)));
if (empty($safeDeviceId)) {
    $safeDeviceId = 'default';
}

$stateFile = "$storageDir/$safeDeviceId.json";
$lastHash = '';

$startTime = time();
$lastPing = time();
$maxDuration = 60; // Max 60s per connection to prevent thread exhaustion

while (true) {
    if (connection_aborted() || (time() - $startTime) >= $maxDuration) {
        break;
    }

    clearstatcache(true, $stateFile);
    if (file_exists($stateFile)) {
        $currentHash = md5_file($stateFile);
        if ($currentHash !== false && $currentHash !== $lastHash) {
            $lastHash = $currentHash;
            $content = file_get_contents($stateFile);
            if (!empty($content)) {
                echo "data: {$content}\n\n";
                @ob_flush();
                @flush();
            }
        }
    }

    // Send SSE comment heartbeat every 15s to keep connection active
    if ((time() - $lastPing) >= 15) {
        echo ": ping\n\n";
        @ob_flush();
        @flush();
        $lastPing = time();
    }

    // Check every 150ms for instant real-time updates
    usleep(150000);
}
