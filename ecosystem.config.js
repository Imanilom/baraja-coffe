module.exports = {
    apps: [
        {
            name: "barajahub",
            script: "api/index.js",
            instances: "max",
            exec_mode: "cluster"
        }
    ]
};
