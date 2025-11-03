package main

import (
	"edward-lemonade/chive/internal/initializers"
	"edward-lemonade/chive/internal/models"
)

func init() {
	initializers.LoadEnvs()
	initializers.ConnectDB()
}

func main() {
	initializers.DB.AutoMigrate(
		&models.User{},
		&models.Project{},
	)
}
