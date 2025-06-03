package services

import "github/k-kanke/backend/db"

func SaveUser(email, name string) error {
	_, err := db.DB.Exec(`
		INSERT INTO users (email, name)
		VALUES ($1, $2)
		ON CONFLICT (email) DO NOTHING
	`, email, name)
	return err
}
