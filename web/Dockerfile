# ── Stage 1: Build React App ────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────
FROM nginx:1.25-alpine AS production

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx config with SPA routing support
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Handle React Router — send all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options         "SAMEORIGIN"  always;
    add_header X-XSS-Protection        "1; mode=block" always;
    add_header X-Content-Type-Options  "nosniff"    always;
    add_header Referrer-Policy         "no-referrer-when-downgrade" always;
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
