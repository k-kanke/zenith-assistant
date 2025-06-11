## Zenith - AI搭載スケジュール調整アシスタント
Zenithは、Googleカレンダーと連携し、自然言語による空き時間検索・予定登録を可能にするAIエージェントです。
Vertex AI Gemini APIを用いた意図理解・情報抽出と、Cloud SQLによるトークン管理・予定登録を組み合わせ、チャットUI上でスムーズな予定調整を実現します。

## 主な機能
- チャットからの自然言語による予定登録・空き時間検索
- Googleカレンダー連携（OAuth2）
- Gemini（Vertex AI）による文章解析と意図推定
- Googleログインによる認証
- リバースプロキシ構成（Nginx + React + Go API）
- Cloud Run デプロイ対応済み(現在公開範囲はテストユーザーに限定しています)

## 採用技術スタック
| 領域 | 技術 |
| ---- | ---- |
| AIエンジン | Gemini API in Vertex AI |
| インフラ | Cloud Run, Cloud Build, IAM |
| フロントエンド | React + Typescript |
| バックエンド | Go + Gin |
| 認証 | Firebase Auth (Google OAuth) |
| DB | Firestore、Cloud SQL (PostgreSQL) |
| Nginx + Docker | バックエンドとフロントエンドを一つのコンテナ内に同梱し、Nginxによってルーティングと静的ファイル提供を両立 |

