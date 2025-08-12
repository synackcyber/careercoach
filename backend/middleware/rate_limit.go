package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"
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
	// Get trusted proxy list from environment (comma-separated)
	trustedProxies := getTrustedProxies()
	
	// Get the direct connection IP
	directIP, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		directIP = r.RemoteAddr
	}
	
	// Only trust X-Forwarded-For if the request comes from a trusted proxy
	if isTrustedProxy(directIP, trustedProxies) {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			// Take the first IP from X-Forwarded-For (the original client)
			ips := strings.Split(xff, ",")
			if len(ips) > 0 {
				clientIP := strings.TrimSpace(ips[0])
				if isValidIP(clientIP) {
					return clientIP
				}
			}
		}
	}
	
	return directIP
}

func getTrustedProxies() []string {
	// Default trusted proxies for common load balancers/proxies
	defaultProxies := []string{
		"127.0.0.1", "::1", // localhost
		"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", // private networks
	}
	
	// Allow override via environment variable
	if envProxies := os.Getenv("TRUSTED_PROXIES"); envProxies != "" {
		return strings.Split(envProxies, ",")
	}
	
	return defaultProxies
}

func isTrustedProxy(ip string, trustedProxies []string) bool {
	for _, trusted := range trustedProxies {
		trusted = strings.TrimSpace(trusted)
		if strings.Contains(trusted, "/") {
			// CIDR notation
			_, network, err := net.ParseCIDR(trusted)
			if err != nil {
				continue
			}
			if testIP := net.ParseIP(ip); testIP != nil && network.Contains(testIP) {
				return true
			}
		} else {
			// Direct IP comparison
			if ip == trusted {
				return true
			}
		}
	}
	return false
}

func isValidIP(ip string) bool {
	return net.ParseIP(ip) != nil
}
