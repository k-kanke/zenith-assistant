package routes

import (
	"github/k-kanke/backend/controllers"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			// "http://localhost:3000",
			"https://zenith-assistant-229406209956.asia-northeast1.run.app",
		},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	log.Println("[debug]:", os.Getenv("GOOGLE_REDIRECT_URL"))

	api := r.Group("/api")
	{
		// ヘルスチェック
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "pong"})
		})

		// チャット機能
		api.POST("/chat", controllers.ChatHandler)

		// 認証関連
		api.GET("/auth/google/login", controllers.GoogleLogin)
		api.GET("/auth/google/callback", controllers.GoogleCallback)
		api.GET("/auth/check", controllers.CheckLogin)

		// カレンダーAPI(DBからトークンを取得してそれを利用する方式)
		calendardb := api.Group("/calendar/db")
		{
			calendardb.GET("/group/get", controllers.GetEventsByEmail)       // emailからその人の予定を取得
			calendardb.POST("/group/create", controllers.CreateEventByEmail) // emailから予定を登録
			calendardb.GET("/group/multi", controllers.GetEventsMultipleUsers)
			calendardb.GET("/group/free", controllers.GetFreeSlots)    // 空き時間を取得
			calendardb.POST("/parse", controllers.ParseScheduleIntent) // 予定登録の初期情報をクエリから抽出
		}

		// firestoreにユーザー情報保存
		user := api.Group("/user")
		{
			user.POST("/register", controllers.RegisterUserHandler) // user情報をfirestoreに保存
			user.GET("/get/info", controllers.GetAllUsersHandler)   // firestoreに保存されているユーザー情報を取得
		}

		// GeminiAPI
		api.POST("/gemini/route", controllers.GeminiRouteHandler)

		// カレンダーAPI(Cookieからトークンを取得)
		calendar := api.Group("/calendar")
		{
			calendar.POST("/events", controllers.GetEvents)          // 指定した日時の予定を取得
			calendar.POST("/events/create", controllers.CreateEvent) // 予定の新規登録
		}

		// タスクAPI
		tasks := api.Group("/tasks")
		{
			tasks.POST("/create", controllers.CreateTaskHandler)
			tasks.POST("/upcoming", controllers.GetUpcomingTasksHandler)
			tasks.POST("/complete", controllers.CompleteTaskHandler)
		}
	}

	return r
}
