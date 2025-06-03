package controllers

import (
	"github/k-kanke/backend/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"google.golang.org/api/calendar/v3"
)

func GetEventsMultipleUsers(c *gin.Context) {
	emails := c.QueryArray("email")
	startStr := c.Query("start")
	endStr := c.Query("end")

	if len(emails) == 0 || startStr == "" || endStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing parameters"})
		return
	}

	start, err1 := time.Parse(time.RFC3339, startStr)
	end, err2 := time.Parse(time.RFC3339, endStr)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format (use RFC3339)"})
		return
	}

	result := make(map[string][]*calendar.Event)

	for _, email := range emails {
		token, err := services.GetValidTokenByEmail(email)
		if err != nil {
			result[email] = nil
			continue
		}
		events, err := services.GetCalendarEvents(token, start, end)
		if err != nil {
			result[email] = nil
			continue
		}
		result[email] = events
	}

	c.JSON(http.StatusOK, gin.H{"events": result})
}
