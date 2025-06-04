package controllers

import (
	"context"
	"github/k-kanke/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAllUsersHandler(c *gin.Context) {
	users, err := services.GetAllUsers(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー一覧の取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
