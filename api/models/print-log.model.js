// models/print-log.model.js - FIXED VERSION
import mongoose from 'mongoose';

const printLogSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        index: true
    },
    item_id: {
        type: String,
        required: true
    },
    item_name: {
        type: String,
        required: true
    },
    item_quantity: {
        type: Number,
        required: true,
        min: 1
    },
    workstation: {
        type: String,
        required: true,
        enum: ['kitchen', 'bar_depan', 'bar_belakang', 'bar', 'beverage', 'unknown'],
        index: true
    },
    print_status: {
        type: String,
        required: true,
        enum: ['pending', 'printing', 'success', 'failed', 'skipped', 'printed_with_issues', 'forced_print'],
        default: 'pending'
    },
    printer_type: {
        type: String,
        enum: ['wifi', 'bluetooth', 'usb', null],
        default: null
    },
    printer_info: {
        type: String
    },
    print_attempts: {
        type: Number,
        default: 1,
        min: 0
    },
    print_duration: {
        type: Number, // in milliseconds
        default: 0
    },
    printed_at: {
        type: Date
    },

    // Stock Information
    stock_available: {
        type: Boolean,
        default: true
    },
    stock_quantity: {
        type: Number,
        default: 0
    },
    stock_status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock', 'unknown', 'critical_stock', 'no_check'],
        default: 'unknown'
    },
    requires_preparation: {
        type: Boolean,
        default: true
    },
    menu_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    },
    calculated_stock: {
        type: Number,
        default: 0
    },
    manual_stock: {
        type: Number,
        default: null
    },
    effective_stock: {
        type: Number,
        default: 0
    },

    // Failure Information - FIXED
    failure_reason: {
        type: String,
        enum: [
            'printer_not_configured',
            'printer_offline',
            'connection_timeout',
            'paper_out',
            'low_ink',
            'unknown_error',
            'stock_unavailable',
            'workstation_mismatch',
            'technical_issue',
            'manual_print_failed',
            'auto_print_failed',
            'retrying',
            'problematic_item',
            'too_many_failures',
            'no_recipe',
            'forced_print_success',
            null
        ],
        default: null
    },
    failure_details: {
        type: String,
        default: ''
    },
    technical_details: {
        type: mongoose.Schema.Types.Mixed // Changed to Mixed for flexibility
    },

    // Problematic Tracking
    warning_notes: {
        type: String
    },
    issues: [{
        type: String
    }],
    problematic_details: {
        type: mongoose.Schema.Types.Mixed // Changed to Mixed
    },
    is_problematic: {
        type: Boolean,
        default: false
    },

    // Additional Context
    menu_workstation: {
        type: String
    },
    is_auto_print: {
        type: Boolean,
        default: false
    },
    is_forced_print: {
        type: Boolean,
        default: false
    },

    // Technical Information
    consecutive_failures: {
        type: Number,
        default: 0
    },
    printer_health: {
        type: String,
        enum: ['healthy', 'warning', 'offline', 'unknown', 'not_configured'], // FIXED: lowercase
        default: 'unknown'
    }

}, {
    timestamps: true
});

// Indexes for better performance
printLogSchema.index({ order_id: 1, item_id: 1 });
printLogSchema.index({ createdAt: -1 });
printLogSchema.index({ print_status: 1 });
printLogSchema.index({ is_problematic: 1 });
printLogSchema.index({ stock_status: 1 });
printLogSchema.index({ workstation: 1 });

// Method to mark as successful with issues
printLogSchema.methods.markAsSuccessfulWithIssues = function (duration, issues) {
    this.print_status = 'printed_with_issues';
    this.print_duration = duration;
    this.printed_at = new Date();
    this.failure_reason = null;
    this.failure_details = '';
    this.is_problematic = true;
    this.issues = issues;
    return this.save();
};

// Method to mark as forced print success
printLogSchema.methods.markAsForcedPrintSuccess = function (duration, issues) {
    this.print_status = 'forced_print';
    this.print_duration = duration;
    this.printed_at = new Date();
    this.failure_reason = 'forced_print_success';
    this.is_forced_print = true;
    this.is_problematic = true;
    this.issues = issues;
    return this.save();
};

// Method to mark as successful
printLogSchema.methods.markAsSuccessful = function (duration) {
    this.print_status = 'success';
    this.print_duration = duration;
    this.printed_at = new Date();
    this.failure_reason = null;
    this.failure_details = '';
    this.is_problematic = false;
    return this.save();
};

// Method to mark as failed
printLogSchema.methods.markAsFailed = function (reason, details = '') {
    this.print_status = 'failed';
    this.failure_reason = reason;
    this.failure_details = details;
    this.print_attempts += 1;
    return this.save();
};

// Static method untuk mendapatkan report problematic items
printLogSchema.statics.getProblematicReport = async function (hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime },
                $or: [
                    { is_problematic: true },
                    { print_status: 'printed_with_issues' },
                    { print_status: 'forced_print' }
                ]
            }
        },
        {
            $group: {
                _id: {
                    workstation: '$workstation',
                    failure_reason: '$failure_reason',
                    stock_status: '$stock_status'
                },
                count: { $sum: 1 },
                items: {
                    $push: {
                        item_name: '$item_name',
                        order_id: '$order_id',
                        stock_quantity: '$stock_quantity',
                        issues: '$issues',
                        warning_notes: '$warning_notes',
                        print_status: '$print_status'
                    }
                }
            }
        }
    ]);
};

// Export model
export const PrintLog = mongoose.model('PrintLog', printLogSchema);