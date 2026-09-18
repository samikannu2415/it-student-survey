package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PollOption represents a single voteable choice in a poll.
type PollOption struct {
	ID    string `bson:"id" json:"id"`
	Text  string `bson:"text" json:"text"`
	Votes int64  `bson:"votes" json:"votes"`
}

// Poll is the top-level document stored in MongoDB.
type Poll struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Question  string             `bson:"question" json:"question"`
	Options   []PollOption       `bson:"options" json:"options"`
	IsActive  bool               `bson:"is_active" json:"is_active"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// VotePayload is what the frontend sends when casting a vote.
type VotePayload struct {
	PollID   string `json:"poll_id" binding:"required"`
	OptionID string `json:"option_id" binding:"required"`
}

// PollUpdateEvent is broadcast over Redis Pub/Sub to all connected clients.
type PollUpdateEvent struct {
	PollID  string       `json:"poll_id"`
	Options []PollOption `json:"options"`
}
