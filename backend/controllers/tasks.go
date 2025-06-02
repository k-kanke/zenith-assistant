package controllers

import (
	"context"
	"fmt"
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

// タスク完了処理
func CompleteTaskHandler(c *gin.Context) {
	// log.Println("[CompleteTaskHandler] called")

	var req struct {
		Message string `json:"message"` // フロントから来る「3完了」を受け取る
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "メッセージが必要です"})
		return
	}

	// log.Println("[req.Message]: ", req.Message)

	// メッセージから「3完了」のような形式を抽出
	var index int
	_, err := fmt.Sscanf(req.Message, "%d完了", &index)
	if err != nil || index < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "形式が正しくありません。例: 3完了"})
		return
	}
	// log.Println("[index]: ", index)

	// pendingタスク一覧取得
	tasks, err := services.GetUpcomingTasks(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "タスク取得に失敗しました"})
		return
	}

	if index > len(tasks) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "指定された番号のタスクが存在しません"})
		return
	}

	target := tasks[index-1]
	log.Println("[CompleteTask] 対象タイトル:", target.Title)

	err = services.CompleteTask(context.Background(), target.Title)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "タスクの完了に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("「%s」を完了にしました", target.Title)})
}
