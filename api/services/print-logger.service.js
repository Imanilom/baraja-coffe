// services/print-logger.service.js - Enhanced dengan Problematic Tracking
import { PrintLog } from '../models/print-log.model.js';
import mongoose from 'mongoose';

export class PrintLogger {
    static async logPrintAttempt(orderId, item, workstation, printerConfig, stockInfo = {}) {
        try {
            // FIXED: Gunakan menuItemId untuk mencari stock
            const menuItemId = item.menuItemId || item._id || item.id;
            console.log('🔄 Using menuItemId for stock check:', menuItemId);

            const stockStatus = await this.checkMenuItemStock(menuItemId);

            // Determine print status based on problematic details
            let printStatus = 'pending';
            let failureReason = null;
            let warningNotes = '';
            let isProblematic = false;

            // Check if item is problematic
            if (stockInfo.is_problematic || stockInfo.problematic_details) {
                printStatus = 'printed_with_issues';
                failureReason = 'problematic_item';
                isProblematic = true;
                warningNotes = this.generateProblematicWarning(stockInfo.problematic_details, stockStatus);
            }

            // Jika stock tidak available, mark sebagai problematic - GUNAKAN manualStock
            if (!stockStatus.available || stockStatus.status === 'out_of_stock') {
                printStatus = 'printed_with_issues';
                failureReason = 'stock_unavailable';
                isProblematic = true;
                warningNotes = `STOCK ISSUE`;
            }

            // Format logging yang konsisten
            if (isProblematic) {
                console.log(`⚠️ [PROBLEMATIC PRINT ATTEMPT]
OrderId: ${orderId}
menuItemId: ${menuItemId}
Item: ${item.name}
Workstation: ${workstation}
manualStock: ${stockStatus.manualStock}
effectiveStock: ${stockStatus.effectiveStock}
Stock Status: ${stockStatus.status}
Issues: ${warningNotes}`);
            } else {
                console.log(`🖨️ [PRINT ATTEMPT]
OrderId: ${orderId}
menuItemId: ${menuItemId}
Item: ${item.name}
Workstation: ${workstation}
manualStock: ${stockStatus.manualStock}
effectiveStock: ${stockStatus.effectiveStock}
Stock Status: ${stockStatus.status}`);
            }

            const log = new PrintLog({
                order_id: orderId,
                item_id: menuItemId,
                item_name: item.name,
                item_quantity: item.qty || item.quantity,
                workstation: workstation,
                print_status: printStatus,
                printer_type: printerConfig?.type,
                printer_info: printerConfig?.info,
                print_attempts: 1,

                // Enhanced stock tracking
                stock_available: stockStatus.available,
                stock_quantity: stockStatus.currentStock,
                stock_status: stockStatus.status,
                requires_preparation: stockStatus.requiresPreparation,
                menu_item_id: menuItemId,
                calculated_stock: stockStatus.calculatedStock,
                manual_stock: stockStatus.manualStock,
                effective_stock: stockStatus.effectiveStock,

                // Problematic tracking - FIXED: hanya set jika ada masalah
                failure_reason: failureReason,
                failure_details: isProblematic ? JSON.stringify(stockInfo.problematic_details || {}) : '',
                warning_notes: warningNotes,
                is_problematic: isProblematic,

                // Additional context
                menu_workstation: item.workstation,
                is_auto_print: stockInfo.is_auto_print || false,

                // Technical context
                consecutive_failures: printerConfig?.consecutive_failures || 0,
                printer_health: printerConfig?.health_status || 'unknown'
            });

            const savedLog = await log.save();
            return savedLog._id;
        } catch (error) {
            console.error('❌ Error logging print attempt:', error);

            // Fallback: create minimal log without validation issues
            try {
                const menuItemId = item.menuItemId || item._id || item.id;
                const fallbackLog = new PrintLog({
                    order_id: orderId,
                    item_id: menuItemId,
                    item_name: item.name,
                    item_quantity: item.qty || item.quantity,
                    workstation: workstation,
                    print_status: 'failed',
                    failure_reason: 'unknown_error',
                    failure_details: `Fallback log due to: ${error.message}`,
                    stock_available: false,
                    stock_status: 'unknown'
                });
                await fallbackLog.save();
                return fallbackLog._id;
            } catch (fallbackError) {
                console.error('❌ Even fallback logging failed:', fallbackError);
                return null;
            }
        }
    }

    static async logPrintSuccess(logId, duration, wasProblematic = false) {
        try {
            const log = await PrintLog.findById(logId);
            if (!log) {
                console.error('❌ Print log not found for success:', logId);
                return;
            }

            // Jika sebelumnya problematic, tetap pertahankan statusnya
            if (wasProblematic && log.print_status === 'printed_with_issues') {
                log.print_duration = duration;
                log.printed_at = new Date();
            } else {
                // Untuk non-problematic, set sebagai success normal
                await log.markAsSuccessful(duration);
            }

            await log.save();

            if (wasProblematic) {
                console.log(`✅ [PROBLEMATIC PRINT SUCCESS]
OrderId: ${log.order_id}
Item: ${log.item_name}
Duration: ${duration}ms
Status: DIPROSES DENGAN CATATAN`);
            } else {
                console.log(`✅ [PRINT SUCCESS]
OrderId: ${log.order_id}
Item: ${log.item_name}
Duration: ${duration}ms`);
            }
        } catch (error) {
            console.error('❌ Error logging print success:', error);
        }
    }

    static async logPrintFailure(logId, reason, details = '', technicalDetails = null) {
        try {
            const validReason = this.mapToValidFailureReason(reason);

            const updateData = {
                print_status: 'failed',
                failure_reason: validReason,
                failure_details: details,
                $inc: { print_attempts: 1 }
            };

            // Tambahkan technical details jika ada
            if (technicalDetails) {
                updateData.technical_details = technicalDetails;
                updateData.warning_notes = this.generateTechnicalWarning(technicalDetails);
            }

            await PrintLog.findByIdAndUpdate(logId, updateData);

            console.log(`❌ [PRINT FAILURE]
Reason: ${validReason}
Details: ${details}
Technical: ${technicalDetails ? JSON.stringify(technicalDetails) : 'None'}`);
        } catch (error) {
            console.error('❌ Error logging print failure:', error);
            throw error;
        }
    }

    // Helper method untuk mapping reason
    static mapToValidFailureReason(reason) {
        const reasonMap = {
            'manual_print_failed': 'manual_print_failed',
            'manual_print_error': 'unknown_error',
            'print_failed': 'technical_issue',
            'unknown_error': 'unknown_error',
            'retrying': 'retrying',
            'auto_print_failed': 'auto_print_failed',
            'printer_not_configured': 'printer_not_configured',
            'too_many_failures': 'technical_issue',
            'connection_timeout': 'connection_timeout',
            'stock_unavailable': 'stock_unavailable',
            'workstation_mismatch': 'workstation_mismatch'
        };

        return reasonMap[reason] || 'unknown_error';
    }

    // Generate warning notes untuk problematic items
    static generateProblematicWarning(problematicDetails, stockStatus) {
        const warnings = [];

        if (problematicDetails?.issues?.includes('out_of_stock')) {
            warnings.push(`STOCK KOSONG`);
        }

        if (problematicDetails?.issues?.includes('workstation_mismatch')) {
            warnings.push(`WORKSTATION MISMATCH`);
        }

        if (problematicDetails?.issues?.includes('technical_issue')) {
            warnings.push(`MASALAH TEKNIS`);
        }

        // Tambahkan warning untuk low stock - GUNAKAN manualStock untuk pengecekan
        if (stockStatus.status === 'low_stock' || stockStatus.status === 'critical_stock') {
            warnings.push(`STOCK RENDAH`);
        }

        return warnings.join(', ') || 'Item bermasalah tetapi tetap diprint';
    }

    static generateTechnicalWarning(technicalDetails) {
        const warnings = [];

        if (technicalDetails.connectionType === 'wifi') {
            warnings.push(`WIFI ISSUE: IP ${technicalDetails.printerIp}`);
        }

        if (technicalDetails.connectionType === 'bluetooth') {
            warnings.push(`BLUETOOTH ISSUE: ${technicalDetails.deviceName}`);
        }

        if (technicalDetails.consecutiveFailures > 0) {
            warnings.push(`FAILURE COUNT: ${technicalDetails.consecutiveFailures}`);
        }

        return warnings.join(' | ');
    }

    // Enhanced stock check method dengan better error handling - GUNAKAN manualStock
    static async checkMenuItemStock(menuItemId) {
        try {
            const menuStock = await mongoose.model('MenuStock').findOne({
                menuItemId: menuItemId
            });

            if (menuStock) {
                // GUNAKAN manualStock sebagai primary, default ke 0 jika null
                const manualStock = menuStock.manualStock !== null ? menuStock.manualStock : 0;
                const calculatedStock = menuStock.calculatedStock || 0;

                // Effective stock sekarang menggunakan manualStock sebagai prioritas
                const effectiveStock = manualStock !== 0 ? manualStock : calculatedStock;

                const stockStatus = {
                    available: effectiveStock > 0,
                    currentStock: effectiveStock,
                    status: this.getStockStatus(manualStock), // GUNAKAN manualStock untuk status
                    requiresPreparation: true,
                    calculatedStock: calculatedStock,
                    manualStock: manualStock,
                    effectiveStock: effectiveStock,
                    lastUpdated: menuStock.updatedAt,
                    isManual: menuStock.manualStock !== null && menuStock.manualStock !== 0,
                    needsAttention: manualStock <= 5, // GUNAKAN manualStock untuk pengecekan
                    critical: manualStock === 0 // GUNAKAN manualStock untuk pengecekan
                };

                // Log low stock sebagai problematic - GUNAKAN manualStock
                if (manualStock <= 5) {
                    console.log(`⚠️ [PROBLEMATIC PRINT ATTEMPT]
menuItemId: ${menuItemId}
manualStock: ${stockStatus.manualStock}
effectiveStock: ${stockStatus.effectiveStock}
Stock Status: ${stockStatus.status}
Issues: STOCK RENDAH`);
                }

                return stockStatus;
            }

            // Fallback dengan detailed warning
            console.warn(`⚠️ NO STOCK DATA: No stock data found for menu item: ${menuItemId}`);
            return {
                available: true,
                currentStock: 0,
                status: 'unknown',
                requiresPreparation: true,
                calculatedStock: 0,
                manualStock: 0, // Default ke 0 bukan null
                effectiveStock: 0,
                isManual: false,
                needsAttention: true,
                critical: false,
                note: 'NO_STOCK_DATA_FOUND'
            };

        } catch (error) {
            console.error('❌ Error checking menu item stock:', error);
            return {
                available: true,
                currentStock: 0,
                status: 'error',
                requiresPreparation: true,
                calculatedStock: 0,
                manualStock: 0, // Default ke 0 bukan null
                effectiveStock: 0,
                isManual: false,
                needsAttention: true,
                critical: false,
                note: 'STOCK_CHECK_ERROR'
            };
        }
    }

    // Update getStockStatus untuk menggunakan manualStock
    static getStockStatus(stockQuantity) {
        if (stockQuantity === 0) return 'out_of_stock';
        if (stockQuantity <= 2) return 'critical_stock';
        if (stockQuantity <= 5) return 'low_stock';
        if (stockQuantity <= 10) return 'medium_stock';
        return 'in_stock';
    }

    // Enhanced analytics untuk problematic items
    static async getProblematicItemsReport(hours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

            const problematicStats = await PrintLog.aggregate([
                {
                    $match: {
                        createdAt: { $gte: cutoffTime },
                        is_problematic: true
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
                                warning_notes: '$warning_notes'
                            }
                        },
                        avg_stock: { $avg: '$stock_quantity' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        workstation: '$_id.workstation',
                        failure_reason: '$_id.failure_reason',
                        stock_status: '$_id.stock_status',
                        count: 1,
                        items: 1,
                        avg_stock: 1
                    }
                }
            ]);

            return problematicStats;
        } catch (error) {
            console.error('❌ Error getting problematic items report:', error);
            return [];
        }
    }

    // Technical issues report
    static async getTechnicalIssuesReport(hours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

            const technicalStats = await PrintLog.aggregate([
                {
                    $match: {
                        createdAt: { $gte: cutoffTime },
                        $or: [
                            { technical_details: { $exists: true, $ne: null } },
                            { print_status: 'failed' }
                        ]
                    }
                },
                {
                    $group: {
                        _id: {
                            workstation: '$workstation',
                            failure_reason: '$failure_reason',
                            printer_type: '$printer_type'
                        },
                        count: { $sum: 1 },
                        last_occurrence: { $max: '$createdAt' },
                        items_affected: { $addToSet: '$item_name' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        workstation: '$_id.workstation',
                        failure_reason: '$_id.failure_reason',
                        printer_type: '$_id.printer_type',
                        count: 1,
                        last_occurrence: 1,
                        items_affected: 1
                    }
                },
                { $sort: { count: -1 } }
            ]);

            return technicalStats;
        } catch (error) {
            console.error('❌ Error getting technical issues report:', error);
            return [];
        }
    }
}