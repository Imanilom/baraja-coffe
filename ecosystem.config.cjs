require("dotenv").config();

module.exports = {
    apps: [
        {
            name: "barajahub",
            script: "api/index.js",
            instances: "1",     // otomatis semua core
            exec_mode: "fork", // cluster mode
            watch: false,
            env: {
                NODE_ENV: "production",
                MONGO_URI: process.env.MONGO_PROD || process.env.MONGO_URI
            }
        }
    ]
};
