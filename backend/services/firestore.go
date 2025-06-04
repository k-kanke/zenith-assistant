package services

import (
	"context"
	"encoding/json"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

var firestoreClient *firebase.App

func InitFirestore() {
	credPath := os.Getenv("FIREBASE_CREDENTIAL_PATH")
	if credPath == "" {
		log.Fatal("パスが環境変数に設定されておりません")
	}

	// Firebaseサービスアカウントの内容を読み取り
	data, err := os.ReadFile(credPath)
	if err != nil {
		log.Fatalf("キー読み込み失敗: %v", err)
	}

	var cred struct {
		ProjectID string `json:"project_id"`
	}
	if err := json.Unmarshal(data, &cred); err != nil {
		log.Fatalf("project_idの抽出に失敗: %v", err)
	}

	opt := option.WithCredentialsFile(credPath)
	conf := &firebase.Config{ProjectID: cred.ProjectID}

	app, err := firebase.NewApp(context.Background(), conf, opt)
	if err != nil {
		log.Fatalf("Firebase 初期化エラー: %v", err)
	}
	firestoreClient = app
	log.Println("[Firestore初期化]")
}

func GetFirestoreClient() *firebase.App {
	return firestoreClient
}
