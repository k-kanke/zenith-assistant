package services

import (
	"context"
	"database/sql"
	"github/k-kanke/backend/db"
	"github/k-kanke/backend/utils"
	"time"

	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// トークンをDBから取得するためにキーとしてEmailを利用する
func GetEventsByEmail(email string, start, end time.Time) ([]*calendar.Event, error) {
	var accessToken, refreshToken, tokenType string
	var expiry time.Time

	err := db.DB.QueryRow(`
		SELECT access_token, refresh_token, token_type, expiry 
		FROM tokens WHERE email = $1
	`, email).Scan(&accessToken, &refreshToken, &tokenType, &expiry)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // ユーザー未登録の場合
		}
		return nil, err
	}

	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    tokenType,
		Expiry:       expiry,
	}

	config := utils.GetGoogleOAuthConfig()
	client := config.Client(context.Background(), token)

	srv, err := calendar.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	events, err := srv.Events.List("primary").
		ShowDeleted(false).
		SingleEvents(true).
		TimeMin(start.Format(time.RFC3339)).
		TimeMax(end.Format(time.RFC3339)).
		OrderBy("startTime").
		Do()

	if err != nil {
		return nil, err
	}

	return events.Items, nil
}
