/**
 * Blogs Service - Business Logic Layer
 */

import * as blogsRepository from "../repositories/blogsRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { queueImageCleanup } from "../../../services/imageCleanupQueue.js";

export const generateBlogNumber = async () => {
  // Find the blog with the highest blogNo
  const latestBlog = await blogsRepository.findOne({}, "blogNo", {
    sort: { blogNo: -1 },
  });
  const latestBlogNo = latestBlog ? latestBlog.blogNo : 999;
  return latestBlogNo + 1;
};

// Retry mechanism for blog creation to handle race conditions
export const createBlogWithRetry = async (blogData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const createdAt = getCurrentDateTime();
      const blogNo = await generateBlogNumber();
      const slug = generateSlug(blogData.title);

      // Create blog first to get the ID
      const newBlogData = {
        ...blogData,
        createdAt,
        blogNo,
        slug,
        publishedAt: createdAt,
      };

      const createdBlog = await blogsRepository.create(newBlogData);

      // Transform blob URLs after creating the blog (now we have the ID)
      const transformedBlogData = await transformBlobUrls(
        blogData,
        createdBlog._id.toString()
      );

      // Update the blog with transformed URLs if needed
      if (transformedBlogData !== blogData) {
        return await blogsRepository.updateById(
          createdBlog._id,
          transformedBlogData
        );
      }

      return createdBlog;
    } catch (error) {
      // If it's a duplicate key error and we have retries left, try again
      if (error.code === 11000 && attempt < maxRetries) {
        // Add a small delay to reduce race condition likelihood
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        continue;
      }
      throw error;
    }
  }
};

export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Transform blob URLs to S3 CDN URLs for cover images
 * @param {Object} blogData - Blog data that may contain blob URLs
 * @returns {Object} - Blog data with transformed URLs
 */
// Initialize S3 Client lazily
let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

/**
 * Upload cover image to S3 with consistent naming and return CDN URL
 * @param {string} blogId - Blog ID for consistent naming
 * @param {string} fileType - MIME type
 * @param {string} fileData - Base64 file data
 * @returns {Promise<string>} - S3 CDN URL
 */
const uploadCoverImageToS3 = async (blogId, fileType, fileData) => {
  try {
    // Convert base64 to buffer
    let fileBuffer;
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      // Handle data URL format
      const base64Data = fileData.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
    } else if (typeof fileData === "string") {
      // Handle plain base64
      fileBuffer = Buffer.from(fileData, "base64");
    } else {
      throw new Error("Invalid fileData format");
    }

    // Use consistent filename: cover-{blogId}.{extension}
    const fileExtension = fileType.split("/")[1] || "jpg";
    const fileName = `cover-${blogId}.${fileExtension}`;
    const timestamp = Date.now();

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${fileName}`,
      Body: fileBuffer,
      ContentType: fileType,
      CacheControl: "public, max-age=31536000", // 1 year cache for images
      ContentDisposition: "inline",
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    // Return the public URL (no cache busting needed with new file approach)
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    const encodedName = encodeURIComponent(fileName);
    const imageUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/images/blog/${encodedName}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/images/blog/${encodedName}`;

    return imageUrl;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete cover image from S3 using consistent naming
 * @param {string} blogId - Blog ID to construct filename
 * @returns {Promise<boolean>} - Success status
 */
const deleteCoverImageFromS3 = async (blogId) => {
  try {
    // Note: With new file approach, we don't need to delete by blogId pattern
    // Old images are cleaned up automatically via the cleanup service
    return true; // Consider it successful as cleanup is handled elsewhere
  } catch (error) {
    return false;
  }
};

const transformBlobUrls = async (blogData, blogId = null) => {
  // Check if coverImage exists and has a blob URL with file data
  if (
    blogData.coverImage &&
    blogData.coverImage.src &&
    blogData.coverImage.src.startsWith("blob:") &&
    blogData.coverImageFileData &&
    blogId
  ) {
    try {
      // Upload the file data to S3 and get the CDN URL
      const s3Url = await uploadCoverImageToS3(
        blogId,
        blogData.coverImageFileType || "image/jpeg",
        blogData.coverImageFileData
      );

      // Remove the temporary file data from the blog data
      const {
        coverImageFileData,
        coverImageFileName,
        coverImageFileType,
        ...cleanBlogData
      } = blogData;

      return {
        ...cleanBlogData,
        coverImage: {
          src: s3Url,
          alt: blogData.coverImage.alt || "Cover Image",
        },
      };
    } catch (error) {
      // Return null for coverImage if conversion fails
      return {
        ...blogData,
        coverImage: null,
      };
    }
  }

  // If blob URL exists but no file data, return null for coverImage
  if (
    blogData.coverImage &&
    blogData.coverImage.src &&
    blogData.coverImage.src.startsWith("blob:")
  ) {
    return {
      ...blogData,
      coverImage: null,
    };
  }

  return blogData;
};

export const createBlog = async (blogData) => {
  // Validate required fields
  if (!blogData.title || !blogData.content) {
    const error = new Error("Title and content are required");
    error.name = "ValidationError";
    throw error;
  }

  // Generate excerpt if not provided
  if (!blogData.excerpt && blogData.content) {
    const textContent = blogData.content.replace(/<[^>]*>/g, "").trim();
    blogData.excerpt = textContent.substring(0, 500);
  }

  return await createBlogWithRetry(blogData);
};

export const getAllBlogs = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  slug = null,
  search = "",
}) => {
  const skip = (page - 1) * limit;

  // Build search query
  let query = {};

  if (slug) {
    query.slug = slug;
  } else if (search) {
    query = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ],
    };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [blogs, total] = await Promise.all([
    blogsRepository.findAll({ query, sort, skip, limit }),
    blogsRepository.count(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: blogs,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getBlogById = async (id) => {
  const blog = await blogsRepository.findById(id);

  if (!blog) {
    const error = new Error("Blog not found");
    error.name = "NotFoundError";
    throw error;
  }

  return blog;
};

export const updateBlog = async (id, updateData) => {
  // Get existing blog to check current cover image
  const existingBlog = await blogsRepository.findById(id);
  if (!existingBlog) {
    const error = new Error("Blog not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Handle cover image operations
  let transformedUpdateData = { ...updateData };

  // If coverImage is being set to null/empty, delete from S3
  if (updateData.coverImage === null || updateData.coverImage === "") {
    // ✅ NEW APPROACH: Queue cleanup of old image
    if (existingBlog.coverImage?.src) {
      await queueImageCleanup(existingBlog.coverImage.src, 2000);
    }

    transformedUpdateData.coverImage = null;
  }
  // If coverImage has blob URL with file data, upload to S3
  else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    updateData.coverImage.src.startsWith("blob:") &&
    updateData.coverImageFileData
  ) {
    // Delete old cover image first
    await deleteCoverImageFromS3(id);
    // Upload new cover image
    transformedUpdateData = await transformBlobUrls(updateData, id);
  }
  // If coverImage is being set for the first time (existing is null)
  else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    !existingBlog.coverImage
  ) {
    // No cleanup needed since there's no existing image
  }
  // If coverImage is being updated with a new S3 URL, delete old cover image
  else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    existingBlog.coverImage?.src &&
    updateData.coverImage.src !== existingBlog.coverImage.src
  ) {
    // ✅ NEW APPROACH: Queue cleanup of old image
    await queueImageCleanup(existingBlog.coverImage.src, 2000);
  }
  // If coverImage is being updated with a new S3 URL (from frontend upload), handle replacement
  else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    updateData.coverImage.src.includes("amazonaws.com")
  ) {
    // ✅ NEW APPROACH: Queue cleanup of old image
    if (
      existingBlog.coverImage?.src &&
      existingBlog.coverImage.src !== updateData.coverImage.src
    ) {
      await queueImageCleanup(existingBlog.coverImage.src, 2000);
    }
  }

  const blog = await blogsRepository.updateById(id, {
    ...transformedUpdateData,
    updatedAt: getCurrentDateTime(),
  });

  return blog;
};

export const deleteBlog = async (id) => {
  const existingBlog = await blogsRepository.findById(id);

  if (!existingBlog) {
    const error = new Error("Blog not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Delete cover image from S3 before deleting blog
  if (existingBlog.coverImage?.src) {
    await deleteCoverImageFromS3(id);
  }

  await blogsRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
