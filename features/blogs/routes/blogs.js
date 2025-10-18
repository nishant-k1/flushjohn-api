/**
 * Blogs Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as blogsService from "../services/blogsService.js";

const router = Router();

// POST /blogs - Create a new blog
router.post("/", async function (req, res) {
  try {
    const blog = await blogsService.createBlog(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {

    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /blogs - Get all blogs with optional slug/search filter
router.get("/", async function (req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      slug = null,
      search = "",
      searchQuery = "",
    } = req.query;

    const result = await blogsService.getAllBlogs({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      slug,
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

// GET /blogs/:id - Get single blog
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const blog = await blogsService.getBlogById(id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {


    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /blogs/:id - Update blog by ID
router.put("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
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

    const blog = await blogsService.updateBlog(id, req.body);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {


    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
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
      message: "Failed to update blog",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// DELETE /blogs/:id - Delete blog by ID
router.delete("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const result = await blogsService.deleteBlog(id);
    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      data: result,
    });
  } catch (error) {


    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
