import * as blogsRepository from "../repositories/blogsRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { queueImageCleanup } from "../../../services/imageCleanupQueue.js";

export const generateBlogNumber = async () => {
  const latestBlog = await blogsRepository.findOne({}, "blogNo", {
    sort: { blogNo: -1 },
  });
  const latestBlogNo = latestBlog ? latestBlog.blogNo : 999;
  return latestBlogNo + 1;
};

export const createBlogWithRetry = async (blogData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const createdAt = getCurrentDateTime();
      const blogNo = await generateBlogNumber();
      const slug = generateSlug(blogData.title);

      const newBlogData = {
        ...blogData,
        createdAt,
        blogNo,
        slug,
        publishedAt: createdAt,
      };

      const createdBlog = await blogsRepository.create(newBlogData);

      const transformedBlogData = await transformBlobUrls(
        blogData,
        createdBlog._id.toString()
      );

      if (transformedBlogData !== blogData) {
        return await blogsRepository.updateById(
          createdBlog._id,
          transformedBlogData
        );
      }

      return createdBlog;
    } catch (error) {
      if (error.code === 11000 && attempt < maxRetries) {
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

const uploadCoverImageToS3 = async (blogId, fileType, fileData) => {
  try {
    let fileBuffer;
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      const base64Data = fileData.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
    } else if (typeof fileData === "string") {
      fileBuffer = Buffer.from(fileData, "base64");
    } else {
      throw new Error("Invalid fileData format");
    }

    const fileExtension = fileType.split("/")[1] || "jpg";
    const fileName = `cover-${blogId}.${fileExtension}`;
    const timestamp = Date.now();

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${fileName}`,
      Body: fileBuffer,
      ContentType: fileType,
      CacheControl: "public, max-age=31536000",
      ContentDisposition: "inline",
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

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
        return true;
      } catch (error) {
        if (error.name !== "NoSuchKey") {
          continue;
        }
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

const transformBlobUrls = async (blogData, blogId = null) => {
  if (
    blogData.coverImage &&
    blogData.coverImage.src &&
    blogData.coverImage.src.startsWith("blob:") &&
    blogData.coverImageFileData &&
    blogId
  ) {
    try {
      const s3Url = await uploadCoverImageToS3(
        blogId,
        blogData.coverImageFileType || "image/jpeg",
        blogData.coverImageFileData
      );

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
      return {
        ...blogData,
        coverImage: null,
      };
    }
  }

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
  if (!blogData.title || !blogData.content) {
    const error = new Error("Title and content are required");
    error.name = "ValidationError";
    throw error;
  }

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
  const existingBlog = await blogsRepository.findById(id);
  if (!existingBlog) {
    const error = new Error("Blog not found");
    error.name = "NotFoundError";
    throw error;
  }

  let transformedUpdateData = { ...updateData };

  if (updateData.coverImage === null || updateData.coverImage === "") {
    if (existingBlog.coverImage?.src) {
      await queueImageCleanup(existingBlog.coverImage.src, 2000);
    }

    transformedUpdateData.coverImage = null;
  } else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    updateData.coverImage.src.startsWith("blob:") &&
    updateData.coverImageFileData
  ) {
    await deleteCoverImageFromS3(id);
    transformedUpdateData = await transformBlobUrls(updateData, id);
  } else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    !existingBlog.coverImage
  ) {
  } else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    existingBlog.coverImage?.src &&
    updateData.coverImage.src !== existingBlog.coverImage.src
  ) {
    await queueImageCleanup(existingBlog.coverImage.src, 2000);
  } else if (
    updateData.coverImage &&
    updateData.coverImage.src &&
    !updateData.coverImage.src.startsWith("blob:") &&
    updateData.coverImage.src.includes("amazonaws.com")
  ) {
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

  if (existingBlog.coverImage?.src) {
    await deleteCoverImageFromS3(id);
  }

  await blogsRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
