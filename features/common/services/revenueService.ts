/**
 * Revenue Calculation Service
 * Calculates total revenue based on sales orders, job orders, and expenses
 */

import * as salesOrdersService from "../../salesOrders/services/salesOrdersService.js";
import * as jobOrdersService from "../../jobOrders/services/jobOrdersService.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";
import {
  add,
  calculatePercentage,
  calculateOrderRevenue,
} from "../../../utils/priceCalculations.js";

/**
 * Calculate revenue for a given date range
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @param {number} vendorTransactionCharges - Vendor transaction charges (percentage or dollar amount)
 * @param {string} vendorTransactionChargesMode - "percentage" or "dollar"
 * @param {number} googleAdsSpending - Google Ads spending
 * @param {number} facebookAdsSpending - Facebook Ads spending
 * @param {number} instagramAdsSpending - Instagram Ads spending
 * @param {number} linkedInAdsSpending - LinkedIn Ads spending
 * @param {number} othersExpenses - Other custom expenses
 * @returns {Promise<Object>} Revenue calculation result
 */
export const calculateRevenue = async ({
  startDate,
  endDate,
  vendorTransactionCharges = 0,
  vendorTransactionChargesMode = "percentage",
  googleAdsSpending = 0,
  facebookAdsSpending = 0,
  instagramAdsSpending = 0,
  linkedInAdsSpending = 0,
  othersExpenses = 0,
}) => {
  try {
    // Format dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Fetch all PAID sales orders in the date range (only calculate revenue for paid orders)
    let allSalesOrders = [];
    let salesPage = 1;
    let hasMoreSales = true;

    while (hasMoreSales) {
      const salesResult = await salesOrdersService.getAllSalesOrders({
        page: salesPage,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "asc",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (salesResult.data && salesResult.data.length > 0) {
        // Filter to only include sales orders with paymentStatus === "Paid"
        const paidSalesOrders = salesResult.data.filter(
          (order) => order.paymentStatus === "Paid"
        );
        allSalesOrders = [...allSalesOrders, ...paidSalesOrders];
        const totalPages = salesResult.pagination?.totalPages || 1;
        hasMoreSales = salesPage < totalPages;
        salesPage++;
      } else {
        hasMoreSales = false;
      }
    }

    // Fetch all job orders with emailStatus === "Sent" in the date range
    let allJobOrders = [];
    let jobPage = 1;
    let hasMoreJobs = true;

    while (hasMoreJobs) {
      const jobResult = await jobOrdersService.getAllJobOrders({
        page: jobPage,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "asc",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (jobResult.data && jobResult.data.length > 0) {
        // Filter to only include job orders with emailStatus === "Sent"
        const sentJobOrders = jobResult.data.filter(
          (order) => order.emailStatus === "Sent"
        );
        allJobOrders = [...allJobOrders, ...sentJobOrders];
        const totalPages = jobResult.pagination?.totalPages || 1;
        hasMoreJobs = jobPage < totalPages;
        jobPage++;
      } else {
        hasMoreJobs = false;
      }
    }

    // Create a map of job orders by sales order ID (only includes job orders with emailStatus === "Sent")
    const jobOrdersBySalesOrder = {};
    allJobOrders.forEach((jobOrder) => {
      if (jobOrder.salesOrder) {
        const salesOrderId =
          typeof jobOrder.salesOrder === "string"
            ? jobOrder.salesOrder
            : jobOrder.salesOrder._id || jobOrder.salesOrder;
        if (!jobOrdersBySalesOrder[salesOrderId]) {
          jobOrdersBySalesOrder[salesOrderId] = [];
        }
        jobOrdersBySalesOrder[salesOrderId].push(jobOrder);
      }
    });

    // Calculate revenue only for sales orders that:
    // 1. Have paymentStatus === "Paid" (already filtered above)
    // 2. Have at least one associated job order with emailStatus === "Sent"
    let totalRevenue = 0;
    const salesOrderRevenues = [];

    allSalesOrders.forEach((salesOrder) => {
      const salesOrderId =
        typeof salesOrder._id === "string"
          ? salesOrder._id
          : salesOrder._id.toString();

      // Find associated job orders (only those with emailStatus === "Sent" are in the map)
      const associatedJobOrders = jobOrdersBySalesOrder[salesOrderId] || [];

      // Skip this sales order if it doesn't have any job orders with emailStatus === "Sent"
      if (associatedJobOrders.length === 0) {
        return;
      }

      // Validate salesOrder.orderTotal before calculation
      if (salesOrder.orderTotal == null) {
        console.error(
          `Sales Order ${salesOrder._id} has null/undefined orderTotal. Skipping revenue calculation.`
        );
        return; // Skip this sales order if orderTotal is missing
      }
      const salesOrderAmount = salesOrder.orderTotal;
      let totalJobOrderAmount = 0;

      associatedJobOrders.forEach((jobOrder) => {
        // Calculate job order total from billing cycles
        let jobOrderTotal = 0;
        if (jobOrder.billingCycles && jobOrder.billingCycles.length > 0) {
          jobOrder.billingCycles.forEach((cycle) => {
            if (cycle.units && cycle.units.length > 0) {
              cycle.units.forEach((unit) => {
                // Validate unit data before calculation
                if (unit.quantity == null || unit.rate == null) {
                  console.error(
                    `Job Order ${jobOrder._id} has unit with missing quantity or rate. Skipping unit.`,
                    unit
                  );
                  return; // Skip this unit if data is missing
                }
                // Use utility function for consistent calculation
                const unitAmount = parseFloat(
                  calculateProductAmount(unit.quantity, unit.rate)
                );
                jobOrderTotal = add(jobOrderTotal, unitAmount);
              });
            }
          });
        }
        totalJobOrderAmount = add(totalJobOrderAmount, jobOrderTotal);
      });

      // Calculate vendor transaction charges
      // Use nullish coalescing to preserve 0 values
      const vendorChargesValue = vendorTransactionCharges ?? 0;
      let vendorCharges = 0;
      if (vendorTransactionChargesMode === "percentage") {
        vendorCharges = calculatePercentage(
          salesOrderAmount,
          vendorChargesValue
        );
      } else {
        vendorCharges = parseFloat(String(vendorChargesValue));
      }

      // Revenue for this sales order = Sales Order Amount - Job Order Amount + Vendor Transaction Charges
      const orderRevenue = calculateOrderRevenue(
        salesOrderAmount,
        totalJobOrderAmount,
        vendorCharges
      );

      totalRevenue = add(totalRevenue, orderRevenue);

      salesOrderRevenues.push({
        salesOrderNo: salesOrder.salesOrderNo,
        salesOrderAmount,
        jobOrderAmount: totalJobOrderAmount,
        vendorCharges,
        revenue: orderRevenue,
      });
    });

    // Add ads spending
    const adsTotal = add(
      add(
        add(
          add(
            parseFloat(String(googleAdsSpending || 0)),
            parseFloat(String(facebookAdsSpending || 0))
          ),
          parseFloat(String(instagramAdsSpending || 0))
        ),
        parseFloat(String(linkedInAdsSpending || 0))
      ),
      parseFloat(String(othersExpenses || 0))
    );

    totalRevenue = add(totalRevenue, adsTotal);

    return {
      totalRevenue,
      salesOrderCount: salesOrderRevenues.length, // Only count sales orders that met all criteria (Paid + has job order with email sent)
      jobOrderCount: allJobOrders.length, // Count of job orders with emailStatus === "Sent"
      salesOrderRevenues,
      adsTotal,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  } catch (error) {
    throw new Error(`Failed to calculate revenue: ${error.message}`);
  }
};
