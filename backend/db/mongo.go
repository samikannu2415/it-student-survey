// backend/db/mongo.go
package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Client is the package-level MongoDB client (thread-safe).
var Client *mongo.Client

// PollsCollection is a reference to the active polls collection.
var PollsCollection *mongo.Collection

// Connect initialises and verifies the MongoDB connection using MONGO_URI from env.
func Connect() {
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		log.Fatal("❌  MONGO_URI environment variable is not set in .env")
	}
	dbName := os.Getenv("MONGO_DB")
	if dbName == "" {
		dbName = "live_polling_db"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("❌  MongoDB connection failed: %v", err)
	}

	// Ping primary replica to confirm read/write readiness.
	if err = client.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatalf("❌  MongoDB ping failed: %v", err)
	}

	Client = client
	PollsCollection = client.Database(dbName).Collection("polls")
	fmt.Printf("✅  MongoDB Atlas Connected successfully! (Database: %s)\n", dbName)
}

// Disconnect cleanly closes the MongoDB client.
func Disconnect() {
	if Client == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := Client.Disconnect(ctx); err != nil {
		log.Printf("⚠️  MongoDB disconnect error: %v", err)
	}
}
