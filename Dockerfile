# Use official Playwright image with Node.js and Chromium pre-installed
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Install SOX (Sound eXchange) for audio capture
# Required for Aggregate Device audio capture on backend
RUN apt-get update && \
    apt-get install -y sox && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    sox --version

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for TypeScript compilation)
RUN npm ci

# Copy application files
COPY . .

# Build TypeScript
RUN npm run build

# Create temp directory for PDFs with proper permissions
RUN mkdir -p public/temp && chmod 755 public/temp

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 8080

# Health check (uses PORT environment variable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
