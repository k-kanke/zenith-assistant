package services

import (
	"context"
	"github/k-kanke/backend/utils"
	"time"

	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// トークンを受け取り、イベント一覧を取得する
func GetCalendarEvents(_ *oauth2.Token, start, end string) ([]*calendar.Event, error) {
	ctx := context.Background()
	config := utils.GetGoogleOAuthConfig()

	// あとで保存先から取得
	accessToken := ""

	token := &oauth2.Token{
		AccessToken: accessToken,
		TokenType:   "Bearer",
	}

	client := config.Client(ctx, token)

	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	events, err := srv.Events.List("primary").
		ShowDeleted(false).
		SingleEvents(true).
		TimeMin(start).
		TimeMax(end).
		OrderBy("startTime").
		Do()

	if err != nil {
		return nil, err
	}

	return events.Items, nil
}

func CreateCalendarEvent(token *oauth2.Token, title string, start, end time.Time) error {
	ctx := context.Background()
	config := utils.GetGoogleOAuthConfig()
	client := config.Client(ctx, token)

	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return err
	}

	event := &calendar.Event{
		Summary: title,
		Start:   &calendar.EventDateTime{DateTime: start.Format(time.RFC3339)},
		End:     &calendar.EventDateTime{DateTime: end.Format(time.RFC3339)},
	}

	_, err = srv.Events.Insert("primary", event).Do()
	return err
}
