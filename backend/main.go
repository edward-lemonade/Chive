package main

import (
	"edward-lemonade/chive/internal/controllers"
	"edward-lemonade/chive/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.New() // Gin router
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	router.POST("/auth/signup", controllers.CreateUser)
	router.POST("/auth/login", controllers.Login)
	router.GET("/user/profile", middlewares.CheckAuth, controllers.GetUserProfile)

	// Project routes
	router.POST("/projects/save", middlewares.CheckAuth, controllers.SaveProject)
	router.GET("/projects/load", middlewares.CheckAuth, controllers.LoadProject)
	router.GET("/projects/info", middlewares.CheckAuth, controllers.GetProjectInfo)
	router.GET("/projects/infos", middlewares.CheckAuth, controllers.GetProjectInfos)

	router.Run()
}
