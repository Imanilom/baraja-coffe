import AppConfig from '../models/AppConfig.model.js';

/**
 * Get all app configuration settings
 * GET /api/app-config
 */
export const getAppConfig = async (req, res) => {
    try {
        const configs = await AppConfig.getAllConfigs();

        // Set defaults if not found in database
        const result = {
            useDiscountPrice: configs.useDiscountPrice ?? true,
            // Add more config keys here as needed
            ...configs
        };

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting app config:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get app configuration',
            error: error.message
        });
    }
};

/**
 * Update a specific config setting
 * PUT /api/app-config/:key
 */
export const updateAppConfig = async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Value is required'
            });
        }

        const config = await AppConfig.setConfig(
            key,
            value,
            description || '',
            req.user?.username || 'admin'
        );

        return res.status(200).json({
            success: true,
            message: `Config '${key}' updated successfully`,
            data: config
        });
    } catch (error) {
        console.error('Error updating app config:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update app configuration',
            error: error.message
        });
    }
};

/**
 * Initialize default configs (run once on setup)
 * POST /api/app-config/init
 */
export const initializeDefaultConfigs = async (req, res) => {
    try {
        const defaults = [
            {
                key: 'useDiscountPrice',
                value: true,
                description: 'Toggle untuk mengaktifkan/menonaktifkan harga diskon. true = pakai harga diskon, false = pakai harga asli'
            }
        ];

        for (const config of defaults) {
            const existing = await AppConfig.findOne({ key: config.key });
            if (!existing) {
                await AppConfig.setConfig(config.key, config.value, config.description, 'system');
                console.log(`✅ Created config: ${config.key} = ${config.value}`);
            }
        }

        const allConfigs = await AppConfig.getAllConfigs();

        return res.status(200).json({
            success: true,
            message: 'Default configs initialized',
            data: allConfigs
        });
    } catch (error) {
        console.error('Error initializing configs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to initialize configs',
            error: error.message
        });
    }
};
