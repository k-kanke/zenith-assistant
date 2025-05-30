package controllers

import (
	"github/k-kanke/backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ChatHandler(c *gin.Context) {
	var req models.ChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	resp := models.ChatResponse{
		Reply: "受け取ったメッセージ: " + req.Message,
	}
	c.JSON(http.StatusOK, resp)
}
