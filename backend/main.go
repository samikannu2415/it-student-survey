package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"live-polling-app/db"
	"live-polling-app/handlers"
	rdb "live-polling-app/redis"
)

func main() {
	// Load .env if present (non-fatal if missing).
	_ = godotenv.Load()

	// ── Infrastructure connections ─────────────────────────────────────────────
	db.Connect()
	defer db.Disconnect()

	if err := db.SeedDemoPoll(); err != nil {
		log.Fatalf("❌ Failed to seed demo poll: %v", err)
	}

	rdb.Connect()

	// ── Background: Redis → WebSocket fan-out ─────────────────────────────────
	ctx, cancelSub := context.WithCancel(context.Background())
	defer cancelSub()
	go handlers.StartRedisSubscriber(ctx)

	// ── Gin router ────────────────────────────────────────────────────────────
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS — allow the production Vercel frontend and local dev origins.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://livepoll-samikannu.vercel.app", "http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ── Routes ────────────────────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now()})
	})

	// WebSocket endpoint — frontend connects here for real-time updates.
	r.GET("/ws", handlers.WSConnect)

	// REST API — polls resource.
	api := r.Group("/api/v1")
	{
		polls := api.Group("/polls")
		{
			polls.GET("", handlers.ListPolls)      // GET  /api/v1/polls
			polls.POST("", handlers.CreatePoll)    // POST /api/v1/polls
			polls.GET("/:id", handlers.GetPoll)    // GET  /api/v1/polls/:id
			polls.POST("/vote", handlers.CastVote) // POST /api/v1/polls/vote
		}
	}

	// ── Server with graceful shutdown ─────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Start server in a goroutine.
	go func() {
		log.Printf("🚀  Antigravity Polling Server → http://localhost:%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌  Server error: %v", err)
		}
	}()

	// Wait for SIGINT / SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("⏳  Shutting down gracefully…")
	cancelSub()

	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelShutdown()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("❌  Forced shutdown: %v", err)
	}
	log.Println("✅  Server stopped cleanly.")
}
