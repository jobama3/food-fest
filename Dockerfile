FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript && npx tsc

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY public ./public

EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/index.js"]
