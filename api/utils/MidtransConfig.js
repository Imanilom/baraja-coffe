import midtransClient from "midtrans-client";


// Create Core API instance
export const coreApi = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: "SB-Mid-server-feojCL4vU6oiXKLmiNhd-HIf",
    clientKey: "SB-Mid-client-_BGtHF124nlTul36"
});


// Create Snap API instance
export const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

