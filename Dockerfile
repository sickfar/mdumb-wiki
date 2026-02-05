# Use official Bun image for building
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image - use Node for better compatibility
FROM node:22-slim AS runner
WORKDIR /app

# Copy necessary files
COPY --from=builder /app/.output ./.output

# Create wiki directory
RUN mkdir -p /wiki

# Expose port
EXPOSE 3020

# Set environment
ENV NODE_ENV=production
ENV PORT=3020
ENV WIKI_PATH=/wiki

# Run the application
CMD ["node", ".output/server/index.mjs"]
