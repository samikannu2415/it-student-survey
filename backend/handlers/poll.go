// backend/handlers/poll.go
package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"live-polling-app/db"
	"live-polling-app/models"
	rdb "live-polling-app/redis"
)

// ─── WebSocket Hub ────────────────────────────────────────────────────────────

// Hub manages all active WebSocket connections.
type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]struct{}
}

// GlobalHub is the singleton WebSocket hub.
var GlobalHub = &Hub{clients: make(map[*websocket.Conn]struct{})}

var upgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Register adds a connection to the hub.
func (h *Hub) Register(conn *websocket.Conn) {
	h.mu.Lock()
	h.clients[conn] = struct{}{}
	h.mu.Unlock()
}

// Deregister removes a connection from the hub and closes it.
func (h *Hub) Deregister(conn *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, conn)
	conn.Close()
	h.mu.Unlock()
}

// Broadcast sends a JSON message to every connected client.
func (h *Hub) Broadcast(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for conn := range h.clients {
		if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("⚠️  WebSocket write error: %v", err)
		}
	}
}

// StartRedisSubscriber listens to Redis Pub/Sub if Redis is enabled,
// and fans out to all WS clients.
func StartRedisSubscriber(ctx context.Context) {
	if !rdb.IsEnabled {
		log.Println("⚡ WebSocket Hub initialized (In-Memory Broadcast Mode Active)")
		return
	}

	pubsub := rdb.Subscribe(ctx)
	if pubsub == nil {
		return
	}
	defer pubsub.Close()

	ch := pubsub.Channel()
	log.Println("🔔 Redis subscriber listening on channel:", rdb.PollChannel)

	for {
		select {
		case <-ctx.Done():
			log.Println("⛔ Redis subscriber shutting down")
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			GlobalHub.Broadcast([]byte(msg.Payload))
		}
	}
}

// ─── HTTP & WebSocket Handlers ────────────────────────────────────────────────

// WSConnect upgrades an HTTP connection to WebSocket and keeps it alive.
func WSConnect(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("❌ WebSocket upgrade failed: %v", err)
		return
	}

	GlobalHub.Register(conn)
	log.Printf("🔗 WS client connected (active connections: %d)", len(GlobalHub.clients))

	// Keep-alive read loop — client disconnection exits this.
	go func() {
		defer GlobalHub.Deregister(conn)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				log.Printf("🔌 WS client disconnected")
				return
			}
		}
	}()
}

// ListPolls returns all active polls from MongoDB.
func ListPolls(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	cursor, err := db.PollsCollection.Find(ctx, bson.M{"is_active": true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls: " + err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err = cursor.All(ctx, &polls); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if polls == nil {
		polls = []models.Poll{}
	}
	c.JSON(http.StatusOK, polls)
}

// GetPoll returns a single poll by its MongoDB ObjectID.
func GetPoll(c *gin.Context) {
	oid, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	if err = db.PollsCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&poll); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}
	c.JSON(http.StatusOK, poll)
}

// CreatePoll inserts a new poll document into MongoDB Atlas.
func CreatePoll(c *gin.Context) {
	var poll models.Poll
	if err := c.ShouldBindJSON(&poll); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(poll.Question) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Question cannot be empty"})
		return
	}
	if len(poll.Options) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 options are required"})
		return
	}

	poll.ID = primitive.NewObjectID()
	poll.IsActive = true
	poll.CreatedAt = time.Now()
	poll.UpdatedAt = time.Now()

	for i := range poll.Options {
		poll.Options[i].Votes = 0
	}
	poll.VotedUsers = []string{}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	if _, err := db.PollsCollection.InsertOne(ctx, poll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database insert failed: " + err.Error()})
		return
	}

	log.Printf("✨ New Poll Created in MongoDB: %s (ID: %s)", poll.Question, poll.ID.Hex())
	c.JSON(http.StatusCreated, poll)
}

func resolveVoterKey(payload models.VotePayload, clientIP string) string {
	if userID := strings.TrimSpace(payload.UserID); userID != "" {
		return userID
	}
	if ipAddress := strings.TrimSpace(payload.IPAddress); ipAddress != "" {
		return ipAddress
	}
	if clientIP != "" {
		return clientIP
	}
	return ""
}

func buildVoteUpdate(payload models.VotePayload, voterKey string, pollID any, optionID string) (bson.M, bson.M) {
	filter := bson.M{
		"_id":          pollID,
		"options.id":   optionID,
		"voted_users": bson.M{"$ne": voterKey},
	}
	update := bson.M{
		"$push": bson.M{"voted_users": voterKey},
		"$inc":  bson.M{"options.$.votes": 1},
		"$set":  bson.M{"updated_at": time.Now()},
	}
	return filter, update
}

// CastVote atomically increments the vote counter in MongoDB and broadcasts live via WebSocket.
func CastVote(c *gin.Context) {
	var payload models.VotePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	oid, err := primitive.ObjectIDFromHex(payload.PollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	voterKey := resolveVoterKey(payload, c.ClientIP())
	if voterKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to identify voter"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	filter, update := buildVoteUpdate(payload, voterKey, oid, payload.OptionID)
	result, err := db.PollsCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Vote recording failed: " + err.Error()})
		return
	}
	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll or option not found"})
		return
	}
	if result.ModifiedCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You have already voted on this poll"})
		return
	}

	// Fetch updated poll document after the atomic Mongo write succeeded.
	var updated models.Poll
	if err = db.PollsCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&updated); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Updated poll fetch failed"})
		return
	}

	// Build the real-time event only after the MongoDB vote was successfully recorded.
	event := models.PollUpdateEvent{
		PollID:  payload.PollID,
		Options: updated.Options,
	}
	eventJSON, _ := json.Marshal(event)

	if err = rdb.Publish(ctx, string(eventJSON)); err != nil {
		log.Printf("⚠️ Redis publish failed after successful vote update: %v", err)
	}
	GlobalHub.Broadcast(eventJSON)

	log.Printf("🗳️ Vote Cast on Poll %s for Option %s (Total votes on option: %d)", payload.PollID, payload.OptionID, getOptionVotes(updated, payload.OptionID))
	c.JSON(http.StatusOK, updated)
}

func getOptionVotes(poll models.Poll, optionID string) int64 {
	for _, opt := range poll.Options {
		if opt.ID == optionID {
			return opt.Votes
		}
	}
	return 0
}
