const fs = require("fs");
const path = require("path");

// Parse .env manual tanpa dotenv
const envPath = path.join(__dirname, ".env");
const env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8").split("\n").forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    });
}

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
                MONGO_URI: env.MONGO_PROD || env.MONGO_URI || process.env.MONGO_PROD || process.env.MONGO_URI
            }
        }
    ]
};
