package services

import (
	"context"
	"log"
	"time"

	"google.golang.org/api/iterator"
)

type User struct {
	Email       string    `json:"email"`
	Nickname    string    `json:"nickname"`
	Affiliation string    `json:"affiliation"`
	CreatedAt   time.Time `json:"createdAt"`
}

func GetAllUsers(ctx context.Context) ([]User, error) {
	app := GetFirestoreClient()
	client, err := app.Firestore(ctx)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	iter := client.Collection("users").Documents(ctx)
	var users []User

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Println("Firestore読み込みエラー:", err)
			continue
		}

		var u User
		if err := doc.DataTo(&u); err != nil {
			continue
		}
		users = append(users, u)
	}

	return users, nil
}
