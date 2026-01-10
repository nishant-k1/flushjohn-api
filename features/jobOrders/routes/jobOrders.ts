/**
 * Job Orders Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as jobOrdersService from "../services/jobOrdersService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";

const router: any = Router();

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
      startDate = null,
      endDate = null,
      page: _page,
      limit: _limit,
      sortBy: _sortBy,
      sortOrder: _sortOrder,
      search: _search,
      searchQuery: _searchQuery,
      startDate: _startDate,
      endDate: _endDate,
      ...columnFilters
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number",
        error: "INVALID_PAGE_NUMBER",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit. Must be between 1 and 100",
        error: "INVALID_LIMIT",
      });
    }

    const result = await jobOrdersService.getAllJobOrders({
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder,
      search: search || searchQuery,
      startDate: startDate || null,
      endDate: endDate || null,
      ...columnFilters,
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

router.patch("/:id", validateAndRecalculateProducts, async function (req, res) {
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
        details: error.errors
          ? Object.values(error.errors).map((err: any) => err.message)
          : [(error as any).message],
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

      // Use ONLY database data for PDF generation (industry standard)
      const jobOrderObj = jobOrder.toObject ? jobOrder.toObject() : jobOrder;

      // Flatten lead fields for PDF template (template expects fName, lName, email at top level)
      // Note: Contact fields (fName, lName, etc.) ONLY exist in lead object, not on job order
      const leadData = jobOrderObj.lead || {};

      const pdfData = {
        ...jobOrderObj, // Use ONLY database data
        // Flatten lead fields to top level for PDF template (NO fallbacks - use database data only)
        fName: leadData.fName,
        lName: leadData.lName,
        cName: leadData.cName,
        email: leadData.email,
        phone: leadData.phone,
        fax: leadData.fax,
        streetAddress: leadData.streetAddress,
        city: leadData.city,
        state: leadData.state,
        zip: leadData.zip,
        country: leadData.country,
        usageType: leadData.usageType,
        _id: id,
        // Keep lead object for backward compatibility
        lead: jobOrderObj.lead,
      };

      const { generateJobOrderPDF } =
        await import("../../fileManagement/services/pdfService.js");
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

      // Use ONLY database data for email generation (industry standard)
      const jobOrderObj = jobOrder.toObject ? jobOrder.toObject() : jobOrder;

      // Use ONLY database data - vendor must be saved in job order before sending email
      // Representative selection (selectedRepresentative) comes from request body as it's a runtime action
      if (!jobOrderObj.vendor || !jobOrderObj.vendor._id) {
        return res.status(400).json({
          success: false,
          message: "Vendor must be selected and saved in job order before sending email",
          error: "NO_VENDOR_IN_JOB_ORDER",
        });
      }

      const vendorId = jobOrderObj.vendor._id;

      const { getVendorById } =
        await import("../../vendors/services/vendorsService.js");
      const vendor = await getVendorById(vendorId);

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

      // Only selectedRepresentative comes from request body (runtime action)
      // Vendor data comes from database jobOrderObj.vendor
      if (req.body.vendor?.selectedRepresentative) {
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

      // Flatten lead fields for email template (template expects fName, lName, email at top level)
      // Note: Contact fields (fName, lName, etc.) ONLY exist in lead object, not on job order
      const leadData = jobOrderObj.lead || {};

      const emailData = {
        ...jobOrderObj, // Use ONLY database data
        // Flatten lead fields to top level for email template (NO fallbacks - use database data only)
        fName: leadData.fName,
        lName: leadData.lName,
        cName: leadData.cName,
        email: primaryEmail, // Use vendor email for job order email (overrides lead email - this is intentional for routing)
        phone: leadData.phone,
        fax: leadData.fax,
        streetAddress: leadData.streetAddress,
        city: leadData.city,
        state: leadData.state,
        zip: leadData.zip,
        country: leadData.country,
        usageType: leadData.usageType,
        _id: id,
        vendorName: recipientName, // Use representative name with vendor name fallback
        ccEmail: ccEmail, // Add CC email if different
        // Keep lead object for backward compatibility
        lead: jobOrderObj.lead,
      };

      const { generateJobOrderPDF } =
        await import("../../fileManagement/services/pdfService.js");
      const { sendJobOrderEmail } =
        await import("../../common/services/emailService.js");

      let pdfUrls;
      const totalStartTime = Date.now();
      try {
        const pdfStartTime = Date.now();
        pdfUrls = await generateJobOrderPDF(emailData, id);
        const pdfTime = Date.now() - pdfStartTime;
        console.log(`⏱️ [JobOrder ${id}] PDF generation: ${pdfTime}ms`);

        // OPTIMIZATION: Pass PDF buffer directly to avoid re-downloading from S3
        const emailStartTime = Date.now();
        await sendJobOrderEmail(
          emailData,
          id,
          pdfUrls.pdfUrl,
          pdfUrls.pdfBuffer
        );
        const emailTime = Date.now() - emailStartTime;
        console.log(`⏱️ [JobOrder ${id}] Email sending: ${emailTime}ms`);
      } catch (pdfError) {
        throw pdfError;
      }

      // CRITICAL FIX: Improved background database update with retry logic
      // Update database in background (non-blocking) - respond immediately
      // This allows the API to return faster while DB update happens asynchronously
      // Note: Update emailStatus, vendorAcceptanceStatus, and vendorHistory using database data
      const dbUpdateStartTime = Date.now();
      const updateWithRetry = async (retries = 3): Promise<void> => {
        try {
          // Get existing vendorHistory from database to update it
          const existingVendorHistory = (jobOrderObj.vendorHistory || []) as any[];
          const vendorHistoryEntry = {
            vendorId: vendorId.toString(),
            vendorName: vendor.name,
            emailStatus: "Sent",
            acceptanceStatus: "Accepted",
          };

          // Check if vendor already exists in history
          const existingVendorIndex = existingVendorHistory.findIndex(
            (v: any) => v.vendorId === vendorId.toString()
          );

          let updatedVendorHistory;
          if (existingVendorIndex >= 0) {
            // Update existing entry
            updatedVendorHistory = [...existingVendorHistory];
            updatedVendorHistory[existingVendorIndex] = vendorHistoryEntry;
          } else {
            // Add new entry
            updatedVendorHistory = [...existingVendorHistory, vendorHistoryEntry];
          }

          const updatedJobOrder = await jobOrdersService.updateJobOrder(id, {
            emailStatus: "Sent",
            vendorAcceptanceStatus: "Accepted",
            vendorHistory: updatedVendorHistory,
          });
          const dbTime = Date.now() - dbUpdateStartTime;
          console.log(
            `⏱️ [JobOrder ${id}] Database update completed (background): ${dbTime}ms`
          );
          
          // Link job order to existing customer (in background)
          try {
            await jobOrdersService.createOrLinkCustomerFromJobOrder(updatedJobOrder);
          } catch (linkError: any) {
            console.error(
              `⚠️ [JobOrder ${id}] Background customer linking failed (non-critical):`,
              linkError.message || String(linkError)
            );
            // Don't retry customer linking - it's non-critical
          }
        } catch (dbError: any) {
          if (retries > 0 && dbError.name !== "ValidationError" && dbError.name !== "NotFoundError") {
            // Retry transient errors (network, timeout, etc.)
            console.warn(
              `⚠️ [JobOrder ${id}] Database update failed, retrying... (${retries} retries left)`,
              dbError.message || String(dbError)
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
            return updateWithRetry(retries - 1);
          }
          // Log final failure after retries exhausted or non-retryable error
          console.error(
            `❌ [JobOrder ${id}] Background database update failed after retries:`,
            {
              error: dbError.message || String(dbError),
              name: dbError.name,
              stack: dbError.stack,
            }
          );
          // TODO: Consider adding to a failed jobs queue for manual retry
        }
      };
      
      // Start background update (fire and forget with retry)
      updateWithRetry().catch((finalError: any) => {
        console.error(
          `❌ [JobOrder ${id}] Fatal error in background update:`,
          finalError.message || String(finalError)
        );
      });

      const totalTime = Date.now() - totalStartTime;
      console.log(`⏱️ [JobOrder ${id}] Total email flow (response sent): ${totalTime}ms`);

      res.status(200).json({
        success: true,
        message: "Job Order email sent successfully",
        data: {
          _id: id,
          jobOrderNo: emailData.jobOrderNo,
          emailStatus: "Sent",
          vendorAcceptanceStatus: "Accepted",
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
