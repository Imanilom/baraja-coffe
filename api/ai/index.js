/**
 * WhatsApp Bot Gateway - Node.js (Baileys) + PHP Webhook Integration
 * File: c:/xampp/htdocs/chatbot/index.js
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const fs = require('fs');
const QRCode = require('qrcode');

// URL Webhook Node.js Express API (Dapat di-override via process.env.WEBHOOK_URL di server live)
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/chatbot/webhook';

// Set untuk melacak ID pesan yang dikirim/diproses oleh BOT (mencegah double reply & loop)
const processedMsgIds = new Set();
const sentMsgIds = new Set();

/**
 * Helper untuk memperbarui status koneksi WA di wa_status.json
 */
function updateWAStatus(data) {
    try {
        fs.writeFileSync('wa_status.json', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('⚠️ Gagal memperbarui wa_status.json:', e.message);
    }
}

/**
 * Helper untuk mengekstrak teks pesan dari berbagai format WhatsApp
 */
function extractMessageText(msg) {
    if (!msg.message) return '';
    
    const content = msg.message.ephemeralMessage?.message || 
                    msg.message.viewOnceMessage?.message || 
                    msg.message.viewOnceMessageV2?.message || 
                    msg.message.documentWithCaptionMessage?.message || 
                    msg.message;

    if (content.stickerMessage) {
        return '[Mengirim Stiker]';
    }

    if (content.imageMessage && !content.imageMessage.caption) {
        return '[Mengirim Gambar]';
    }

    if (content.audioMessage) {
        return '[Mengirim Pesan Suara]';
    }

    return content.conversation ||
           content.extendedTextMessage?.text ||
           content.imageMessage?.caption ||
           content.videoMessage?.caption ||
           content.templateButtonReplyMessage?.selectedId ||
           content.buttonsResponseMessage?.selectedButtonId ||
           content.listResponseMessage?.singleSelectReply?.selectedRowId ||
           '';
}

async function connectToWhatsApp() {
    // 1. Inisialisasi Auth State (Penyimpanan Sesi)
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    // 2. Ambil versi Baileys Web terbaru
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Menggunakan WA Baileys v${version.join('.')}, Is Latest: ${isLatest}`);

    // 3. Buat Socket WhatsApp dengan Browser Signature Linux Chrome
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'), // Mencegah blokir 'tidak bisa login'
        syncFullHistory: false
    });

    // 4. Update Event Credentials
    sock.ev.on('creds.update', saveCreds);

    // 5. Update Event Status Koneksi
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n==================================================');
            console.log('Silakan Scan QR Code di bawah ini atau via Backoffice Admin:');
            console.log('==================================================\n');
            qrcode.generate(qr, { small: true });

            QRCode.toDataURL(qr, (err, url) => {
                if (!err) {
                    updateWAStatus({
                        status: 'qr_ready',
                        qr_code: url,
                        qr_raw: qr,
                        updated_at: new Date().toISOString()
                    });
                }
            });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;
            const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
            const shouldReconnect = !isReplaced;
            
            console.log(`[!] Koneksi terputus (Reason Code: ${statusCode}). LoggedOut: ${isLoggedOut}, Replaced: ${isReplaced}`);
            
            updateWAStatus({
                status: 'disconnected',
                reason: statusCode,
                reconnecting: shouldReconnect,
                updated_at: new Date().toISOString()
            });

            if (isReplaced) {
                console.log('⚠️ [BENTROK SESI (Code 440)] Ada instance `node index.js` lain yang sedang berjalan. Menghentikan instance ini.');
            } else if (isLoggedOut) {
                console.log('🔄 [LOGOUT DITANGKAPI] Sesi dilogout dari HP / Backoffice. Hapus folder auth & menyiapkan QR Code baru...');
                try {
                    if (fs.existsSync('auth_info_baileys')) {
                        fs.rmSync('auth_info_baileys', { recursive: true, force: true });
                    }
                } catch (errRm) {}
                setTimeout(() => {
                    connectToWhatsApp();
                }, 2000);
            } else {
                setTimeout(() => {
                    connectToWhatsApp();
                }, 3000);
            }
        } else if (connection === 'open') {
            const userPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Unknown';
            const userName = sock.user?.name || 'Baraja Coffee BOT';

            console.log('\n==================================================');
            console.log(`✅ [BERHASIL] Bot WhatsApp Berhasil Terhubung! (${userName} - ${userPhone})`);
            console.log('🤖 Menunggu pesan masuk dari WhatsApp...');
            console.log('==================================================\n');

            updateWAStatus({
                status: 'connected',
                phone: userPhone,
                name: userName,
                updated_at: new Date().toISOString()
            });
        }
    });

    // 6. Tangkap Pesan Masuk (Event messages.upsert)
    sock.ev.on('messages.upsert', async (m) => {
        try {
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                const remoteJid = msg.key.remoteJid;

                // 1. Abaikan pesan broadcast status/story WA
                if (!remoteJid || remoteJid.endsWith('@status.whatsapp.net')) continue;

                // 2. DILARANG MEMBALAS PESAN SENDIRI (fromMe)
                if (msg.key.fromMe) continue;

                // 3. MENCEGAH BALASAN GANDA (Deduplikasi Message ID)
                if (msg.key.id) {
                    if (processedMsgIds.has(msg.key.id)) {
                        console.log(`⚠️ [DUPLIKAT DIABAIKAN] Pesan ${msg.key.id} dari ${remoteJid} sudah pernah diproses.`);
                        continue;
                    }
                    processedMsgIds.add(msg.key.id);
                    if (processedMsgIds.size > 2000) processedMsgIds.clear();
                }

                // Ekstrak teks pesan menggunakan helper
                const messageText = extractMessageText(msg);

                if (!messageText.trim()) {
                    console.log(`ℹ️ [PESAN NON-TEKS] Pesan dari ${remoteJid} bukan berupa teks.`);
                    continue;
                }

                const pushName = msg.pushName || (msg.key.fromMe ? 'Penguji (Self)' : 'Pengguna WA');
                console.log(`📩 [PESAN MASUK] dari ${pushName} (${remoteJid}): "${messageText}"`);

                // Tampilkan indikator "Typing..." di WhatsApp
                await sock.sendPresenceUpdate('composing', remoteJid);

                // Send Payload ke Webhook PHP Backend via Axios
                const payload = {
                    sender: remoteJid,
                    pushName: pushName,
                    message: messageText
                };

                try {
                    const response = await axios.post(WEBHOOK_URL, payload, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 30000 // Timeout 30 detik
                    });

                    // Hentikan indikator "Typing..."
                    await sock.sendPresenceUpdate('paused', remoteJid);

                    // 1. Kirim Balasan (Teks / Gambar) dari PHP ke WhatsApp Pelanggan
                    if (response.data && (response.data.reply || response.data.image_url)) {
                        const replyMessage = response.data.reply || '';
                        let sentMsg;

                        if (response.data.image_url) {
                            try {
                                const cleanImgUrl = response.data.image_url.replace(/([^:]\/)\/+/g, "$1");
                                sentMsg = await sock.sendMessage(remoteJid, {
                                    image: { url: cleanImgUrl },
                                    caption: replyMessage
                                }, { quoted: msg });
                                console.log(`📸 [FOTO MENU DIKIRIM] ke ${remoteJid}: ${cleanImgUrl}`);
                            } catch (imgErr) {
                                console.error(`⚠️ Gagal mendownload gambar (${response.data.image_url}):`, imgErr.message);
                                // Fallback: Kirim pesan teks jika gambar tidak dapat diunduh
                                sentMsg = await sock.sendMessage(remoteJid, { text: replyMessage }, { quoted: msg });
                            }
                        } else {
                            // Kirim Pesan Teks
                            sentMsg = await sock.sendMessage(remoteJid, { text: replyMessage }, { quoted: msg });
                        }
                        
                        // Catat ID pesan balasan bot agar tidak diproses ulang
                        if (sentMsg?.key?.id) {
                            sentMsgIds.add(sentMsg.key.id);
                            if (sentMsgIds.size > 1000) sentMsgIds.clear();
                        }
                        
                        console.log(`📤 [BALASAN DIKIRIM] ke ${remoteJid}: "${replyMessage}"\n`);
                    }

                    // 2. Notifikasi Otomatis ke Group WA Kasir / Barista (Jika Ada Pesanan Baru)
                    if (response.data && response.data.notify_group && response.data.group_jid && response.data.group_message) {
                        let targetJid = response.data.group_jid.trim();
                        const groupMsg = response.data.group_message;

                        // Otomatis convert jika user memasukkan link undangan WA di backoffice
                        if (targetJid.includes('chat.whatsapp.com/')) {
                            const match = targetJid.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
                            if (match) {
                                const inviteCode = match[1];
                                try {
                                    const info = await sock.groupGetInviteInfo(inviteCode);
                                    let rawId = info.id || info.gid || '';
                                    if (rawId && !rawId.endsWith('@g.us')) {
                                        rawId += '@g.us';
                                    }
                                    if (rawId) targetJid = rawId;
                                    await sock.groupAcceptInvite(inviteCode).catch(() => {});
                                } catch (e) {
                                    console.error('⚠️ Gagal me-resolve link grup WA:', e.message);
                                }
                            }
                        }

                        // Format JID dengan benar
                        if (!targetJid.includes('@')) {
                            targetJid = targetJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                        } else if (targetJid.includes('@g.us')) {
                            targetJid = targetJid.split('@')[0] + '@g.us';
                        }

                        let groupSent = false;
                        try {
                            await sock.sendMessage(targetJid, { text: groupMsg });
                            groupSent = true;
                        } catch (errGroup) {
                            console.warn(`⚠️ Warning kirim ke grup (${targetJid}): ${errGroup.message}. Retrying with metadata sync...`);
                            try {
                                await sock.groupMetadata(targetJid).catch(() => {});
                                await new Promise(r => setTimeout(r, 1000));
                                await sock.sendMessage(targetJid, { text: groupMsg });
                                groupSent = true;
                            } catch (retryErr) {
                                console.error(`❌ Gagal mengirim notifikasi ke grup (${targetJid}):`, retryErr.message);
                            }
                        }

                        if (groupSent) {
                            console.log(`🔔 [NOTIFIKASI KASIR/BARISTA DIKIRIM BERHASIL] ke Group ${targetJid}\n`);
                        }
                    }

                } catch (webhookError) {
                    await sock.sendPresenceUpdate('paused', remoteJid);
                    console.error('❌ [ERROR WEBHOOK] Gagal terhubung ke PHP Backend:', webhookError.message);
                }
            }
        } catch (err) {
            console.error('❌ [ERROR MESSAGE HANDLER]:', err);
        }
    });
}

// Jalankan Bot
connectToWhatsApp();
