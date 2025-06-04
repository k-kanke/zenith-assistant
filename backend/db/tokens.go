package db

import (
	"context"
	"database/sql"
	"github/k-kanke/backend/utils"
	"log"
	"time"

	"golang.org/x/oauth2"
)

func SaveToken(email, accessToken, refreshToken, tokenType string, expiry time.Time) error {
	log.Println("[SaveToken] token保存処理開始")
	_, err := DB.Exec(`
		INSERT INTO tokens (email, access_token, refresh_token, token_type, expiry)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (email) DO UPDATE 
		SET access_token = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			token_type = EXCLUDED.token_type,
			expiry = EXCLUDED.expiry
	`, email, accessToken, refreshToken, tokenType, expiry)

	if err != nil {
		log.Println("[SaveToken] エラー:", err)
	}
	return err
}

func GetValidTokenByEmail(email string) (*oauth2.Token, error) {
	row := DB.QueryRow(`
		SELECT access_token, refresh_token, token_type, expiry
		FROM tokens WHERE email = $1
	`, email)

	var accessToken, refreshToken, tokenType string
	var expiry time.Time

	if err := row.Scan(&accessToken, &refreshToken, &tokenType, &expiry); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // トークンなし
		}
		return nil, err
	}

	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    tokenType,
		Expiry:       expiry,
	}

	if token.Valid() {
		return token, nil
	}

	// トークン更新
	config := utils.GetGoogleOAuthConfig()
	newToken, err := config.TokenSource(context.Background(), token).Token()
	if err != nil {
		log.Println("[GetValidTokenByEmail] token refresh 失敗:", err)
		return nil, err
	}

	// DB更新
	err = SaveToken(email, newToken.AccessToken, newToken.RefreshToken, newToken.TokenType, newToken.Expiry)
	if err != nil {
		log.Println("[GetValidTokenByEmail] token 保存失敗:", err)
		return nil, err
	}

	return newToken, nil
}
