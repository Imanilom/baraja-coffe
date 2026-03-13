import { param, query, validationResult } from 'express-validator';
import moment from 'moment';

// Validation middleware
export const validateSalesReportQuery = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('startDate must be a valid date in ISO 8601 format'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('endDate must be a valid date in ISO 8601 format')
        .custom((endDate, { req }) => {
            if (req.query.startDate && endDate) {
                const start = moment(req.query.startDate);
                const end = moment(endDate);
                if (end.isBefore(start)) {
                    throw new Error('endDate must be after startDate');
                }
            }
            return true;
        }),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit must be between 1 and 100'),
    query('cashierId')
        .optional()
        .isMongoId()
        .withMessage('cashierId must be a valid MongoDB ObjectId'),
    query('outletId')
        .optional()
        .isMongoId()
        .withMessage('outlet must be a valid MongoDB ObjectId'),
    query('paymentMethod')
        .optional()
        .isIn(['Cash', 'Card', 'E-Wallet', 'Debit', 'Bank Transfer', 'No Payment'])
        .withMessage('Invalid payment method'),
    query('orderType')
        .optional()
        .isIn(['Dine-In', 'Pickup', 'Delivery', 'Take Away', 'Reservation', 'Event'])
        .withMessage('Invalid order type'),
    query('status')
        .optional()
        .custom((value) => {
            const validStatuses = ['Pending', 'Waiting', 'Reserved', 'OnProcess', 'Completed', 'Canceled'];
            const statuses = value.split(',');
            return statuses.every(status => validStatuses.includes(status.trim()));
        })
        .withMessage('Invalid status values'),
    query('groupBy')
        .optional()
        .isIn(['day', 'week', 'month'])
        .withMessage('groupBy must be day, week, or month'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        next();
    }
];