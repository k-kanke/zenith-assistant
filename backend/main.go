package main

import (
	"github/k-kanke/backend/routes"
)

func main() {
	r := routes.SetupRoutes()

	r.Run(":8080")
}
