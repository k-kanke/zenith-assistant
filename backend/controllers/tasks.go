package controllers

import (
	"context"
	"github/k-kanke/backend/services"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// タスク作成
func CreateTaskHandler(c *gin.Context) {
	var req struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "メッセージが必要です"})
		return
	}

	title := req.Message // 今回はそのまま使用する

	err := services.CreateTask(context.Background(), title)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "タスクの作成に失敗しまいた"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "タスクを追加しました", "title": title})
}

// タスク取得
func GetUpcomingTasksHandler(c *gin.Context) {
	// log.Println("aaaaaa")
	log.Println("[GET TASKS] called")
	tasks, err := services.GetUpcomingTasks(context.Background())
	if err != nil {
		log.Printf("[GET TASKS] エラー: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "タスクの取得に失敗しました"})
		return
	}

	log.Printf("[GET TASKS] 取得件数: %d", len(tasks))
	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}
