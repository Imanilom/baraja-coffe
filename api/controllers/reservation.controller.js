import mongoose from 'mongoose';
import Joi from 'joi';
import Reservation from '../models/Reservation.model.js';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';
import Payment from '../models/Payment.model.js';
import { Order } from '../models/order.model.js';
import { createMidtransSnapTransaction } from '../validators/order.validator.js';

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
  payment_type: Joi.string().valid('full', 'partial', 'none').default('partial'), // TAMBAH OPTION 'none'
  down_payment_amount: Joi.number().min(0).optional(),
  payment_method: Joi.string().valid('E-Wallet', 'Bank Transfer', 'Credit Card', 'Cash', 'None').default('E-Wallet'), // TAMBAH OPTION 'None'
  require_dp: Joi.boolean().default(true) // FIELD BARU: menentukan apakah perlu DP atau tidak
});

// Create reservation only
export const createReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Area not found or inactive'
      });
    }

    // Validate tables exist and are active
    const tables = await Table.find({
      _id: { $in: table_ids },
      area_id: area_id,
      is_active: true
    }).session(session);

    if (tables.length !== table_ids.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Some tables not found or inactive'
      });
    }

    // Check total table capacity
    const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
    if (totalTableCapacity < guest_count) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Selected tables capacity (${totalTableCapacity}) insufficient for ${guest_count} guests`
      });
    }

    // Check if tables are available
    const conflictingReservations = await Reservation.find({
      reservation_date: reservation_date,
      reservation_time: reservation_time,
      table_id: { $in: table_ids },
      status: { $in: ['confirmed', 'pending'] }
    }).session(session);

    if (conflictingReservations.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: 'One or more selected tables are already reserved for this time slot'
      });
    }

    // Create reservation
    const reservation = new Reservation({
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
    session.endSession();

    // Populate data for response
    const populatedReservation = await Reservation.findById(reservation._id)
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
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reservation',
      error: error.message
    });
  }
};


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


// Create reservation with order - VERSI TANPA DP OPSIONAL
export const createReservationWithOrder = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
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
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
        details: error.details
      });
    }

    // Extract validated data
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
      require_dp // FIELD BARU
    } = value;

    console.log('✅ Processed reservation data:', {
      reservation_date,
      reservation_time,
      food_serving_time: food_serving_time ? food_serving_time.toISOString() : null,
      area_id,
      guest_count,
      table_count: table_ids.length,
      order_items_count: order_items ? order_items.length : 0,
      total_amount,
      down_payment_amount,
      customer_name,
      customer_phone,
      require_dp, // LOG FIELD BARU
      payment_type
    });

    // Validate area exists and is active
    const area = await Area.findById(area_id).session(session);
    if (!area || !area.is_active) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Area not found or inactive'
      });
    }
    console.log('✅ Area validated:', area.area_name);

    // Validate tables exist and are active
    const tables = await Table.find({
      _id: { $in: table_ids },
      area_id: area_id,
      is_active: true
    }).session(session);

    if (tables.length !== table_ids.length) {
      await session.abortTransaction();
      await session.endSession();
      const foundTableIds = tables.map(t => t._id.toString());
      const missingTables = table_ids.filter(id => !foundTableIds.includes(id));
      return res.status(400).json({
        success: false,
        message: 'Some tables not found or inactive',
        missing_tables: missingTables,
        found_tables: foundTableIds.length,
        details: `Requested ${table_ids.length} tables, found ${foundTableIds.length}`
      });
    }
    console.log('✅ Tables validated:', tables.map(t => t.table_number));

    // Check total table capacity
    const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
    if (totalTableCapacity < guest_count) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        success: false,
        message: `Selected tables capacity (${totalTableCapacity}) insufficient for ${guest_count} guests`,
        total_capacity: totalTableCapacity,
        required_capacity: guest_count,
        tables: tables.map(t => ({ table_number: t.table_number, seats: t.seats }))
      });
    }
    console.log('✅ Table capacity validated:', totalTableCapacity);

    // Check if tables are available (no conflicts)
    const conflictingReservations = await Reservation.find({
      reservation_date: reservation_date,
      reservation_time: reservation_time,
      table_id: { $in: table_ids },
      status: { $in: ['confirmed', 'pending'] }
    }).session(session);

    if (conflictingReservations.length > 0) {
      await session.abortTransaction();
      await session.endSession();
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

      return res.status(409).json({
        success: false,
        message: `Tables ${conflictingTableNumbers.join(', ')} are already reserved for this time slot`,
        conflicting_tables: conflictingTableNumbers,
        reservation_time: reservation_time,
        reservation_date: reservation_date
      });
    }
    console.log('✅ No scheduling conflicts found');

    // Generate reservation code
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lastReservation = await Reservation.findOne({
      reservation_code: new RegExp(`RSV-${dateString}`)
    }).sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastReservation) {
      const lastSequence = parseInt(lastReservation.reservation_code.split('-')[2]) || 0;
      sequence = lastSequence + 1;
    }
    
    const reservationCode = `RSV-${dateString}-${sequence.toString().padStart(3, '0')}`;

    // TENTUKAN STATUS RESERVASI BERDASARKAN REQUIRE_DP
    const reservationStatus = require_dp ? 'pending' : 'confirmed';

    // Prepare reservation data dengan semua field required
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
      status: reservationStatus, // GUNAKAN STATUS YANG SUDAH DITENTUKAN
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
    console.log('✅ Reservation created:', reservation.reservation_code);

    let order = null;
    let paymentRecord = null;
    let midtransResponse = null;
    
    // Create order if there are order items
    // Create order if there are order items
    if (order_items && order_items.length > 0) {
      // Generate order ID yang lebih pendek - hanya menggunakan sequence number
      const orderSequence = await getNextOrderSequence();
      const orderId = `ORD-${reservation.reservation_code}-${orderSequence.toString().padStart(3, '0')}`;
      
      // Prepare order items
      const formattedOrderItems = order_items.map(item => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes || '',
        guestName: item.guestName || '',
        dineType: 'Dine-In',
        addedAt: getWIBNow(),
        kitchenStatus: 'pending',
        isPrinted: false,
        batchNumber: 1
      }));

      // Calculate totals
      const orderTotal = order_items.reduce((sum, item) => sum + item.subtotal, 0);
      
      // TENTUKAN APAKAH PERLU DP ATAU TIDAK
      let dpAmount = 0;
      let remainingAmount = orderTotal;
      let customAmountItems = [];
      
      if (require_dp) {
        // JIKA PERLU DP
        dpAmount = down_payment_amount || Math.round(orderTotal * 0.30);
        remainingAmount = orderTotal - dpAmount;
        
        customAmountItems = [{
          amount: dpAmount,
          name: 'Down Payment (30%)',
          description: `DP untuk reservasi ${reservation.reservation_code}`,
          dineType: 'Dine-In',
          appliedAt: getWIBNow(),
          discountApplied: 0
        }];
        
        console.log('💰 With DP calculations:', {
          order_total: orderTotal,
          down_payment: dpAmount,
          calculated_dp: Math.round(orderTotal * 0.30),
          remaining_amount: remainingAmount
        });
      } else {
        // JIKA TIDAK PERLU DP
        console.log('💰 No DP required - full amount will be paid later');
      }

      // Create order dengan semua field required
      order = new Order({
        order_id: orderId,
        user: customer_name || 'Guest',
        items: formattedOrderItems,
        customAmountItems: customAmountItems, // KOSONGKAN JIKA TIDAK ADA DP
        status: require_dp ? 'Pending' : 'Reserved', // STATUS ORDER BERBEDA
        paymentMethod: payment_method || (require_dp ? 'E-Wallet' : 'Cash'),
        orderType: 'Reservation',
        tableNumber: tables.map(t => t.table_number).join(', '),
        type: 'Indoor',
        outlet: '67cbc9560f025d897d69f889',
        totalBeforeDiscount: orderTotal,
        totalAfterDiscount: orderTotal,
        totalCustomAmount: dpAmount, // 0 JIKA TIDAK ADA DP
        grandTotal: orderTotal + dpAmount,
        source: 'Web',
        reservation: reservation._id,
        isOpenBill: true,
        discounts: {
          autoPromoDiscount: 0,
          manualDiscount: 0,
          voucherDiscount: 0
        },
        appliedPromos: [],
        totalTax: 0,
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
        taxAndServiceDetails: [],
        kitchenNotifications: [],
        transferHistory: []
      });

      await order.save({ session });

      // BUAT PAYMENT RECORD HANYA JIKA PERLU DP
      if (require_dp) {
        // Generate payment code yang lebih pendek - hanya menggunakan sequence number
        const paymentSequence = await getNextPaymentSequence();
        const paymentCode = `PAY-${reservation.reservation_code}-${paymentSequence.toString().padStart(3, '0')}`;
        
        paymentRecord = new Payment({
          order_id: order.order_id,
          payment_code: paymentCode,
          method: payment_method || 'E-Wallet',
          status: 'pending', // Status awal pending
          paymentType: 'Down Payment',
          amount: dpAmount,
          totalAmount: orderTotal,
          remainingAmount: remainingAmount,
          phone: customer_phone || '',
          currency: 'IDR'
        });

        await paymentRecord.save({ session });
        console.log('✅ Payment record created with status pending:', paymentRecord.payment_code);

        // Create Midtrans transaction HANYA JIKA PERLU DP
        try {
          console.log('🔄 Creating Midtrans transaction for DP...');
          
          // Persiapan data customer untuk Midtrans
          const customerData = {
            first_name: customer_name ? customer_name.split(' ')[0] : 'Customer',
            last_name: customer_name ? customer_name.split(' ').slice(1).join(' ') : '',
            email: customer_email || 'customer@example.com',
            phone: customer_phone || '081234567890'
          };

          // Pastikan amount adalah number
          const paymentAmount = Number(dpAmount);
          if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error(`Invalid payment amount: ${dpAmount}`);
          }

          console.log('💰 Midtrans payment details:', {
            orderId: order.order_id,
            amount: paymentAmount,
            customer: customerData
          });

          // Panggil Midtrans function dengan parameter yang benar
          midtransResponse = await createMidtransSnapTransaction(
            order.order_id,    // Parameter 1: orderId
            paymentAmount,     // Parameter 2: amount (number)
            customerData,      // Parameter 3: customer
            payment_method     // Parameter 4: paymentMethod
          );

          console.log('✅ Midtrans transaction created:', {
            token: midtransResponse.token ? 'YES' : 'NO',
            redirect_url: midtransResponse.redirect_url ? 'YES' : 'NO'
          });

          // UPDATE PAYMENT RECORD DENGAN DATA MIDTRANS JIKA BERHASIL
          if (midtransResponse && midtransResponse.token) {
            // Gunakan transaction_id dari Midtrans atau buat yang lebih pendek
            paymentRecord.transaction_id = midtransResponse.transaction_id || `MID-${paymentSequence}`;
            paymentRecord.midtransRedirectUrl = midtransResponse.redirect_url;
            paymentRecord.raw_response = midtransResponse;
            
            await paymentRecord.save({ session });
            console.log('✅ Payment record updated with Midtrans data');
          }

        } catch (midtransError) {
          console.error('❌ Midtrans error:', midtransError);
          // Simpan error response di payment record
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
      } else {
        console.log('ℹ️ No DP required, skipping payment record and Midtrans');
      }

      // Update reservation with order reference
      reservation.order_id = order._id;
      await reservation.save({ session });

      console.log('✅ Order created successfully:', {
        order_id: order.order_id,
        total: order.grandTotal,
        dp_required: require_dp,
        dp_amount: dpAmount,
        item_count: order.items.length,
        payment_record: paymentRecord ? paymentRecord.payment_code : 'none'
      });
    } else {
      console.log('ℹ️ No order items provided, creating reservation only');
    }

    // Commit transaction - SEMUA operasi database berhasil
    await session.commitTransaction();
    console.log('✅ Transaction committed successfully');

    // Populate data for response (di luar session)
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats')
      .populate('order_id', 'order_id status grandTotal');

    // Prepare SUCCESS response data
    const responseData = {
      success: true,
      message: require_dp ? 
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
    if (order) {
      responseData.data.order = {
        id: order._id,
        order_id: order.order_id,
        status: order.status,
        grandTotal: order.grandTotal,
        down_payment_required: require_dp,
        down_payment_amount: require_dp ? (down_payment_amount || Math.round(total_amount * 0.30)) : 0,
        payment_method: payment_method || (require_dp ? 'E-Wallet' : 'Cash')
      };
      
      // Add payment record info hanya jika ada DP
      if (paymentRecord) {
        responseData.data.payment_record = {
          id: paymentRecord._id,
          payment_code: paymentRecord.payment_code,
          status: paymentRecord.status,
          amount: paymentRecord.amount,
          remaining_amount: paymentRecord.remainingAmount,
          payment_type: paymentRecord.paymentType
        };
      }
      
      // Add Midtrans response hanya jika perlu DP dan berhasil
      if (require_dp && midtransResponse && midtransResponse.token) {
        responseData.data.payment = {
          token: midtransResponse.token,
          redirect_url: midtransResponse.redirect_url,
          status: 'waiting_payment'
        };
        
        // Tambahkan redirect_url di root level untuk kompatibilitas
        responseData.redirect_url = midtransResponse.redirect_url;
        responseData.payment_url = midtransResponse.redirect_url;
        
      } else if (require_dp) {
        // Jika perlu DP tapi Midtrans gagal
        responseData.data.payment = {
          status: 'payment_pending',
          message: 'Payment gateway temporarily unavailable. Please complete payment at the venue.',
          error: midtransResponse?.error || 'Payment initialization failed'
        };
      }
    }

    console.log('🎉 Reservation with order created successfully');
    console.log('📊 Final response:', {
      reservation_code: populatedReservation.reservation_code,
      has_order: !!order,
      require_dp: require_dp,
      has_payment_record: !!paymentRecord,
      has_midtrans: !!midtransResponse?.token,
      guest_count: populatedReservation.guest_count,
      table_count: populatedReservation.table_id.length
    });

    // Kirim response SUKSES
    res.status(201).json(responseData);

  } catch (error) {
    // Handle errors dan rollback transaction
    console.error('❌ Error creating reservation with order:', error);
    
    try {
      // Coba abort transaction jika masih aktif
      if (session.inTransaction()) {
        await session.abortTransaction();
        console.log('✅ Transaction aborted due to error');
      }
    } catch (abortError) {
      console.error('❌ Error aborting transaction:', abortError);
    } finally {
      // Selalu end session
      await session.endSession();
    }
    
    // Determine error type for better response
    let errorMessage = 'Error creating reservation';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Data validation failed';
      statusCode = 400;
    } else if (error.name === 'MongoError' && error.code === 11000) {
      errorMessage = 'Duplicate reservation detected';
      statusCode = 409;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid data format';
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        error_type: error.name
      })
    });
  }
};

// Helper function untuk mendapatkan sequence order berikutnya - DIPERBAIKI
const getNextOrderSequence = async () => {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Cari order terakhir untuk hari ini dengan pattern yang benar
  const lastOrder = await Order.findOne({
    order_id: new RegExp(`ORD-RSV-${dateString}-`)
  }).sort({ createdAt: -1 });
  
  let sequence = 1;
  if (lastOrder && lastOrder.order_id) {
    // Extract sequence dari order_id: ORD-RSV-20251110-001
    const orderIdParts = lastOrder.order_id.split('-');
    if (orderIdParts.length >= 4) {
      const lastSequence = parseInt(orderIdParts[3]) || 0;
      sequence = lastSequence + 1;
    }
  }
  
  return sequence;
};

// Helper function untuk mendapatkan sequence payment berikutnya - DIPERBAIKI
const getNextPaymentSequence = async () => {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Cari payment terakhir untuk hari ini dengan pattern yang benar
  const lastPayment = await Payment.findOne({
    payment_code: new RegExp(`PAY-RSV-${dateString}-`)
  }).sort({ createdAt: -1 });
  
  let sequence = 1;
  if (lastPayment && lastPayment.payment_code) {
    // Extract sequence dari payment_code: PAY-RSV-20251110-001
    const paymentCodeParts = lastPayment.payment_code.split('-');
    if (paymentCodeParts.length >= 4) {
      const lastSequence = parseInt(paymentCodeParts[3]) || 0;
      sequence = lastSequence + 1;
    }
  }
  
  return sequence;
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

// Update reservation status
export const updateReservationStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, check_in_time, check_out_time } = req.body;

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
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
    session.endSession();

    const updatedReservation = await Reservation.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('table_id', 'table_number seats');

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      data: updatedReservation
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reservation',
      error: error.message
    });
  }
};

// Cancel reservation
export const cancelReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Reservation is already cancelled'
      });
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
    session.endSession();

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
      error: error.message
    });
  }
};

// Check availability
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

    // Get area information
    const area = await Area.findById(area_id);
    if (!area || !area.is_active) {
      return res.json({
        success: true,
        available: false,
        message: 'Area not available',
        reason: 'area_inactive'
      });
    }

    // Check if guest count exceeds area capacity
    if (parseInt(guest_count) > area.capacity) {
      return res.json({
        success: true,
        available: false,
        message: `Guest count (${guest_count}) exceeds area capacity (${area.capacity})`,
        reason: 'capacity_exceeded'
      });
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
        return res.json({
          success: true,
          available: false,
          message: 'Some requested tables are not available or inactive',
          reason: 'table_not_found'
        });
      }

      const totalTableCapacity = tables.reduce((sum, table) => sum + table.seats, 0);
      if (totalTableCapacity < parseInt(guest_count)) {
        return res.json({
          success: true,
          available: false,
          message: `Selected tables capacity (${totalTableCapacity}) is insufficient for ${guest_count} guests`,
          reason: 'insufficient_table_capacity'
        });
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

        return res.json({
          success: true,
          available: false,
          message: `Tables ${conflictingTableNumbers.join(', ')} are already reserved for this time slot`,
          reason: 'tables_already_reserved',
          conflicting_tables: conflictingTableNumbers
        });
      }

      return res.json({
        success: true,
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
      });
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

    res.json({
      success: true,
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