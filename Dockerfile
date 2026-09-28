# Production Dockerfile for AWS ECS Fargate & EC2 Auto Scaling
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment and default application port
ENV NODE_ENV=production \
    PORT=3000

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies (if any exist)
RUN if [ -f package-lock.json ]; then npm ci --only=production; fi

# Copy application source code
COPY index.js ./

# Switch to standard non-root user for security best practices
USER node

# Expose microservice port
EXPOSE 3000

# Add container-level healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# Start microservice
CMD ["node", "index.js"]
