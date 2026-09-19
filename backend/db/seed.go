package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"live-polling-app/models"
)

const DemoPollQuestion = "Which coding language would you choose if you could learn only ONE?"

func SeedDemoPoll() error {
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	filter := bson.M{"question": DemoPollQuestion}
	var existing models.Poll
	if err := PollsCollection.FindOne(ctx, filter).Decode(&existing); err == nil {
		log.Printf("ℹ️  Demo poll already exists in MongoDB: %s", existing.ID.Hex())
		return nil
	} else if err != mongo.ErrNoDocuments {
		return err
	}

	poll := models.Poll{
		ID:        primitive.NewObjectID(),
		Question:  DemoPollQuestion,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Options: []models.PollOption{
			{ID: "python", Text: "Python 🐍", Votes: 0},
			{ID: "java", Text: "Java ☕", Votes: 0},
			{ID: "cpp", Text: "C++ ⚡", Votes: 0},
			{ID: "javascript", Text: "JavaScript 🌐", Votes: 0},
		},
	}

	if _, err := PollsCollection.InsertOne(ctx, poll); err != nil {
		return err
	}

	log.Printf("🌱 Seeded demo poll in MongoDB with ObjectID: %s", poll.ID.Hex())
	return nil
}
