// backend/test_mongo.go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

func main() {
	_ = godotenv.Load(".env")

	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		log.Fatal("❌ MONGO_URI is missing in .env")
	}

	fmt.Println("⏳ Connecting to MongoDB Atlas cluster...")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("❌ Connection initialization error: %v", err)
	}
	defer client.Disconnect(ctx)

	if err = client.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatalf("❌ MongoDB Ping failed: %v", err)
	}

	fmt.Println("🎉 SUCCESS: MongoDB Atlas Cluster0 is connected and responsive!")
}
