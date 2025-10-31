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
	ID        string                 `json:"id"`
	Title     string                 `json:"title"`
	Data      map[string]interface{} `json:"data"`
	CreatedAt string                 `json:"createdAt"`
	UpdatedAt string                 `json:"updatedAt"`
}

func SaveProject(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	var projectInput ProjectInput
	if err := c.ShouldBindJSON(&projectInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert nodes and edges to JSON
	nodesJSON, err := json.Marshal(projectInput.Data["nodes"])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nodes data"})
		return
	}

	edgesJSON, err := json.Marshal(projectInput.Data["edges"])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid edges data"})
		return
	}

	// Create or update project
	var project models.Project

	// Try to parse frontend ID as uint to check if project exists
	// Note: Frontend may send UUID (string) or numeric ID
	if projectInput.ID != "" {
		var projectID uint
		// Try to find by numeric ID if it's a valid number
		_, err := fmt.Sscanf(projectInput.ID, "%d", &projectID)
		if err == nil {
			// Found valid numeric ID, try to find existing project
			result := initializers.DB.Where("ID = ? AND creator_id = ?", projectID, currentUser.ID).First(&project)
			if result.Error == nil {
				// Update existing project
				project.Title = projectInput.Title
				project.Nodes = datatypes.JSON(nodesJSON)
				project.Edges = datatypes.JSON(edgesJSON)
				if err := initializers.DB.Save(&project).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
					return
				}
				c.JSON(http.StatusOK, gin.H{
					"message": "Project updated successfully",
					"project": project,
				})
				return
			}
		}
	}

	// Create new project (ID not provided or project not found)
	project = models.Project{
		CreatorID:       currentUser.ID,
		CreatorUsername: currentUser.ID, // Note: CreatorUsername is uint in model
		Title:           projectInput.Title,
		Nodes:           datatypes.JSON(nodesJSON),
		Edges:           datatypes.JSON(edgesJSON),
	}

	if err := initializers.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project saved successfully",
		"project": project,
	})
}

func LoadProject(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	// Get project ID from query parameter
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
	result := initializers.DB.Where("ID = ? AND creator_id = ?", projectIDUint, currentUser.ID).First(&project)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Unmarshal nodes and edges from JSON
	var nodes interface{}
	var edges interface{}

	if len(project.Nodes) > 0 {
		if err := json.Unmarshal(project.Nodes, &nodes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse nodes"})
			return
		}
	}

	if len(project.Edges) > 0 {
		if err := json.Unmarshal(project.Edges, &edges); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse edges"})
			return
		}
	}

	// Return project in ChiveProject format
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
	CreatorUsername uint   `json:"creatorUsername"`
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

	// Get project ID from query parameter
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
