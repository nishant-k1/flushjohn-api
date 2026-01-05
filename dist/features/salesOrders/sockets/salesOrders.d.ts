/**
 * Sales Orders Socket Handler
 * Handles real-time updates for sales orders and payments
 */
export declare function salesOrderSocketHandler(_namespace: any, socket: any): void;
/**
 * Emit payment created event to all clients watching a specific sales order
 * @param {Object} payment - The payment document
 */
export declare function emitPaymentCreated(salesOrderId: any, payment: any): void;
/**
 * Emit payment updated event (status changes, refunds, etc.)
 * @param {Object} payment - The updated payment document
 */
export declare function emitPaymentUpdated(salesOrderId: any, payment: any): void;
/**
 * Emit sales order updated event (totals, status, etc.)
 * @param {Object} salesOrder - The updated sales order document
 */
export declare function emitSalesOrderUpdated(salesOrderId: any, salesOrder: any): void;
//# sourceMappingURL=salesOrders.d.ts.map