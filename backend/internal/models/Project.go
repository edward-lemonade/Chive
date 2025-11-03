package models

import (
	"time"

	"gorm.io/datatypes"
)

type Project struct {
	ID              uint           `json:"id" gorm:"primary_key"`
	CreatorID       uint           `json:"creatorId"`
	CreatorUsername string         `json:"creatorUsername"`
	Title           string         `json:"title"`
	Nodes           datatypes.JSON `json:"nodes" gorm:"type:json"`
	Edges           datatypes.JSON `json:"edges" gorm:"type:json"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
