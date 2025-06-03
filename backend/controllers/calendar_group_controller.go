package controllers

import (
	"github/k-kanke/backend/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// メールアドレスを指定して予定を取得するエンドポイント
func GetEventsByEmail(c *gin.Context) {
	email := c.Query("email")
	log.Println("呼び出されたemail: ", email)
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "メールアドレスが必要です"})
		return
	}

	start := time.Now()
	end := start.Add(24 * time.Hour)

	events, err := services.GetEventsByEmail(email, start, end)
	if err != nil {
		log.Println("[Error] イベント取得失敗:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "カレンダー取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}
