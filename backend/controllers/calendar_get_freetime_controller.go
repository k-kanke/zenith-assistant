package controllers

import (
	"github/k-kanke/backend/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetFreeSlots(c *gin.Context) {
	// クエリからemail取得
	emails := c.QueryArray("email")
	if len(emails) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "emailが必要です"})
		return
	}

	// 開始・終了日時取得
	startStr := c.Query("start")
	endStr := c.Query("end")

	start, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		log.Println("[start]:", start)
		c.JSON(http.StatusBadRequest, gin.H{"error": "startの形式が不正です"})
		return
	}

	end, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "endの形式が不正です"})
		return
	}

	// 空き時間を取得
	slots, err := services.CalculateFreeSlots(emails, start, end)
	if err != nil {
		log.Println("[GetFreeSlots] 空き時間の取得エラー:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "空き時間の取得に失敗しました"})
		return
	}

	log.Println("[slots]: ", slots)

	c.JSON(http.StatusOK, gin.H{"free_slots": slots})
}
