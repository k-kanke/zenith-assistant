package controllers

import (
	"github/k-kanke/backend/services"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

func GetEvents(c *gin.Context) {
	// 開始・終了時刻をクエリから取得
	start := c.Query("start")
	end := c.Query("end")
	log.Println("こんにちは")

	if start == "" || end == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start and end query parameters required"})
		return
	}

	// Authorizationヘッダーからトークンを取り出す
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
		return
	}

	accessToken := strings.TrimPrefix(authHeader, "Bearer ")

	// Cookieからアクセストークンを取得
	{ /*
			accessToken, err := c.Cookie("access_token")
			if err != nil || accessToken == "" {
				log.Println("[WARN] No access_token cookie:", err)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenicated"})
				return
			}
		*/
	}

	log.Println("こんばんは")

	token := &oauth2.Token{
		AccessToken: accessToken,
		TokenType:   "Bearer",
	}

	events, err := services.GetCalendarEvents(token, start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}
