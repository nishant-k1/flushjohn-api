const express = require("express");
const router = express.Router();
const Blogs = require("../models/Blogs");
const { generateSlug } = require("../utils");

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
    const blog = await Blogs.create(newBlogPostData);
    if (res.io) res.io.emit("create-blog", blog);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/", async function (req, res) {
  try {
    const blogsList = await Blogs.find().sort({ _id: -1 });
    res.status(200).json({ success: true, data: blogsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/", async function (req, res) {
  try {
    const _id = req.query?._id;
    const blog = await Blogs.findById(_id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:slug", async function (req, res) {
  try {
    const slug = req.params.slug;
    const blogPost = await Blogs.findOne({ slug });
    res.status(200).json({ success: true, data: blogPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT: Update a blog by _id
router.put("/", async function (req, res) {
  try {
    const _id = req.query?._id;
    const blog = await Blogs.findByIdAndUpdate(_id, req.body, { new: true });
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
    const blogs = await Blogs.find().sort({ _id: -1 });
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
