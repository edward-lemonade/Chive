package cv_service

import (
	"edward-lemonade/chive/internal/models"
	"io"
	"log"
	"sync"

	"github.com/google/uuid"
)

type Job struct {
	ID            string
	UploadedFiles []io.Reader
	Filenames     []string
	Pipeline      models.PipelineData
	ResultChan    chan *ProcessingResult // Channel to send result back
}

var (
	jobQueue      chan *Job
	workers       int
	queueInitOnce sync.Once
)

func InitQueue(numWorkers int, queueSize int) {
	queueInitOnce.Do(func() {
		workers = numWorkers
		jobQueue = make(chan *Job, queueSize)

		for i := 0; i < workers; i++ {
			go worker(i)
		}

		log.Printf("Initialized CV processing queue with %d workers and buffer size %d", numWorkers, queueSize)
	})
}

// worker processes jobs from the queue
func worker(id int) {
	log.Printf("CV Worker %d started", id)

	for job := range jobQueue {
		log.Printf("Worker %d processing job %s", id, job.ID)

		result := processJob(job)
		job.ResultChan <- result

		log.Printf("Worker %d completed job %s", id, job.ID)
	}
}
func processJob(job *Job) *ProcessingResult {
	result, err := HandleImageBatch(job.UploadedFiles, job.Filenames, job.Pipeline)
	if err != nil {
		return &ProcessingResult{
			JobID: job.ID,
			Error: err,
		}
	}
	return result
}

// SubmitJob adds a job to the queue and returns a channel to receive the result
func SubmitJob(uploadedFiles []io.Reader, filenames []string, pipeline models.PipelineData) (*Job, error) {
	job := &Job{
		ID:            generateJobID(),
		UploadedFiles: uploadedFiles,
		Filenames:     filenames,
		Pipeline:      pipeline,
		ResultChan:    make(chan *ProcessingResult, 1), // Buffered channel
	}

	jobQueue <- job
	log.Printf("Job %s added to queue", job.ID)

	return job, nil
}

func generateJobID() string {
	return uuid.New().String()
}
