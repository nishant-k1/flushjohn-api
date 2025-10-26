/**
 * Blogs Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as blogsService from "../services/blogsService.js";
import {
  generateBlogCoverImagePresignedUrl,
  deleteBlogCoverImageFromS3,
} from "../../common/services/s3Service.js";

const router = Router();

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
      status = null, // ✅ NEW: Add status parameter
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

    const result = await blogsService.getAllBlogs({
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder,
      slug,
      search: search || searchQuery,
      status, // ✅ NEW: Pass status to service
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
        details: error.errors
          ? Object.values(error.errors).map((err) => err.message)
          : [error.message],
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

    await blogsService.getBlogById(id);

    const result = await generateBlogCoverImagePresignedUrl(id, fileType);

    res.status(200).json({
      success: true,
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
      message: "Failed to generate presigned URL",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

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

    await blogsService.getBlogById(id);

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

    await blogsService.getBlogById(id);

    const deleteSuccess = await deleteBlogCoverImageFromS3(id);

    if (!deleteSuccess) {
      // Failed to delete cover image from S3, continuing with database update
    }

    const updatedBlog = await blogsService.updateBlog(id, {
      coverImage: null,
    });

    res.status(200).json({
      success: true,
      data: updatedBlog,
      message: "Cover image deleted successfully",
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
      message: "Failed to delete cover image",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// Regenerate excerpt for a blog
router.post("/:id/regenerate-excerpt", async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const blog = await blogsService.regenerateExcerpt(id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "NOT_FOUND",
      });
    }

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
      message: "Failed to regenerate excerpt",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
