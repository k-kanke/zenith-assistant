package controllers

import (
	"context"
	"github/k-kanke/backend/services"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterUserHandler(c *gin.Context) {
	log.Println("[RegisterUserHandler]呼ばれた")
	var req struct {
		Email       string `json:"email"`
		Nickname    string `json:"nickname"`
		Affiliation string `json:"affiliation"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力データが不正です"})
		return
	}

	err := services.SaveUserToFirestore(context.Background(), req.Email, req.Nickname, req.Affiliation)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Firestoreへの保存に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ユーザーを登録しました"})
}
