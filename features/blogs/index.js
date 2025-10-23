import routes from "./routes/blogs.js";
import blogAutomationRoutes from "./routes/blog-automation.js";
import model from "./models/Blogs/index.js";
import * as blogsService from "./services/blogsService.js";
import * as automatedBlogService from "./services/automatedBlogService.js";
import * as blogGeneratorService from "./services/blogGeneratorService.js";
import * as blogContentData from "./services/blogContentData.js";
import * as contentCalendar from "./services/contentCalendar.js";
import * as cronScheduler from "./services/cronScheduler.js";

export default {
  routes: {
    blogs: routes,
    blogAutomation: blogAutomationRoutes,
  },
  services: {
    blogsService,
    automatedBlogService,
    blogGeneratorService,
    blogContentData,
    contentCalendar,
    cronScheduler,
  },
  model,
  scripts: {
    cleanBlogContent: "./scripts/cleanBlogContent.js",
    fixBlogImages: "./scripts/fix-blog-images.js",
    fixBlogValidation: "./scripts/fixBlogValidation.js",
    generateBlogContentFiles: "./scripts/generateBlogContentFiles.js",
    generateBlogPosts: "./scripts/generateBlogPosts.js",
    publishBlogPosts: "./scripts/publishBlogPosts.js",
    testAutomation: "./scripts/testAutomation.js",
    testOpenAI: "./scripts/testOpenAI.js",
    triggerBlogGeneration: "./scripts/triggerBlogGeneration.js",
  },
};
