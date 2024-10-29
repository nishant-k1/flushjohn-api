var express = require("express");
var router = express.Router();
const Blogs = require("../models/Blogs");

router.post("/", async function (req, res, next) {
  try {
    const createdAt = new Date();
    const latestBlog = await Blogs.findOne({}, "blogNo").sort({
      blogNo: -1,
    });
    const latestBlogNo = latestBlog ? latestBlog.blogNo : 999;
    const newBlogNo = latestBlogNo + 1;
    const blogNo = newBlogNo;
    const webblog = blogData({ ...req.body, createdAt, blogNo });
    const blog = await Blogs.create(webblog);
    res.io.emit("create-blog", blog);
    res.status(201).json({ success: true, data: blog.data });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async function (req, res, next) {
  try {
    // await corsHandle(req, res)
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    if (_id) {
      const blogs = await Blogs.findById(_id);
      res.status(200).json({ success: true, data: blogs });
    } else {
      const blogs = await Blogs.find().sort({ _id: -1 });
      res.status(200).json({ success: true, data: blogs });
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/", async function (req, res, next) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    const blog = await Blogs.findByIdAndUpdate(_id, req.body);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.log(error);
  }
});

router.delete("/", async function (req, res, next) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    const blog = await Blogs.findByIdAndDelete(_id);
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
