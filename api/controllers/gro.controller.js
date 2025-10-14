  // controllers/groController.js
import { Order } from '../models/order.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';
import { io } from '../index.js';
import mongoose from "mongoose";

/**
 * GRO Controller untuk management meja dan pesanan
 */

// ✅ GET ALL ACTIVE ORDERS WITH TABLE INFO (MAX 4 HOURS)
export const getActiveOrders = async (req, res) => {
  try {
    const { outletId } = req.params;
    
    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    // Hitung waktu 4 jam lalu dalam WIB
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const fourHoursAgo = new Date(nowWIB.getTime() - 4 * 60 * 60 * 1000);

    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In',
      tableNumber: { $exists: true, $ne: null },
      createdAtWIB: { $gte: fourHoursAgo } // 🔥 Filter hanya 4 jam terakhir
    })
    .populate('user_id', 'name phone')
    .populate('cashierId', 'name')
    .populate({
      path: 'items.menuItem',
      select: 'name price mainCategory workstation'
    })
    .sort({ createdAt: -1 });

    const formattedOrders = activeOrders.map(order => ({
      id: order._id,
      order_id: order.order_id,
      customerName: order.user_id?.name || order.user,
      customerPhone: order.user_id?.phone,
      tableNumber: order.tableNumber,
      status: order.status,
      orderType: order.orderType,
      items: order.items.map(item => ({
        name: item.menuItem?.name,
        quantity: item.quantity,
        mainCategory: item.menuItem?.mainCategory,
        workstation: item.menuItem?.workstation
      })),
      totalPrice: order.grandTotal,
      createdAt: order.createdAtWIB,
      isOpenBill: order.isOpenBill
    }));

    res.json({
      success: true,
      data: formattedOrders,
      total: formattedOrders.length
    });

  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pesanan aktif',
      error: error.message
    });
  }
};

// ✅ GET TABLE OCCUPANCY STATUS — DENGAN AUTO-UPDATE STATUS MEJA
export const getTableOccupancyStatus = async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    // 🔥 LANGSUNG UPDATE STATUS MEJA BERDASARKAN PESANAN AKTIF (<4 JAM)
    await Table.syncTableStatusWithActiveOrders(outletId);

    // Sekarang ambil data terbaru
    const tables = await Table.find({ is_active: true })
      .populate('area_id', 'area_code area_name')
      .sort({ area_id: 1, table_number: 1 });

    // Ambil pesanan aktif (untuk tampilan occupancy detail)
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const fourHoursAgo = new Date(nowWIB.getTime() - 4 * 60 * 60 * 1000);

    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In',
      tableNumber: { $exists: true, $ne: null },
      createdAtWIB: { $gte: fourHoursAgo }
    }).select('order_id tableNumber user status createdAtWIB');

    const activeOrderMap = {};
    activeOrders.forEach(order => {
      activeOrderMap[order.tableNumber] = {
        orderId: order._id,
        order_id: order.order_id,
        customerName: order.user,
        status: order.status,
        occupiedSince: order.createdAtWIB
      };
    });

    const tableStatus = tables.map(table => {
      const occupancy = activeOrderMap[table.table_number];
      return {
        id: table._id,
        table_number: table.table_number,
        area: {
          code: table.area_id?.area_code || 'N/A',
          name: table.area_id?.area_name || 'Unknown Area'
        },
        seats: table.seats,
        table_type: table.table_type,
        currentStatus: table.status, // sekarang sudah akurat!
        displayStatus: table.status,  // tidak perlu override lagi
        isOccupied: !!occupancy,
        occupancy: occupancy || null
      };
    });

    // Group by area
    const tablesByArea = {};
    tableStatus.forEach(table => {
      const areaCode = table.area.code;
      if (!tablesByArea[areaCode]) {
        tablesByArea[areaCode] = [];
      }
      tablesByArea[areaCode].push(table);
    });

    const totalTables = tables.length;
    const occupiedTables = tableStatus.filter(t => t.isOccupied).length;
    const availableTables = totalTables - occupiedTables;

    res.json({
      success: true,
      data: {
        tablesByArea,
        statistics: {
          totalTables,
          occupiedTables,
          availableTables,
          occupancyRate: totalTables > 0 ? ((occupiedTables / totalTables) * 100).toFixed(1) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching table occupancy:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil status ocupansi meja',
      error: error.message
    });
  }
};

// ✅ PERBAIKAN: getAvailableTables — pastikan meja benar-benar available (tidak punya pesanan aktif)
export const getAvailableTables = async (req, res) => {
  try {
    const { outletId, areaCode } = req.query;

    if (!outletId) {
      return res.status(400).json({
        success: false,
        message: 'Outlet ID diperlukan'
      });
    }

    // Ambil semua pesanan aktif untuk outlet ini
    const activeOrders = await Order.find({
      outlet: outletId,
      status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
      orderType: 'Dine-In',
      tableNumber: { $exists: true, $ne: null }
    }).select('tableNumber');

    const occupiedTableNumbers = new Set(
      activeOrders.map(order => order.tableNumber?.toUpperCase())
    );

    let filter = {
      is_active: true,
      // Jangan andalkan `status: 'available'` saja — cek juga tidak ada pesanan aktif
    };

    if (areaCode) {
      const area = await Area.findOne({ 
        area_code: areaCode.toUpperCase(),
        outlet_id: outletId,
        is_active: true 
      });
      
      if (area) {
        filter.area_id = area._id;
      }
    }

    const allTables = await Table.find(filter)
      .populate('area_id', 'area_code area_name')
      .sort({ table_number: 1 });

    // Filter meja yang benar-benar available: status 'available' DAN tidak ada pesanan aktif
    const trulyAvailableTables = allTables.filter(table => {
      const tableNum = table.table_number.toUpperCase();
      return table.status === 'available' && !occupiedTableNumbers.has(tableNum);
    });

    const formattedTables = trulyAvailableTables.map(table => ({
      id: table._id,
      table_number: table.table_number,
      area: {
        code: table.area_id?.area_code || 'N/A',
        name: table.area_id?.area_name || 'Unknown'
      },
      seats: table.seats,
      table_type: table.table_type,
      status: table.status
    }));

    res.json({
      success: true,
      data: formattedTables,
      total: formattedTables.length
    });

  } catch (error) {
    console.error('Error fetching available tables:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data meja tersedia',
      error: error.message
    });
  }
};


  // ✅ TRANSFER ORDER TO DIFFERENT TABLE
  export const transferOrderTable = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderId } = req.params;
      const { newTableNumber, reason, transferredBy } = req.body;

      if (!newTableNumber || !transferredBy) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Nomor meja baru dan nama GRO yang mentransfer diperlukan'
        });
      }

      // Cari pesanan
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan'
        });
      }

      // Validasi order type
      if (order.orderType !== 'Dine-In') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Hanya pesanan Dine-In yang bisa dipindahkan meja'
        });
      }

      const oldTableNumber = order.tableNumber;

      // Cek apakah meja baru tersedia
      const newTable = await Table.findOne({
        table_number: newTableNumber.toUpperCase(),
        is_active: true,
        status: 'available'
      }).populate('area_id').session(session);

      if (!newTable) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Meja ${newTableNumber} tidak tersedia atau tidak ditemukan`
        });
      }

      // Cek apakah meja baru sudah ada pesanan aktif
      const existingOrderOnNewTable = await Order.findOne({
        tableNumber: newTableNumber,
        status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
        outlet: order.outlet
      }).session(session);

      if (existingOrderOnNewTable && existingOrderOnNewTable._id.toString() !== orderId) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Meja ${newTableNumber} sudah memiliki pesanan aktif`
        });
      }

      // Update table status
      await Table.findByIdAndUpdate(
        newTable._id,
        { status: 'occupied' },
        { session }
      );

      // Jika meja lama ada, update statusnya menjadi available
      if (oldTableNumber) {
        const oldTable = await Table.findOne({
          table_number: oldTableNumber.toUpperCase()
        }).session(session);
        
        if (oldTable) {
          await Table.findByIdAndUpdate(
            oldTable._id,
            { status: 'available' },
            { session }
          );
        }
      }

      // Update order dengan table baru
      order.tableNumber = newTableNumber.toUpperCase();
      order.updatedAtWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      
      // Simpan history transfer
      if (!order.transferHistory) {
        order.transferHistory = [];
      }
      
      order.transferHistory.push({
        fromTable: oldTableNumber,
        toTable: newTableNumber,
        transferredBy: transferredBy,
        reason: reason || 'Table transfer by GRO',
        transferredAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
      });

      await order.save({ session });

      await session.commitTransaction();

      // ✅ EMIT SOCKET EVENT UNTUK REAL-TIME UPDATE
      const transferData = {
        orderId: order._id,
        order_id: order.order_id,
        oldTable: oldTableNumber,
        newTable: newTableNumber,
        customerName: order.user_id?.name || order.user,
        transferredBy: transferredBy,
        reason: reason,
        area: newTable.area_id.area_code,
        timestamp: new Date()
      };

      // Emit ke room order
      io.to(`order_${order.order_id}`).emit('table_transferred', transferData);
      
      // Emit ke cashier room
      io.to('cashier_room').emit('order_table_changed', transferData);
      
      // Emit ke area room
      io.to(`area_${newTable.area_id.area_code}`).emit('table_assignment_updated', {
        tableNumber: newTableNumber,
        orderId: order.order_id,
        status: 'occupied'
      });

      if (oldTableNumber) {
        const oldTable = await Table.findOne({ table_number: oldTableNumber });
        if (oldTable) {
          io.to(`area_${oldTable.area_id?.area_code}`).emit('table_assignment_updated', {
            tableNumber: oldTableNumber,
            status: 'available'
          });
        }
      }

      console.log(`✅ Table transferred: Order ${order.order_id} from ${oldTableNumber} to ${newTableNumber}`);

      res.json({
        success: true,
        message: `Pesanan berhasil dipindahkan dari meja ${oldTableNumber} ke meja ${newTableNumber}`,
        data: {
          order: {
            id: order._id,
            order_id: order.order_id,
            tableNumber: order.tableNumber,
            customerName: order.user_id?.name || order.user
          },
          transfer: {
            from: oldTableNumber,
            to: newTableNumber,
            transferredBy: transferredBy,
            reason: reason,
            timestamp: new Date()
          }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error transferring table:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memindahkan pesanan ke meja baru',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  };

  // ✅ GET ORDER TABLE HISTORY
  export const getOrderTableHistory = async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .select('order_id tableNumber transferHistory user user_id');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan'
        });
      }

      const history = order.transferHistory || [];

      res.json({
        success: true,
        data: {
          order: {
            id: order._id,
            order_id: order.order_id,
            currentTable: order.tableNumber,
            customerName: order.user_id?.name || order.user
          },
          transferHistory: history.map(transfer => ({
            fromTable: transfer.fromTable,
            toTable: transfer.toTable,
            transferredBy: transfer.transferredBy,
            reason: transfer.reason,
            transferredAt: transfer.transferredAt
          })).sort((a, b) => new Date(b.transferredAt) - new Date(a.transferredAt))
        }
      });

    } catch (error) {
      console.error('Error fetching table history:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil history perpindahan meja',
        error: error.message
      });
    }
  };

  // ✅ BULK TABLE STATUS UPDATE (Untuk GRO yang keliling)
  export const bulkUpdateTableStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { updates, updatedBy } = req.body;

      if (!Array.isArray(updates) || updates.length === 0 || !updatedBy) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Data updates dan nama GRO diperlukan'
        });
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const { tableNumber, status, notes } = update;

          // Find table
          const table = await Table.findOne({
            table_number: tableNumber.toUpperCase(),
            is_active: true
          }).session(session);

          if (!table) {
            errors.push({ tableNumber, message: 'Meja tidak ditemukan' });
            continue;
          }

          // Check if table has active order when changing to available
          if (status === 'available' && table.status === 'occupied') {
            const activeOrder = await Order.findOne({
              tableNumber: tableNumber,
              status: { $in: ['Pending', 'Waiting', 'OnProcess'] }
            }).session(session);

            if (activeOrder) {
              errors.push({ 
                tableNumber, 
                message: `Meja ${tableNumber} masih memiliki pesanan aktif (Order: ${activeOrder.order_id})` 
              });
              continue;
            }
          }

          // Update table status
          const oldStatus = table.status;
          table.status = status;
          table.updatedAt = new Date();

          // Add status history
          if (!table.statusHistory) {
            table.statusHistory = [];
          }

          table.statusHistory.push({
            fromStatus: oldStatus,
            toStatus: status,
            updatedBy: updatedBy,
            notes: notes,
            updatedAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
          });

          await table.save({ session });

          results.push({
            tableNumber,
            fromStatus: oldStatus,
            toStatus: status,
            success: true
          });

          // Emit socket event
          io.to(`area_${table.area_id?.area_code}`).emit('table_status_updated', {
            tableId: table._id,
            tableNumber: table.table_number,
            areaId: table.area_id,
            oldStatus: oldStatus,
            newStatus: status,
            updatedBy: updatedBy,
            timestamp: new Date()
          });

        } catch (error) {
          errors.push({ tableNumber: update.tableNumber, message: error.message });
        }
      }

      await session.commitTransaction();

      res.json({
        success: errors.length === 0,
        message: `${results.length} meja berhasil diupdate, ${errors.length} gagal`,
        updated: results.length,
        failed: errors.length,
        results,
        errors
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error bulk updating tables:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal update status meja',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  };