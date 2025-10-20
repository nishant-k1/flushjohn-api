/**
 * Blogs Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as blogsService from "../services/blogsService.js";
import {
  generateBlogCoverImagePresignedUrl,
  deleteBlogCoverImageFromS3,
} from "../../../services/s3Service.js";

const router = Router();

// POST /blogs - Create a new blog
router.post("/", async function (req, res) {
  try {
    const blog = await blogsService.createBlog(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error: error.message,
    });
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

// POST /blogs/:id/cover-image/presigned-url - Generate presigned URL for cover image upload
router.post("/:id/cover-image/presigned-url", async function (req, res) {
  try {
    const { id } = req.params;
    const { fileType } = req.body;

    if (!blogsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    if (!fileType) {
      return res.status(400).json({
        success: false,
        message: "File type is required",
        error: "MISSING_FILE_TYPE",
      });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Allowed types: jpeg, jpg, png, gif, webp",
        error: "INVALID_FILE_TYPE",
      });
    }

    // Check if blog exists
    const blog = await blogsService.getBlogById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "BLOG_NOT_FOUND",
      });
    }

    const result = await generateBlogCoverImagePresignedUrl(id, fileType);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);

    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate presigned URL",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// POST /blogs/:id/cover-image/upload-complete - Handle upload completion and update database
router.post("/:id/cover-image/upload-complete", async function (req, res) {
  try {
    const { id } = req.params;
    const { publicUrl, key } = req.body;

    if (!blogsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    if (!publicUrl || !key) {
      return res.status(400).json({
        success: false,
        message: "Public URL and key are required",
        error: "MISSING_REQUIRED_FIELDS",
      });
    }

    // Check if blog exists
    const existingBlog = await blogsService.getBlogById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "BLOG_NOT_FOUND",
      });
    }

    // Update blog with new cover image URL
    const updatedBlog = await blogsService.updateBlog(id, {
      coverImage: {
        src: publicUrl,
        alt: "Cover Image",
      },
    });

    res.status(200).json({
      success: true,
      data: updatedBlog,
      message: "Cover image uploaded successfully",
    });
  } catch (error) {
    console.error("Error handling upload completion:", error);

    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to complete upload",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// DELETE /blogs/:id/cover-image - Delete cover image
router.delete("/:id/cover-image", async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Check if blog exists
    const existingBlog = await blogsService.getBlogById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "BLOG_NOT_FOUND",
      });
    }

    // Delete cover image from S3
    const deleteSuccess = await deleteBlogCoverImageFromS3(id);

    if (!deleteSuccess) {
      console.warn(
        `Failed to delete cover image from S3 for blog ${id}, but continuing with database update`
      );
    }

    // Update blog to remove cover image
    const updatedBlog = await blogsService.updateBlog(id, {
      coverImage: null,
    });

    res.status(200).json({
      success: true,
      data: updatedBlog,
      message: "Cover image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cover image:", error);

    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete cover image",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
