package middleware

import (
	"fmt"
	"net/http"
	"strings"

    "goaltracker/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// UserIDKey is the key used to store the user ID in the Gin context
const UserIDKey = "userID"

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

// RequireAdmin checks if authenticated user is in the ADMIN_USER_IDS allowlist
// RequireAdmin checks if authenticated user is in the ADMIN_USER_IDS allowlist
func RequireAdmin() gin.HandlerFunc {
    cfg := config.Load()
    allow := map[string]struct{}{}
    if cfg.AdminUserIDs != "" {
        for _, id := range strings.Split(cfg.AdminUserIDs, ",") {
            id = strings.TrimSpace(id)
            if id != "" { allow[id] = struct{}{} }
        }
    }
    return func(c *gin.Context) {
        uid, err := GetUserID(c)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
            return
        }
        if _, ok := allow[uid]; !ok {
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


