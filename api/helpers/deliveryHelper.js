// helpers/deliveryHelper.js
import goSendService from '../services/goSendService.js';
import GoSendBooking from '../models/GoSendBooking.js';
import { Order } from '../models/order.model.js';

export const processGoSendDelivery = async ({ orderId, outlet, recipient_data, orderData }) => {
  try {
    // Tentukan shipment method (bisa dari user preference atau default Instant)
    const shipment_method = recipient_data.shipment_method || 'Instant';
    
    // Siapkan data booking GoSend
    const bookingData = {
      shipment_method: shipment_method,
      storeOrderId: orderId,
      routes: [{
        originName: outlet.name,
        originNote: `Pickup order ${orderId} - Cafe Delivery`,
        originContactName: outlet.managerName || 'Cafe Manager',
        originContactPhone: outlet.phoneNumber,
        originLatLong: outlet.coordinates,
        originAddress: outlet.address,
        destinationName: recipient_data.name,
        destinationNote: recipient_data.note || 'Tolong hati-hati',
        destinationContactName: recipient_data.name,
        destinationContactPhone: recipient_data.phone,
        destinationLatLong: recipient_data.coordinates,
        destinationAddress: recipient_data.address,
        item: `ORDER-${orderId}`, // Masking - gunakan order ID internal
      }]
    };

    // Dapatkan estimasi harga terlebih dahulu
    let estimate;
    try {
      estimate = await goSendService.getPriceEstimate(
        outlet.coordinates,
        recipient_data.coordinates
      );
    } catch (estimateError) {
      console.warn('Failed to get GoSend estimate, using default pricing');
      estimate = {
        [shipment_method]: {
          price: { total_price: 15000 },
          distance: 0,
          shipment_method_description: 'Delivery Service'
        }
      };
    }

    // Buat booking di GoSend
    const goSendResponse = await goSendService.createBooking(bookingData);

    // Simpan ke database GoSendBooking
    const goSendBooking = await GoSendBooking.create({
      order_id: orderId,
      goSend_order_no: goSendResponse.orderNo,
      store_order_id: orderId,
      shipment_method: bookingData.shipment_method,
      status: 'confirmed',
      routes: {
        origin: {
          name: bookingData.routes[0].originName,
          note: bookingData.routes[0].originNote,
          contact_name: bookingData.routes[0].originContactName,
          contact_phone: bookingData.routes[0].originContactPhone,
          latlong: bookingData.routes[0].originLatLong,
          address: bookingData.routes[0].originAddress
        },
        destination: {
          name: bookingData.routes[0].destinationName,
          note: bookingData.routes[0].destinationNote,
          contact_name: bookingData.routes[0].destinationContactName,
          contact_phone: bookingData.routes[0].destinationContactPhone,
          latlong: bookingData.routes[0].destinationLatLong,
          address: bookingData.routes[0].destinationAddress
        }
      },
      item: bookingData.routes[0].item,
      pricing: {
        total_price: estimate[shipment_method]?.price?.total_price || 15000,
        distance: estimate[shipment_method]?.distance || 0,
        shipment_method_description: estimate[shipment_method]?.shipment_method_description || ''
      },
      timestamps: {
        order_created: new Date()
      },
      live_tracking_url: goSendResponse.liveTrackingUrl
    });

    // Update order dengan delivery info
    await Order.findOneAndUpdate(
      { order_id: orderId },
      { 
        deliveryStatus: 'pending',
        deliveryProvider: 'GoSend',
        deliveryTracking: {
          provider: 'GoSend',
          tracking_number: goSendResponse.orderNo,
          status: 'confirmed',
          live_tracking_url: goSendResponse.liveTrackingUrl,
          estimated_arrival: calculateEstimatedArrival(shipment_method)
        },
        recipientInfo: {
          name: recipient_data.name,
          phone: recipient_data.phone,
          address: recipient_data.address,
          coordinates: recipient_data.coordinates,
          note: recipient_data.note
        }
      }
    );

    return {
      success: true,
      goSend_order_no: goSendResponse.orderNo,
      estimated_price: estimate[shipment_method]?.price?.total_price || 15000,
      live_tracking_url: goSendResponse.liveTrackingUrl,
      shipment_method: shipment_method
    };

  } catch (error) {
    console.error('Error in processGoSendDelivery:', error);
    throw new Error(`Gagal membuat delivery: ${error.message}`);
  }
};

// Helper untuk estimasi waktu sampai
const calculateEstimatedArrival = (shipment_method) => {
  const now = new Date();
  switch (shipment_method) {
    case 'Instant':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 jam
    case 'SameDay':
      return new Date(now.getTime() + 6 * 60 * 60 * 1000); // +6 jam
    default:
      return new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 jam default
  }
};