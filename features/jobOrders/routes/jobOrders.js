/**
 * Job Orders Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as jobOrdersService from "../services/jobOrdersService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";

const router = Router();

router.post("/", validateAndRecalculateProducts, async function (req, res) {
  try {
    const jobOrder = await jobOrdersService.createJobOrder(req.body);
    res.status(201).json({ success: true, data: jobOrder });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.name === "DuplicateError") {
      return res.status(409).json({
        success: false,
        error: error.message,
        message: "A job order already exists for this sales order",
        data: {
          existingJobOrderId: error.existingJobOrderId,
          jobOrderNo: error.jobOrderNo,
        },
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/", async function (req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      searchQuery = "",
    } = req.query;

    const result = await jobOrdersService.getAllJobOrders({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      search: search || searchQuery,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!jobOrdersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const jobOrder = await jobOrdersService.getJobOrderById(id);
    res.status(200).json({ success: true, data: jobOrder });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "JOB_ORDER_NOT_FOUND",
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", validateAndRecalculateProducts, async function (req, res) {
  try {
    const { id } = req.params;

    if (!jobOrdersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required for update",
        error: "EMPTY_REQUEST_BODY",
      });
    }

    const jobOrder = await jobOrdersService.updateJobOrder(id, req.body);
    res.status(200).json({ success: true, data: jobOrder });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "JOB_ORDER_NOT_FOUND",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update job order",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.delete("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!jobOrdersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const result = await jobOrdersService.deleteJobOrder(id);
    res.status(200).json({
      success: true,
      message: "Job order deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "JOB_ORDER_NOT_FOUND",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete job order",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.post(
  "/:id/pdf",
  validateAndRecalculateProducts,
  async function (req, res) {
    try {
      const { id } = req.params;

      if (!jobOrdersService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid job order ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      const jobOrder = await jobOrdersService.getJobOrderById(id);

      const pdfData = {
        ...req.body,
        _id: id,
        jobOrderNo: req.body.jobOrderNo || jobOrder.jobOrderNo,
        createdAt: req.body.createdAt || jobOrder.createdAt,
      };

      const { generateJobOrderPDF } = await import(
        "../../fileManagement/services/pdfService.js"
      );
      const pdfUrls = await generateJobOrderPDF(pdfData, id);

      res.status(201).json({
        success: true,
        message: "Job Order PDF generated and uploaded to S3",
        data: {
          _id: id,
          pdfUrl: pdfUrls.pdfUrl,
        },
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: "JOB_ORDER_NOT_FOUND",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

router.post(
  "/:id/email",
  validateAndRecalculateProducts,
  async function (req, res) {
    try {
      const { id } = req.params;

      if (!jobOrdersService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid job order ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      const jobOrder = await jobOrdersService.getJobOrderById(id);

      if (!req.body.vendor || !req.body.vendor._id) {
        return res.status(400).json({
          success: false,
          message: "Vendor must be selected before sending job order email",
          error: "NO_VENDOR_SELECTED",
        });
      }

      const { getVendorById } = await import(
        "../../vendors/services/vendorsService.js"
      );
      const vendor = await getVendorById(req.body.vendor._id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Selected vendor not found",
          error: "VENDOR_NOT_FOUND",
        });
      }

      if (!vendor.email) {
        return res.status(400).json({
          success: false,
          message: "Selected vendor does not have an email address",
          error: "VENDOR_NO_EMAIL",
        });
      }

      let primaryEmail, ccEmail, recipientName;

      if (req.body.vendor.selectedRepresentative) {
        const selectedRep = req.body.vendor.selectedRepresentative;

        if (selectedRep.type === "representative") {
          primaryEmail = selectedRep.email;
          ccEmail = vendor.email;
          recipientName = selectedRep.name;
        } else {
          primaryEmail = vendor.email;
          ccEmail = null;
          recipientName = vendor.name;
        }
      } else {
        primaryEmail = vendor.email;
        ccEmail = null;
        recipientName = vendor.name;
      }

      const emailData = {
        ...req.body,
        _id: id,
        jobOrderNo: req.body.jobOrderNo || jobOrder.jobOrderNo,
        createdAt: req.body.createdAt || jobOrder.createdAt,
        vendorName: recipientName, // Use representative name with vendor name fallback
        email: primaryEmail, // Use determined primary email
        ccEmail: ccEmail, // Add CC email if different
      };


      const { generateJobOrderPDF } = await import(
        "../../fileManagement/services/pdfService.js"
      );
      const { sendJobOrderEmail } = await import(
        "../../common/services/emailService.js"
      );

      let pdfUrls;
      try {
        pdfUrls = await generateJobOrderPDF(emailData, id);
        await sendJobOrderEmail(emailData, id, pdfUrls.pdfUrl);
      } catch (pdfError) {
        throw pdfError;
      }

      const updatedJobOrder = await jobOrdersService.updateJobOrder(id, {
        ...emailData,
        emailStatus: "Sent",
        vendorAcceptanceStatus: "Accepted",
      });

      // Link job order to customer
      await jobOrdersService.linkJobOrderToCustomer(updatedJobOrder);

      res.status(200).json({
        success: true,
        message: "Job Order email sent successfully",
        data: {
          _id: updatedJobOrder._id,
          jobOrderNo: updatedJobOrder.jobOrderNo,
          emailStatus: updatedJobOrder.emailStatus,
          vendorAcceptanceStatus: updatedJobOrder.vendorAcceptanceStatus,
          pdfUrl: pdfUrls.pdfUrl,
        },
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: "JOB_ORDER_NOT_FOUND",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

export default router;
