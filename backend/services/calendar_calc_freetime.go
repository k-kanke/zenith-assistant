package services

import (
	"context"
	"github/k-kanke/backend/db"
	"github/k-kanke/backend/utils"
	"log"
	"sort"
	"time"

	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type TimeSlot struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

func CalculateFreeSlots(emails []string, start, end time.Time) ([]TimeSlot, error) {
	var allEvents []*calendar.Event

	// 全ユーザーの予定を取得しマージ
	for _, email := range emails {
		log.Println("[開始] 空き時間計算: ", emails)
		token, err := db.GetValidTokenByEmail(email)
		if err != nil {
			log.Println("[トークン作成失敗]", email, err)
			continue
		}

		config := utils.GetGoogleOAuthConfig()
		client := config.Client(context.Background(), token)

		srv, err := calendar.NewService(context.Background(), option.WithHTTPClient(client))
		if err != nil {
			log.Println("[CalculateFreeSlots] サービス生成失敗:", email, err)
			continue
		}

		events, err := srv.Events.List("primary").
			ShowDeleted(false).
			SingleEvents(true).
			TimeMin(start.Format(time.RFC3339)).
			TimeMax(end.Format(time.RFC3339)).
			OrderBy("startTime").
			MaxResults(100).
			Do()
		if err != nil {
			log.Println("[CalculateFreeSlots] イベント取得失敗:", email, err)
			continue
		}

		log.Println("[events]:", events)

		allEvents = append(allEvents, events.Items...)
	}

	// イベントを時刻順にソート
	sort.Slice(allEvents, func(i, j int) bool {
		return allEvents[i].Start.DateTime < allEvents[j].Start.DateTime
	})

	// 空き時間計算
	var freeSlots []TimeSlot
	current := start

	for _, event := range allEvents {
		eventStart, _ := time.Parse(time.RFC3339, event.Start.DateTime)
		eventEnd, _ := time.Parse(time.RFC3339, event.End.DateTime)

		if current.Before(eventStart) {
			freeSlots = append(freeSlots, TimeSlot{
				Start: current.Format(time.RFC3339),
				End:   eventStart.Format(time.RFC3339),
			})
		}
		if current.Before(eventEnd) {
			current = eventEnd
		}
	}

	// 最後の空き時間（予定の後〜endまで）
	if current.Before(end) {
		freeSlots = append(freeSlots, TimeSlot{
			Start: current.Format(time.RFC3339),
			End:   end.Format(time.RFC3339),
		})
	}

	return freeSlots, nil
}
