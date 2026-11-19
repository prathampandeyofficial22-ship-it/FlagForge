FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/

RUN npm ci

COPY client ./client

RUN npm run build:client

# Production Nginx Server
FROM nginx:alpine AS runner

COPY --from=builder /app/client/dist /usr/share/nginx/html

# Custom nginx config for SPA routing and API proxy
RUN echo 'server { \
  listen 80; \
  location /api { \
    proxy_pass http://server:4000; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
  } \
  location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
