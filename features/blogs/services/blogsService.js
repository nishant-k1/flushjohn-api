import * as blogsRepository from "../repositories/blogsRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import OpenAI from "openai";
import { generateComprehensiveBlogMetadata } from "./blogGeneratorService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI-powered excerpt using OpenAI
 * @param {string} content - Blog content
 * @param {string} title - Blog title
 * @returns {Promise<string>} - Generated excerpt
 */
const generateAIExcerpt = async (content, title) => {
  try {
    // Remove HTML tags and clean content for AI processing
    const cleanContent = content.replace(/<[^>]*>/g, "").trim();

    // Limit content to first 2000 characters to stay within token limits
    const truncatedContent = cleanContent.substring(0, 2000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert content writer. Generate a compelling, SEO-friendly excerpt (summary) for blog posts. The excerpt should be 120-150 characters, engaging, and capture the main value proposition. Return ONLY plain text without any HTML tags, quotes, backticks, or special formatting.",
        },
        {
          role: "user",
          content: `Generate a compelling excerpt for this blog post:

Title: "${title}"
Content: "${truncatedContent}"

Requirements:
- 120-150 characters
- Engaging and informative
- Include key benefits or value proposition
- SEO-friendly
- NO HTML tags, quotes, backticks, or special formatting
- Return ONLY plain text excerpt
- Do not include any markup or formatting`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    let excerpt = response.choices[0].message.content.trim();

    // Clean up any formatting artifacts
    excerpt = excerpt
      .replace(/<[^>]*>/g, "") // Remove HTML tags first
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/^```.*$/gm, "") // Remove code block markers
      .replace(/^`\s*/gm, "") // Remove any leading backticks
      .replace(/\s*`$/gm, "") // Remove any trailing backticks
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();

    // Ensure proper length
    if (excerpt.length > 150) {
      excerpt = excerpt.substring(0, 147) + "...";
    }

    return excerpt;
  } catch (error) {
    console.error("Error generating AI excerpt:", error);
    // Fallback to basic text processing if AI fails
    return generateBasicExcerpt(content);
  }
};

/**
 * Fallback basic excerpt generation
 * @param {string} content - Blog content
 * @returns {string} - Basic excerpt
 */
const generateBasicExcerpt = (content) => {
  // Remove HTML tags and clean up the content
  let textContent = content.replace(/<[^>]*>/g, "").trim();

  // Remove code block markers and other formatting artifacts
  textContent = textContent.replace(/```html|```/g, "").trim();

  // Split by paragraphs and find the first meaningful paragraph
  const paragraphs = textContent
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 20);
  const firstParagraph = paragraphs[0] || textContent.split(".")[0];

  // Clean up the excerpt
  let cleanExcerpt = firstParagraph.trim();

  // If it's still too short or contains HTML artifacts, try to get more content
  if (cleanExcerpt.length < 50) {
    const sentences = textContent
      .split(/[.!?]/)
      .filter((s) => s.trim().length > 10);
    cleanExcerpt = sentences.slice(0, 2).join(". ").trim();
  }

  return cleanExcerpt.length > 150
    ? cleanExcerpt.substring(0, 150) + "..."
    : cleanExcerpt;
};

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
      const slug = await generateUniqueSlug(blogData.title);

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

export const generateUniqueSlug = async (title) => {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingBlog = await blogsRepository.findOne({ slug });
    if (!existingBlog) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

export const getBlogBySlug = async (slug) => {
  return await blogsRepository.findOne({ slug });
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
    let deleted = false;

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
        deleted = true;
        break;
      } catch (error) {
        if (error.name === "NoSuchKey") {
          continue;
        } else {
          console.error(`Error deleting cover image ${fileName}:`, error);
          continue;
        }
      }
    }

    if (!deleted) {
      try {
        const { ListObjectsV2Command, DeleteObjectCommand } = await import(
          "@aws-sdk/client-s3"
        );
        const listParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Prefix: `images/blog/cover-${blogId}-`,
        };

        const s3 = getS3Client();
        const listCommand = new ListObjectsV2Command(listParams);
        const listResponse = await s3.send(listCommand);

        if (listResponse.Contents && listResponse.Contents.length > 0) {
          for (const object of listResponse.Contents) {
            const deleteParams = {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: object.Key,
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3.send(deleteCommand);
            deleted = true;
          }
        }
      } catch (error) {
        console.error(
          `Error deleting timestamped cover images for blog ${blogId}:`,
          error
        );
      }
    }

    return true; // Return true even if no files were found to delete
  } catch (error) {
    console.error(`Error in deleteCoverImageFromS3 for blog ${blogId}:`, error);
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
        coverImageS3: {
          src: s3Url,
          alt: blogData.coverImage.alt || "Cover Image",
        },
        // Clear Unsplash image when manual upload is used
        coverImageUnsplash: null,
      };
    } catch (error) {
      return {
        ...blogData,
        coverImageS3: null,
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
      coverImageS3: null,
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
    // Use AI to generate excerpt
    blogData.excerpt = await generateAIExcerpt(
      blogData.content,
      blogData.title
    );
  }

  // Generate comprehensive metadata if not provided
  if (!blogData.tags || !blogData.author || !blogData.coverImage?.alt) {
    try {
      const comprehensiveMetadata = await generateComprehensiveBlogMetadata(
        blogData.title,
        blogData.content,
        { primary: blogData.title, secondary: "" },
        blogData.category || "tips"
      );

      // Only set if not already provided
      if (!blogData.tags) blogData.tags = comprehensiveMetadata.tags;
      if (!blogData.author) blogData.author = comprehensiveMetadata.author;
      if (!blogData.coverImage?.alt && blogData.coverImage) {
        blogData.coverImage.alt = comprehensiveMetadata.coverImageAlt;
      }
      if (!blogData.featured)
        blogData.featured = comprehensiveMetadata.featured;
      if (!blogData.priority)
        blogData.priority = comprehensiveMetadata.priority;
    } catch (error) {
      console.error("Error generating comprehensive metadata:", error);
      // Continue with basic data
    }
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
  status = null, // ✅ NEW: Add status parameter
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

  if (status) {
    query.status = status;
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
    }
  }

  // Generate excerpt if not provided and content is updated
  if (!transformedUpdateData.excerpt && transformedUpdateData.content) {
    // Use AI to generate excerpt
    transformedUpdateData.excerpt = await generateAIExcerpt(
      transformedUpdateData.content,
      transformedUpdateData.title || existingBlog.title
    );
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

export const regenerateExcerpt = async (id) => {
  const existingBlog = await blogsRepository.findById(id);
  if (!existingBlog) {
    const error = new Error("Blog not found");
    error.name = "NotFoundError";
    throw error;
  }

  if (!existingBlog.content) {
    const error = new Error("Blog content not found");
    error.name = "ValidationError";
    throw error;
  }

  // Use AI to generate new excerpt
  const newExcerpt = await generateAIExcerpt(
    existingBlog.content,
    existingBlog.title
  );

  const updatedBlog = await blogsRepository.updateById(id, {
    excerpt: newExcerpt,
    updatedAt: getCurrentDateTime(),
  });

  return updatedBlog;
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
