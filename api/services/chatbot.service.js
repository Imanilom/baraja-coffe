import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fetch from 'node-fetch'; // assuming node-fetch is available, or use axios
import { MenuItem } from '../models/MenuItem.model.js';
import { Order } from '../models/order.model.js';
import Payment from '../models/Payment.model.js';
import btnQrisService from './btnQris.service.js';
import CustomerChatbotProfile from '../models/CustomerChatbotProfile.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path ke config dan session
const CONFIG_PATH = path.join(__dirname, '../ai/config.json');
const SESSIONS_DIR = path.join(__dirname, '../ai/sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const getWIBNow = () => {
    const now = new Date();
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

// ===== CUSTOMER DATA COLLECTION HELPERS =====

const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Track setiap interaksi/pesan masuk dari pelanggan.
 * Update: totalInteractions, interactionHours, interactionDays, lastInteractionAt, name, firstSeenAt
 */
const trackInteraction = async (sender, pushName) => {
    try {
        const phoneClean = sender.replace(/[^0-9]/g, '');
        const now = getWIBNow();
        const hour = String(now.getUTCHours()); // Already WIB via getWIBNow offset
        const dayIndex = now.getUTCDay();
        const dayName = HARI_INDONESIA[dayIndex];

        const updateOps = {
            $inc: {
                totalInteractions: 1,
                [`interactionHours.${hour}`]: 1,
                [`interactionDays.${dayName}`]: 1
            },
            $set: {
                name: pushName || 'Pelanggan',
                whatsappJid: sender,
                lastInteractionAt: now
            },
            $setOnInsert: {
                phone: phoneClean,
                firstSeenAt: now
            }
        };

        await CustomerChatbotProfile.findOneAndUpdate(
            { phone: phoneClean },
            updateOps,
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error('[TRACK INTERACTION ERROR]', err.message);
    }
};

/**
 * Track pesanan berhasil: update favoriteItems, orderHistory, totalOrders, totalSpent, tags
 */
const trackOrder = async (sender, pushName, orderedItems, totalAmount, orderType, orderId, menuItems) => {
    try {
        const phoneClean = sender.replace(/[^0-9]/g, '');
        const now = getWIBNow();

        // Build items summary for orderHistory
        const itemsSummary = orderedItems.map(oi => {
            const menuItem = menuItems.find(m => m._id.toString() === oi.item?.toString());
            return {
                name: menuItem?.name || 'Unknown',
                quantity: oi.quantity,
                price: oi.price
            };
        });

        // Find or create profile
        let profile = await CustomerChatbotProfile.findOneAndUpdate(
            { phone: phoneClean },
            {
                $inc: {
                    totalOrders: 1,
                    totalSpent: totalAmount
                },
                $set: {
                    name: pushName || 'Pelanggan',
                    whatsappJid: sender,
                    lastOrderAt: now
                },
                $setOnInsert: {
                    phone: phoneClean,
                    firstSeenAt: now
                }
            },
            { upsert: true, new: true }
        );

        // Update favoriteItems
        for (const oi of orderedItems) {
            const menuItem = menuItems.find(m => m._id.toString() === oi.item?.toString());
            if (!menuItem) continue;

            const existingIdx = profile.favoriteItems.findIndex(
                fi => fi.menuItemId?.toString() === menuItem._id.toString()
            );

            if (existingIdx >= 0) {
                profile.favoriteItems[existingIdx].orderCount += oi.quantity;
                profile.favoriteItems[existingIdx].lastOrdered = now;
            } else {
                profile.favoriteItems.push({
                    menuItemId: menuItem._id,
                    menuItemName: menuItem.name,
                    orderCount: oi.quantity,
                    lastOrdered: now
                });
            }
        }

        // Sort favoriteItems by orderCount descending, keep top 30
        profile.favoriteItems.sort((a, b) => b.orderCount - a.orderCount);
        if (profile.favoriteItems.length > 30) {
            profile.favoriteItems = profile.favoriteItems.slice(0, 30);
        }

        // Push to orderHistory (max 50)
        profile.orderHistory.push({
            orderId: orderId,
            items: itemsSummary,
            totalAmount: totalAmount,
            orderType: orderType,
            orderedAt: now
        });
        if (profile.orderHistory.length > 50) {
            profile.orderHistory = profile.orderHistory.slice(-50);
        }

        // Recalculate averageOrderValue
        if (profile.totalOrders > 0) {
            profile.averageOrderValue = Math.round(profile.totalSpent / profile.totalOrders);
        }

        // Auto-assign tags
        const tags = new Set();
        if (profile.totalOrders >= 10) tags.add('Pelanggan Setia');
        else if (profile.totalOrders >= 5) tags.add('Pelanggan Reguler');
        else if (profile.totalOrders >= 1) tags.add('Pelanggan Baru');

        // Check peak hours from interactionHours
        const hours = profile.interactionHours || new Map();
        let nightCount = 0, morningCount = 0, totalHourCount = 0;
        for (const [h, count] of hours.entries()) {
            const hNum = parseInt(h);
            totalHourCount += count;
            if (hNum >= 22 || hNum < 4) nightCount += count;
            if (hNum >= 6 && hNum < 10) morningCount += count;
        }
        if (totalHourCount > 3) {
            if (nightCount / totalHourCount > 0.4) tags.add('Night Owl');
            if (morningCount / totalHourCount > 0.4) tags.add('Early Bird');
        }

        // Check favorite categories
        const topItems = profile.favoriteItems.slice(0, 5).map(fi => fi.menuItemName.toLowerCase());
        const hasCoffee = topItems.some(n => /latte|espresso|americano|cappuccino|braun|coffee|kopi/i.test(n));
        const hasFood = topItems.some(n => /nasi|goreng|spaghetti|aglio|pasta|ayam|kambing/i.test(n));
        if (hasCoffee) tags.add('Coffee Lover');
        if (hasFood) tags.add('Food Enthusiast');

        if (profile.totalSpent >= 1000000) tags.add('Big Spender');

        profile.tags = [...tags];

        await profile.save();
        console.log(`[TRACK ORDER] Profile updated for ${phoneClean} (${pushName}): ${profile.totalOrders} orders, Rp ${profile.totalSpent.toLocaleString('id-ID')}`);
    } catch (err) {
        console.error('[TRACK ORDER ERROR]', err.message);
    }
};

const getConfig = () => {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Gagal membaca config chatbot:", e);
    }
    return {
        gemini_api_key: "",
        gemini_api_keys: [],
        system_instruction: "",
        disabled_items: [],
        disabled_categories: [],
        kasir_group_jid: ""
    };
};

const getSessionHistory = (sender) => {
    const file = path.join(SESSIONS_DIR, `${crypto.createHash('md5').update(sender).digest('hex')}.json`);
    try {
        if (fs.existsSync(file)) {
            const data = fs.readFileSync(file, 'utf-8');
            return JSON.parse(data) || [];
        }
    } catch (e) {}
    return [];
};

const saveSessionHistory = (sender, history) => {
    const file = path.join(SESSIONS_DIR, `${crypto.createHash('md5').update(sender).digest('hex')}.json`);
    try {
        if (history.length > 10) {
            history = history.slice(-10);
        }
        fs.writeFileSync(file, JSON.stringify(history, null, 2));
    } catch (e) {}
};

const fetchLiveKasirMenu = async (config, userQuery) => {
    const disabledItems = config.disabled_items || [];
    const disabledCategories = config.disabled_categories || [];
    
    // Fetch directly from DB
    const items = await MenuItem.find({ isActive: true }).populate('category').lean();
    
    const disabledCatsLower = disabledCategories.map(c => c.toLowerCase());
    
    let matchedItems = [];
    let otherItems = [];
    
    const qLower = (userQuery || "").toLowerCase().trim();
    
    const aliasMap = {
        'teh': ['teh', 'tea', 'lemon tea', 'lychee tea', 'hmt'],
        'air': ['mineral water', 'mineral', 'water', 'reflection mineral', 'infused water', 'aqua'],
        'mineral': ['mineral water', 'mineral', 'water', 'reflection mineral', 'aqua'],
        'air mineral': ['mineral water', 'mineral', 'water', 'reflection mineral', 'aqua'],
        'air putih': ['mineral water', 'mineral', 'water', 'reflection mineral', 'aqua'],
        'kopi': ['coffee', 'latte', 'espresso', 'americano', 'cappuccino', 'braun', 'brew'],
        'makan': ['nasi', 'goreng', 'snack', 'croissant', 'food', 'mie', 'ayam', 'daging'],
        'makanan': ['nasi', 'goreng', 'snack', 'croissant', 'food', 'mie', 'ayam', 'daging']
    };
    
    let searchKeywords = [];
    for (const [alias, targets] of Object.entries(aliasMap)) {
        if (qLower.includes(alias)) {
            searchKeywords = searchKeywords.concat(targets);
        }
    }
    
    for (const item of items) {
        if (!item.name) continue;
        const categoryName = item.category?.name || 'Menu';
        
        if (disabledCatsLower.includes(categoryName.toLowerCase())) continue;
        if (disabledItems.includes(item.name) || disabledItems.includes(item._id.toString())) continue;
        
        const priceNum = item.discountedPrice || item.price || item.originalPrice || 0;
        if (priceNum <= 0) continue;
        
        const priceFormatted = `Rp ${priceNum.toLocaleString('id-ID')}`;
        const statusStok = item.isActive ? "READY" : "HABIS"; // Since we already filtered isActive: true, it's always READY, but keeping logic
        
        let descText = item.description ? ` | Deskripsi: "${item.description}"` : "";
        const line = `- *${item.name}* [Kategori: ${categoryName}]: ${priceFormatted} (Stok: ${statusStok})${descText}`;
        
        const nameLower = item.name.toLowerCase();
        const catLower = categoryName.toLowerCase();
        
        let isMatch = false;
        for (const kw of searchKeywords) {
            if (nameLower.includes(kw) || catLower.includes(kw)) {
                isMatch = true; break;
            }
        }
        
        if (!isMatch && qLower) {
            const words = qLower.split(' ');
            for (const w of words) {
                if (w.length >= 3 && (nameLower.includes(w) || catLower.includes(w))) {
                    isMatch = true; break;
                }
            }
        }
        
        if (isMatch) {
            matchedItems.push(line);
        } else {
            otherItems.push(line);
        }
    }
    
    let finalItems = matchedItems.concat(otherItems.slice(0, Math.max(0, 35 - matchedItems.length)));
    if (finalItems.length === 0) finalItems = otherItems.slice(0, 35);
    
    return finalItems.slice(0, 40).join('\n');
};

const findMenuImageUrl = async (query) => {
    const items = await MenuItem.find({ isActive: true }).lean();
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    if (!cleanQuery) return null;
    
    for (const item of items) {
        if (!item.name) continue;
        const nameClean = item.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        
        if (nameClean.includes(cleanQuery) || cleanQuery.includes(nameClean)) {
            let imgUrl = item.imageUrl || item.image || null;
            if (imgUrl) {
                if (imgUrl.includes('placeholder') || imgUrl.includes('Add-Sauce')) return null;
                return imgUrl;
            }
        }
    }
    return null;
};

const callGeminiAI = async (sender, userMsg, systemInstruction, config, userName) => {
    let apiKeys = [];
    if (config.gemini_api_keys && config.gemini_api_keys.length > 0) {
        apiKeys = [...config.gemini_api_keys];
    }
    if (config.gemini_api_key && !apiKeys.includes(config.gemini_api_key)) {
        apiKeys.push(config.gemini_api_key);
    }
    
    if (apiKeys.length === 0) {
        return `Maaf Kak ${userName}, API Key Gemini belum dikonfigurasi.`;
    }
    
    const history = getSessionHistory(sender);
    const contentsPayload = history.filter(h => h.role && h.text).map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
    }));
    
    contentsPayload.push({
        role: "user",
        parts: [{ text: userMsg }]
    });
    
    const models = [
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.7-flash',
        'gemini-flash-latest'
    ];
    let replyText = null;
    
    for (const apiKey of apiKeys) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const payload = {
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: contentsPayload
                };
                
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await res.json();
                console.log(`[GEMINI DEBUG] Model: ${model}, Status: ${res.status}, Result:`, JSON.stringify(result).substring(0, 200));
                
                if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    replyText = result.candidates[0].content.parts[0].text.trim();
                    break;
                }
                
                if (res.status === 429 || res.status === 403 || (result.error && result.error.message.toLowerCase().includes('quota'))) {
                    console.warn(`[GEMINI ROTATION] Key limit. Switching...`);
                    break; // break model loop, go to next key
                }
            } catch (error) {
                console.error("Gemini API Error:", error.message);
            }
        }
        if (replyText) break;
    }
    
    if (!replyText) {
        replyText = `Halo Kak ${userName}! 👋 Terima kasih sudah menghubungi Baraja Coffee. Ada yang bisa kami bantu?`;
    }
    
    history.push({ role: "user", text: userMsg });
    history.push({ role: "model", text: replyText });
    saveSessionHistory(sender, history);
    
    return replyText;
};

const createUnifiedOrder = async (sender, pushName, replyText, userMessage, config) => {
    const history = getSessionHistory(sender);
    const recentHistoryText = history.slice(-8).map(h => h.text || "").join("\n");
    const textToScan = `${recentHistoryText}\n${userMessage}\n${replyText}`;
    
    let orderType = 'Dine-In';
    if (/(take-away|takeaway|take away|bawa pulang|dibawa pulang)/i.test(textToScan) && !/dine-in|dine in|makan di tempat/i.test(userMessage)) {
        if (/(dine-in|dine in|makan di tempat)/i.test(textToScan)) {
            orderType = 'Dine-In';
        } else {
            orderType = 'Take Away';
        }
    }
    
    let tableNumber = '1';
    const tMatch = textToScan.match(/nomor meja\s*:\s*(\d+|[a-zA-Z0-9]+)/i);
    const tMatch2 = textToScan.match(/(meja|table)\s*#?\s*(\d+|[a-zA-Z0-9]+)/i);
    if (tMatch) tableNumber = tMatch[1].trim();
    else if (tMatch2) tableNumber = tMatch2[2].trim();
    
    const items = await MenuItem.find({ isActive: true }).lean();
    let orderedItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
        if (!item.name || item.name.length < 3) continue;
        const price = item.discountedPrice || item.price || item.originalPrice || 0;
        if (price <= 0) continue;
        
        let aliases = [item.name];
        if (item.name.toLowerCase() === 'mineral water') aliases.push('Air putih', 'Air mineral', 'Aqua', 'Air');
        else if (item.name.toLowerCase() === 'nasi goreng la baraja') aliases.push('Nasi Goreng Baraja', 'Nasgor Baraja');
        
        let isMatched = false;
        let matchedQty = 1;
        
        for (const alias of aliases) {
            const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedAlias, 'i');
            if (regex.test(textToScan)) {
                isMatched = true;
                const match00 = textToScan.match(new RegExp(escapedAlias + '\\s*[:\\-]?\\s*(\\d+)', 'i'));
                const match0 = textToScan.match(new RegExp(escapedAlias + '\\s*\\(\\s*(\\d+)\\s*(pcs|porsi|gelas|cup|botol)?\\s*\\)', 'i'));
                const match1 = textToScan.match(new RegExp('(\\d+)\\s*(x|pcs|porsi)?\\s*' + escapedAlias, 'i'));
                const match2 = textToScan.match(new RegExp(escapedAlias + '\\s*(x|\\*)\\s*(\\d+)', 'i'));
                
                if (match00) matchedQty = Math.max(1, parseInt(match00[1]));
                else if (match0) matchedQty = Math.max(1, parseInt(match0[1]));
                else if (match1) matchedQty = Math.max(1, parseInt(match1[1]));
                else if (match2) matchedQty = Math.max(1, parseInt(match2[2]));
                break;
            }
        }
        
        if (isMatched) {
            console.log(`[ORDER MATCHED] Item: ${item.name}, Qty: ${matchedQty}, Price: ${price}`);
            orderedItems.push({
                item: item._id, // References MenuItem
                quantity: matchedQty,
                price: price,
                kitchenStatus: 'pending',
                notes: 'Pesanan via WA Bot'
            });
            totalAmount += price * matchedQty;
        }
    }
    
    if (orderedItems.length === 0 || totalAmount <= 0) {
        console.log(`[ORDER FAILED] No items matched or total amount is 0.`);
        return null;
    }
    
    const orderTypeMap = {
        'dine-in': 'Dine-In',
        'dine_in': 'Dine-In',
        'dinein': 'Dine-In',
        'take-away': 'Take Away',
        'takeaway': 'Take Away',
        'take_away': 'Take Away'
    };
    
    let orderTypeStr = 'Dine-In'; // default
    const typeMatch = textToScan.match(/(dine-in|dine in|makan di sini|di sini|take-away|takeaway|bawa pulang|bungkus)/i);
    if (typeMatch) {
        const t = typeMatch[1].toLowerCase().replace(/\s+/g, '');
        if (t.includes('take') || t.includes('bawa') || t.includes('bungkus')) orderTypeStr = 'Take Away';
        else orderTypeStr = 'Dine-In';
    }
    
    const phoneClean = sender.replace(/[^0-9]/g, '');
    
    try {
        // Prepare Order Number (e.g. BARIDIN-XXX)
        const orderCount = await Order.countDocuments();
        const order_id = `WA-${new Date().getTime().toString().slice(-6)}-${orderCount}`;
        
        // Use Baraja Coffee Amphitheater Outlet ID or fallback
        const outletId = '67cbc9560f025d897d69f889'; // Harcoded from PHP webhook
        
        const newOrder = new Order({
            order_id,
            user: `${pushName} (WA Bot)`,
            customerName: pushName,
            customerPhone: phoneClean,
            tableNumber: String(tableNumber),
            items: orderedItems,
            subtotal: totalAmount,
            totalBeforeDiscount: totalAmount,
            totalAfterDiscount: totalAmount,
            grandTotal: totalAmount,
            orderType: orderTypeStr,
            source: 'App',
            status: 'Pending',
            paymentStatus: 'pending',
            paymentMethod: 'Cash', // Default, might be updated to QRIS below
            totalAmount: totalAmount,
            originalTotalAmount: totalAmount,
            contact: {
                phone: phoneClean,
                email: 'whatsapp@barajacoffee.site'
            },
            items: orderedItems,
            outlet: outletId, // Should match an existing outlet if populated in DB!
            createdAtWIB: getWIBNow()
        });
        
        await newOrder.save();
        
        let paymentInfoText = `*(Mohon maaf Kak, untuk pembayaran QRIS / Transfer langsung via WhatsApp saat ini belum tersedia)*`;
        let imageUrl = null;
        
        // TRY TO GENERATE BTN QRIS!
        try {
            const btnResult = await btnQrisService.generateQR(order_id, totalAmount);
            if (btnResult && btnResult.responseCode && btnResult.responseCode.startsWith('200')) {
                // Create Payment Object
                const payment = new Payment({
                    order_id: order_id,
                    payment_code: order_id,
                    transaction_id: btnResult.referenceNo,
                    method: 'BTN_QRIS',
                    status: 'pending',
                    paymentType: 'Full',
                    amount: totalAmount,
                    totalAmount: totalAmount,
                    remainingAmount: totalAmount,
                    raw_response: btnResult
                });
                await payment.save();
                
                // Update Order
                newOrder.paymentMethod = 'BTN_QRIS';
                newOrder.paymentDetails = {
                    referenceNo: btnResult.referenceNo,
                    qrContent: btnResult.qrContent
                };
                await newOrder.save();
                
                // Construct QRIS Payment info
                paymentInfoText = `💳 *Metode Pembayaran*: QRIS (Bisa pakai e-wallet/M-Banking apa saja)\n\n📌 *LINK QRIS*: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(btnResult.qrContent)}`;
                // Assign image URL so bot sends it as an image!
                imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(btnResult.qrContent)}`;
            }
        } catch (qrisError) {
            console.error("Failed to generate BTN QRIS for chatbot:", qrisError);
            paymentInfoText = `💳 *Metode Pembayaran*: Bayar Langsung di Kasir / Staf Baraja\n\n_Silakan lakukan pembayaran di kasir atau tunggu staf kami menghampiri meja Kakak. Terima kasih!_ 😊`;
        }
        
        const finalReply = `Terima kasih Kak ${pushName}! Pesanan Kakak telah dikonfirmasi dan **RESMI TERINPUT DI KASIR POS**.\n\n📌 *Nomor Order*: \`#${order_id}\`\n\n${paymentInfoText}`;
        
        // Track order data ke CustomerChatbotProfile (non-blocking)
        trackOrder(sender, pushName, orderedItems, totalAmount, orderTypeStr, order_id, items).catch(() => {});
        
        return {
            order: newOrder,
            reply: finalReply,
            image_url: imageUrl
        };
        
    } catch (err) {
        console.error("Error creating Chatbot order:", err);
        return null;
    }
};

export const processIncomingMessage = async (payload) => {
    const { sender, message, pushName = 'Pelanggan' } = payload;
    const config = getConfig();
    
    // Track interaksi pelanggan (non-blocking)
    trackInteraction(sender, pushName).catch(() => {});
    
    if (config.bot_status === 'maintenance') {
        return {
            status: 'success',
            reply: `Mohon maaf Kak ${pushName}, layanan Customer Service WhatsApp saat ini sedang dalam pemeliharaan sistem. Silakan hubungi Admin di ${config.admin_phone}.`
        };
    }
    
    const msgLower = message.toLowerCase().trim();
    if (['batal', 'batal pesan', 'batal pesanan', 'reset', 'reset pesanan', 'batalkan', 'cancel'].includes(msgLower)) {
        const file = path.join(SESSIONS_DIR, `${crypto.createHash('md5').update(sender).digest('hex')}.json`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        return {
            status: 'success',
            reply: `Siap Kak ${pushName}! Pesanan sebelumnya telah dibatalkan dan memori pesanan telah di-reset. 😊\n\nAda menu lezat atau minuman segar lainnya dari Baraja Coffee yang ingin Kakak pesan?`
        };
    }
    
    const liveMenuCatalog = await fetchLiveKasirMenu(config, message);
    
    let recomMenuText = "";
    if (config.recommended_items && config.recommended_items.length > 0) {
        const disabledItems = config.disabled_items || [];
        const activeRecoms = config.recommended_items.filter(i => !disabledItems.includes(i));
        if (activeRecoms.length > 0) {
            recomMenuText = `\nMENU REKOMENDASI UTAMA PILIHAN MANAGEMENT:\n${activeRecoms.map(i => `- *${i}*`).join('\n')}`;
        }
    }
    
    const userGreetingDirective = `\n\nINFORMASI PENGGUNA WHATSAPP SAAT INI:\n- Nama Profil WhatsApp Pengirim: ${pushName}\n- ATURAN SAPAAN: Selalu sapalah pelanggan dengan menyertakan nama WhatsApp-nya dengan ramah.`;
    let fullSystemInstruction = `${config.system_instruction}${userGreetingDirective}${recomMenuText}\n\nDATA LIVE KATALOG KASIR & STOK REAL-TIME:\n${liveMenuCatalog}`;
    
    // Modify system instruction so it no longer says QRIS is unavailable
    fullSystemInstruction = fullSystemInstruction.replace('*(Mohon maaf Kak, untuk pembayaran QRIS / Transfer langsung via WhatsApp saat ini belum tersedia)*', 'Silakan ketik "PROSES PESANAN" untuk mendapatkan QRIS.');
    
    let imageUrl = null;
    const imgMatch = message.match(/(foto|gambar|spill|lihat foto|foto menu|minta foto|minta gambar)\s*(menu|untuk)?\s*(.+)/i);
    if (imgMatch) {
        const searchName = imgMatch[3].trim();
        imageUrl = await findMenuImageUrl(searchName);
        if (imageUrl) {
            fullSystemInstruction += `\n\n[STATUS FOTO MENU '${searchName}']: TERSEDIA di sistem kasir. Gambar resmi dikirimkan via media attachment.`;
        } else {
            fullSystemInstruction += `\n\n[STATUS FOTO MENU '${searchName}']: TIDAK TERSEDIA di sistem kasir. Wajib infokan secara jujur.`;
        }
    }
    
    let reply = await callGeminiAI(sender, message, fullSystemInstruction, config, pushName);
    
    const isUserConfirmed = /(proses pesanan|fix pesan|pesan sekarang|proses pesan)/i.test(msgLower);
    let responsePayload = { status: 'success', reply, image_url: imageUrl };
    
    if (isUserConfirmed) {
        const orderResult = await createUnifiedOrder(sender, pushName, reply, message, config);
        if (orderResult) {
            responsePayload.reply = orderResult.reply;
            if (orderResult.image_url) {
                responsePayload.image_url = orderResult.image_url;
            }
            
            // Reset Session
            const file = path.join(SESSIONS_DIR, `${crypto.createHash('md5').update(sender).digest('hex')}.json`);
            if (fs.existsSync(file)) fs.unlinkSync(file);
            
            if (config.kasir_group_jid) {
                responsePayload.notify_group = true;
                responsePayload.group_jid = config.kasir_group_jid;
                responsePayload.group_message = `🔔 *NOTIFIKASI PESANAN MASUK (BARAJA BOT)* (#${orderResult.order.order_id})\n\n• *Pemesan*: ${pushName} (${sender})\n• *Rincian Pesanan & Balasan*: \n${responsePayload.reply}\n\n📌 *Pesanan ini telah terinjeksi ke sistem POS Kasir Baraja.*`;
            }
        }
    }
    
    return responsePayload;
};
