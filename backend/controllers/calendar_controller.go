package controllers

import (
	"fmt"
	"github/k-kanke/backend/services"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

// 予定を取得
func GetEvents(c *gin.Context) {
	var req struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("[Error] メッセージのバインドに失敗", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message"})
		return
	}

	// Cookieからアクセストークンを取得
	accessToken, err := c.Cookie("access_token")
	if err != nil || accessToken == "" {
		log.Println("[Error] Cookieからアクセストークン取得失敗", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "アクセストークンが取得できませんでした"})
		return
	}
	token := &oauth2.Token{
		AccessToken: accessToken,
		TokenType:   "Bearer",
	}

	// ユーザーのメッセージから日付を抽出（関数で。あとで記述）
	date, err := extratDateFromMessage(req.Message)
	if err != nil {
		log.Println("[Error] メッセージからの日付抽出失敗", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付の抽出に失敗しました"})
		return
	}

	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.Local)
	endOfDay := startOfDay.Add(24 * time.Hour)

	// イベント取得
	events, err := services.GetCalendarEvents(token, startOfDay, endOfDay)
	if err != nil {
		log.Println("[Error] カレンダーから予約の読み取り失敗", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}

// 日付抽出関数
func extratDateFromMessage(msg string) (time.Time, error) {
	// 例：「6月5日の予定を教えて」
	re := regexp.MustCompile(`(?P<month>\d{1,2})月(?P<day>\d{1,2})日`)
	matches := re.FindStringSubmatch(msg)
	if len(matches) < 3 {
		return time.Time{}, fmt.Errorf("日付形式が不正です")
	}

	month, _ := strconv.Atoi(matches[1])
	day, _ := strconv.Atoi(matches[2])
	now := time.Now()
	year := now.Year()

	date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.Local)
	return date, nil
}
