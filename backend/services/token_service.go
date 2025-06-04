package services

import (
	"context"
	"github/k-kanke/backend/db"
	"github/k-kanke/backend/utils"
	"log"
	"time"

	"golang.org/x/oauth2"
)

func GetValidTokenByEmail(email string) (*oauth2.Token, error) {
	log.Println("[GetValidTokenByEmail] 呼ばれた!! ")
	row := db.DB.QueryRow(`
		SELECT access_token, refresh_token, token_type, expiry
		FROM tokens WHERE email = $1
	`, email)

	var (
		accessToken, refreshToken, tokenType string
		expiry                               time.Time
	)

	if err := row.Scan(&accessToken, &refreshToken, &tokenType, &expiry); err != nil {
		return nil, err
	}

	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    tokenType,
		Expiry:       expiry,
	}

	// 有効期限チェック
	if token.Valid() {
		return token, nil
	}

	log.Println("古いトークン:", token)

	// 有効期限切れ → 更新
	config := utils.GetGoogleOAuthConfig()
	log.Println("[config]:", config)

	ts := config.TokenSource(context.Background(), token)
	log.Println("[ts]:", ts)

	newToken, err := ts.Token()
	if err != nil {
		return nil, err
	}

	log.Println("新しいトークン:", newToken)

	// 新しいトークンでDB更新
	if err := db.SaveToken(email, newToken.AccessToken, newToken.RefreshToken, newToken.TokenType, newToken.Expiry); err != nil {
		return nil, err
	}

	return newToken, nil
}
