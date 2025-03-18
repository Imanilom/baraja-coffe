import midtransClient from "midtrans-client";


// Create Core API instance
export const coreApi = new midtransClient.CoreApi({
        isProduction : false,
        serverKey : process.env.MIDTRANS_SERVER_KEY,
        clientKey : process.env.MIDTRANS_CLIENT_KEY
    });

// Create Snap API instance
export const snap = new midtransClient.Snap({
        isProduction : false,
        serverKey : process.env.MIDTRANS_SERVER_KEY,
        clientKey : process.env.MIDTRANS_CLIENT_KEY
    });

