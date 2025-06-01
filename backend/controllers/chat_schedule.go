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

func HandleScheduleChat(c *gin.Context) {
	log.Println("aaaaaaaaa")
	var req struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("[ERROR] メッセージのバインドに失敗:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message"})
		return
	}

	log.Println("[DEBUG] メッセージ内容:", req.Message)

	// 🔽 Cookieからアクセストークン取得
	accessToken, err := c.Cookie("access_token")
	if err != nil || accessToken == "" {
		log.Println("[ERROR] Cookieからaccess_token取得失敗:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "アクセストークンが見つかりません"})
		return
	}

	token := &oauth2.Token{
		AccessToken: accessToken,
		TokenType:   "Bearer",
	}

	// 🔍 例：「6月5日の10時から11時でMTG」
	title, start, end, err := parseMessageSimple(req.Message)
	if err != nil {
		log.Println("[ERROR] メッセージ解析に失敗:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not parse message"})
		return
	}

	log.Printf("[INFO] 予定を作成します: %s %s〜%s\n", title, start.Format(time.RFC3339), end.Format(time.RFC3339))

	if err := services.CreateCalendarEvent(token, title, start, end); err != nil {
		log.Println("[ERROR] Google Calendar 予定作成に失敗:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "予定を追加しました", "title": title})
}

// クエリから予定を登録するために必要な情報を返す
func parseMessageSimple(msg string) (title string, start, end time.Time, err error) {
	log.Println("[DEBUG] メッセージ内容:", msg)

	// 正規表現で抽出(追々AIを組み込んで柔軟に対応する)
	re := regexp.MustCompile(`(?P<month>\d{1,2})月(?P<day>\d{1,2})日の(?P<startHour>\d{1,2})時から(?P<endHour>\d{1,2})時(?:まで)?(?P<title>.+)`)
	matches := re.FindStringSubmatch(msg)

	if len(matches) < 6 {
		log.Println("[ERROR] メッセージからの抽出に失敗")
		return "", time.Time{}, time.Time{}, fmt.Errorf("format error")
	}

	now := time.Now()
	year := now.Year()

	month, _ := strconv.Atoi(matches[1])
	day, _ := strconv.Atoi(matches[2])
	startHour, _ := strconv.Atoi(matches[3])
	endHour, _ := strconv.Atoi(matches[4])
	title = matches[5]

	location := time.Local
	start = time.Date(year, time.Month(month), day, startHour, 0, 0, 0, location)
	end = time.Date(year, time.Month(month), day, endHour, 0, 0, 0, location)

	log.Printf("[DEBUG] title: %s, start: %s, end: %s\n", title, start.Format(time.RFC3339), end.Format(time.RFC3339))
	return title, start, end, nil
}
