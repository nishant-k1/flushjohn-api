/**
 * Blogs Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as blogsService from "../services/blogsService.js";
import {
  generateBlogCoverImagePresignedUrl,
  deleteBlogCoverImageFromS3,
} from "../../common/services/s3Service.js";
import {
  AsyncRouteHandler,
  parsePaginationQuery,
  safeStringQuery,
  isValidationError,
  MongooseFilter,
} from "../../../types/common.js";

const router: any = Router();

router.post("/", (async function (req, res) {
  try {
    const blog = await blogsService.createBlog(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    if (isValidationError(error)) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.message,
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error: errorMessage,
    });
  }
}) as AsyncRouteHandler);

router.get("/", (async function (req, res) {
  try {
    const pagination = parsePaginationQuery(req.query);
    const {
      slug,
      status,
      ...columnFilters
    } = req.query;

    const slugValue = slug
      ? safeStringQuery(
          typeof slug === "string" || Array.isArray(slug) ? slug : String(slug)
        )
      : null;
    const statusValue = status
      ? safeStringQuery(
          typeof status === "string" || Array.isArray(status)
            ? status
            : String(status)
        )
      : null;

    const result = await blogsService.getAllBlogs({
      page: pagination.page,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      slug: slugValue,
      search: pagination.search,
      status: statusValue,
      ...columnFilters,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, error: errorMessage });
  }
}) as AsyncRouteHandler);

router.get("/:id", (async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const blog = await blogsService.getBlogById(id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, error: errorMessage });
  }
}) as AsyncRouteHandler);

router.put("/:id", (async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: "Request body is required for update",
        error: "EMPTY_REQUEST_BODY",
      });
      return;
    }

    const blog = await blogsService.updateBlog(id, req.body);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
      return;
    }

    if (isValidationError(error)) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.errors
          ? Object.values(error.errors).map((err) => err.message)
          : [error.message],
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
    });
  }
}) as AsyncRouteHandler);

router.delete("/:id", (async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const result = await blogsService.deleteBlog(id);
    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
    });
  }
}) as AsyncRouteHandler);

router.post("/:id/cover-image/presigned-url", (async function (req, res) {
  try {
    const { id } = req.params;
    const { fileType } = req.body;

    if (!blogsService.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    if (!fileType) {
      res.status(400).json({
        success: false,
        message: "File type is required",
        error: "MISSING_FILE_TYPE",
      });
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(fileType)) {
      res.status(400).json({
        success: false,
        message: "Invalid file type. Allowed types: jpeg, jpg, png, gif, webp",
        error: "INVALID_FILE_TYPE",
      });
      return;
    }

    await blogsService.getBlogById(id);

    const result = await generateBlogCoverImagePresignedUrl(id, fileType);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to generate presigned URL",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
    });
  }
}) as AsyncRouteHandler);

router.post("/:id/cover-image/upload-complete", (async function (req, res) {
  try {
    const { id } = req.params;
    const { publicUrl, key } = req.body;

    if (!blogsService.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    if (!publicUrl || !key) {
      res.status(400).json({
        success: false,
        message: "Public URL and key are required",
        error: "MISSING_REQUIRED_FIELDS",
      });
      return;
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
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to complete upload",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
    });
  }
}) as AsyncRouteHandler);

router.delete("/:id/cover-image", (async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
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
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "BLOG_NOT_FOUND",
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to delete cover image",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
    });
  }
}) as AsyncRouteHandler);

// Regenerate excerpt for a blog
router.post("/:id/regenerate-excerpt", (async function (req, res) {
  try {
    const { id } = req.params;

    if (!blogsService.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    const blog = await blogsService.regenerateExcerpt(id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "NOT_FOUND",
      });
      return;
    }

    if (isValidationError(error)) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.message,
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to regenerate excerpt",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
    });
  }
}) as AsyncRouteHandler);

export default router;
