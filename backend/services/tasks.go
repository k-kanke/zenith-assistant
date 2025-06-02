package services

import (
	"context"
	"time"
)

type Task struct {
	Title     string    `firestore:"title"`
	Status    string    `firestore:"status"`
	CreatedAt time.Time `firestore:"createdAt"`
}

// タスクを作成
func CreateTask(ctx context.Context, title string) error {
	app := GetFirestoreClient()
	client, err := app.Firestore(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	_, _, err = client.Collection("tasks").Add(ctx, Task{
		Title:     title,
		Status:    "pending",
		CreatedAt: time.Now(),
	})

	return err
}
