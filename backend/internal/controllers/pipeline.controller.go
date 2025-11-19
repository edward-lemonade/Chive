package controllers

import (
	"edward-lemonade/chive/internal/cv_service"
	"edward-lemonade/chive/internal/initializers"
	"edward-lemonade/chive/internal/models"
	"edward-lemonade/chive/internal/utils"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func Pipe(c *gin.Context) {
	user, exists := c.Get("currentUser")
	if !exists {
		fmt.Print("User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	// Verify project access
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
	projectResult := initializers.DB.Where("ID = ? AND creator_id = ?", projectIDUint, currentUser.ID).First(&project)
	if projectResult.Error != nil {
		fmt.Print("Project not found")
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Form
	form, err := c.MultipartForm()
	if err != nil {
		fmt.Print("Failed to parse form data")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	// Retrieve images
	files := form.File["images"]
	if len(files) == 0 {
		fmt.Print("No images uploaded")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No images uploaded"})
		return
	}

	// Retrieve pipeline data
	dataValues := form.Value["data"]
	if len(dataValues) == 0 {
		fmt.Print("Pipeline data not provided")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pipeline data not provided"})
		return
	}
	var pipelineData models.PipelineData
	if err := json.Unmarshal([]byte(dataValues[0]), &pipelineData); err != nil {
		fmt.Print("Failed to parse pipeline data JSON: ", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pipeline data JSON", "details": err.Error()})
		return
	}

	// Prepare file readers and names
	var fileReaders []io.Reader
	var filenames []string
	var openFiles []*multipart.File

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		openFiles = append(openFiles, &file)
		fileReaders = append(fileReaders, file)
		filenames = append(filenames, fileHeader.Filename)
	}

	// Close all files when done
	defer func() {
		for _, file := range openFiles {
			(*file).Close()
		}
	}()

	job, err := cv_service.SubmitJob(fileReaders, filenames, pipelineData)
	if err != nil {
		fmt.Print("Failed to submit job")
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to submit job: %v", err)})
		return
	}

	// Wait for result with timeout
	select {
	case result := <-job.ResultChan:
		defer cv_service.CleanupJobFiles(result.JobID)

		if result.Error != nil {
			fmt.Printf("Processing failed: %v", result.Error)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Processing failed: %v", result.Error)})
			return
		}

		zipBuffer, err := utils.CreateZipFromFiles(result.OutputFiles)
		if err != nil {
			fmt.Print("Failed to create ZIP")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ZIP"})
			return
		}

		c.Header("Content-Type", "application/zip")
		c.Header("Content-Disposition", "attachment; filename=processed_images.zip")
		c.Data(http.StatusOK, "application/zip", zipBuffer.Bytes())

	case <-time.After(5 * time.Minute): // 5 minute timeout
		fmt.Print("Processing timeout")
		c.JSON(http.StatusRequestTimeout, gin.H{"error": "Processing timeout"})
		return
	}

}
