# ==== フロントエンドビルド ====
FROM node:20 AS frontend

WORKDIR /frontend
COPY frontend/ ./
RUN npm install
RUN npm run build

# ==== バックエンドビルド ====
FROM golang:1.24 AS backend

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server

# ==== 本番イメージ (Nginx + server) ====
FROM nginx:stable

# Nginx config をコピー
COPY nginx.conf /etc/nginx/nginx.conf

# フロントエンドビルド成果物を配信ディレクトリへ
COPY --from=frontend /frontend/build /usr/share/nginx/html

# Goサーバーをコピーして8081で起動
COPY --from=backend /app/server /app/server

# APIバックエンド用
EXPOSE 8080

CMD ["/bin/sh", "-c", "/app/server & nginx -g 'daemon off;'"]