/**
 * Blogs Service - Business Logic Layer
 */

import * as blogsRepository from "../repositories/blogsRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
        console.log(`Blog creation attempt ${attempt} failed, retrying...`);
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

    // Return the public URL with cache busting
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    const encodedName = encodeURIComponent(fileName);
    const imageUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/images/blog/${encodedName}?t=${timestamp}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/images/blog/${encodedName}?t=${timestamp}`;

    console.log("Cover image uploaded to S3:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Error uploading cover image to S3:", error);
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
    // Try common image extensions
    const extensions = ["jpg", "jpeg", "png", "gif", "webp"];

    for (const ext of extensions) {
      const fileName = `cover-${blogId}.${ext}`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `images/blog/${fileName}`,
      };

      try {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const command = new DeleteObjectCommand(params);
        const s3 = getS3Client();
        await s3.send(command);
        console.log(`Cover image deleted from S3: ${fileName}`);
        return true;
      } catch (error) {
        // Continue to next extension if file not found
        if (error.name !== "NoSuchKey") {
          console.error(`Error deleting cover image ${fileName}:`, error);
        }
      }
    }

    console.log(`No cover image found for blog ${blogId}`);
    return true; // Consider it successful if no file exists
  } catch (error) {
    console.error("Error deleting cover image from S3:", error);
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
    console.log("Converting blob URL to S3 URL:", blogData.coverImage.src);

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
      console.error("Error converting blob URL:", error);
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
    console.warn(
      "Blob URL detected but no file data provided:",
      blogData.coverImage.src
    );
    return {
      ...blogData,
      coverImage: null,
    };
  }

  return blogData;
};

export const createBlog = async (blogData) => {
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
    console.log(`Deleting cover image for blog ${id}`);
    await deleteCoverImageFromS3(id);
    transformedUpdateData.coverImage = null;
  }
  // If coverImage has blob URL with file data, upload to S3
  else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    updateData.coverImage.src.startsWith("blob:") &&
    updateData.coverImageFileData
  ) {
    console.log(`Replacing cover image for blog ${id}`);
    // Delete old cover image first
    await deleteCoverImageFromS3(id);
    // Upload new cover image
    transformedUpdateData = await transformBlobUrls(updateData, id);
  }
  // If coverImage is being updated with a new S3 URL, delete old cover image
  else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    updateData.coverImage.src !== existingBlog.coverImage?.src
  ) {
    console.log(`Updating cover image URL for blog ${id}`);
    // Delete old cover image if it exists and is different
    if (
      existingBlog.coverImage?.src &&
      existingBlog.coverImage.src !== updateData.coverImage.src
    ) {
      await deleteCoverImageFromS3(id);
    }
  }
  // If coverImage is being updated with a new S3 URL (from frontend upload), handle replacement
  else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    updateData.coverImage.src.includes("amazonaws.com")
  ) {
    console.log(`Cover image updated with S3 URL for blog ${id}`);
    // Delete old cover image if it exists and is different
    if (
      existingBlog.coverImage?.src &&
      existingBlog.coverImage.src !== updateData.coverImage.src
    ) {
      await deleteCoverImageFromS3(id);
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
    console.log(`Deleting cover image for blog ${id} before blog deletion`);
    await deleteCoverImageFromS3(id);
  }

  await blogsRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
