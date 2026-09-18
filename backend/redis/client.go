// backend/redis/client.go
package redis

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// RDB is the package-level Redis client (thread-safe).
var RDB *redis.Client

// IsEnabled tracks whether Redis Pub/Sub is active or fallback in-memory is used.
var IsEnabled bool

// PollChannel is the Redis Pub/Sub channel name for poll vote events.
const PollChannel = "poll_updates"

// Connect initialises the Redis client using REDIS_URI or REDIS_ADDR from .env.
// If Redis is not reachable, it gracefully switches to in-memory real-time broadcasting.
func Connect() {
	redisURI := os.Getenv("REDIS_URI")
	addr := os.Getenv("REDIS_ADDR")

	var opts *redis.Options

	if redisURI != "" {
		parsedOpts, err := redis.ParseURL(redisURI)
		if err == nil {
			opts = parsedOpts
		}
	}

	if opts == nil {
		if addr == "" {
			addr = "localhost:6379"
		}
		password := os.Getenv("REDIS_PASSWORD")
		opts = &redis.Options{
			Addr:     addr,
			Password: password,
			DB:       0,
		}
	}

	// Set short timeout for health check
	opts.DialTimeout = 3 * time.Second
	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if _, err := client.Ping(ctx).Result(); err != nil {
		log.Printf("ℹ️  Redis not reachable (%v). Using High-Performance In-Memory WebSocket Hub.", err)
		IsEnabled = false
		return
	}

	RDB = client
	IsEnabled = true
	target := addr
	if redisURI != "" {
		parts := strings.Split(redisURI, "@")
		if len(parts) > 1 {
			target = parts[1]
		}
	}
	fmt.Printf("✅  Redis Pub/Sub connected successfully! → %s\n", target)
}

// Publish broadcasts a JSON payload to the PollChannel (if Redis active).
func Publish(ctx context.Context, payload string) error {
	if !IsEnabled || RDB == nil {
		return nil
	}
	return RDB.Publish(ctx, PollChannel, payload).Err()
}

// Subscribe returns a PubSub handle subscribed to PollChannel (if Redis active).
func Subscribe(ctx context.Context) *redis.PubSub {
	if !IsEnabled || RDB == nil {
		return nil
	}
	return RDB.Subscribe(ctx, PollChannel)
}
