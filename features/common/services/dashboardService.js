import * as leadsService from "../../leads/services/leadsService.js";
import * as quotesService from "../../quotes/services/quotesService.js";
import * as salesOrdersService from "../../salesOrders/services/salesOrdersService.js";
import * as jobOrdersService from "../../jobOrders/services/jobOrdersService.js";
import * as customersService from "../../customers/services/customersService.js";

/**
 * Get month index from month name
 */
const getMonthIndex = (month) => {
  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  return months[month.toLowerCase()] || 0;
};

/**
 * Calculate date filter based on date range, month, and year
 */
export const getDateFilter = (dateRange, month = null, year = null) => {
  const now = new Date();
  let startDate, endDate;


  // If month and year are provided, override the date range logic
  if (month && year) {
    const monthIndex = getMonthIndex(month);
    startDate = new Date(year, monthIndex, 1);
    endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);
    return { startDate, endDate };
  }

  // If only year is provided, use the entire year
  if (year && !month) {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
    return { startDate, endDate };
  }

  // If only month is provided, use current year
  if (month && !year) {
    const monthIndex = getMonthIndex(month);
    const currentYear = now.getFullYear();
    startDate = new Date(currentYear, monthIndex, 1);
    endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
    return { startDate, endDate };
  }

  switch (dateRange) {
    case "7days":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3months":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        now.getDate()
      );
      break;
    case "6months":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        now.getDate()
      );
      break;
    case "12months":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 12,
        now.getDate()
      );
      break;
    case "january":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 0, 31, 23, 59, 59);
      break;
    case "february":
      startDate = new Date(now.getFullYear(), 1, 1);
      endDate = new Date(now.getFullYear(), 1, 28, 23, 59, 59); // Simplified, doesn't handle leap years
      break;
    case "march":
      startDate = new Date(now.getFullYear(), 2, 1);
      endDate = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
      break;
    case "april":
      startDate = new Date(now.getFullYear(), 3, 1);
      endDate = new Date(now.getFullYear(), 3, 30, 23, 59, 59);
      break;
    case "may":
      startDate = new Date(now.getFullYear(), 4, 1);
      endDate = new Date(now.getFullYear(), 4, 31, 23, 59, 59);
      break;
    case "june":
      startDate = new Date(now.getFullYear(), 5, 1);
      endDate = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
      break;
    case "july":
      startDate = new Date(now.getFullYear(), 6, 1);
      endDate = new Date(now.getFullYear(), 6, 31, 23, 59, 59);
      break;
    case "august":
      startDate = new Date(now.getFullYear(), 7, 1);
      endDate = new Date(now.getFullYear(), 7, 31, 23, 59, 59);
      break;
    case "september":
      startDate = new Date(now.getFullYear(), 8, 1);
      endDate = new Date(now.getFullYear(), 8, 30, 23, 59, 59);
      break;
    case "october":
      startDate = new Date(now.getFullYear(), 9, 1);
      endDate = new Date(now.getFullYear(), 9, 31, 23, 59, 59);
      break;
    case "november":
      startDate = new Date(now.getFullYear(), 10, 1);
      endDate = new Date(now.getFullYear(), 10, 30, 23, 59, 59);
      break;
    case "december":
      startDate = new Date(now.getFullYear(), 11, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
    default:
      startDate = null; // No filter
      break;
  }

  return { startDate, endDate };
};

/**
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (
  dateRange = "12months",
  month = null,
  year = null
) => {
  try {
    const { startDate, endDate } = getDateFilter(dateRange, month, year);

    // Build date filter object
    let dateFilter = {};
    if (startDate) {
      dateFilter.$gte = startDate;
    }
    if (endDate) {
      dateFilter.$lte = endDate;
    }


    // Get all leads with date filter
    const leadsFilter =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const allLeads = await leadsService.getAllLeads({
      page: 1,
      limit: 1000,
      filter: leadsFilter,
    });

    // Get all quotes with date filter
    const quotesFilter =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const allQuotes = await quotesService.getAllQuotes({
      page: 1,
      limit: 1000,
      filter: quotesFilter,
    });

    // Get all sales orders with date filter
    const salesOrdersFilter =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const allSalesOrders = await salesOrdersService.getAllSalesOrders({
      page: 1,
      limit: 1000,
      filter: salesOrdersFilter,
    });

    // Get all job orders with date filter
    const jobOrdersFilter =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const allJobOrders = await jobOrdersService.getAllJobOrders({
      page: 1,
      limit: 1000,
      filter: jobOrdersFilter,
    });

    // Get all customers with date filter
    const customersFilter =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const allCustomers = await customersService.getAllCustomers({
      page: 1,
      limit: 1000,
      filter: customersFilter,
    });

    // Calculate leads conversion
    const totalLeads = allLeads.data?.length || 0;
    const convertedLeads =
      allLeads.data?.filter((lead) => {
        // Check if lead has both sales order and job order with email status sent successfully
        const hasSalesOrder = allSalesOrders.data?.some(
          (order) =>
            order.leadId === lead._id &&
            order.emailStatus === "sent successfully"
        );
        const hasJobOrder = allJobOrders.data?.some(
          (order) =>
            order.leadId === lead._id &&
            order.emailStatus === "sent successfully"
        );
        return hasSalesOrder && hasJobOrder;
      }).length || 0;

    // Calculate conversion rate
    const conversionRate =
      totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    // Lead sources analysis - only official sources from CRM form
    const officialLeadSources = ["Call Lead", "Web Quick Lead", "Web Lead"];
    const leadSources = {};

    // Initialize all official sources with 0
    officialLeadSources.forEach((source) => {
      leadSources[source] = 0;
    });

    // Count only official sources, map similar ones to official sources
    allLeads.data?.forEach((lead) => {
      const source = lead.leadSource || "Unknown";

      // Map similar sources to official ones
      let mappedSource = source;
      if (source.toLowerCase().includes("call")) {
        mappedSource = "Call Lead";
      } else if (
        source.toLowerCase().includes("web quick") ||
        source.toLowerCase().includes("quick lead")
      ) {
        mappedSource = "Web Quick Lead";
      } else if (
        source.toLowerCase().includes("web") &&
        !source.toLowerCase().includes("quick")
      ) {
        mappedSource = "Web Lead";
      }

      // Only count if it's an official source
      if (officialLeadSources.includes(mappedSource)) {
        leadSources[mappedSource] = (leadSources[mappedSource] || 0) + 1;
      }
    });

    // Usage type analysis - only official usage types from CRM form
    const officialUsageTypes = ["Event", "Construction"];
    const usageTypes = {};

    // Initialize all official usage types with 0
    officialUsageTypes.forEach((type) => {
      usageTypes[type] = 0;
    });

    // Count only official usage types
    allLeads.data?.forEach((lead) => {
      const usageType = lead.usageType || "Unknown";

      // Only count if it's an official usage type
      if (officialUsageTypes.includes(usageType)) {
        usageTypes[usageType] = (usageTypes[usageType] || 0) + 1;
      }
    });

    // Revenue calculation
    const totalRevenue =
      allSalesOrders.data?.reduce((sum, order) => {
        return sum + (order.totalAmount || 0);
      }, 0) || 0;

    // Net Profit calculation (Job Order total - Sales Order total)
    const totalJobOrderAmount =
      allJobOrders.data?.reduce((sum, order) => {
        return sum + (order.totalAmount || 0);
      }, 0) || 0;

    const netProfit = totalJobOrderAmount - totalRevenue;

    // Calculate average revenue per customer
    const avgRevenuePerCustomer =
      convertedLeads > 0 ? (totalRevenue / convertedLeads).toFixed(2) : 0;

    // Monthly trends (based on date range)
    const monthlyTrends = calculateMonthlyTrends(
      allLeads.data,
      allSalesOrders.data,
      allJobOrders.data,
      dateRange
    );

    // Top cities analysis
    const topCities = {};
    allLeads.data?.forEach((lead) => {
      const city = lead.city || "Unknown";
      topCities[city] = (topCities[city] || 0) + 1;
    });

    // Equipment utilization (mock data - you can replace with actual equipment data)
    const equipmentUtilization = {
      inUse: 65,
      available: 25,
      maintenance: 7,
      outOfService: 3,
    };

    // Customer satisfaction (mock data - you can replace with actual survey data)
    const customerSatisfaction = {
      score: 4.7,
    };

    return {
      leadsConversion: {
        converted: convertedLeads,
        notConverted: totalLeads - convertedLeads,
      },
      leadSources: {
        labels: Object.keys(leadSources),
        values: Object.values(leadSources),
      },
      usageTypes: {
        labels: Object.keys(usageTypes),
        values: Object.values(usageTypes),
      },
      revenue: {
        labels: monthlyTrends.labels,
        values: monthlyTrends.revenue,
      },
      netProfit: {
        labels: monthlyTrends.labels,
        values: monthlyTrends.netProfit,
      },
      topCities: {
        labels: Object.keys(topCities).slice(0, 6),
        values: Object.values(topCities).slice(0, 6),
      },
      monthlyTrends: {
        labels: monthlyTrends.labels,
        leads: monthlyTrends.leads,
        conversions: monthlyTrends.conversions,
        revenue: monthlyTrends.revenue,
        netProfit: monthlyTrends.netProfit,
      },
      equipmentUtilization,
      customerSatisfaction,
      conversionRate: parseFloat(conversionRate),
      avgRevenuePerCustomer: parseFloat(avgRevenuePerCustomer),
      totalCustomers: convertedLeads,
      activeEquipment:
        equipmentUtilization.inUse + equipmentUtilization.available,
    };
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    throw error;
  }
};

/**
 * Calculate monthly trends based on date range
 */
const calculateMonthlyTrends = (
  leads,
  salesOrders,
  jobOrders,
  dateRange = "12months"
) => {
  const months = [];
  const leadsData = [];
  const conversionsData = [];
  const revenueData = [];
  const netProfitData = [];

  // Determine number of months based on date range
  let monthsCount = 12; // default
  switch (dateRange) {
    case "7days":
    case "30days":
      monthsCount = 1; // Show only current month for short ranges
      break;
    case "3months":
      monthsCount = 3;
      break;
    case "6months":
      monthsCount = 6;
      break;
    case "12months":
      monthsCount = 12;
      break;
    case "year":
      monthsCount = 12;
      break;
    case "all":
      monthsCount = 24; // Show last 2 years for all time
      break;
  }

  // Generate months based on date range
  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    months.push(monthName);

    // Count leads for this month
    const leadsCount =
      leads?.filter((lead) => {
        const leadDate = new Date(lead.createdAt);
        return (
          leadDate.getMonth() === date.getMonth() &&
          leadDate.getFullYear() === date.getFullYear()
        );
      }).length || 0;

    leadsData.push(leadsCount);

    // Count conversions for this month (mock data - you can calculate actual conversions)
    const conversionsCount = Math.floor(leadsCount * 0.4); // Assuming 40% conversion rate
    conversionsData.push(conversionsCount);

    // Calculate revenue for this month
    const revenue =
      salesOrders
        ?.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;

    // Calculate job order amount for this month
    const jobOrderAmount =
      jobOrders
        ?.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;

    // Calculate net profit (Job Order amount - Revenue)
    const netProfit = jobOrderAmount - revenue;

    revenueData.push(Math.floor(revenue / 1000)); // Convert to thousands
    netProfitData.push(Math.floor(netProfit / 1000)); // Convert to thousands
  }

  return {
    labels: months,
    leads: leadsData,
    conversions: conversionsData,
    revenue: revenueData,
    netProfit: netProfitData,
  };
};
