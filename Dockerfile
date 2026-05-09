# --- STAGE 1: Build & Compile dependencies ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install native compilation dependencies required for specific packages
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including development packages for Next.js build compilation
RUN npm ci

COPY . .

# Generate Prisma Client and compile optimized Next.js static bundle
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: Lightweight Production runner ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install openssl for Prisma runtime connection pools compatibility
RUN apk add --no-cache openssl

# Add non-privileged user for enhanced container security (OWASP ASVS compliance)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential production files and compiled bundles
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
