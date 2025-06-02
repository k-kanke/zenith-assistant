package main

import (
	"github/k-kanke/backend/routes"
	"github/k-kanke/backend/services"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println(".env ファイルが読み込めませんでした")
	}

	services.InitFirestore()
	r := routes.SetupRoutes()
	r.Run(":8080")
}
