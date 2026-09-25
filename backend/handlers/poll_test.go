package handlers

import (
	"testing"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func TestResolveVoterKeyUsesExplicitUserID(t *testing.T) {
	payload := VotePayload{UserID: "user-123"}
	key := resolveVoterKey(payload, "203.0.113.7")
	if key != "user-123" {
		t.Fatalf("expected explicit user ID to be used, got %q", key)
	}
}

func TestResolveVoterKeyFallsBackToClientIP(t *testing.T) {
	payload := VotePayload{}
	key := resolveVoterKey(payload, "203.0.113.7")
	if key != "203.0.113.7" {
		t.Fatalf("expected client IP fallback, got %q", key)
	}
}

func TestBuildVoteUpdateFiltersDuplicateVoters(t *testing.T) {
	payload := VotePayload{UserID: "user-123"}
	filter, update := buildVoteUpdate(payload, "user-123", "poll-123", "option-1")

	if got, ok := filter["voted_users"].(bson.M)["$ne"]; !ok || got != "user-123" {
		t.Fatalf("expected duplicate voter check to use $ne with the voter key; got %#v", filter["voted_users"])
	}

	if got, ok := update["$push"].(bson.M)["voted_users"]; !ok || got != "user-123" {
		t.Fatalf("expected voted_users to be pushed for first-time voter; got %#v", update["$push"])
	}

	if got, ok := update["$inc"].(bson.M)["options.$.votes"]; !ok || got != 1 {
		t.Fatalf("expected option vote increment to be 1; got %#v", update["$inc"])
	}
}

func TestResolveVoterKeyFromGinContext(t *testing.T) {
	w := gin.CreateTestContext(nil)
	w.Request = nil
	key := resolveVoterKey(VotePayload{}, "203.0.113.42")
	if key != "203.0.113.42" {
		t.Fatalf("expected IP fallback to be used, got %q", key)
	}
}
