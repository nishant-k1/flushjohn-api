import { Router } from "express";
const router = Router();
import Blogs from "../models/Blogs/index.js";
import { generateSlug } from "../utils/index.js";

// POST: Create a new blog
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const latestBlog = await Blogs.findOne({}, "blogNo").sort({ blogNo: -1 });
    const latestBlogNo = latestBlog ? latestBlog.blogNo : 999;
    const newBlogNo = latestBlogNo + 1;
    const newBlogPostData = {
      ...req.body,
      createdAt,
      blogNo: newBlogNo,
      slug: generateSlug(req.body?.title),
    };
    const newBlog = await Blogs.create(newBlogPostData);
    res.status(201).json({ success: true, data: newBlog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /blogs - Get all blogs
router.get("/", async function (req, res) {
  try {
    const blogsList = await Blogs.find().sort({ _id: -1 });
    res.status(200).json({ success: true, data: blogsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /blogs/:id - Get a single blog by ID
router.get("/:id", async function (req, res) {
  try {
    const _id = req.params.id;
    
    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }
    
    const blog = await Blogs.findById(_id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "BLOG_NOT_FOUND",
      });
    }
    
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /blogs/slug/:slug - Get a blog by slug
router.get("/slug/:slug", async function (req, res) {
  try {
    const slug = req.params.slug;
    const blog = await Blogs.findOne({ slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "BLOG_NOT_FOUND",
      });
    }
    
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /blogs/:id - Update a blog by ID
router.put("/:id", async function (req, res) {
  try {
    const _id = req.params.id;
    
    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }
    
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required for update",
        error: "EMPTY_REQUEST_BODY",
      });
    }
    
    const updatedAt = new Date();
    const newBlogUpdateData = {
      ...req.body,
      updatedAt,
      slug: generateSlug(req.body?.title),
    };
    
    const blog = await Blogs.findByIdAndUpdate(_id, newBlogUpdateData, {
      new: true,
      runValidators: true,
    });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "BLOG_NOT_FOUND",
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Blog updated successfully",
      data: blog 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /blogs/:id - Delete a blog by ID
router.delete("/:id", async function (req, res) {
  try {
    const _id = req.params.id;
    
    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
        error: "INVALID_ID_FORMAT",
      });
    }
    
    // Check if blog exists before deletion
    const existingBlog = await Blogs.findById(_id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        error: "BLOG_NOT_FOUND",
      });
    }
    
    await Blogs.findByIdAndDelete(_id);
    
    res.status(200).json({ 
      success: true, 
      message: "Blog deleted successfully",
      data: { _id } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
