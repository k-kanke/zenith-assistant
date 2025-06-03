package services

import (
	"database/sql"
	"fmt"
	"github/k-kanke/backend/db"
	"time"

	"golang.org/x/oauth2"
)

func GetTokenByEmail(email string) (*oauth2.Token, error) {
	row := db.DB.QueryRow(`
		SELECT access_token, refresh_token, token_type, expiry
		FROM tokens
		WHERE email = $1
	`, email)

	var accessToken, refreshToken, tokenType string
	var expiry time.Time

	err := row.Scan(&accessToken, &refreshToken, &tokenType, &expiry)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no token found for email: %s", email)
	} else if err != nil {
		return nil, err
	}

	token := &oauth2.Token{
		AccessToken:  accessToken,
		TokenType:    tokenType,
		RefreshToken: refreshToken,
		Expiry:       expiry,
	}
	return token, nil
}
