import mongoose, { model } from "mongoose";

const { Schema } = mongoose;

const BlogsSchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    blogNo: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [50, "Content must be at least 50 characters long"],
    },
    excerpt: {
      type: String,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
      default: "FlushJohn Team",
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 10;
        },
        message: "Cannot have more than 10 tags",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published", "archived"],
        message: "Status must be either draft, published, or archived",
      },
      default: "draft",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      default: "general",
      enum: {
        values: [
          "porta-potty-rental",
          "construction",
          "events",
          "tips",
          "news",
          "general",
        ],
        message: "Invalid category",
      },
    },
    // S3 uploaded images (manual uploads)
    coverImageS3: {
      src: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: "S3 cover image must be a valid URL",
        },
      },
      alt: {
        type: String,
        default: "Blog cover image",
        maxlength: [100, "Alt text cannot exceed 100 characters"],
      },
    },
    // Unsplash images (automated)
    coverImageUnsplash: {
      src: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: "Unsplash cover image must be a valid URL",
        },
      },
      alt: {
        type: String,
        default: "Blog cover image",
        maxlength: [100, "Alt text cannot exceed 100 characters"],
      },
    },
    // Legacy field for backward compatibility
    coverImage: {
      src: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: "Cover image must be a valid URL",
        },
      },
      alt: {
        type: String,
        default: "Blog cover image",
        maxlength: [100, "Alt text cannot exceed 100 characters"],
      },
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
      trim: true,
    },
    metaKeywords: {
      type: [String],
      validate: {
        validator: function (keywords) {
          return keywords.length <= 15;
        },
        message: "Cannot have more than 15 meta keywords",
      },
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    readingTime: {
      type: Number, // in minutes
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        user: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isApproved: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

BlogsSchema.index({ title: "text", content: "text", excerpt: "text" });
BlogsSchema.index({ status: 1, publishedAt: -1 });
BlogsSchema.index({ category: 1, status: 1 });
BlogsSchema.index({ tags: 1 });
BlogsSchema.index({ slug: 1 });

BlogsSchema.virtual("estimatedReadingTime").get(function () {
  if (this.wordCount > 0) {
    return Math.ceil(this.wordCount / 200); // Average 200 words per minute
  }
  return 0;
});

BlogsSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  if (this.content) {
    const textContent = this.content.replace(/<[^>]*>/g, "");
    const trimmedContent = textContent.trim();

    if (!trimmedContent) {
      this.wordCount = 0;
      this.readingTime = 0;
    } else {
      const words = trimmedContent
        .split(/\s+/)
        .filter((word) => word.length > 0);
      this.wordCount = words.length;
      this.readingTime = Math.ceil(this.wordCount / 200);
    }
  } else {
    this.wordCount = 0;
    this.readingTime = 0;
  }

  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

export default model("Blogs", BlogsSchema);
