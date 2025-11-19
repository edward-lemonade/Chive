package models

import (
	"time"

	"gorm.io/datatypes"
)

type PipelineData struct {
	Nodes []interface{} `json:"nodes"`
	Edges []interface{} `json:"edges"`
}

// DATABASE SCHEMA
type Project struct {
	ID              uint           `json:"id" gorm:"primary_key"`
	CreatorID       uint           `json:"creatorId"`
	CreatorUsername string         `json:"creatorUsername"`
	Title           string         `json:"title"`
	Data            datatypes.JSON `json:"data" gorm:"type:json"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// SLICES
type ProjectInput struct {
	ID        uint         `json:"id"`
	Title     string       `json:"title"`
	Data      PipelineData `json:"data"`
	CreatedAt string       `json:"createdAt"`
	UpdatedAt string       `json:"updatedAt"`
}
type ProjectInfo struct {
	ID              uint   `json:"id"`
	CreatorID       uint   `json:"creatorId"`
	CreatorUsername string `json:"creatorUsername"`
	Title           string `json:"title"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}
