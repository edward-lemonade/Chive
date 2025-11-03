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

type ProjectInput struct {
	ID        uint                   `json:"id"`
	Title     string                 `json:"title"`
	Data      map[string]interface{} `json:"data"`
	CreatedAt string                 `json:"createdAt"`
	UpdatedAt string                 `json:"updatedAt"`
}

func SaveProject(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		fmt.Print("User not authenticated")
		return
	}

	currentUser := user.(models.User)

	var projectInput ProjectInput
	if err := c.ShouldBindJSON(&projectInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format", "details": err.Error()})
		fmt.Print("Error binding JSON: ", err.Error())
		return
	}

	// Validate required fields
	if projectInput.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}

	if projectInput.Data == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data field is required"})
		return
	}

	nodesData, ok := projectInput.Data["nodes"]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data must contain 'nodes' field"})
		return
	}
	nodesJSON, err := json.Marshal(nodesData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nodes data", "details": err.Error()})
		fmt.Print("Invalid nodes data: ", err.Error())
		return
	}

	edgesData, ok := projectInput.Data["edges"]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data must contain 'edges' field"})
		return
	}
	edgesJSON, err := json.Marshal(edgesData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid edges data", "details": err.Error()})
		fmt.Print("Invalid edges data: ", err.Error())
		return
	}

	var project models.Project

	// If ID is non-zero, try to find and update existing project
	if projectInput.ID != 0 {
		result := initializers.DB.Where("ID = ? AND creator_id = ?", projectInput.ID, currentUser.ID).First(&project)
		if result.Error == nil {
			// Update existing project
			project.Title = projectInput.Title
			project.Nodes = datatypes.JSON(nodesJSON)
			project.Edges = datatypes.JSON(edgesJSON)
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
		Nodes:           datatypes.JSON(nodesJSON),
		Edges:           datatypes.JSON(edgesJSON),
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

	var nodes interface{}
	var edges interface{}

	if len(project.Nodes) > 0 {
		if err := json.Unmarshal(project.Nodes, &nodes); err != nil {
			fmt.Print("Failed to parse nodes")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse nodes"})
			return
		}
	}

	if len(project.Edges) > 0 {
		if err := json.Unmarshal(project.Edges, &edges); err != nil {
			fmt.Print("Failed to parse edges")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse edges"})
			return
		}
	}

	// ChiveProject format
	c.JSON(http.StatusOK, gin.H{
		"id":    project.ID,
		"title": project.Title,
		"data": gin.H{
			"nodes": nodes,
			"edges": edges,
		},
		"createdAt": project.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		"updatedAt": project.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

type ProjectInfo struct {
	ID              uint   `json:"id"`
	CreatorID       uint   `json:"creatorId"`
	CreatorUsername string `json:"creatorUsername"`
	Title           string `json:"title"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
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

	projectInfo := ProjectInfo{
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

	projectInfos := make([]ProjectInfo, len(projects))
	for i, project := range projects {
		projectInfos[i] = ProjectInfo{
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
