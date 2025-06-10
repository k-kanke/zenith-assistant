package controllers

import (
	"context"
	"github/k-kanke/backend/db"
	"github/k-kanke/backend/services"
	"github/k-kanke/backend/utils"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	oauth2api "google.golang.org/api/oauth2/v2" // 名前の衝突解消のためoauth2apiとしてimport
	"google.golang.org/api/option"
)

// LoginPage.tsx「Googleアカウントでログイン」を押すとこれが最初に呼ばれる
func GoogleLogin(c *gin.Context) {
	log.Println("[GoogleLogin] 呼ばれた!")
	config := utils.GetGoogleOAuthConfig()

	url := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("prompt", "consent"))
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
		log.Println("[GoogleCallback] Token exchange failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token exchange failed"})
		return
	}

	// Googleユーザー情報の取得
	client := config.Client(context.Background(), token)
	service, err := oauth2api.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuth2 service init failed"})
		return
	}

	log.Println("[GoogleCallback] token取得成功:", token.AccessToken)

	userinfo, err := service.Userinfo.Get().Do()
	if err != nil {
		log.Println("[GoogleCallback] Get user info failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Get user info failed"})
		return
	}

	log.Println("[GoogleCallback] userinfo取得成功:", userinfo.Email, userinfo.Name)

	// DBにユーザー登録
	err = services.SaveUser(userinfo.Email, userinfo.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user"})
		return
	}

	log.Println("[GoogleCallback] SaveUser 成功")

	// トークン保存
	err = db.SaveToken(
		userinfo.Email,
		token.AccessToken,
		token.RefreshToken,
		token.TokenType,
		token.Expiry,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save token"})
		return
	}

	log.Println("[GoogleCallback] SaveToken 成功")

	// Cookieに保存してリダイレクト
	// c.SetCookie("access_token", token.AccessToken, 3600, "/", "localhost", false, true)
	// c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000")
}

func CheckLogin(c *gin.Context) {
	_, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"loggedIn": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{"loggedIn": true})
}
