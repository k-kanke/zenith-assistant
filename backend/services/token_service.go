package services

import (
	"github/k-kanke/backend/db"
	"log"
	"time"
)

func SaveToken(email, accessToken, refreshToken, tokenType string, expiry time.Time) error {
	log.Println("[SaveToken] token保存処理開始")
	_, err := db.DB.Exec(`
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
