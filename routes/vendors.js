import { Router } from "express";
const router = Router();
import Vendors from "../models/Vendors/index.js";

// POST: Create a new vendor
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const latestVendor = await Vendors.findOne({}, "vendorNo").sort({
      vendorNo: -1,
    });
    const latestVendorNo = latestVendor ? latestVendor.vendorNo : 999;
    const newVendorNo = latestVendorNo + 1;
    const newVendorData = {
      ...req.body,
      createdAt,
      vendorNo: newVendorNo,
    };
    const newVendor = await Vendors.create(newVendorData);
    res.status(201).json({ success: true, data: newVendor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /vendors - Get all vendors with pagination, sorting, and filtering
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query for search
    let query = {};
    const searchTerm = search || searchQuery;
    if (searchTerm) {
      query = {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { cName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { phone: { $regex: searchTerm, $options: "i" } },
          { city: { $regex: searchTerm, $options: "i" } },
          { state: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await Vendors.countDocuments(query);

    // Get vendors with pagination and sorting
    const vendors = await Vendors.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: vendors,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /vendors/:id - Get single vendor
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const vendor = await Vendors.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /vendors - Update vendor
router.put("/", async function (req, res) {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    const updatedVendor = await Vendors.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({ success: true, data: updatedVendor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /vendors - Delete vendor
router.delete("/", async function (req, res) {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    const deletedVendor = await Vendors.findByIdAndDelete(_id);

    if (!deletedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Return updated list after deletion
    const vendorsList = await Vendors.find().sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
      data: vendorsList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
