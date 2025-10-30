import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';  
import Payment from '../models/Payment.model.js'; 
import cron from 'node-cron';

// Helper function untuk mendapatkan waktu WIB sekarang
const getWIBNow = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

/**
 * Fungsi untuk membatalkan order REGULER yang belum dibayar setelah 30 menit
 * HANYA untuk order reguler, BUKAN open bill atau reservasi
 */
export const autoCancelUnpaidOrders = async () => {
  let connection;
  try {
    console.log(`[${getWIBNow().toISOString()}] Memulai auto-cancel unpaid REGULAR orders...`);

    // Connect to database jika belum connected
    if (mongoose.connection.readyState !== 1) {
      connection = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Waktu threshold: 30 menit yang lalu dalam WIB
    const thirtyMinutesAgo = new Date(getWIBNow().getTime() - 30 * 60 * 1000);

    console.log(`Mencari REGULAR orders yang dibuat sebelum: ${thirtyMinutesAgo}`);

    // KRITERIA ORDER YANG AKAN DI-CANCEL:
    // 1. Status masih Pending atau Waiting
    // 2. Dibuat lebih dari 30 menit yang lalu  
    // 3. BUKAN open bill (isOpenBill: false)
    // 4. BUKAN order reservasi (orderType bukan 'Reservation')
    // 5. Order type harus reguler (Dine-In, Take Away, Pickup, Delivery)
    // 6. Belum memiliki payment yang success/settlement
    const unpaidOrders = await Order.find({
      status: { $in: ['Pending', 'Waiting'] },
      isOpenBill: false, // TIDAK termasuk open bill
      orderType: { 
        $in: ['Dine-In', 'Take Away', 'Pickup', 'Delivery'] // HANYA order reguler
      },
      createdAtWIB: { $lte: thirtyMinutesAgo },
      $or: [
        { paymentMethod: { $exists: false } },
        { paymentMethod: { $in: [null, 'No Payment'] } }
      ]
    }).populate('items.menuItem');

    console.log(`Ditemukan ${unpaidOrders.length} REGULAR orders yang belum dibayar`);

    let canceledCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each unpaid order
    for (const order of unpaidOrders) {
      try {
        // DOUBLE CHECK: Pastikan ini bukan open bill atau reservasi
        if (order.isOpenBill === true) {
          console.log(`⏩ Skip: Order ${order.order_id} adalah open bill`);
          skippedCount++;
          continue;
        }

        if (order.orderType === 'Reservation' || order.orderType === 'Event') {
          console.log(`⏩ Skip: Order ${order.order_id} adalah ${order.orderType}`);
          skippedCount++;
          continue;
        }

        // Cek apakah order sudah memiliki payment yang success
        const existingPayments = await Payment.find({
          order_id: order.order_id,
          status: { $in: ['settlement', 'paid', 'capture'] }
        });

        // Jika sudah ada payment yang success, skip
        if (existingPayments.length > 0) {
          console.log(`⏩ Skip: Order ${order.order_id} sudah memiliki payment success`);
          skippedCount++;
          continue;
        }

        // Cek juga payment yang pending tapi belum expired
        const pendingPayments = await Payment.find({
          order_id: order.order_id,
          status: 'pending'
        });

        // Jika ada pending payment, cek expiry time
        let shouldCancel = true;
        for (const payment of pendingPayments) {
          if (payment.expiry_time) {
            const expiryTime = new Date(payment.expiry_time);
            if (expiryTime > getWIBNow()) {
              shouldCancel = false;
              console.log(`⏩ Skip: Order ${order.order_id} memiliki payment yang belum expired`);
              skippedCount++;
              break;
            }
          }
        }

        if (!shouldCancel) {
          continue;
        }

        // DOUBLE CHECK: Pastikan order memiliki reservation reference
        // Jika ada reservation ID, skip karena ini order dari reservasi
        if (order.reservation || order.originalReservationId) {
          console.log(`⏩ Skip: Order ${order.order_id} terkait dengan reservasi`);
          skippedCount++;
          continue;
        }

        // ✅ SEMUA KRITERIA TERPENUHI - LANJUTKAN CANCEL
        console.log(`✅ Memproses cancel untuk REGULAR order: ${order.order_id}`);

        // Update order status to Canceled
        await Order.findByIdAndUpdate(order._id, {
          status: 'Canceled',
          updatedAtWIB: getWIBNow(),
          cancellationReason: 'Auto-cancel: Tidak ada pembayaran dalam 30 menit'
        });

        // Juga update via order_id untuk konsistensi
        await Order.findOneAndUpdate(
          { order_id: order.order_id },
          {
            status: 'Canceled',
            updatedAtWIB: getWIBNow(),
            cancellationReason: 'Auto-cancel: Tidak ada pembayaran dalam 30 menit'
          }
        );

        canceledCount++;
        console.log(`✅ Order REGULER ${order.order_id} berhasil di-cancel (created at: ${order.createdAtWIB})`);

        // Log auto-cancel activity
        await logAutoCancel(order);

      } catch (error) {
        errorCount++;
        console.error(`❌ Gagal cancel order ${order.order_id}:`, error.message);
      }
    }

    console.log(`[${getWIBNow().toISOString()}] Auto-cancel REGULAR orders selesai.`);
    console.log(`📊 Hasil: Berhasil: ${canceledCount}, Gagal: ${errorCount}, Skip: ${skippedCount}, Total: ${unpaidOrders.length}`);

    return {
      success: true,
      canceledCount,
      errorCount,
      skippedCount,
      totalProcessed: unpaidOrders.length,
      message: `Auto-cancel completed: ${canceledCount} regular orders canceled, ${skippedCount} skipped (open bill/reservation)`
    };

  } catch (error) {
    console.error('❌ Error dalam auto-cancel process:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fungsi untuk logging auto-cancel activity
 */
const logAutoCancel = async (order) => {
  try {
    const logEntry = {
      orderId: order.order_id,
      orderType: order.orderType,
      user: order.user,
      totalAmount: order.grandTotal,
      createdAt: order.createdAtWIB,
      canceledAt: getWIBNow(),
      reason: 'Auto-cancel: Tidak ada pembayaran dalam 30 menit',
      isOpenBill: order.isOpenBill,
      isReservation: order.orderType === 'Reservation' || !!order.reservation
    };

    console.log('📝 Auto-cancel log:', logEntry);

    // Contoh: Simpan ke collection terpisah jika diperlukan
    // await AutoCancelLog.create(logEntry);

  } catch (error) {
    console.error('Error logging auto-cancel:', error);
  }
};

/**
 * Fungsi untuk manual trigger (testing purposes)
 */
export const manualTriggerAutoCancel = async () => {
  console.log('🚀 Manual trigger auto-cancel REGULAR orders...');
  return await autoCancelUnpaidOrders();
};

/**
 * Fungsi khusus untuk melihat order yang akan di-cancel (debugging)
 */
export const previewAutoCancel = async () => {
  try {
    const thirtyMinutesAgo = new Date(getWIBNow().getTime() - 30 * 60 * 1000);

    const potentialOrders = await Order.find({
      status: { $in: ['Pending', 'Waiting'] },
      createdAtWIB: { $lte: thirtyMinutesAgo }
    }).select('order_id orderType isOpenBill status createdAtWIB paymentMethod reservation');

    console.log('📋 Preview orders yang akan dicek:');
    
    const regularOrders = potentialOrders.filter(order => 
      !order.isOpenBill && 
      order.orderType !== 'Reservation' && 
      order.orderType !== 'Event' &&
      !order.reservation
    );

    const skipOrders = potentialOrders.filter(order => 
      order.isOpenBill || 
      order.orderType === 'Reservation' || 
      order.orderType === 'Event' ||
      order.reservation
    );

    console.log(`✅ Akan diproses (REGULAR): ${regularOrders.length} orders`);
    regularOrders.forEach(order => {
      console.log(`   - ${order.order_id} (${order.orderType}) - ${order.createdAtWIB}`);
    });

    console.log(`⏩ Akan di-skip: ${skipOrders.length} orders`);
    skipOrders.forEach(order => {
      const skipReason = order.isOpenBill ? 'Open Bill' : 
                        order.orderType === 'Reservation' ? 'Reservation' :
                        order.orderType === 'Event' ? 'Event' :
                        order.reservation ? 'Has Reservation' : 'Other';
      console.log(`   - ${order.order_id} (${order.orderType}) - ${skipReason}`);
    });

    return {
      regularOrders,
      skipOrders,
      total: potentialOrders.length
    };

  } catch (error) {
    console.error('Error in preview:', error);
    return { error: error.message };
  }
};

/**
 * Scheduler untuk auto-cancel
 */
export const startAutoCancelScheduler = () => {
  console.log('🕐 Starting auto-cancel scheduler for REGULAR orders only...');

  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running scheduled auto-cancel job for REGULAR orders...');
    try {
      const result = await autoCancelUnpaidOrders();
      console.log('📊 Scheduled job result:', result);
    } catch (error) {
      console.error('❌ Scheduled auto-cancel job failed:', error);
    }
  });

  // Optional: Run immediately on startup untuk handle orders yang tertinggal
  setTimeout(() => {
    console.log('🚀 Running initial auto-cancel check for REGULAR orders...');
    autoCancelUnpaidOrders();
  }, 10000); // Run 10 detik setelah startup

  // Juga jalankan preview untuk debugging
  setTimeout(() => {
    console.log('👀 Running preview of auto-cancel candidates...');
    previewAutoCancel();
  }, 15000);
};