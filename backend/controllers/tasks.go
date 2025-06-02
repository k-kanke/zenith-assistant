package controllers

import (
	"context"
	"github/k-kanke/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

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
