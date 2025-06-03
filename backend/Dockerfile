# ビルドステージ
FROM golang:1.24 AS builder

WORKDIR /app

# モジュールの準備
COPY go.mod ./
COPY go.sum ./
RUN go mod download

# アプリケーションのコピーとビルド
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o server

# ランタイムステージ　（デプロイ時はscratch）
FROM debian:bullseye-slim

WORKDIR /app
COPY --from=builder /app/server .

# Cloud Run ではポート8080が標準
EXPOSE 8080

CMD ["./server"]
