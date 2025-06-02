package services

import (
	"context"
	"time"
)

type Task struct {
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	DueDate   time.Time `json:"dueDate,omitempty"`
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

// 登録されているタスクを取得
func GetUpcomingTasks(ctx context.Context) ([]Task, error) {
	app := GetFirestoreClient()
	client, err := app.Firestore(ctx)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	iter := client.Collection("tasks").
		Where("status", "==", "pending").
		Documents(ctx)

	var tasks []Task
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var task Task
		if err := doc.DataTo(&task); err == nil {
			tasks = append(tasks, task)
		}
	}

	// log.Println("task: ", tasks)

	return tasks, nil
}
