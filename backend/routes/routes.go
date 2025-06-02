package routes

import (
	"github/k-kanke/backend/controllers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// ヘルスチェック
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// チャット機能
	r.POST("/chat", controllers.ChatHandler)

	// 認証関連
	r.GET("/auth/google/login", controllers.GoogleLogin)
	r.GET("/auth/google/callback", controllers.GoogleCallback)
	r.GET("/auth/check", controllers.CheckLogin)

	// カレンダーAPI
	calendar := r.Group("/calendar")
	{
		calendar.POST("/events", controllers.GetEvents)          // 指定した日時の予定を取得
		calendar.POST("/events/create", controllers.CreateEvent) // 予定の新規登録
	}

	// タスクAPI
	tasks := r.Group("/tasks")
	{
		tasks.POST("/create", controllers.CreateTaskHandler)
		tasks.POST("/upcoming", controllers.GetUpcomingTasksHandler)
	}

	return r
}
