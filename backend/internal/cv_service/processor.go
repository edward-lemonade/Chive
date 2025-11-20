package cv_service

import (
	"edward-lemonade/chive/internal/models"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type ProcessingResult struct {
	JobID       string
	OutputFiles []string
	Error       error
}

var cvExePath string

func init() {
	cwd, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	cvExePath = filepath.Join(cwd, "..", "cv", "build", "cv.exe")
}

// handles the entire pipeline (internal, called by workers)
func HandleImageBatch(uploadedFiles []io.Reader, filenames []string, pipeline models.PipelineData) (*ProcessingResult, error) {
	jobID := uuid.New().String()

	inputDir := filepath.Join("..", "input", jobID)
	outputDir := filepath.Join("..", "output", jobID)

	if err := os.MkdirAll(inputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create input directory: %v", err)
	}
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	// save uploaded files
	var inputPaths []string
	for i, file := range uploadedFiles {
		if !isImageFile(filenames[i]) {
			fmt.Printf("Not image file: %v", filenames[i])
			continue
		}

		destPath := filepath.Join(inputDir, filenames[i])
		destFile, err := os.Create(destPath)
		if err != nil {
			fmt.Printf("Failed to create input file %v: %v", filenames[i], err)
			continue
		}

		_, err = io.Copy(destFile, file)
		destFile.Close()

		if err != nil {
			fmt.Printf("Failed to move input file %v: %v", filenames[i], err)
			continue
		}

		inputPaths = append(inputPaths, destPath)
	}

	if len(inputPaths) == 0 {
		CleanupJobFiles(jobID)
		return nil, fmt.Errorf("no valid image files provided")
	}

	// process images
	err := executePipelineOnBatch(inputPaths, outputDir, pipeline)
	if err != nil {
		CleanupJobFiles(jobID)
		return nil, fmt.Errorf("processing failed: %v", err)
	}

	// collect output file paths
	var outputFiles []string
	for _, filename := range filenames {
		if isImageFile(filename) {
			outputPath := filepath.Join(outputDir, filename)
			if _, err := os.Stat(outputPath); err == nil {
				outputFiles = append(outputFiles, outputPath)
			}
		}
	}

	return &ProcessingResult{
		JobID:       jobID,
		OutputFiles: outputFiles,
	}, nil
}

// CleanupJobFiles removes input and output directories for a job
func CleanupJobFiles(jobID string) error {
	inputDir := filepath.Join("..", "input", jobID)
	outputDir := filepath.Join("..", "output", jobID)

	var errs []error

	if err := os.RemoveAll(inputDir); err != nil {
		errs = append(errs, fmt.Errorf("failed to remove input dir: %v", err))
	}

	if err := os.RemoveAll(outputDir); err != nil {
		errs = append(errs, fmt.Errorf("failed to remove output dir: %v", err))
	}

	if len(errs) > 0 {
		return fmt.Errorf("cleanup errors: %v", errs)
	}
	return nil
}

func executePipelineOnBatch(imagePaths []string, outputDir string, pipeline models.PipelineData) error {
	if len(imagePaths) == 0 {
		return nil
	}

	// Convert all paths to absolute paths
	var absolutePaths []string
	for _, path := range imagePaths {
		absPath, err := filepath.Abs(path)
		if err != nil {
			return fmt.Errorf("failed to get absolute path for %s: %v", path, err)
		}
		absolutePaths = append(absolutePaths, absPath)
	}
	absOutputDir, err := filepath.Abs(outputDir)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for output dir: %v", err)
	}

	pipelineJSONBytes, err := json.Marshal(pipeline)
	if err != nil {
		return fmt.Errorf("failed to marshal pipeline string %s: %v", pipeline, err)
	}
	pipelineJSONString := string(pipelineJSONBytes)

	fmt.Println(pipelineJSONString)

	args := []string{"--output", absOutputDir, "--input"}
	args = append(args, absolutePaths...)
	args = append(args, "--pipeline", pipelineJSONString)

	cmd := exec.Command(cvExePath, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return fmt.Errorf("cv.exe failed: %v, output: %s", err, string(output))
	}

	return nil
}

func isImageFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".bmp"
}
