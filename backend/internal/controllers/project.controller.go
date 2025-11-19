package controllers

import (
	"edward-lemonade/chive/internal/initializers"
	"edward-lemonade/chive/internal/models"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

func SaveProject(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		fmt.Print("User not authenticated")
		return
	}

	currentUser := user.(models.User)

	var projectInput models.ProjectInput
	if err := c.ShouldBindJSON(&projectInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format", "details": err.Error()})
		fmt.Print("Error binding JSON: ", err.Error())
		return
	}

	dataBytes, err := json.Marshal(projectInput.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal project data"})
		fmt.Print("Failed to marshal project data: ", err.Error())
		return
	}

	var project models.Project

	// If ID is non-zero, try to find and update existing project
	if projectInput.ID != 0 {
		result := initializers.DB.Where("ID = ? AND creator_id = ?", projectInput.ID, currentUser.ID).First(&project)
		if result.Error == nil {
			// Update existing project
			project.Title = projectInput.Title
			project.Data = datatypes.JSON(dataBytes)
			if err := initializers.DB.Save(&project).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
				fmt.Print("Failed to update project: ", err.Error())
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"message": "Project updated successfully",
				"project": gin.H{
					"id":        project.ID,
					"title":     project.Title,
					"createdAt": project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
					"updatedAt": project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				},
			})
			return
		}
	}

	// Create new project (ID not provided or project not found)
	project = models.Project{
		CreatorID:       currentUser.ID,
		CreatorUsername: currentUser.Username,
		Title:           projectInput.Title,
		Data:            datatypes.JSON(dataBytes),
	}

	if err := initializers.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save project"})
		fmt.Print("Failed to save project")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project saved successfully",
		"project": gin.H{
			"id":        project.ID,
			"title":     project.Title,
			"createdAt": project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			"updatedAt": project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	})
}

func LoadProject(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		fmt.Print("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	projectID := c.Query("id")
	if projectID == "" {
		fmt.Print("Project ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project ID is required"})
		return
	}

	var projectIDUint uint
	if _, err := fmt.Sscanf(projectID, "%d", &projectIDUint); err != nil {
		fmt.Print("Invalid project ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var project models.Project
	result := initializers.DB.Where("ID = ? AND creator_id = ?", projectIDUint, currentUser.ID).First(&project)

	if result.Error != nil {
		fmt.Print("Project not found")
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// ChiveProject format
	c.JSON(http.StatusOK, gin.H{
		"id":        project.ID,
		"title":     project.Title,
		"data":      project.Data,
		"createdAt": project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		"updatedAt": project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

func GetProjectInfo(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	projectID := c.Query("projectId")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project ID is required"})
		return
	}

	var projectIDUint uint
	if _, err := fmt.Sscanf(projectID, "%d", &projectIDUint); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var project models.Project
	result := initializers.DB.Select("ID", "CreatorID", "CreatorUsername", "Title", "CreatedAt", "UpdatedAt").
		Where("ID = ? AND creator_id = ?", projectIDUint, currentUser.ID).
		First(&project)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	projectInfo := models.ProjectInfo{
		ID:              project.ID,
		CreatorID:       project.CreatorID,
		CreatorUsername: project.CreatorUsername,
		Title:           project.Title,
		CreatedAt:       project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:       project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	c.JSON(http.StatusOK, gin.H{
		"project": projectInfo,
	})
}
func GetProjectInfos(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	var projects []models.Project
	result := initializers.DB.Select("ID", "CreatorID", "CreatorUsername", "Title", "CreatedAt", "UpdatedAt").
		Where("creator_id = ?", currentUser.ID).
		Order("updated_at DESC").
		Find(&projects)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	projectInfos := make([]models.ProjectInfo, len(projects))
	for i, project := range projects {
		projectInfos[i] = models.ProjectInfo{
			ID:              project.ID,
			CreatorID:       project.CreatorID,
			CreatorUsername: project.CreatorUsername,
			Title:           project.Title,
			CreatedAt:       project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:       project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projectInfos,
	})
}
