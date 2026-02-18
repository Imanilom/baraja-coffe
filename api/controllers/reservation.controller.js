import mongoose from 'mongoose';
import Joi from 'joi';
import Reservation from '../models/Reservation.model.js';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import { createMidtransSnapTransaction } from '../validators/order.validator.js';
import { LockUtil } from '../utils/lock.util.js';
import { MenuItem } from '../models/MenuItem.model.js';

// Helper untuk get WIB time sekarang
const getWIBNow = () => {
  const now = new Date();
  // UTC+7 for WIB
  const wibOffset = 7 * 60 * 60 * 1000;
  return new Date(now.getTime() + wibOffset);
};

// Schema validation untuk reservasi biasa
const createReservationSchema = Joi.object({
  reservation_date: Joi.date().required(),
  reservation_time: Joi.string().required(),
  agenda: Joi.string().optional().allow(''),
  agenda_description: Joi.string().optional().allow(''),
  area_id: Joi.string().required(),
  table_ids: Joi.array().items(Joi.string()).min(1).required(),
  table_type: Joi.string().valid('long table', 'class', 'casual', 'theater').default('long table'),
  guest_count: Joi.number().integer().min(1).required(),
  guest_number: Joi.string().optional().allow(''),
  customer_name: Joi.string().optional().allow(''),
  customer_phone: Joi.string().optional().allow(''),
  customer_email: Joi.string().email().optional().allow(''),
  equipment: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow(''),
  serving_type: Joi.string().valid('ala carte', 'buffet').default('ala carte'),
  food_serving_time: Joi.date().optional()
});

// Schema validation untuk reservasi dengan order
const createReservationWithOrderSchema = Joi.object({
  reservation_date: Joi.date().required(),
  reservation_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  agenda: Joi.string().optional().allow('').default('general'),
  agenda_description: Joi.string().optional().allow(''),
  area_id: Joi.string().hex().length(24).required(),
  table_ids: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
  table_type: Joi.string().valid('long table', 'class', 'casual', 'theater').default('long table'),
  guest_count: Joi.number().integer().min(1).max(100).required(),
  guest_number: Joi.string().optional().allow(''),
  customer_name: Joi.string().min(1).required(),
  customer_phone: Joi.string().min(1).required(),
  customer_email: Joi.string().email().optional().allow(''),
  equipment: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow(''),
  serving_type: Joi.string().valid('ala carte', 'buffet').default('ala carte'),
  food_serving_time: Joi.alternatives().try(
    Joi.date(),
    Joi.string()
  ).optional(),
  // Field untuk order
  order_items: Joi.array().items(Joi.object({
    menuItem: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).max(100).required(),
    subtotal: Joi.number().min(0).required(),
    notes: Joi.string().optional().allow(''),
    guestName: Joi.string().optional().allow('')
  })).optional(),
  total_amount: Joi.number().min(0).optional(),
  payment_type: Joi.string().valid('full', 'partial', 'none').default('partial'),
  down_payment_amount: Joi.number().min(0).optional(),
  payment_method: Joi.string().valid('E-Wallet', 'Bank Transfer', 'Credit Card', 'Cash', 'None').default('E-Wallet'),
  require_dp: Joi.boolean().default(true)
});

// Helper function untuk parse date dengan timezone Indonesia
const parseFoodServingTime = (dateString, reservationDate, reservationTime) => {
  if (!dateString) return null;

  try {
    // Jika format "01/11/2025, 17.34"
    if (dateString.includes('/') && dateString.includes(',')) {
      const [datePart, timePart] = dateString.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hour, minute] = timePart.split('.');

      // Create date dengan timezone Indonesia (UTC+7)
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );

      // Adjust untuk timezone (UTC+7)
      const timezoneOffset = 7 * 60; // minutes
      const localTime = new Date(date.getTime() + timezoneOffset * 60 * 1000);

      return localTime;
    }

    // Jika sudah format ISO, langsung return
    if (dateString.includes('T')) {
      return new Date(dateString);
    }

    // Fallback: gunakan reservation date + time
    if (reservationDate && reservationTime) {
      const [hours, minutes] = reservationTime.split(':');
      const date = new Date(reservationDate);
      date.setHours(parseInt(hours), parseInt(minutes));
      return date;
    }

    return new Date(dateString);
  } catch (error) {
    console.warn('Error parsing food_serving_time:', error);
    return null;
  }
};

// Create reservation only dengan LOCK
export const createReservation = async (req, res) => {
  try {
    console.log('Creating reservation with data:', req.body);

    const { error, value } = createReservationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Gunakan lock untuk mencegah race condition
    const result = await LockUtil.withReservationLock(value, async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const {
          reservation_date,
          reservation_time,
          area_id,
          guest_count,
          table_ids,
          notes,
          agenda,
          agenda_description,
          table_type,
          guest_number,
          customer_name,
          customer_phone,
          customer_email,
          equipment,
          serving_type,
          food_serving_time
        } = value;

        // Validate area exists and is active
        const area = await Area.findById(area_id).session(session);
        if (!area || !area.is_active) {
          await session.abortTransaction();
          throw new Error('Area not found or inactive');
        }

        // Validate tables exist and are active
        const tables = await Table.find({
          _id: { $in: table_ids },
          area_id: area_id,
          is_active: true
        }).session(session);

        if (tables.length !== table_ids.length) {
          await session.abortTransaction();
          throw new Error('Some tables not found or inactive');
        }

        // Check total table capacity
        const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
        if (totalTableCapacity < guest_count) {
          await session.abortTransaction();
          throw new Error(`Selected tables capacity (${totalTableCapacity}) insufficient for ${guest_count} guests`);
        }

        // Check if tables are available dengan lock protection
        const conflictingReservations = await Reservation.find({
          reservation_date: reservation_date,
          reservation_time: reservation_time,
          table_id: { $in: table_ids },
          status: { $in: ['confirmed', 'pending'] }
        }).session(session);

        if (conflictingReservations.length > 0) {
          await session.abortTransaction();
          throw new Error('One or more selected tables are already reserved for this time slot');
        }

        // Generate reservation code dengan sequence yang aman
        const reservationCode = await generateReservationCode(session);

        // Create reservation
        const reservation = new Reservation({
          reservation_code: reservationCode,
          reservation_date: reservation_date,
          reservation_time: reservation_time,
          area_id: area_id,
          table_id: table_ids,
          guest_count: guest_count,
          agenda: agenda || '',
          agenda_description: agenda_description || '',
          table_type: table_type || 'long table',
          guest_number: guest_number || '',
          customer_name: customer_name || '',
          customer_phone: customer_phone || '',
          customer_email: customer_email || '',
          equipment: equipment || [],
          notes: notes || '',
          serving_type: serving_type || 'ala carte',
          food_serving_time: food_serving_time || null,
          status: 'confirmed'
        });

        await reservation.save({ session });
        await session.commitTransaction();

        return reservation;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }, {
      onRetry: (retryCount, maxRetries) => {
        console.log(`🔄 Reservation lock retry ${retryCount}/${maxRetries}`);
      }
    });

    // Populate data for response
    const populatedReservation = await Reservation.findById(result._id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats');

    console.log('Reservation created successfully:', populatedReservation);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: {
        id: populatedReservation._id,
        reservation_code: populatedReservation.reservation_code,
        reservation_date: populatedReservation.reservation_date,
        reservation_time: populatedReservation.reservation_time,
        area: {
          id: populatedReservation.area_id._id,
          name: populatedReservation.area_id.area_name,
          code: populatedReservation.area_id.area_code
        },
        tables: populatedReservation.table_id.map(table => ({
          id: table._id,
          table_number: table.table_number,
          seats: table.seats
        })),
        guest_count: populatedReservation.guest_count,
        agenda: populatedReservation.agenda,
        agenda_description: populatedReservation.agenda_description,
        customer_name: populatedReservation.customer_name,
        customer_phone: populatedReservation.customer_phone,
        customer_email: populatedReservation.customer_email,
        notes: populatedReservation.notes,
        status: populatedReservation.status,
        created_at: populatedReservation.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reservation',
      error: error.message
    });
  }
};

// Create reservation with order dengan LOCK COMPREHENSIVE
export const createReservationWithOrder = async (req, res) => {
  try {
    console.log('📝 Creating reservation with order data:', req.body);

    // Pre-process data sebelum validation
    let processedBody = { ...req.body };

    // Parse food_serving_time dengan timezone correction
    if (processedBody.food_serving_time && typeof processedBody.food_serving_time === 'string') {
      const parsedDate = parseFoodServingTime(
        processedBody.food_serving_time,
        processedBody.reservation_date,
        processedBody.reservation_time
      );

      if (parsedDate && !isNaN(parsedDate.getTime())) {
        processedBody.food_serving_time = parsedDate;
        console.log('✅ Successfully parsed food_serving_time:', {
          original: processedBody.food_serving_time,
          parsed: parsedDate.toISOString(),
          local: parsedDate.toLocaleString('id-ID')
        });
      } else {
        console.warn('❌ Invalid food_serving_time format, setting to null');
        processedBody.food_serving_time = null;
      }
    }

    // Ensure required customer fields are filled
    if (!processedBody.customer_name && processedBody.guest_number) {
      processedBody.customer_name = `Guest-${processedBody.guest_number}`;
    }

    if (!processedBody.customer_phone && processedBody.guest_number) {
      processedBody.customer_phone = processedBody.guest_number;
    }

    // Validasi data dengan schema
    const { error, value } = createReservationWithOrderSchema.validate(processedBody);
    if (error) {
      console.log('❌ Validation error details:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
        details: error.details
      });
    }

    // Gunakan lock comprehensive untuk seluruh proses reservation dengan order
    const result = await LockUtil.withReservationLock(value, async () => {
      const session = await mongoose.startSession();
      let transactionCommitted = false;

      try {
        await session.startTransaction();

        const {
          reservation_date,
          reservation_time,
          area_id,
          guest_count,
          table_ids,
          notes,
          agenda,
          agenda_description,
          table_type,
          guest_number,
          customer_name,
          customer_phone,
          customer_email,
          equipment,
          serving_type,
          food_serving_time,
          order_items,
          total_amount,
          payment_type,
          down_payment_amount,
          payment_method,
          require_dp
        } = value;

        console.log('✅ Processed reservation data with LOCK:', {
          reservation_date,
          reservation_time,
          area_id,
          guest_count,
          table_count: table_ids.length,
          order_items_count: order_items ? order_items.length : 0,
          require_dp
        });

        // Validate area exists and is active
        const area = await Area.findById(area_id).session(session);
        if (!area || !area.is_active) {
          throw new Error('Area not found or inactive');
        }

        // Validate tables exist and are active
        const tables = await Table.find({
          _id: { $in: table_ids },
          area_id: area_id,
          is_active: true
        }).session(session);

        if (tables.length !== table_ids.length) {
          const foundTableIds = tables.map(t => t._id.toString());
          const missingTables = table_ids.filter(id => !foundTableIds.includes(id));
          throw new Error(`Some tables not found or inactive. Missing: ${missingTables.join(', ')}`);
        }

        // Check total table capacity
        const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
        if (totalTableCapacity < guest_count) {
          throw new Error(`Selected tables capacity (${totalTableCapacity}) insufficient for ${guest_count} guests`);
        }

        // Check if tables are available dengan lock protection
        const conflictingReservations = await Reservation.find({
          reservation_date: reservation_date,
          reservation_time: reservation_time,
          table_id: { $in: table_ids },
          status: { $in: ['confirmed', 'pending'] }
        }).session(session);

        if (conflictingReservations.length > 0) {
          const conflictingTableIds = [];
          conflictingReservations.forEach(res => {
            res.table_id.forEach(tableId => {
              if (table_ids.includes(tableId.toString()) && !conflictingTableIds.includes(tableId.toString())) {
                conflictingTableIds.push(tableId.toString());
              }
            });
          });

          const conflictingTables = await Table.find({
            _id: { $in: conflictingTableIds }
          });
          const conflictingTableNumbers = conflictingTables.map(t => t.table_number);

          throw new Error(`Tables ${conflictingTableNumbers.join(', ')} are already reserved for this time slot`);
        }

        // Generate reservation code dengan sequence yang aman
        const reservationCode = await generateReservationCode(session);

        // TENTUKAN STATUS RESERVASI BERDASARKAN REQUIRE_DP
        const reservationStatus = require_dp ? 'pending' : 'confirmed';

        // Prepare reservation data
        const reservationData = {
          reservation_code: reservationCode,
          reservation_date: reservation_date,
          reservation_time: reservation_time,
          area_id: area_id,
          table_id: table_ids,
          guest_count: guest_count,
          agenda: agenda || 'general',
          agenda_description: agenda_description || '',
          table_type: table_type || 'long table',
          guest_number: guest_number || customer_phone || '',
          customer_name: customer_name || `Guest-${customer_phone}`,
          customer_phone: customer_phone || '',
          customer_email: customer_email || '',
          equipment: equipment || [],
          notes: notes || '',
          serving_type: serving_type || 'ala carte',
          status: reservationStatus,
          food_serving_option: 'scheduled',
          created_by: {
            employee_id: null,
            employee_name: null,
            created_at: getWIBNow()
          }
        };

        // Only add food_serving_time if it's valid
        if (food_serving_time && !isNaN(new Date(food_serving_time).getTime())) {
          reservationData.food_serving_time = food_serving_time;
        }

        // Create reservation
        const reservation = new Reservation(reservationData);
        await reservation.save({ session });
        console.log('✅ Reservation created with LOCK:', reservation.reservation_code);

        let order = null;
        let paymentRecord = null;
        let midtransResponse = null;

        // Create order if there are order items
        if (order_items && order_items.length > 0) {
          // Generate order ID yang aman
          const orderSequence = await getNextOrderSequence(session);
          const orderId = `ORD-${reservation.reservation_code}-${orderSequence.toString().padStart(3, '0')}`;

          // Fetch menu items info from DB to ensure prices are correct
          const menuItemIds = order_items.map(item => item.menuItem);
          const menuItemsDocs = await MenuItem.find({ _id: { $in: menuItemIds } }).session(session);
          const menuItemsMap = new Map(menuItemsDocs.map(doc => [doc._id.toString(), doc]));

          // Prepare order items with BACKEND CALCULATED subtotal
          const formattedOrderItems = order_items.map(item => {
            const menuItemDoc = menuItemsMap.get(item.menuItem.toString());

            // Fallback price if not found (shouldn't happen due to previous checks usually, but safe)
            // or maybe throw error if strict
            if (!menuItemDoc) {
              throw new Error(`Menu item not found: ${item.menuItem}`);
            }

            const realPrice = menuItemDoc.price || 0;
            const calculatedSubtotal = realPrice * item.quantity;

            console.log(`💰 Recalculating item: ${menuItemDoc.name} | Qty: ${item.quantity} | Frontend Subtotal: ${item.subtotal} | Backend Subtotal: ${calculatedSubtotal}`);

            return {
              menuItem: item.menuItem,
              quantity: item.quantity,
              subtotal: calculatedSubtotal, // ✅ USE CALCULATED SUBTOTAL
              notes: item.notes || '',
              guestName: item.guestName || '',
              dineType: 'Dine-In',
              addedAt: getWIBNow(),
              kitchenStatus: 'pending',
              isPrinted: false,
              batchNumber: 1,
              // Store snapshot of data at time of order
              menuItemData: {
                name: menuItemDoc.name,
                price: realPrice,
                category: menuItemDoc.category,
                sku: menuItemDoc.sku,
                isActive: menuItemDoc.isActive
              }
            };
          });

          // Calculate totals
          const orderTotal = order_items.reduce((sum, item) => sum + item.subtotal, 0);

          // Calculate tax (10% of order total)
          const taxAmount = Math.round(orderTotal * 0.10);

          // Grand total = items + tax (NOT + DP!)
          const grandTotal = orderTotal + taxAmount;

          // TENTUKAN APAKAH PERLU DP ATAU TIDAK
          let dpAmount = 0;
          let remainingAmount = grandTotal;
          let customAmountItems = [];

          if (require_dp) {
            // DP bisa dari input user atau default 30% dari grand total
            dpAmount = down_payment_amount || Math.round(grandTotal * 0.30);
            remainingAmount = grandTotal - dpAmount;

            customAmountItems = [{
              amount: dpAmount,
              name: 'Down Payment (30%)',
              description: `DP untuk reservasi ${reservation.reservation_code}`,
              dineType: 'Dine-In',
              appliedAt: getWIBNow(),
              discountApplied: 0
            }];
          }

          // Create order
          order = new Order({
            order_id: orderId,
            user: customer_name || 'Guest',
            items: formattedOrderItems,
            customAmountItems: customAmountItems,
            status: require_dp ? 'Pending' : 'Reserved',
            paymentMethod: payment_method || (require_dp ? 'E-Wallet' : 'Cash'),
            orderType: 'Reservation',
            tableNumber: tables.map(t => t.table_number).join(', '),
            type: 'Indoor',
            outlet: '67cbc9560f025d897d69f889',
            totalBeforeDiscount: orderTotal,
            totalAfterDiscount: orderTotal,
            totalCustomAmount: dpAmount,
            grandTotal: grandTotal,  // ✅ FIX: items + tax, NOT + DP
            source: 'Web',
            reservation: reservation._id,
            isOpenBill: true,
            discounts: {
              autoPromoDiscount: 0,
              manualDiscount: 0,
              voucherDiscount: 0
            },
            appliedPromos: [],
            totalTax: taxAmount,  // ✅ FIX: Store calculated tax
            totalServiceFee: 0,
            change: 0,
            created_by: {
              employee_id: null,
              employee_name: null,
              created_at: getWIBNow()
            },
            currentBatch: 1,
            deliveryStatus: "false",
            deliveryProvider: "false",
            isSplitPayment: false,
            taxAndServiceDetails: [{
              type: 'tax',
              name: 'PPN',
              amount: taxAmount,
              _id: new mongoose.Types.ObjectId()
            }],
            kitchenNotifications: [],
            transferHistory: []
          });

          await order.save({ session });

          // BUAT PAYMENT RECORD HANYA JIKA PERLU DP
          if (require_dp) {
            // Generate payment code yang aman
            const paymentSequence = await getNextPaymentSequence(session);
            const paymentCode = `PAY-${reservation.reservation_code}-${paymentSequence.toString().padStart(3, '0')}`;

            paymentRecord = new Payment({
              order_id: order.order_id,
              payment_code: paymentCode,
              method: payment_method || 'E-Wallet',
              status: 'pending',
              paymentType: 'Down Payment',
              amount: dpAmount,
              totalAmount: grandTotal,  // ✅ FIX: Use grand total (items + tax)
              remainingAmount: remainingAmount,  // ✅ Already correct: grandTotal - dpAmount
              phone: customer_phone || '',
              currency: 'IDR'
            });

            await paymentRecord.save({ session });
            console.log('✅ Payment record created with LOCK:', paymentRecord.payment_code);

            // Create Midtrans transaction HANYA JIKA PERLU DP
            try {
              console.log('🔄 Creating Midtrans transaction for DP with LOCK...');

              const customerData = {
                first_name: customer_name ? customer_name.split(' ')[0] : 'Customer',
                last_name: customer_name ? customer_name.split(' ').slice(1).join(' ') : '',
                email: customer_email || 'customer@example.com',
                phone: customer_phone || '081234567890'
              };

              const paymentAmount = Number(dpAmount);
              if (isNaN(paymentAmount) || paymentAmount <= 0) {
                throw new Error(`Invalid payment amount: ${dpAmount}`);
              }

              midtransResponse = await createMidtransSnapTransaction(
                order.order_id,
                paymentAmount,
                customerData,
                payment_method
              );

              console.log('✅ Midtrans transaction created with LOCK:', {
                token: midtransResponse.token ? 'YES' : 'NO',
                redirect_url: midtransResponse.redirect_url ? 'YES' : 'NO'
              });

              // UPDATE PAYMENT RECORD DENGAN DATA MIDTRANS JIKA BERHASIL
              if (midtransResponse && midtransResponse.token) {
                paymentRecord.transaction_id = midtransResponse.transaction_id || `MID-${paymentSequence}`;
                paymentRecord.midtransRedirectUrl = midtransResponse.redirect_url;
                paymentRecord.raw_response = midtransResponse;

                await paymentRecord.save({ session });
              }

            } catch (midtransError) {
              console.error('❌ Midtrans error with LOCK:', midtransError);
              paymentRecord.raw_response = {
                error: midtransError.message,
                status: 'failed'
              };
              await paymentRecord.save({ session });

              midtransResponse = {
                success: false,
                error: midtransError.message,
                status: 'failed'
              };
            }
          }

          // Update reservation with order reference
          reservation.order_id = order._id;
          await reservation.save({ session });

          console.log('✅ Order created successfully with LOCK:', {
            order_id: order.order_id,
            items_total: orderTotal,
            tax: taxAmount,
            grand_total: order.grandTotal,
            dp_required: require_dp,
            dp_amount: dpAmount,
            remaining: remainingAmount
          });
        }

        // Commit transaction - SEMUA operasi database berhasil
        await session.commitTransaction();
        transactionCommitted = true;
        console.log('✅ Transaction committed successfully with LOCK');

        return {
          reservation,
          order,
          paymentRecord,
          midtransResponse,
          require_dp,
          down_payment_amount,
          total_amount,
          payment_method
        };

      } catch (error) {
        if (session.inTransaction() && !transactionCommitted) {
          await session.abortTransaction();
          console.log('✅ Transaction aborted due to error with LOCK');
        }
        throw error;
      } finally {
        session.endSession();
      }
    }, {
      onRetry: (retryCount, maxRetries) => {
        console.log(`🔄 Reservation with order lock retry ${retryCount}/${maxRetries}`);
      }
    });

    // Populate data for response (di luar session dan lock)
    const populatedReservation = await Reservation.findById(result.reservation._id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('order_id', 'order_id status grandTotal');

    // Prepare SUCCESS response data
    const responseData = {
      success: true,
      message: result.require_dp ?
        'Reservation created successfully. Please complete the down payment.' :
        'Reservation created successfully. No down payment required.',
      data: {
        reservation: {
          id: populatedReservation._id,
          reservation_code: populatedReservation.reservation_code,
          reservation_date: populatedReservation.reservation_date,
          reservation_time: populatedReservation.reservation_time,
          area: {
            id: populatedReservation.area_id._id,
            name: populatedReservation.area_id.area_name,
            code: populatedReservation.area_id.area_code
          },
          tables: populatedReservation.table_id.map(table => ({
            id: table._id,
            table_number: table.table_number,
            seats: table.seats
          })),
          guest_count: populatedReservation.guest_count,
          agenda: populatedReservation.agenda,
          agenda_description: populatedReservation.agenda_description,
          customer_name: populatedReservation.customer_name,
          customer_phone: populatedReservation.customer_phone,
          customer_email: populatedReservation.customer_email,
          notes: populatedReservation.notes,
          status: populatedReservation.status,
          food_serving_time: populatedReservation.food_serving_time,
          created_at: populatedReservation.createdAt
        }
      }
    };

    // Add order info if exists
    if (result.order) {
      responseData.data.order = {
        id: result.order._id,
        order_id: result.order.order_id,
        status: result.order.status,
        grandTotal: result.order.grandTotal,
        down_payment_required: result.require_dp,
        down_payment_amount: result.require_dp ? (result.down_payment_amount || Math.round(result.total_amount * 0.30)) : 0,
        payment_method: result.payment_method || (result.require_dp ? 'E-Wallet' : 'Cash')
      };

      // Add payment record info hanya jika ada DP
      if (result.paymentRecord) {
        responseData.data.payment_record = {
          id: result.paymentRecord._id,
          payment_code: result.paymentRecord.payment_code,
          status: result.paymentRecord.status,
          amount: result.paymentRecord.amount,
          remaining_amount: result.paymentRecord.remainingAmount,
          payment_type: result.paymentRecord.paymentType
        };
      }

      // Add Midtrans response hanya jika perlu DP dan berhasil
      if (result.require_dp && result.midtransResponse && result.midtransResponse.token) {
        responseData.data.payment = {
          token: result.midtransResponse.token,
          redirect_url: result.midtransResponse.redirect_url,
          status: 'waiting_payment'
        };

        responseData.redirect_url = result.midtransResponse.redirect_url;
        responseData.payment_url = result.midtransResponse.redirect_url;
      }
    }

    console.log('🎉 Reservation with order created successfully with LOCK');
    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Error creating reservation with order:', error);

    let statusCode = 500;
    let errorMessage = 'Error creating reservation';

    if (error.message.includes('Area not found') || error.message.includes('tables not found')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('already reserved')) {
      statusCode = 409;
      errorMessage = error.message;
    } else if (error.message.includes('insufficient')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Failed to acquire lock')) {
      statusCode = 429; // Too Many Requests
      errorMessage = 'System busy. Please try again in a moment.';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    });
  }
};

// Helper function untuk generate reservation code yang aman dengan LOCK - FIXED
const generateReservationCode = async (session) => {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');

  try {
    // Gunakan atomic operation untuk sequence dengan error handling
    const counterDoc = await Reservation.findOneAndUpdate(
      {
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      },
      { $inc: { _tempSequence: 1 } },
      {
        session,
        new: true,
        upsert: true,
        setDefaultsOnInsert: { _tempSequence: 1 },
        returnDocument: 'after'
      }
    );

    // Pastikan counterDoc ada dan memiliki _tempSequence
    if (!counterDoc) {
      throw new Error('Failed to generate reservation sequence');
    }

    const sequence = counterDoc._tempSequence;

    // Validasi sequence adalah number yang valid
    if (typeof sequence !== 'number' || isNaN(sequence)) {
      throw new Error('Invalid sequence generated');
    }

    return `RSV-${dateString}-${sequence.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('❌ Error generating reservation code:', error);

    // Fallback: gunakan timestamp sebagai backup
    const fallbackSequence = Date.now().toString().slice(-3);
    return `RSV-${dateString}-${fallbackSequence}`;
  }
};

// Helper function untuk mendapatkan sequence order berikutnya dengan LOCK - FIXED
const getNextOrderSequence = async (session) => {
  const today = new Date();

  try {
    const counterDoc = await Order.findOneAndUpdate(
      {
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      },
      { $inc: { _tempSequence: 1 } },
      {
        session,
        new: true,
        upsert: true,
        setDefaultsOnInsert: { _tempSequence: 1 },
        returnDocument: 'after'
      }
    );

    if (!counterDoc || typeof counterDoc._tempSequence !== 'number') {
      throw new Error('Failed to generate order sequence');
    }

    return counterDoc._tempSequence;
  } catch (error) {
    console.error('❌ Error generating order sequence:', error);
    return Math.floor(Math.random() * 100) + 1; // Fallback random
  }
};

// Helper function untuk mendapatkan sequence payment berikutnya dengan LOCK - FIXED
const getNextPaymentSequence = async (session) => {
  const today = new Date();

  try {
    const counterDoc = await Payment.findOneAndUpdate(
      {
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      },
      { $inc: { _tempSequence: 1 } },
      {
        session,
        new: true,
        upsert: true,
        setDefaultsOnInsert: { _tempSequence: 1 },
        returnDocument: 'after'
      }
    );

    if (!counterDoc || typeof counterDoc._tempSequence !== 'number') {
      throw new Error('Failed to generate payment sequence');
    }

    return counterDoc._tempSequence;
  } catch (error) {
    console.error('❌ Error generating payment sequence:', error);
    return Math.floor(Math.random() * 100) + 1; // Fallback random
  }
};

// Get all reservations
export const getReservations = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 10 } = req.query;

    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.reservation_date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('order_id', 'order_id status grandTotal')
      .sort({ reservation_date: 1, reservation_time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Reservation.countDocuments(query);

    res.json({
      success: true,
      data: reservations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error getting reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting reservations',
      error: error.message
    });
  }
};

// Get reservation by ID
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('order_id', 'order_id status grandTotal items');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error getting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting reservation',
      error: error.message
    });
  }
};

// Update reservation status dengan LOCK
export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, check_in_time, check_out_time } = req.body;

    // Gunakan lock berdasarkan reservation ID
    const result = await LockUtil.withLock(`reservation:${id}`, async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const reservation = await Reservation.findById(id).session(session);
        if (!reservation) {
          throw new Error('Reservation not found');
        }

        // Update status
        if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
          reservation.status = status;
        }

        // Update check-in time
        if (check_in_time) {
          reservation.check_in_time = check_in_time;
        }

        // Update check-out time
        if (check_out_time) {
          reservation.check_out_time = check_out_time;
        }

        await reservation.save({ session });
        await session.commitTransaction();

        return reservation;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    });

    const updatedReservation = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats');

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      data: updatedReservation
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reservation',
      error: error.message
    });
  }
};

// Cancel reservation dengan LOCK
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Gunakan lock berdasarkan reservation ID
    const result = await LockUtil.withLock(`reservation:${id}`, async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const reservation = await Reservation.findById(id).session(session);
        if (!reservation) {
          throw new Error('Reservation not found');
        }

        if (reservation.status === 'cancelled') {
          throw new Error('Reservation is already cancelled');
        }

        // Update reservation status
        reservation.status = 'cancelled';
        if (cancellation_reason) {
          reservation.notes += `\nCancellation reason: ${cancellation_reason}`;
        }

        await reservation.save({ session });

        // If there's an associated order, cancel it too
        if (reservation.order_id) {
          const order = await Order.findById(reservation.order_id).session(session);
          if (order) {
            order.status = 'Canceled';
            order.cancellationReason = cancellation_reason || 'Reservation cancelled';
            await order.save({ session });
          }
        }

        await session.commitTransaction();
        return reservation;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
      error: error.message
    });
  }
};

// Check availability dengan LOCK untuk consistency
export const checkAvailability = async (req, res) => {
  try {
    const { date, time, area_id, guest_count, table_ids } = req.query;

    console.log('Checking availability for:', { date, time, area_id, guest_count, table_ids });

    if (!date || !time || !area_id || !guest_count) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: date, time, area_id, guest_count'
      });
    }

    const reservationDate = new Date(date);
    if (isNaN(reservationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }

    // Gunakan lock untuk consistency check
    const availabilityResult = await LockUtil.withAreaLock(area_id, async () => {
      // Get area information
      const area = await Area.findById(area_id);
      if (!area || !area.is_active) {
        return {
          available: false,
          message: 'Area not available',
          reason: 'area_inactive'
        };
      }

      // Check if guest count exceeds area capacity
      if (parseInt(guest_count) > area.capacity) {
        return {
          available: false,
          message: `Guest count (${guest_count}) exceeds area capacity (${area.capacity})`,
          reason: 'capacity_exceeded'
        };
      }

      // If specific tables are requested, check table availability
      if (table_ids) {
        const requestedTableIds = Array.isArray(table_ids) ? table_ids : table_ids.split(',').map(id => id.trim());

        const tables = await Table.find({
          _id: { $in: requestedTableIds },
          area_id: area_id,
          is_active: true
        });

        if (tables.length !== requestedTableIds.length) {
          return {
            available: false,
            message: 'Some requested tables are not available or inactive',
            reason: 'table_not_found'
          };
        }

        const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
        if (totalTableCapacity < parseInt(guest_count)) {
          return {
            available: false,
            message: `Selected tables capacity (${totalTableCapacity}) is insufficient for ${guest_count} guests`,
            reason: 'insufficient_table_capacity'
          };
        }

        const existingReservations = await Reservation.find({
          reservation_date: {
            $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
            $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
          },
          reservation_time: time,
          table_id: { $in: requestedTableIds },
          status: { $in: ['confirmed', 'pending'] }
        });

        if (existingReservations.length > 0) {
          const conflictingTableIds = [];
          existingReservations.forEach(reservation => {
            reservation.table_id.forEach(tableId => {
              if (requestedTableIds.includes(tableId.toString()) &&
                !conflictingTableIds.includes(tableId.toString())) {
                conflictingTableIds.push(tableId.toString());
              }
            });
          });

          const conflictingTables = await Table.find({
            _id: { $in: conflictingTableIds }
          });
          const conflictingTableNumbers = conflictingTables.map(t => t.table_number);

          return {
            available: false,
            message: `Tables ${conflictingTableNumbers.join(', ')} are already reserved for this time slot`,
            reason: 'tables_already_reserved',
            conflicting_tables: conflictingTableNumbers
          };
        }

        return {
          available: true,
          message: 'Selected tables are available',
          data: {
            area_name: area.area_name,
            area_code: area.area_code,
            guest_count: parseInt(guest_count),
            table_count: tables.length,
            total_table_capacity: totalTableCapacity,
            selected_tables: tables.map(t => ({
              id: t._id,
              table_number: t.table_number,
              seats: t.seats
            }))
          }
        };
      }

      // General area availability check
      const existingReservations = await Reservation.find({
        reservation_date: {
          $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
          $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
        },
        reservation_time: time,
        area_id: area_id,
        status: { $in: ['confirmed', 'pending'] }
      });

      const totalReservedGuests = existingReservations.reduce((sum, reservation) => {
        return sum + reservation.guest_count;
      }, 0);

      const availableCapacity = area.capacity - totalReservedGuests;
      const isAvailable = availableCapacity >= parseInt(guest_count);

      return {
        available: isAvailable,
        available_capacity: availableCapacity,
        total_capacity: area.capacity,
        message: isAvailable ? 'Area has sufficient capacity' : 'Insufficient capacity in area',
        reason: isAvailable ? 'available' : 'insufficient_capacity',
        data: {
          area_name: area.area_name,
          area_code: area.area_code,
          guest_count: parseInt(guest_count),
          reserved_guests: totalReservedGuests
        }
      };
    });

    res.json({
      success: true,
      ...availabilityResult
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
};

export default {
  createReservation,
  createReservationWithOrder,
  getReservations,
  getReservationById,
  updateReservationStatus,
  cancelReservation,
  checkAvailability
};