package services

import (
	"context"
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

	opt := option.WithCredentialsFile(credPath)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("Firebase 初期化エラー: %v", err)
	}
	firestoreClient = app
}

func GetFirestoreClient() *firebase.App {
	return firestoreClient
}
