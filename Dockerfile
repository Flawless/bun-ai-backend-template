# Production Dockerfile - Compiled binary in minimal Alpine image
# Stage 1: Build environment
FROM oven/bun:1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (including dev dependencies for building)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source code and configs
COPY src ./src
COPY tsconfig.json ./
COPY eslint.config.js ./
COPY .prettierrc ./

# Copy test files for validation
COPY tests ./tests

# Run quality checks
RUN bun run type-check && \
    bun run lint && \
    bun run test

# Build the application to a single binary
# Set NODE_ENV to production to avoid pino-pretty transport issue
ENV NODE_ENV=production
RUN bun build src/index.ts \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server

# Stage 2: Production runtime
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache \
    libgcc \
    libstdc++ \
    ca-certificates \
    curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy the compiled binary from builder
COPY --from=builder --chown=nodejs:nodejs /app/server /app/server

# Make binary executable
RUN chmod +x /app/server

# Health check using curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port (default 3000, overridable with PORT env)
EXPOSE 3000

# Run the binary
ENTRYPOINT ["/app/server"]