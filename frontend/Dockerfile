# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ENV REACT_APP_API_URL=http://localhost:8080/api/v1
ENV REACT_APP_WS_URL=ws://localhost:8080/ws
RUN npm run build

# ── Runtime (nginx) ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
