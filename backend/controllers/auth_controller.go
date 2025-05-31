package controllers

import (
	"context"
	"github/k-kanke/backend/utils"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	oauth2api "google.golang.org/api/oauth2/v2" // 名前の衝突解消のためoauth2apiとしてimport
	"google.golang.org/api/option"
)

func GoogleLogin(c *gin.Context) {
	config := utils.GetGoogleOAuthConfig()

	url := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	log.Println("[DEBUG] Redirecting to Google Auth URL:", url)

	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code not found"})
		return
	}

	config := utils.GetGoogleOAuthConfig()

	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token exchange failed"})
		return
	}

	client := config.Client(context.Background(), token)
	service, err := oauth2api.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuth2 service init failed"})
		return
	}

	userinfo, err := service.Userinfo.Get().Do()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Get user info failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ログイン成功",
		"email":   userinfo.Email,
		"token":   token,
	})
}
