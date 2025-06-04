package controllers

import (
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
)

func ParseScheduleIntent(c *gin.Context) {
	var req struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	message := req.Message

	// タイトル抽出（簡易的に「会議」とする）
	title := "会議"

	// email抽出
	emailRegex := regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`)
	emails := emailRegex.FindAllString(message, -1)

	// 日時抽出
	t := time.Now()
	// layout := "2006-01-02T15:04:05+09:00"
	start := time.Date(t.Year(), 6, 5, 15, 0, 0, 0, time.FixedZone("JST", 9*60*60)) // 固定値で仮実装
	end := start.Add(1 * time.Hour)

	// 実際はクエリからAIでかくパラメータ抽出

	// レスポンス
	c.JSON(http.StatusOK, gin.H{
		"title":  title,
		"start":  start.Format(time.RFC3339),
		"end":    end.Format(time.RFC3339),
		"emails": emails,
	})

}
