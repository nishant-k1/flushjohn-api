const mongoose = require("mongoose");

const { Schema } = mongoose;

const BlogsSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  blogNo: {
    type: Number,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  // author: {
  //   type: Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  // tags: {
  //   type: [String],
  //   default: [],
  // },
  // status: {
  //   type: String,
  //   enum: ["draft", "published", "archived"],
  //   default: "draft",
  // },
  // category: {
  //   type: String,
  //   required: true,
  // },
  // comments: [
  //   {
  //     user: { type: Schema.Types.ObjectId, ref: "User" },
  //     content: String,
  //     createdAt: { type: Date, default: Date.now },
  //   },
  // ],
  // coverImage: {
  //   type: String,
  //   default: "",
  // },
  // likes: {
  //   type: Number,
  //   default: 0,
  // },
  // metaDescription: {
  //   type: String,
  // },
  // metaKeywords: {
  //   type: [String],
  // },
});

module.exports = mongoose.models.Blogs || mongoose.model("Blogs", BlogsSchema);
