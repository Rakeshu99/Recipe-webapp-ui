# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ---- Run stage ----
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app .

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "fe-server.js"]