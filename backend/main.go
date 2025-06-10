package main

import (
	"github/k-kanke/backend/db"
	"github/k-kanke/backend/routes"
	"github/k-kanke/backend/services"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("Failed to load .env file")
		}
	}

	if err := db.InitDB(); err != nil {
		log.Fatal("DB接続に失敗しました:", err)
	}

	services.InitFirestore()
	r := routes.SetupRoutes()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("サーバー起動 :", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("サーバー起動失敗 :", err)
	}
}
