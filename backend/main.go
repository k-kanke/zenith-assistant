package main

import (
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

	services.InitFirestore()
	r := routes.SetupRoutes()
	log.Println("Server running on :8080")
	e := r.Run(":8080")
	if e != nil {
		log.Fatal("Failed to start setver:", e)
	}
}
