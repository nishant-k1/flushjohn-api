/**
 * Sales Orders Socket Handler
 * Handles real-time updates for sales orders and payments
 */

export function salesOrderSocketHandler(_namespace, socket) {
  // Join a room for a specific sales order
  socket.on("join-sales-order", (salesOrderId) => {
    if (!salesOrderId) {
      return;
    }

    const room = `sales-order-${salesOrderId}`;
    socket.join(room);

    // Acknowledge successful join
    socket.emit("joined-sales-order", { salesOrderId, room });
  });

  // Leave a sales order room
  socket.on("leave-sales-order", (salesOrderId) => {
    if (!salesOrderId) {
      return;
    }

    const room = `sales-order-${salesOrderId}`;
    socket.leave(room);

    // Acknowledge successful leave
    socket.emit("left-sales-order", { salesOrderId, room });
  });

  socket.on("disconnect", () => {
    // Socket disconnected
  });
}

/**
 * Emit payment created event to all clients watching a specific sales order
 * @param {Object} payment - The payment document
 */
export function emitPaymentCreated(salesOrderId, payment) {
  if (!global.salesOrdersNamespace) {
    return;
  }

  const room = `sales-order-${salesOrderId}`;

  // Convert Mongoose document to plain object if needed
  const paymentObj = payment?.toObject ? payment.toObject() : payment;

  global.salesOrdersNamespace.to(room).emit("paymentCreated", {
    salesOrderId: salesOrderId.toString(),
    payment: paymentObj,
  });
}

/**
 * Emit payment updated event (status changes, refunds, etc.)
 * @param {Object} payment - The updated payment document
 */
export function emitPaymentUpdated(salesOrderId, payment) {
  if (!global.salesOrdersNamespace) {
    return;
  }

  const room = `sales-order-${salesOrderId}`;

  // Convert Mongoose document to plain object if needed
  const paymentObj = payment?.toObject ? payment.toObject() : payment;

  global.salesOrdersNamespace.to(room).emit("paymentUpdated", {
    salesOrderId: salesOrderId.toString(),
    payment: paymentObj,
  });
}

/**
 * Emit sales order updated event (totals, status, etc.)
 * @param {Object} salesOrder - The updated sales order document
 */
export function emitSalesOrderUpdated(salesOrderId, salesOrder) {
  if (!global.salesOrdersNamespace) {
    return;
  }

  const room = `sales-order-${salesOrderId}`;

  // Convert Mongoose document to plain object if needed
  const salesOrderObj = salesOrder?.toObject
    ? salesOrder.toObject()
    : salesOrder;

  global.salesOrdersNamespace.to(room).emit("salesOrderUpdated", {
    salesOrderId: salesOrderId.toString(),
    salesOrder: salesOrderObj,
  });
}
