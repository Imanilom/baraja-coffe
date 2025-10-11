module.exports = {
    apps: [
        {
            name: "barajahub",
            script: "api/index.js",
            instances: "max",     // otomatis semua core
            exec_mode: "cluster", // cluster mode
            watch: false,
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
