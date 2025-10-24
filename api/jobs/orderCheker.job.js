import mongoose from 'mongoose';
import { Order } from '../models/order.model.js'; // Sesuaikan path
import Payment from '../models/Payment.model.js'; // Sesuaikan path
import cron from 'node-cron';
// Helper function untuk mendapatkan waktu WIB sekarang
const getWIBNow = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

/**
 * Fungsi untuk membatalkan order yang belum dibayar setelah 30 menit
 */
export const autoCancelUnpaidOrders = async () => {
  let connection;
  try {
    console.log(`[${getWIBNow().toISOString()}] Memulai auto-cancel unpaid orders...`);

    // Connect to database jika belum connected
    if (mongoose.connection.readyState !== 1) {
      connection = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Waktu threshold: 30 menit yang lalu dalam WIB
    const thirtyMinutesAgo = new Date(getWIBNow().getTime() - 30 * 60 * 1000);

    console.log(`Mencari orders yang dibuat sebelum: ${thirtyMinutesAgo}`);

    // Cari orders yang memenuhi kriteria:
    // 1. Status masih Pending atau Waiting
    // 2. Dibuat lebih dari 30 menit yang lalu
    // 3. Bukan open bill
    // 4. Belum memiliki payment yang success/settlement
    const unpaidOrders = await Order.find({
      status: { $in: ['Pending', 'Waiting'] },
      isOpenBill: false,
      createdAtWIB: { $lte: thirtyMinutesAgo },
      $or: [
        { paymentMethod: { $exists: false } },
        { paymentMethod: { $in: [null, 'No Payment'] } }
      ]
    }).populate('items.menuItem');

    console.log(`Ditemukan ${unpaidOrders.length} orders yang belum dibayar`);

    let canceledCount = 0;
    let errorCount = 0;

    // Process each unpaid order
    for (const order of unpaidOrders) {
      try {
        // Cek apakah order sudah memiliki payment yang success
        const existingPayments = await Payment.find({
          order_id: order.order_id,
          status: { $in: ['settlement', 'paid', 'capture'] }
        });

        // Jika sudah ada payment yang success, skip
        if (existingPayments.length > 0) {
          console.log(`Order ${order.order_id} sudah memiliki payment, skip cancel`);
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
              console.log(`Order ${order.order_id} memiliki payment yang belum expired, skip cancel`);
              break;
            }
          }
        }

        if (!shouldCancel) {
          continue;
        }

        // Update order status to Canceled
        await Order.findByIdAndUpdate(order._id, {
          status: 'Canceled',
          updatedAtWIB: getWIBNow()
        });

        // Juga update via order_id untuk konsistensi
        await Order.findOneAndUpdate(
          { order_id: order.order_id },
          {
            status: 'Canceled',
            updatedAtWIB: getWIBNow()
          }
        );

        canceledCount++;
        console.log(`✅ Order ${order.order_id} berhasil di-cancel (created at: ${order.createdAtWIB})`);

        // Optional: Tambahkan log atau notifikasi di sini
        await logAutoCancel(order);

      } catch (error) {
        errorCount++;
        console.error(`❌ Gagal cancel order ${order.order_id}:`, error.message);
      }
    }

    console.log(`[${getWIBNow().toISOString()}] Auto-cancel selesai. Berhasil: ${canceledCount}, Gagal: ${errorCount}`);

    return {
      success: true,
      canceledCount,
      errorCount,
      totalProcessed: unpaidOrders.length
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
    // Anda bisa menyimpan log ke database atau external service
    const logEntry = {
      orderId: order.order_id,
      orderType: order.orderType,
      user: order.user,
      totalAmount: order.grandTotal,
      createdAt: order.createdAtWIB,
      canceledAt: getWIBNow(),
      reason: 'Auto-cancel: Tidak ada pembayaran dalam 30 menit'
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
  console.log('🚀 Manual trigger auto-cancel...');
  return await autoCancelUnpaidOrders();
};

export const startAutoCancelScheduler = () => {
  console.log('🕐 Starting auto-cancel scheduler...');

  // Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running scheduled auto-cancel job...');
    try {
      await autoCancelUnpaidOrders();
    } catch (error) {
      console.error('❌ Scheduled auto-cancel job failed:', error);
    }
  });

  // Optional: Run immediately on startup untuk handle orders yang tertinggal
  setTimeout(() => {
    console.log('🚀 Running initial auto-cancel check...');
    autoCancelUnpaidOrders();
  }, 10000); // Run 10 detik setelah startup
};
