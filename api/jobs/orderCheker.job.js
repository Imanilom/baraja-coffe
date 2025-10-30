import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';  
import Payment from '../models/Payment.model.js'; 
import cron from 'node-cron';

// Helper function untuk mendapatkan waktu WIB sekarang
const getWIBNow = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

/**
 * FUNGSI UTAMA YANG DIPERBAIKI - Auto Cancel Unpaid Orders
 * Masalah utama diperbaiki: Query tidak ketat, penanganan payment lebih akurat
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

    // ✅ QUERY YANG DIPERBAIKI - Lebih sederhana dan akurat
    const unpaidOrders = await Order.find({
      status: { $in: ['Pending'] },
      isOpenBill: false, // TIDAK termasuk open bill
      orderType: { 
        $in: ['Dine-In', 'Take Away', 'Pickup', 'Delivery'] // HANYA order reguler
      },
      createdAtWIB: { $lte: thirtyMinutesAgo }
      // ✅ DIHAPUS: Filter paymentMethod yang terlalu ketat
    }).populate('items.menuItem');

    console.log(`Ditemukan ${unpaidOrders.length} REGULAR orders yang belum dibayar`);

    let canceledCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each unpaid order
    for (const order of unpaidOrders) {
      try {
        // ✅ DOUBLE CHECK: Pastikan ini bukan open bill atau reservasi
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

        // ✅ CEK PAYMENT YANG LEBIH SEDERHANA DAN AKURAT
        const successfulPayments = await Payment.find({
          order_id: order.order_id,
          status: { $in: ['settlement', 'paid', 'capture', 'success'] }
        });

        // Jika sudah ada payment yang success, skip
        if (successfulPayments.length > 0) {
          console.log(`⏩ Skip: Order ${order.order_id} sudah memiliki payment success`);
          skippedCount++;
          continue;
        }

        // ✅ CEK PAYMENT PENDING YANG MASIH VALID (belum expired)
        const validPendingPayments = await Payment.find({
          order_id: order.order_id,
          status: 'pending',
          expiry_time: { $gt: getWIBNow() } // Hanya yang belum expired
        });

        if (validPendingPayments.length > 0) {
          console.log(`⏩ Skip: Order ${order.order_id} memiliki payment pending yang masih valid (expiry: ${validPendingPayments[0].expiry_time})`);
          skippedCount++;
          continue;
        }

        // ✅ DOUBLE CHECK: Pastikan order tidak terkait reservasi
        if (order.reservation || order.originalReservationId || order.reservationReference) {
          console.log(`⏩ Skip: Order ${order.order_id} terkait dengan reservasi`);
          skippedCount++;
          continue;
        }

        // ✅ SEMUA KRITERIA TERPENUHI - LANJUTKAN CANCEL
        console.log(`✅ Memproses cancel untuk REGULAR order: ${order.order_id} (${order.orderType})`);

        // Update order status to Canceled
        const updateResult = await Order.findByIdAndUpdate(
          order._id, 
          {
            status: 'Canceled',
            updatedAt: getWIBNow(),
            updatedAtWIB: getWIBNow(),
            cancellationReason: 'Auto-cancel: Tidak ada pembayaran dalam 30 menit'
          },
          { new: true }
        );

        if (updateResult) {
          canceledCount++;
          console.log(`✅ Order REGULER ${order.order_id} berhasil di-cancel (created at: ${order.createdAtWIB})`);
          
          // Log auto-cancel activity
          await logAutoCancel(order);
        } else {
          errorCount++;
          console.error(`❌ Gagal update order ${order.order_id}`);
        }

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
      message: `Auto-cancel completed: ${canceledCount} regular orders canceled, ${skippedCount} skipped`
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
 * 🔍 FUNGSI DIAGNOSIS - Untuk debug order yang tidak ter-cancel
 */
export const diagnoseUncanceledOrders = async () => {
  try {
    const thirtyMinutesAgo = new Date(getWIBNow().getTime() - 30 * 60 * 1000);
    
    console.log('🔍 DIAGNOSIS - Mencari order yang seharusnya ter-cancel...');
    console.log(`Waktu threshold: ${thirtyMinutesAgo}`);

    const problematicOrders = await Order.find({
      status: { $in: ['Pending'] },
      createdAtWIB: { $lte: thirtyMinutesAgo },
      isOpenBill: false
    }).sort({ createdAtWIB: 1 });

    console.log(`\n📋 Ditemukan ${problematicOrders.length} order yang perlu diagnosis:`);

    let shouldCancelCount = 0;
    
    for (const order of problematicOrders) {
      const payments = await Payment.find({ order_id: order.order_id });
      
      console.log(`\n--- Order ${order.order_id} ---`);
      console.log(`Type: ${order.orderType}, Status: ${order.status}`);
      console.log(`Created: ${order.createdAtWIB}`);
      console.log(`Payment Method: ${order.paymentMethod}`);
      console.log(`Is Open Bill: ${order.isOpenBill}`);
      console.log(`Reservation: ${order.reservation || 'No'}`);
      console.log(`Payments found: ${payments.length}`);
      
      payments.forEach(payment => {
        console.log(`  - Payment: ${payment.status}, Expiry: ${payment.expiry_time}`);
      });

      // Analisis kriteria cancel
      const isRegularOrder = !order.isOpenBill && 
                            order.orderType !== 'Reservation' && 
                            order.orderType !== 'Event';
      
      const hasSuccessfulPayment = payments.some(p => 
        ['settlement', 'paid', 'capture', 'success'].includes(p.status)
      );
      
      const hasValidPendingPayment = payments.some(p => 
        p.status === 'pending' && p.expiry_time && p.expiry_time > getWIBNow()
      );

      const hasReservation = order.reservation || order.originalReservationId || order.reservationReference;

      const shouldCancel = isRegularOrder && !hasSuccessfulPayment && !hasValidPendingPayment && !hasReservation;

      console.log(`📊 Analysis:`);
      console.log(`  - Regular Order: ${isRegularOrder}`);
      console.log(`  - Has Successful Payment: ${hasSuccessfulPayment}`);
      console.log(`  - Has Valid Pending Payment: ${hasValidPendingPayment}`);
      console.log(`  - Has Reservation: ${hasReservation}`);
      console.log(`  ➡️ Should be canceled: ${shouldCancel ? '✅ YES' : '❌ NO'}`);

      if (shouldCancel) shouldCancelCount++;
    }

    console.log(`\n🎯 SUMMARY: ${shouldCancelCount} dari ${problematicOrders.length} order seharusnya ter-cancel`);

    return {
      totalOrders: problematicOrders.length,
      shouldCancelCount,
      orders: problematicOrders
    };

  } catch (error) {
    console.error('❌ Error in diagnosis:', error);
    return { error: error.message };
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
      status: { $in: ['Pending'] },
      createdAtWIB: { $lte: thirtyMinutesAgo }
    }).select('order_id orderType isOpenBill status createdAtWIB paymentMethod reservation originalReservationId reservationReference')
      .sort({ createdAtWIB: 1 });

    console.log('📋 Preview orders yang akan dicek:');
    
    const regularOrders = potentialOrders.filter(order => 
      !order.isOpenBill && 
      order.orderType !== 'Reservation' && 
      order.orderType !== 'Event' &&
      !order.reservation &&
      !order.originalReservationId &&
      !order.reservationReference
    );

    const skipOrders = potentialOrders.filter(order => 
      order.isOpenBill || 
      order.orderType === 'Reservation' || 
      order.orderType === 'Event' ||
      order.reservation ||
      order.originalReservationId ||
      order.reservationReference
    );

    console.log(`✅ Akan diproses (REGULAR): ${regularOrders.length} orders`);
    regularOrders.forEach(order => {
      console.log(`   - ${order.order_id} (${order.orderType}) - ${order.createdAtWIB} - ${order.status}`);
    });

    console.log(`⏩ Akan di-skip: ${skipOrders.length} orders`);
    skipOrders.forEach(order => {
      const skipReason = order.isOpenBill ? 'Open Bill' : 
                        order.orderType === 'Reservation' ? 'Reservation' :
                        order.orderType === 'Event' ? 'Event' :
                        order.reservation ? 'Has Reservation' :
                        order.originalReservationId ? 'Original Reservation' :
                        order.reservationReference ? 'Reservation Reference' : 'Other';
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
 * ✅ FUNGSI TAMBAHAN: Force cancel untuk order tertentu (emergency)
 */
export const forceCancelOrder = async (orderId) => {
  try {
    console.log(`🔄 Force cancel order: ${orderId}`);
    
    const order = await Order.findOne({ order_id: orderId });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const updateResult = await Order.findOneAndUpdate(
      { order_id: orderId },
      {
        status: 'Canceled',
        updatedAt: getWIBNow(),
        updatedAtWIB: getWIBNow(),
        cancellationReason: 'Manual force cancel: Emergency cancellation'
      },
      { new: true }
    );

    if (updateResult) {
      console.log(`✅ Order ${orderId} successfully force canceled`);
      return { success: true, order: updateResult };
    } else {
      return { success: false, error: 'Failed to update order' };
    }

  } catch (error) {
    console.error(`❌ Error force canceling order ${orderId}:`, error);
    return { success: false, error: error.message };
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

  // Juga jalankan preview dan diagnosis untuk debugging
  setTimeout(() => {
    console.log('👀 Running preview of auto-cancel candidates...');
    previewAutoCancel();
  }, 15000);

  setTimeout(() => {
    console.log('🔍 Running diagnosis for uncanceled orders...');
    diagnoseUncanceledOrders();
  }, 20000);
};

// Export semua functions
export default {
  autoCancelUnpaidOrders,
  manualTriggerAutoCancel,
  previewAutoCancel,
  diagnoseUncanceledOrders,
  forceCancelOrder,
  startAutoCancelScheduler
};