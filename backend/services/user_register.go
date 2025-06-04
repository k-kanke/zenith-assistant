package services

import (
	"context"
	"log"
	"time"

	"cloud.google.com/go/firestore"
)

func SaveUserToFirestore(ctx context.Context, email, nickname, affiliation string) error {
	log.Println("[SaveUserToFirestore]呼ばれた!")
	app := GetFirestoreClient()
	log.Println("[app]:", app)
	client, err := app.Firestore(ctx)
	log.Println("[client]:", client)
	if err != nil {
		log.Println("[Firestore Init Error]", err)
		return err
	}
	defer client.Close()

	_, err = client.Collection("users").Doc(email).Set(ctx, map[string]interface{}{
		"email":       email,
		"nickname":    nickname,
		"affiliation": affiliation,
		"createdAt":   time.Now(),
	}, firestore.MergeAll)

	if err != nil {
		log.Println("[Firestore Save Error]", err)
	}

	return err
}
