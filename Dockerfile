# ─── Stage 1: build Angular ───────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ─── Stage 2: nginx serve ─────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS final

COPY --from=build /app/dist/music-manager-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
