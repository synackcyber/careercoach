package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Simple token bucket per IP

type bucket struct {
	tokens         int
	lastRefillTime time.Time
}

type rateLimiter struct {
	capacity   int
	refillRate int // tokens per second
	buckets    map[string]*bucket
	mu         sync.Mutex
}

func newRateLimiter(capacity, refillRate int) *rateLimiter {
	return &rateLimiter{
		capacity:   capacity,
		refillRate: refillRate,
		buckets:    make(map[string]*bucket),
	}
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	b, ok := rl.buckets[key]
	if !ok {
		b = &bucket{tokens: rl.capacity, lastRefillTime: time.Now()}
		rl.buckets[key] = b
	}

	now := time.Now()
	elapsed := now.Sub(b.lastRefillTime).Seconds()
	refill := int(elapsed * float64(rl.refillRate))
	if refill > 0 {
		b.tokens = minInt(rl.capacity, b.tokens+refill)
		b.lastRefillTime = now
	}

	if b.tokens > 0 {
		b.tokens--
		return true
	}
	return false
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// RateLimitMiddleware applies a simple per-IP rate limit
func RateLimitMiddleware(capacity, refillRate int) gin.HandlerFunc {
	rl := newRateLimiter(capacity, refillRate)
	return func(c *gin.Context) {
		ip := clientIP(c.Request)
		if ip == "" {
			ip = "unknown"
		}
		if !rl.allow(ip) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}
		c.Next()
	}
}

func clientIP(r *http.Request) string {
	// Respect X-Forwarded-For if present
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return xff
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
