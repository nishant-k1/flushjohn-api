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
    await Blogs.create(newBlogPostData);
    const blogsList = await Blogs.find().sort({ _id: -1 });
    res.status(201).json({ success: true, data: blogsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/", async function (req, res) {
  try {
    const _id = req.query?._id;
    const slug = req.query?.slug;

    if (_id) {
      const blog = await Blogs.findById(_id);
      res.status(200).json({ success: true, data: blog });
    } else if (slug) {
      const blog = await Blogs.findOne({ slug });
      res.status(200).json({ success: true, data: blog });
    } else {
      const blogsList = await Blogs.find().sort({ _id: -1 });
      res.status(200).json({ success: true, data: blogsList });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT: Update a blog by _id
router.put("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const _id = req.query?._id;
    const newBlogUpdateData = {
      ...req.body,
      createdAt,
      slug: generateSlug(req.body?.title),
    };
    const blog = await Blogs.findByIdAndUpdate(_id, newBlogUpdateData, {
      new: true,
    });
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE: Delete a blog by _id
router.delete("/", async function (req, res) {
  try {
    const _id = req.query?._id;
    await Blogs.findByIdAndDelete(_id);
    const blogsList = await Blogs.find().sort({ _id: -1 });
    res.status(200).json({ success: true, data: blogsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
