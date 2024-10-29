const mongoose = require("mongoose");

const { Schema } = mongoose;

// Define the Blog schema
const blogSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  blogNo: {
    type: Number,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.models.Blogs || mongoose.model("Blogs", BlogsSchema);
