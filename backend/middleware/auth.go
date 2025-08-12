package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

    "goaltracker/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// UserIDKey is the key used to store the user ID in the Gin context
const UserIDKey = "userID"

// Admin cache with TTL
var (
	adminCache struct {
		mu        sync.RWMutex
		adminIDs  map[string]struct{}
		lastLoad  time.Time
		cacheTTL  time.Duration
	}
)

func init() {
	adminCache.adminIDs = make(map[string]struct{})
	adminCache.cacheTTL = 5 * time.Minute // Cache for 5 minutes
}

// RequireAuth is a Gin middleware to authenticate requests using JWT
func RequireAuth() gin.HandlerFunc {
	cfg := config.Load()

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			return
		}

		// Verify HS256 token using Supabase JWT secret
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			if cfg.SupabaseJWTSecret == "" {
				return nil, fmt.Errorf("missing SUPABASE_JWT_SECRET")
			}
			return []byte(cfg.SupabaseJWTSecret), nil
		}, jwt.WithIssuer(cfg.OIDCIssuerURL), jwt.WithAudience(cfg.OIDCAudience))

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Invalid token: %v", err)})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User ID (sub) not found in token claims"})
			return
		}

		c.Set(UserIDKey, userID)
		c.Next()
	}
}

// loadAdminIDs loads and caches admin user IDs with TTL
func loadAdminIDs() map[string]struct{} {
    adminCache.mu.RLock()
    if time.Since(adminCache.lastLoad) < adminCache.cacheTTL {
        defer adminCache.mu.RUnlock()
        return adminCache.adminIDs
    }
    adminCache.mu.RUnlock()

    // Cache expired, reload
    adminCache.mu.Lock()
    defer adminCache.mu.Unlock()

    // Double-check in case another goroutine loaded while we waited
    if time.Since(adminCache.lastLoad) < adminCache.cacheTTL {
        return adminCache.adminIDs
    }

    // Load admin IDs from environment
    newAdminIDs := make(map[string]struct{})
    if adminUserIDs := os.Getenv("ADMIN_USER_IDS"); adminUserIDs != "" {
        for _, id := range strings.Split(adminUserIDs, ",") {
            id = strings.TrimSpace(id)
            if id != "" {
                newAdminIDs[id] = struct{}{}
            }
        }
    }

    adminCache.adminIDs = newAdminIDs
    adminCache.lastLoad = time.Now()
    return adminCache.adminIDs
}

// RequireAdmin checks if authenticated user is in the ADMIN_USER_IDS allowlist
func RequireAdmin() gin.HandlerFunc {
    return func(c *gin.Context) {
        uid, err := GetUserID(c)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
            return
        }
        
        adminIDs := loadAdminIDs()
        if _, ok := adminIDs[uid]; !ok {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
            return
        }
        
        c.Next()
    }
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetUserID extracts the user ID from the Gin context
func GetUserID(c *gin.Context) (string, error) {
	userID, exists := c.Get(UserIDKey)
	if !exists {
		return "", fmt.Errorf("user ID not found in context")
	}
	strUserID, ok := userID.(string)
	if !ok {
		return "", fmt.Errorf("user ID in context is not a string")
	}
	return strUserID, nil
}


