/**
 * Payments Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as paymentsService from "../services/paymentsService.js";

const router: any = Router();

/**
 * Helper to validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Create payment link for sales order
 * POST /api/payments/sales-orders/:salesOrderId/create-payment-link
 */
router.post(
  "/sales-orders/:salesOrderId/create-payment-link",
  async function (req, res) {
    try {
      const { salesOrderId } = req.params;
      const { returnUrl } = req.body;

      if (!isValidObjectId(salesOrderId)) {
        res.status(400).json({
          success: false,
          message: "Invalid sales order ID format",
          error: "INVALID_ID_FORMAT",
        });
        return;
      }

      const result = await paymentsService.createSalesOrderPaymentLink(
        salesOrderId,
        returnUrl
      );

      res.status(201).json({
        success: true,
        message: "Payment link created successfully",
        data: result,
      });
    } catch (error) {
      if (error.message === "Sales Order not found") {
        res.status(404).json({
          success: false,
          message: error.message,
          error: "SALES_ORDER_NOT_FOUND",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to create payment link",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

/**
 * Save payment method for customer (without charging)
 * POST /api/payments/sales-orders/:salesOrderId/save-payment-method
 */
router.post(
  "/sales-orders/:salesOrderId/save-payment-method",
  async function (req, res) {
    try {
      const { salesOrderId } = req.params;
      const { paymentMethodId, customerId = null } = req.body;

      if (!isValidObjectId(salesOrderId)) {
        res.status(400).json({
          success: false,
          message: "Invalid sales order ID format",
          error: "INVALID_ID_FORMAT",
        });
        return;
      }

      if (!paymentMethodId) {
        res.status(400).json({
          success: false,
          message: "Payment method ID is required",
          error: "PAYMENT_METHOD_REQUIRED",
        });
        return;
      }

      const result = await paymentsService.savePaymentMethod(salesOrderId, {
        paymentMethodId,
        customerId,
      });

      res.status(200).json({
        success: true,
        message: "Payment method saved successfully",
        data: result,
      });
    } catch (error) {
      if (error.message === "Sales Order not found") {
        res.status(404).json({
          success: false,
          message: error.message,
          error: "SALES_ORDER_NOT_FOUND",
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to save payment method",
        error: "SAVE_PAYMENT_METHOD_FAILED",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

/**
 * Charge sales order (save card and charge)
 * POST /api/payments/sales-orders/:salesOrderId/charge
 */
router.post("/sales-orders/:salesOrderId/charge", async function (req, res) {
  try {
    const { salesOrderId } = req.params;
    const { paymentMethodId, saveCard = false, customerId = null } = req.body;

    if (!isValidObjectId(salesOrderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    if (!paymentMethodId) {
      res.status(400).json({
        success: false,
        message: "Payment method ID is required",
        error: "PAYMENT_METHOD_REQUIRED",
      });
      return;
    }

    const result = await paymentsService.chargeSalesOrder(salesOrderId, {
      paymentMethodId,
      saveCard,
      customerId,
    });

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Sales Order not found") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "SALES_ORDER_NOT_FOUND",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment",
      error: "PAYMENT_FAILED",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

/**
 * Get saved payment methods for a customer
 * GET /api/payments/customers/:customerId/payment-methods
 * IMPORTANT: Specific routes must come BEFORE the catch-all /:paymentId route
 */
router.get("/customers/:customerId/payment-methods", async function (req, res) {
  try {
    const { customerId } = req.params;

    if (!customerId || !customerId.startsWith("cus_")) {
      res.status(400).json({
        success: false,
        message: "Invalid Stripe customer ID format",
        error: "INVALID_CUSTOMER_ID_FORMAT",
      });
      return;
    }

    const paymentMethods =
      await paymentsService.getCustomerPaymentMethods(customerId);

    res.status(200).json({
      success: true,
      message: "Payment methods fetched successfully",
      data: paymentMethods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

/**
 * Delete payment method for customer
 * DELETE /api/payments/customers/:customerId/payment-methods/:paymentMethodId
 * IMPORTANT: Specific routes must come BEFORE the catch-all /:paymentId route
 */
router.delete(
  "/customers/:customerId/payment-methods/:paymentMethodId",
  async function (req, res) {
    try {
      const { customerId, paymentMethodId } = req.params;

      if (!customerId || !customerId.startsWith("cus_")) {
        res.status(400).json({
          success: false,
          message: "Invalid Stripe customer ID format",
          error: "INVALID_CUSTOMER_ID_FORMAT",
        });
        return;
      }

      if (!paymentMethodId || !paymentMethodId.startsWith("pm_")) {
        res.status(400).json({
          success: false,
          message: "Invalid payment method ID format",
          error: "INVALID_PAYMENT_METHOD_ID_FORMAT",
        });
        return;
      }

      await paymentsService.deletePaymentMethod(paymentMethodId);

      res.status(200).json({
        success: true,
        message: "Payment method deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete payment method",
        error: "DELETE_PAYMENT_METHOD_FAILED",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

/**
 * Get payments for sales order
 * GET /api/payments/sales-orders/:salesOrderId
 * IMPORTANT: Specific routes must come BEFORE the catch-all /:paymentId route
 */
router.get("/sales-orders/:salesOrderId", async function (req, res) {
  try {
    const { salesOrderId } = req.params;

    if (!isValidObjectId(salesOrderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const payments =
      await paymentsService.getPaymentsBySalesOrder(salesOrderId);

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && {
        details: error.message,
      }),
    });
  }
});

/**
 * Get payment by ID
 * GET /api/payments/:paymentId
 * IMPORTANT: This catch-all route must come LAST, after all specific routes
 */
router.get("/:paymentId", async function (req, res) {
  try {
    const { paymentId } = req.params;

    if (!isValidObjectId(paymentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const payment = await paymentsService.getPaymentById(paymentId);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
        error: "PAYMENT_NOT_FOUND",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

/**
 * Cancel pending payment link
 * POST /api/payments/:paymentId/cancel
 */
router.post("/:paymentId/cancel", async function (req, res) {
  try {
    const { cancelPaymentLink } =
      await import("../services/paymentsService.js");
    const { paymentId } = req.params;

    if (!isValidObjectId(paymentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    await cancelPaymentLink(paymentId);

    res.json({
      success: true,
      message: "Payment link cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling payment link:", error);

    if (error.message === "Payment not found") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "PAYMENT_NOT_FOUND",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel payment link",
      error: "CANCEL_PAYMENT_LINK_FAILED",
    });
  }
});

/**
 * Sync payment link status from Stripe
 * POST /api/payments/:paymentId/sync
 */
router.post("/:paymentId/sync", async function (req, res) {
  try {
    const { paymentId } = req.params;

    if (!isValidObjectId(paymentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const { syncPaymentLinkStatus } =
      await import("../services/paymentsService.js");
    const result = await syncPaymentLinkStatus(paymentId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.message === "Payment not found") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "PAYMENT_NOT_FOUND",
      });
      return;
    }

    if (
      error.message.includes("Only payment link payments") ||
      error.message.includes("Payment link ID not found")
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: "INVALID_PAYMENT_TYPE",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to sync payment status",
      error: "SYNC_FAILED",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

/**
 * Process refund for payment
 * POST /api/payments/:paymentId/refund
 */
router.post("/:paymentId/refund", async function (req, res) {
  try {
    const { paymentId } = req.params;
    const { amount = null, reason = "requested_by_customer" } = req.body;

    if (!isValidObjectId(paymentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const result = await paymentsService.refundPayment(
      paymentId,
      amount,
      reason
    );

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Payment not found") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "PAYMENT_NOT_FOUND",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to process refund",
      error: "REFUND_FAILED",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

/**
 * Send payment receipt email manually
 * POST /api/payments/:paymentId/send-receipt
 */
router.post("/:paymentId/send-receipt", async function (req, res) {
  try {
    const { paymentId } = req.params;

    if (!isValidObjectId(paymentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const result = await paymentsService.sendPaymentReceipt(paymentId);

    res.status(200).json({
      success: true,
      message: "Payment receipt sent successfully",
      data: result,
    });
  } catch (error) {
    if (
      error.message === "Payment not found" ||
      error.message === "Sales order not found"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "NOT_FOUND",
      });
      return;
    }

    if (error.message === "Can only send receipt for successful payments") {
      res.status(400).json({
        success: false,
        message: error.message,
        error: "INVALID_PAYMENT_STATUS",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to send payment receipt",
      error: "SEND_RECEIPT_FAILED",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
