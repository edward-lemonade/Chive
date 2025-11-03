package main

import (
	"edward-lemonade/chive/internal/controllers"
	"edward-lemonade/chive/internal/initializers"
	"edward-lemonade/chive/internal/middlewares"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	initializers.LoadEnvs()

	initializers.ConnectDB()

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"},
		AllowCredentials: true,
	}))

	// Auth routes
	router.POST("/api/auth/signup", controllers.CreateUser)
	router.POST("/api/auth/login", controllers.Login)
	router.GET("/api/user/profile", middlewares.CheckAuth, controllers.GetUserProfile)

	// Project routes
	router.POST("/api/project/save", middlewares.CheckAuth, controllers.SaveProject)
	router.GET("/api/project/load", middlewares.CheckAuth, controllers.LoadProject)
	router.GET("/api/projects/info", middlewares.CheckAuth, controllers.GetProjectInfo)
	router.GET("/api/projects/infos", middlewares.CheckAuth, controllers.GetProjectInfos)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router.Run(":" + port)
}
