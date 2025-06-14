package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {

	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("[env_loader] Failed to load .env file")
		}
	}
}
