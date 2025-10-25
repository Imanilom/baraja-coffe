// services/goSendService.js
import axios from 'axios';

class GoSendService {
  constructor() {
    this.stagingBaseURL = 'https://integration-kilat-api.gojekapi.com';
    this.productionBaseURL = 'https://kilat-api.gojekapi.com';
    this.clientId = process.env.GOSEND_CLIENT_ID;
    this.passKey = process.env.GOSEND_PASS_KEY;
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'staging';
  }

  getBaseURL() {
    return this.environment === 'production' ? this.productionBaseURL : this.stagingBaseURL;
  }

  getHeaders() {
    return {
      'Client-ID': this.clientId,
      'Pass-Key': this.passKey,
      'Content-Type': 'application/json'
    };
  }

  // Validasi nomor telepon sesuai requirement GoSend
  validatePhoneNumber(phone) {
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Validasi panjang minimal
    if (cleanedPhone.length < 10) return false;
    
    // Hanya nomor Indonesia yang diperbolehkan
    if (!cleanedPhone.startsWith('08') && !cleanedPhone.startsWith('62') && !cleanedPhone.startsWith('021')) {
      return false;
    }
    
    // Validasi berdasarkan prefix
    if (cleanedPhone.startsWith('08') && cleanedPhone.length >= 10 && cleanedPhone.length <= 13) {
      return true;
    }
    
    if (cleanedPhone.startsWith('62') && cleanedPhone.length >= 11 && cleanedPhone.length <= 14) {
      return true;
    }
    
    if (cleanedPhone.startsWith('021') && cleanedPhone.length >= 10 && cleanedPhone.length <= 11) {
      return true;
    }
    
    return false;
  }

  // Estimate price dan distance
  async getPriceEstimate(originLatLong, destinationLatLong) {
    try {
      const url = `${this.getBaseURL()}/gokilat/v10/calculate/price`;
      const params = {
        origin: originLatLong,
        destination: destinationLatLong,
        paymentType: 3 // corporate
      };

      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params
      });

      return response.data;
    } catch (error) {
      console.error('GoSend price estimate error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create booking untuk pick-up
  async createBooking(bookingData) {
    try {
      const url = `${this.getBaseURL()}/gokilat/v10/booking`;
      
      // Validasi nomor telepon
      if (!this.validatePhoneNumber(bookingData.routes[0].originContactPhone)) {
        throw new Error('Nomor telepon pengirim tidak valid');
      }
      
      if (!this.validatePhoneNumber(bookingData.routes[0].destinationContactPhone)) {
        throw new Error('Nomor telepon penerima tidak valid');
      }

      const payload = {
        paymentType: 3, // corporate - COD tidak supported
        shipment_method: bookingData.shipment_method || 'Instant',
        routes: [{
          originName: bookingData.routes[0].originName,
          originNote: bookingData.routes[0].originNote,
          originContactName: bookingData.routes[0].originContactName,
          originContactPhone: bookingData.routes[0].originContactPhone,
          originLatLong: bookingData.routes[0].originLatLong,
          originAddress: bookingData.routes[0].originAddress,
          destinationName: bookingData.routes[0].destinationName,
          destinationNote: bookingData.routes[0].destinationNote,
          destinationContactName: bookingData.routes[0].destinationContactName,
          destinationContactPhone: bookingData.routes[0].destinationContactPhone,
          destinationLatLong: bookingData.routes[0].destinationLatLong,
          destinationAddress: bookingData.routes[0].destinationAddress,
          item: bookingData.routes[0].item, // Gunakan internal order ID (masking)
          storeOrderId: bookingData.storeOrderId,
          insuranceDetails: bookingData.insuranceDetails || {
            applied: "false",
            fee: "0",
            product_description: bookingData.routes[0].item,
            product_price: "0"
          }
        }]
      };

      const response = await axios.post(url, payload, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('GoSend create booking error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get order status
  async getOrderStatus(orderNo) {
    try {
      const url = `${this.getBaseURL()}/gokilat/v10/booking/orderno/${orderNo}`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('GoSend get order status error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(orderNo) {
    try {
      const url = `${this.getBaseURL()}/gokilat/v10/booking/cancel`;
      
      const payload = {
        orderNo: orderNo
      };

      const response = await axios.put(url, payload, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('GoSend cancel booking error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new GoSendService();
