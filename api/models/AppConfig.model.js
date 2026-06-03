import mongoose from 'mongoose';

const AppConfigSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    updatedBy: {
        type: String,
        default: 'system'
    }
}, {
    timestamps: true
});

// Static method to get config by key
AppConfigSchema.statics.getConfig = async function (key, defaultValue = null) {
    const config = await this.findOne({ key });
    return config ? config.value : defaultValue;
};

// Static method to set config
AppConfigSchema.statics.setConfig = async function (key, value, description = '', updatedBy = 'system') {
    return await this.findOneAndUpdate(
        { key },
        {
            value,
            description,
            updatedBy,
            updatedAt: new Date()
        },
        { upsert: true, new: true }
    );
};

// Static method to get all configs as object
AppConfigSchema.statics.getAllConfigs = async function () {
    const configs = await this.find({});
    const result = {};
    configs.forEach(c => {
        result[c.key] = c.value;
    });
    return result;
};

const AppConfig = mongoose.model('AppConfig', AppConfigSchema);
export default AppConfig;
