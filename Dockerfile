# ---------- Builder stage ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Accept build argument for API URL
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ARG NEXT_PUBLIC_FB_PUBLISHER=
ENV NEXT_PUBLIC_FB_PUBLISHER=${NEXT_PUBLIC_FB_PUBLISHER}
ARG NEXT_PUBLIC_JOYWORK_COMPANY_ID=
ENV NEXT_PUBLIC_JOYWORK_COMPANY_ID=${NEXT_PUBLIC_JOYWORK_COMPANY_ID}

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js application (without turbopack for Docker compatibility)
RUN npx next build

# ---------- Production stage ----------
FROM node:20-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_FB_PUBLISHER=
ARG NEXT_PUBLIC_JOYWORK_COMPANY_ID=
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_FB_PUBLISHER=${NEXT_PUBLIC_FB_PUBLISHER}
ENV NEXT_PUBLIC_JOYWORK_COMPANY_ID=${NEXT_PUBLIC_JOYWORK_COMPANY_ID}

# Create non-root user for security
RUN groupadd -r nextjs && useradd -r -g nextjs nextjs

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Change ownership to non-root user
RUN chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

