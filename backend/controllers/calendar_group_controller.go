package controllers

import (
	"github/k-kanke/backend/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// メールアドレスを指定して予定を取得するエンドポイント
// 期間の始まりと終わりをパラメータで指定できるように
func GetEventsByEmail(c *gin.Context) {
	email := c.Query("email")
	log.Println("呼び出されたemail: ", email)
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "メールアドレスが必要です"})
		return
	}

	startStr := c.DefaultQuery("start", time.Now().Format("2006-01-02"))
	endStr := c.DefaultQuery("end", "")

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date"})
		return
	}

	var end time.Time
	if endStr == "" {
		end = start.Add(24 * time.Hour)
	} else {
		end, err = time.Parse("2006-01-02", endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date"})
			return
		}
	}

	token, err := services.GetValidTokenByEmail(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token not found"})
		return
	}

	events, err := services.GetCalendarEvents(token, start, end)
	if err != nil {
		log.Println("[Error] イベント取得失敗:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "カレンダー取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}

// 複数ユーザーに対してemailから予定を登録
func CreateEventByEmail(c *gin.Context) {
	var req struct {
		Emails []string  `json:"email"`
		Title  string    `json:"title"`
		Start  time.Time `json:"start"`
		End    time.Time `json:"end"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	successList := []string{}
	failedList := map[string]string{}

	for _, email := range req.Emails {
		token, err := services.GetValidTokenByEmail(email)
		if err != nil {
			failedList[email] = "トークンが存在しない、または有効期限切れです"
			continue
		}

		err = services.CreateCalendarEvent(token, req.Title, req.Start, req.End)
		if err != nil {
			failedList[email] = "予定作成に失敗しました"
			continue
		}

		successList = append(successList, email)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "予定の作成に成功しました",
		"successfrl": successList,
		"failed":     failedList,
	})
}
